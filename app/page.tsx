"use client";

import { useState } from "react";
import ResultsGrid from "@/components/ResultsGrid";
import Header from "@/components/Header";
import { loadProfile, loadHistory, addToHistory, loadRejected, loadEnjoyed } from "@/lib/storage";
import type { BookRecommendation, RecommendRequest } from "@/lib/types";

type Length = "quick" | "medium" | "long" | "any";

const lengthLabels: { value: Length; label: string }[] = [
  { value: "quick", label: "Quick read" },
  { value: "medium", label: "Medium" },
  { value: "long", label: "Long" },
  { value: "any", label: "No preference" },
];

export default function HomePage() {
  const [mood, setMood] = useState("");
  const [avoid, setAvoid] = useState("");
  const [length, setLength] = useState<Length>("any");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [results, setResults] = useState<BookRecommendation[] | null>(null);
  const [sessionShown, setSessionShown] = useState<string[]>([]);
  const [currentRequest, setCurrentRequest] = useState<Omit<RecommendRequest, "history" | "exclude"> | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    setResults(null);

    const profile = loadProfile();
    const history = loadHistory();

    const reqBody: RecommendRequest = {
      profile,
      readingMood: mood,
      avoidThis: avoid,
      length,
      history,
      rejected: loadRejected(),
      enjoyed: loadEnjoyed(),
    };

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(reqBody),
      });
      if (!res.ok) throw new Error("Request failed");
      const data = await res.json();
      const books: BookRecommendation[] = data.books || [];
      addToHistory(books);
      const titles = books.map((b) => b.title);
      setSessionShown([...history, ...titles]);
      setCurrentRequest({ profile, readingMood: mood, avoidThis: avoid, length });
      setResults(books);
    } catch {
      setError("Something went wrong — please try again.");
    } finally {
      setLoading(false);
    }
  }

  function handleNewSearch() {
    setResults(null);
    setMood("");
    setAvoid("");
    setLength("any");
  }

  return (
    <main className="min-h-screen bg-[#faf6f0] pb-20">
      <Header />
      <div className={`mx-auto px-4 transition-all duration-300 ${results ? "max-w-5xl" : "max-w-2xl"}`}>

        {!results ? (
          <form onSubmit={handleSubmit} className="space-y-7">
            {/* Mood */}
            <div>
              <label className="block font-serif text-[#3b2a1a] text-lg mb-2">
                What kind of read are you hoping for?
              </label>
              <input
                type="text"
                value={mood}
                onChange={(e) => setMood(e.target.value)}
                placeholder="e.g. something light, a page-turner, a slow burn"
                className="w-full rounded-xl border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm"
              />
            </div>

            {/* Avoid */}
            <div>
              <label className="block font-serif text-[#3b2a1a] text-lg mb-2">
                Anything to avoid this time?
              </label>
              <input
                type="text"
                value={avoid}
                onChange={(e) => setAvoid(e.target.value)}
                placeholder="e.g. nothing too sad, no sci-fi"
                className="w-full rounded-xl border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm"
              />
            </div>

            {/* Length */}
            <div>
              <label className="block font-serif text-[#3b2a1a] text-lg mb-3">
                How long a book?
              </label>
              <div className="flex flex-wrap gap-2">
                {lengthLabels.map(({ value, label }) => (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setLength(value)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium border transition-colors duration-150 ${
                      length === value
                        ? "bg-[#b5763a] text-white border-[#b5763a]"
                        : "bg-white text-[#6b5240] border-[#d9c9b5] hover:border-[#b5763a]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#3b2a1a] hover:bg-[#5a3e28] text-white font-semibold text-base py-4 rounded-xl transition-colors duration-200 disabled:opacity-60 disabled:cursor-wait"
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Finding books…
                </span>
              ) : (
                "Find books"
              )}
            </button>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}
          </form>
        ) : (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="font-serif text-xl text-[#3b2a1a]">Here are some ideas</h2>
              <button
                onClick={handleNewSearch}
                className="text-sm text-[#b5763a] hover:text-[#8a4e20] font-medium"
              >
                ← Start over
              </button>
            </div>
            {currentRequest && (
              <ResultsGrid
                books={results}
                request={currentRequest}
                sessionShown={sessionShown}
                onHistoryUpdate={setSessionShown}
              />
            )}
          </div>
        )}
      </div>

    </main>
  );
}
