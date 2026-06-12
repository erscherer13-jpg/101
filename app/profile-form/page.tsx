"use client";

import { useState } from "react";
import type { BookEntry, DadProfile } from "@/lib/types";
import Header from "@/components/Header";

const emptyBook = (): BookEntry => ({ title: "", word: "" });

export default function ProfileFormPage() {
  const [lovedBooks, setLovedBooks] = useState<BookEntry[]>([emptyBook()]);
  const [dislikedBooks, setDislikedBooks] = useState<BookEntry[]>([emptyBook()]);
  const [favoriteMedia, setFavoriteMedia] = useState("");
  const [likedAuthors, setLikedAuthors] = useState("");
  const [avoidTopics, setAvoidTopics] = useState("");
  const [greatBookMeans, setGreatBookMeans] = useState("");
  const [saved, setSaved] = useState(false);
  const [sending, setSending] = useState(false);

  function updateBook(
    list: BookEntry[],
    setList: (v: BookEntry[]) => void,
    index: number,
    field: keyof BookEntry,
    value: string
  ) {
    const updated = list.map((b, i) => (i === index ? { ...b, [field]: value } : b));
    setList(updated);
  }

  function addBook(list: BookEntry[], setList: (v: BookEntry[]) => void, max: number) {
    if (list.length < max) setList([...list, emptyBook()]);
  }

  function removeBook(list: BookEntry[], setList: (v: BookEntry[]) => void, index: number) {
    if (list.length === 1) return;
    setList(list.filter((_, i) => i !== index));
  }

  async function handleSave() {
    const profile: DadProfile = {
      lovedBooks: lovedBooks.filter((b) => b.title.trim()),
      dislikedBooks: dislikedBooks.filter((b) => b.title.trim()),
      favoriteMedia,
      likedAuthors,
      avoidTopics,
      greatBookMeans,
    };

    // Download JSON for /setup upload
    const blob = new Blob([JSON.stringify(profile, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "dad-profile.json";
    a.click();
    URL.revokeObjectURL(url);

    // Email answers to Ellie via Formspree
    const endpoint = process.env.NEXT_PUBLIC_FORMSPREE_ENDPOINT;
    if (endpoint) {
      setSending(true);
      try {
        await fetch(endpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json", Accept: "application/json" },
          body: JSON.stringify(profile),
        });
      } catch {
        // Non-fatal — download already succeeded
      } finally {
        setSending(false);
      }
    }

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  }

  return (
    <main className="min-h-screen bg-[#faf6f0]">
      <Header />
      <div className="px-4 py-8">
      <div className="max-w-xl mx-auto">
        {/* Header */}
        <div className="mb-10 text-center">
          <p className="text-[#b5763a] text-sm tracking-widest uppercase mb-2 font-medium">
            A note from Ellie
          </p>
          <h1 className="text-4xl font-serif text-[#3b2a1a] mb-4 leading-snug">
            Help me find you<br />the perfect book
          </h1>
          <p className="text-[#6b5240] text-base leading-relaxed max-w-md mx-auto">
            I love picking books for you, but I&rsquo;ll be honest — I don&rsquo;t always know what
            you&rsquo;ll love. I built this little tool to help me get it right. Take a couple of
            minutes to fill this out and it&rsquo;ll make all the difference. No wrong answers, just
            what feels true to you.
          </p>
        </div>

        <div className="space-y-10">
          {/* Loved Books */}
          <section>
            <h2 className="text-xl font-serif text-[#3b2a1a] mb-1">
              Books you&rsquo;ve loved
            </h2>
            <p className="text-sm text-[#8a6a52] mb-4">
              Up to 5. For each one, just one word for why you loved it — "funny", "moving",
              "gripping", anything that fits.
            </p>
            <div className="space-y-3">
              {lovedBooks.map((book, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Book title"
                      value={book.title}
                      onChange={(e) => updateBook(lovedBooks, setLovedBooks, i, "title", e.target.value)}
                      className="flex-1 rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="One word"
                      value={book.word}
                      onChange={(e) => updateBook(lovedBooks, setLovedBooks, i, "word", e.target.value)}
                      className="w-28 rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm"
                    />
                  </div>
                  {lovedBooks.length > 1 && (
                    <button
                      onClick={() => removeBook(lovedBooks, setLovedBooks, i)}
                      className="mt-3 text-[#c4a882] hover:text-[#b5763a] text-lg leading-none"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {lovedBooks.length < 5 && (
              <button
                onClick={() => addBook(lovedBooks, setLovedBooks, 5)}
                className="mt-3 text-sm text-[#b5763a] hover:text-[#8a4e20] font-medium"
              >
                + Add another
              </button>
            )}
          </section>

          {/* Disliked Books */}
          <section>
            <h2 className="text-xl font-serif text-[#3b2a1a] mb-1">
              Books that weren&rsquo;t for you
            </h2>
            <p className="text-sm text-[#8a6a52] mb-4">
              Up to 3 — books you couldn&rsquo;t finish or just didn&rsquo;t enjoy. Same deal: one
              word for why.
            </p>
            <div className="space-y-3">
              {dislikedBooks.map((book, i) => (
                <div key={i} className="flex gap-2 items-start">
                  <div className="flex-1 flex gap-2">
                    <input
                      type="text"
                      placeholder="Book title"
                      value={book.title}
                      onChange={(e) => updateBook(dislikedBooks, setDislikedBooks, i, "title", e.target.value)}
                      className="flex-1 rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm"
                    />
                    <input
                      type="text"
                      placeholder="One word"
                      value={book.word}
                      onChange={(e) => updateBook(dislikedBooks, setDislikedBooks, i, "word", e.target.value)}
                      className="w-28 rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm"
                    />
                  </div>
                  {dislikedBooks.length > 1 && (
                    <button
                      onClick={() => removeBook(dislikedBooks, setDislikedBooks, i)}
                      className="mt-3 text-[#c4a882] hover:text-[#b5763a] text-lg leading-none"
                      aria-label="Remove"
                    >
                      ×
                    </button>
                  )}
                </div>
              ))}
            </div>
            {dislikedBooks.length < 3 && (
              <button
                onClick={() => addBook(dislikedBooks, setDislikedBooks, 3)}
                className="mt-3 text-sm text-[#b5763a] hover:text-[#8a4e20] font-medium"
              >
                + Add another
              </button>
            )}
          </section>

          {/* Favorite Media */}
          <section>
            <h2 className="text-xl font-serif text-[#3b2a1a] mb-1">
              Favourite films or TV shows
            </h2>
            <p className="text-sm text-[#8a6a52] mb-3">
              These help me understand the kinds of stories and moods that resonate with you.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. The Shawshank Redemption, Slow Horses, anything with a great twist..."
              value={favoriteMedia}
              onChange={(e) => setFavoriteMedia(e.target.value)}
              className="w-full rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm resize-none"
            />
          </section>

          {/* Authors */}
          <section>
            <h2 className="text-xl font-serif text-[#3b2a1a] mb-1">
              Authors you enjoy
            </h2>
            <p className="text-sm text-[#8a6a52] mb-3">
              Anyone whose writing style or voice you&rsquo;ve liked, even if you&rsquo;ve only
              read one of their books.
            </p>
            <textarea
              rows={2}
              placeholder="e.g. Cormac McCarthy, Maggie O'Farrell, Bill Bryson..."
              value={likedAuthors}
              onChange={(e) => setLikedAuthors(e.target.value)}
              className="w-full rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm resize-none"
            />
          </section>

          {/* Avoid Topics */}
          <section>
            <h2 className="text-xl font-serif text-[#3b2a1a] mb-1">
              Things you&rsquo;d rather not read about
            </h2>
            <p className="text-sm text-[#8a6a52] mb-3">
              Topics, themes, or genres you actively avoid — I want to make sure the gift feels
              right, not obligatory.
            </p>
            <textarea
              rows={2}
              placeholder="e.g. war, horror, anything too bleak, romance novels..."
              value={avoidTopics}
              onChange={(e) => setAvoidTopics(e.target.value)}
              className="w-full rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm resize-none"
            />
          </section>

          {/* Great Book */}
          <section>
            <h2 className="text-xl font-serif text-[#3b2a1a] mb-1">
              What makes a book great for you?
            </h2>
            <p className="text-sm text-[#8a6a52] mb-3">
              No right answer. Could be a feeling, a quality of writing, a type of story — whatever
              comes to mind.
            </p>
            <textarea
              rows={3}
              placeholder="e.g. A story that makes me forget time exists. Characters who feel real. Something I still think about a week later..."
              value={greatBookMeans}
              onChange={(e) => setGreatBookMeans(e.target.value)}
              className="w-full rounded-lg border border-[#d9c9b5] bg-white px-4 py-3 text-[#3b2a1a] placeholder-[#c4a882] focus:outline-none focus:ring-2 focus:ring-[#b5763a]/40 text-sm resize-none"
            />
          </section>

          {/* Save Button */}
          <div className="pt-4 pb-8 text-center">
            <button
              onClick={handleSave}
              className="bg-[#b5763a] hover:bg-[#8a4e20] text-white font-semibold text-base px-10 py-4 rounded-xl shadow-md transition-colors duration-200 w-full sm:w-auto"
            >
              {saved ? "✓ Saved — check your downloads" : sending ? "Sending…" : "Save my answers"}
            </button>
            <p className="mt-3 text-xs text-[#a08060]">
              Downloads a small file to your device and sends your answers to Ellie.
            </p>
          </div>
        </div>
      </div>
      </div>
    </main>
  );
}
