import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { RecommendRequest } from "@/lib/types";

// The Anthropic SDK needs the Node.js runtime — the edge runtime lacks the
// APIs it depends on, so pin this route explicitly.
export const runtime = "nodejs";

function buildSystemPrompt(): string {
  return `You are a warm, well-read friend who happens to know a lot about books — think brilliant independent bookseller, the kind who remembers what every regular customer loves and has a genuine recommendation ready before you've finished explaining what you're after. You're enthusiastic but never salesy. You don't pad recommendations with generic praise; you get specific. You notice what someone actually responded to — the pacing, the voice, the emotional register — and you match it. When you recommend a book, it sounds like a real suggestion from someone who has read it and thought about whether this particular person would love it. You never write things like "this beloved classic" or "this masterwork" — you write like a person, not a blurb.

You have access to a web search tool. Use it to find real critical reception (NYT, Guardian, Goodreads, literary journals) for each book you plan to recommend — pull a short genuine quote or paraphrase from reviews. If a search returns nothing useful, write a brief accurate critical summary from your own knowledge instead.
Your final message MUST be a single valid JSON object and nothing else — no prose before or after, no markdown fences. Never apologise or explain; always return the JSON.`;
}

function buildUserPrompt(req: RecommendRequest): string {
  const profileBlock = req.profile
    ? `
DAD'S TASTE PROFILE:
- Books he loved: ${req.profile.lovedBooks.map((b) => `"${b.title}" (${b.word})`).join(", ") || "none provided"}
- Books he didn't finish: ${req.profile.dislikedBooks.map((b) => `"${b.title}" (${b.word})`).join(", ") || "none provided"}
- Favourite films/TV: ${req.profile.favoriteMedia || "not specified"}
- Authors he likes: ${req.profile.likedAuthors || "not specified"}
- Topics/genres to avoid: ${req.profile.avoidTopics || "none specified"}
- What makes a book great for him: ${req.profile.greatBookMeans || "not specified"}
`
    : "No taste profile provided.";

  const historyBlock =
    req.history.length > 0
      ? `\nALREADY RECOMMENDED (never suggest these again): ${req.history.join(", ")}`
      : "";

  const excludeBlock =
    req.exclude && req.exclude.length > 0
      ? `\nALSO EXCLUDE THIS SESSION: ${req.exclude.join(", ")}`
      : "";

  const rejectedBlock =
    req.rejected && req.rejected.length > 0
      ? `\nBOOKS HE REJECTED (\"Not for me\") — never suggest these, and use them as negative signals to understand what doesn't land for him: ${req.rejected.join(", ")}`
      : "";

  const enjoyedBlock =
    req.enjoyed && req.enjoyed.length > 0
      ? `\nBOOKS HE ENJOYED — use these as strong positive signals alongside his taste profile: ${req.enjoyed.join(", ")}`
      : "";

  const lengthMap: Record<string, string> = {
    quick: "under 250 pages",
    medium: "250–450 pages",
    long: "over 450 pages",
    any: "any length",
  };

  return `${profileBlock}${historyBlock}${excludeBlock}${rejectedBlock}${enjoyedBlock}

CURRENT REQUEST:
- Reading mood: ${req.readingMood || "not specified"}
- Things to avoid this time: ${req.avoidThis || "nothing specific"}
- Preferred length: ${lengthMap[req.length] || "any length"}

Task:
1. Select ${req.exclude ? "1 replacement book" : "3–5 books"} that fit this profile well.
2. For each book, use the web_search tool to find genuine critical reception — a real quote or paraphrase from NYT, The Guardian, Goodreads, or similar.
3. Return ONLY a JSON object in this exact shape:

{
  "books": [
    {
      "id": "unique-slug",
      "title": "Book Title",
      "author": "Author Name",
      "description": "2–3 sentence description of the book.",
      "whyYoudLoveIt": "1–2 sentences reasoning over the taste profile — specific, not generic.",
      "criticsQuote": "One line from real critical reception with source, e.g. 'Utterly gripping — The Guardian'",
      "length": "Quick" | "Medium" | "Long"
    }
  ]
}

Length labels: Quick = under 250 pages, Medium = 250–450, Long = over 450.`;
}

async function getRecommendations(
  client: Anthropic,
  prompt: string,
  withSearch: boolean
) {
  // Anthropic's native server-side web search tool — searches are run by the
  // API itself, so no separate search API key or manual tool loop is needed.
  const tools = withSearch
    ? ([{ type: "web_search_20250305", name: "web_search", max_uses: 6 }] as unknown as Anthropic.Tool[])
    : undefined;

  return client.messages.create({
    model: "claude-sonnet-4-6",
    max_tokens: 4096,
    system: buildSystemPrompt(),
    ...(tools ? { tools } : {}),
    messages: [{ role: "user", content: prompt }],
  });
}

export async function POST(req: NextRequest) {
  // Initialize the client inside the handler so a missing env var surfaces a
  // clear error instead of crashing at module load.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    console.error("recommend route: ANTHROPIC_API_KEY is undefined");
    return NextResponse.json(
      { error: "Server not configured", detail: "ANTHROPIC_API_KEY is missing" },
      { status: 500 }
    );
  }

  const client = new Anthropic({ apiKey });

  let body: RecommendRequest;
  try {
    body = (await req.json()) as RecommendRequest;
  } catch (err) {
    console.error("recommend route: failed to parse request body:", err);
    return NextResponse.json({ error: "Bad request" }, { status: 400 });
  }

  const prompt = buildUserPrompt(body);

  // Try with web search first; if that fails (e.g. web search not enabled on
  // the account), fall back to a plain request so the app still works.
  let response;
  try {
    response = await getRecommendations(client, prompt, true);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("recommend route: web-search call failed, retrying without search:", message);
    try {
      response = await getRecommendations(client, prompt, false);
    } catch (err2) {
      const message2 = err2 instanceof Error ? err2.message : String(err2);
      console.error("recommend route: fallback call also failed:", message2);
      return NextResponse.json(
        { error: "AI request failed", detail: message2 },
        { status: 500 }
      );
    }
  }

  // Combine every text block, then pull out the JSON object between the first
  // { and last } — robust against any stray prose the model adds.
  const fullText = response.content
    .filter((b): b is Anthropic.TextBlock => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const start = fullText.indexOf("{");
  const end = fullText.lastIndexOf("}");
  if (start === -1 || end === -1 || end <= start) {
    console.error("recommend route: no JSON found in response:", fullText.slice(0, 300));
    return NextResponse.json({ error: "No recommendations returned" }, { status: 500 });
  }

  try {
    const parsed = JSON.parse(fullText.slice(start, end + 1));
    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("recommend route: JSON parse failed:", message, "| text:", fullText.slice(0, 300));
    return NextResponse.json({ error: "Could not parse recommendations", detail: message }, { status: 500 });
  }
}
