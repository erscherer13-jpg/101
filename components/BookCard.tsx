"use client";

import type { BookRecommendation } from "@/lib/types";

interface Props {
  book: BookRecommendation;
  onNotForMe: (id: string) => void;
  onEnjoyed: (id: string) => void;
  replacing?: boolean;
  enjoyed?: boolean;
}

const lengthColors: Record<string, string> = {
  Quick: "bg-[#e8f4e8] text-[#3a6b3a]",
  Medium: "bg-[#f0ebe1] text-[#7a5c2e]",
  Long: "bg-[#e8e4f0] text-[#4a3a6b]",
};

export default function BookCard({ book, onNotForMe, onEnjoyed, replacing, enjoyed }: Props) {
  return (
    <article className="bg-white border border-[#e0d5c5] rounded-2xl p-6 shadow-sm flex flex-col gap-4 transition-opacity duration-300">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-serif text-[#3b2a1a] leading-snug">{book.title}</h2>
          <p className="text-sm text-[#8a6a52] mt-0.5">{book.author}</p>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 mt-0.5 ${lengthColors[book.length] || "bg-[#f0ebe1] text-[#7a5c2e]"}`}
        >
          {book.length}
        </span>
      </div>

      <p className="text-sm text-[#4a3728] leading-relaxed">{book.description}</p>

      <div className="bg-[#fdf8f2] border border-[#ede6da] rounded-xl px-4 py-3">
        <p className="text-xs font-semibold text-[#b5763a] uppercase tracking-wide mb-1">
          Why you&rsquo;d love this
        </p>
        <p className="text-sm text-[#4a3728] leading-relaxed">{book.whyYoudLoveIt}</p>
      </div>

      {book.criticsQuote && (
        <p className="text-xs text-[#8a6a52] italic border-l-2 border-[#d9c9b5] pl-3">
          {book.criticsQuote}
        </p>
      )}

      <div className="mt-auto flex gap-2">
        <button
          onClick={() => onNotForMe(book.id)}
          disabled={replacing}
          className="text-xs text-[#a08060] hover:text-[#6b3e1a] border border-[#d9c9b5] hover:border-[#b5763a] rounded-lg px-3 py-1.5 transition-colors duration-150 disabled:opacity-40 disabled:cursor-wait"
        >
          {replacing ? "Finding another…" : "Not for me"}
        </button>
        <button
          onClick={() => onEnjoyed(book.id)}
          disabled={enjoyed}
          className={`text-xs border rounded-lg px-3 py-1.5 transition-colors duration-150 ${
            enjoyed
              ? "text-[#3a6b3a] border-[#a8d4a8] bg-[#e8f4e8] cursor-default"
              : "text-[#a08060] hover:text-[#3a6b3a] border-[#d9c9b5] hover:border-[#a8d4a8]"
          }`}
        >
          {enjoyed ? "✓ Enjoyed" : "Read & Enjoyed"}
        </button>
      </div>
    </article>
  );
}
