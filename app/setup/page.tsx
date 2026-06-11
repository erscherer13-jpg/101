"use client";

import { useState, useRef } from "react";
import { saveProfile } from "@/lib/storage";
import type { DadProfile } from "@/lib/types";

export default function SetupPage() {
  const [status, setStatus] = useState<"idle" | "loaded" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const parsed = JSON.parse(ev.target?.result as string) as DadProfile;
        saveProfile(parsed);
        setStatus("loaded");
      } catch {
        setErrorMsg("That file didn't look right. Make sure it's the dad-profile.json downloaded from the profile form.");
        setStatus("error");
      }
    };
    reader.readAsText(file);
  }

  return (
    <main className="min-h-screen bg-[#faf6f0] flex items-center justify-center px-4">
      <div className="max-w-sm w-full text-center">
        <h1 className="text-2xl font-serif text-[#3b2a1a] mb-2">Load taste profile</h1>
        <p className="text-sm text-[#8a6a52] mb-8 leading-relaxed">
          Upload the <span className="font-mono text-xs bg-[#ede6da] px-1 rounded">dad-profile.json</span> file
          your dad downloaded from the profile form. This is only needed once — the profile stays saved on this device.
        </p>

        {status === "loaded" ? (
          <div className="bg-[#f0ebe1] border border-[#d9c9b5] rounded-xl px-6 py-5 text-[#3b2a1a]">
            <div className="text-2xl mb-2">✓</div>
            <p className="font-semibold">Profile loaded — preferences saved.</p>
            <p className="text-sm text-[#8a6a52] mt-1">You can close this page and start finding books.</p>
            <a
              href="/"
              className="inline-block mt-4 text-sm text-[#b5763a] hover:text-[#8a4e20] font-medium underline underline-offset-2"
            >
              Go to the homepage →
            </a>
          </div>
        ) : (
          <>
            <button
              onClick={() => inputRef.current?.click()}
              className="bg-[#b5763a] hover:bg-[#8a4e20] text-white font-semibold px-8 py-3 rounded-xl transition-colors duration-200 w-full"
            >
              Upload dad-profile.json
            </button>
            <input
              ref={inputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleFile}
              className="hidden"
            />
            {status === "error" && (
              <p className="mt-4 text-sm text-red-600">{errorMsg}</p>
            )}
          </>
        )}
      </div>
    </main>
  );
}
