import Anthropic from "@anthropic-ai/sdk";
import { NextRequest, NextResponse } from "next/server";
import type { RecommendRequest, BookRecommendation } from "@/lib/types";

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

function buildSystemPrompt(): string {
  return `You are a knowledgeable independent bookseller helping pick thoughtful book gifts.
You have access to a web_search tool. Use it to find real critical reception (NYT, Guardian, Goodreads, literary journals) for each book you plan to recommend — pull a short genuine quote or paraphrase from reviews.
Always return valid JSON only — no markdown, no explanation outside the JSON object.`;
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

  const lengthMap: Record<string, string> = {
    quick: "under 250 pages",
    medium: "250–450 pages",
    long: "over 450 pages",
    any: "any length",
  };

  return `${profileBlock}${historyBlock}${excludeBlock}

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

export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as RecommendRequest;

    const tools: Anthropic.Tool[] = [
      {
        name: "web_search",
        description: "Search the web for book reviews and critical reception.",
        input_schema: {
          type: "object" as const,
          properties: {
            query: { type: "string", description: "The search query" },
          },
          required: ["query"],
        },
      },
    ];

    const messages: Anthropic.MessageParam[] = [
      { role: "user", content: buildUserPrompt(body) },
    ];

    // Agentic loop: keep going until we get a final text response
    let response = await client.messages.create({
      model: "claude-sonnet-4-6",
      max_tokens: 4096,
      system: buildSystemPrompt(),
      tools,
      messages,
    });

    while (response.stop_reason === "tool_use") {
      const toolUseBlock = response.content.find(
        (b): b is Anthropic.ToolUseBlock => b.type === "tool_use"
      );
      if (!toolUseBlock) break;

      // Perform the web search
      const query = (toolUseBlock.input as { query: string }).query;
      let searchResult = "";
      try {
        const searchRes = await fetch(
          `https://api.search.brave.com/res/v1/web/search?q=${encodeURIComponent(query)}&count=3`,
          {
            headers: {
              Accept: "application/json",
              "Accept-Encoding": "gzip",
              "X-Subscription-Token": process.env.BRAVE_SEARCH_API_KEY || "",
            },
          }
        );
        if (searchRes.ok) {
          const data = await searchRes.json();
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          searchResult = (data.web?.results || []).slice(0, 3).map((r: any) =>
            `${r.title}: ${r.description}`
          ).join("\n");
        } else {
          searchResult = "Search unavailable.";
        }
      } catch {
        searchResult = "Search unavailable.";
      }

      messages.push({ role: "assistant", content: response.content });
      messages.push({
        role: "user",
        content: [
          {
            type: "tool_result",
            tool_use_id: toolUseBlock.id,
            content: searchResult || "No results found.",
          },
        ],
      });

      response = await client.messages.create({
        model: "claude-sonnet-4-6",
        max_tokens: 4096,
        system: buildSystemPrompt(),
        tools,
        messages,
      });
    }

    const textBlock = response.content.find(
      (b): b is Anthropic.TextBlock => b.type === "text"
    );
    if (!textBlock) {
      return NextResponse.json({ error: "No response from AI" }, { status: 500 });
    }

    // Extract JSON from the response text (strip any accidental markdown fences)
    const raw = textBlock.text.replace(/```json\s*/g, "").replace(/```\s*/g, "").trim();
    const parsed = JSON.parse(raw);

    return NextResponse.json(parsed);
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("recommend route error:", message);
    return NextResponse.json({ error: "Something went wrong", detail: message }, { status: 500 });
  }
}
