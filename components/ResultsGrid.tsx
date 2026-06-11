"use client";

import { useState } from "react";
import BookCard from "./BookCard";
import type { BookRecommendation, RecommendRequest } from "@/lib/types";
import { addToHistory } from "@/lib/storage";

interface Props {
  books: BookRecommendation[];
  request: Omit<RecommendRequest, "history" | "exclude">;
  sessionShown: string[]; // all titles shown this session
  onHistoryUpdate: (titles: string[]) => void;
}

export default function ResultsGrid({ books: initial, request, sessionShown, onHistoryUpdate }: Props) {
  const [books, setBooks] = useState<BookRecommendation[]>(initial);
  const [replacing, setReplacing] = useState<string | null>(null);
  const [allShown, setAllShown] = useState<string[]>(sessionShown);

  async function handleNotForMe(id: string) {
    const book = books.find((b) => b.id === id);
    if (!book) return;
    setReplacing(id);

    try {
      const res = await fetch("/api/recommend", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...request,
          history: allShown,
          exclude: allShown,
        } satisfies RecommendRequest),
      });
      const data = await res.json();
      const replacement: BookRecommendation | undefined = data.books?.[0];

      if (replacement) {
        const newTitles = [...allShown, replacement.title];
        setAllShown(newTitles);
        addToHistory([replacement]);
        onHistoryUpdate(newTitles);
        setBooks((prev) => prev.map((b) => (b.id === id ? replacement : b)));
      } else {
        // No replacement found — just dismiss the card
        setBooks((prev) => prev.filter((b) => b.id !== id));
      }
    } catch {
      setBooks((prev) => prev.filter((b) => b.id !== id));
    } finally {
      setReplacing(null);
    }
  }

  return (
    <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      {books.map((book) => (
        <BookCard
          key={book.id}
          book={book}
          onNotForMe={handleNotForMe}
          replacing={replacing === book.id}
        />
      ))}
    </div>
  );
}
