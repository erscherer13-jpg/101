"use client";

import Link from "next/link";

interface Props {
  onTitleClick?: () => void;
}

export default function Header({ onTitleClick }: Props) {
  return (
    <header className="flex items-center justify-between px-4 py-4 max-w-5xl mx-auto w-full">
      {onTitleClick ? (
        <button
          onClick={onTitleClick}
          className="text-7xl font-serif text-[#3b2a1a] tracking-tight hover:opacity-80 transition-opacity"
        >
          Jeff&rsquo;s<span className="text-[#b5763a]">BookMatch</span>
        </button>
      ) : (
        <Link href="/" className="text-7xl font-serif text-[#3b2a1a] tracking-tight hover:opacity-80 transition-opacity">
          Jeff&rsquo;s<span className="text-[#b5763a]">BookMatch</span>
        </Link>
      )}
      <Link
        href="/reading-list"
        className="text-sm font-medium text-[#b5763a] hover:text-[#8a4e20] border border-[#d9c9b5] hover:border-[#b5763a] rounded-lg px-3 py-1.5 transition-colors duration-150"
      >
        My Reading List
      </Link>
    </header>
  );
}
