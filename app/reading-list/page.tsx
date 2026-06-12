"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Header from "@/components/Header";
import { loadReadingList, removeFromReadingList } from "@/lib/storage";
import type { ReadingListEntry } from "@/lib/types";

export default function ReadingListPage() {
  const [list, setList] = useState<ReadingListEntry[]>([]);

  useEffect(() => {
    setList(loadReadingList());
  }, []);

  function handleRemove(id: string) {
    removeFromReadingList(id);
    setList((prev) => prev.filter((e) => e.id !== id));
  }

  return (
    <main className="min-h-screen bg-[#faf6f0] pb-20">
      <Header />
      <div className="max-w-3xl mx-auto px-4 pt-4">
        <h1 className="text-3xl font-serif text-[#3b2a1a] mb-1">My Reading List</h1>
        <p className="text-sm text-[#8a6a52] mb-8">Books saved from your recommendations.</p>

        {list.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-[#a08060] text-base mb-4">Nothing saved yet.</p>
            <Link
              href="/"
              className="text-sm text-[#b5763a] hover:text-[#8a4e20] font-medium underline underline-offset-2"
            >
              Find some books →
            </Link>
          </div>
        ) : (
          <ul className="space-y-5">
            {list.map((entry) => (
              <li
                key={entry.id}
                className="bg-white border border-[#e0d5c5] rounded-2xl p-6 shadow-sm flex flex-col gap-3"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-serif text-[#3b2a1a] leading-snug">{entry.title}</h2>
                    <p className="text-sm text-[#8a6a52] mt-0.5">{entry.author}</p>
                  </div>
                  <button
                    onClick={() => handleRemove(entry.id)}
                    className="text-xs text-[#a08060] hover:text-[#6b3e1a] border border-[#d9c9b5] hover:border-[#b5763a] rounded-lg px-3 py-1.5 transition-colors duration-150 shrink-0"
                  >
                    Remove
                  </button>
                </div>
                <p className="text-sm text-[#4a3728] leading-relaxed">{entry.description}</p>
                <div className="bg-[#fdf8f2] border border-[#ede6da] rounded-xl px-4 py-3">
                  <p className="text-xs font-semibold text-[#b5763a] uppercase tracking-wide mb-1">
                    Why you&rsquo;d love this
                  </p>
                  <p className="text-sm text-[#4a3728] leading-relaxed">{entry.whyYoudLoveIt}</p>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  );
}
