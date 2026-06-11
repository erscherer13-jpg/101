"use client";

import type { DadProfile, BookRecommendation } from "./types";

const PROFILE_KEY = "jbm_dad_profile";
const HISTORY_KEY = "jbm_recommendation_history";

export function saveProfile(profile: DadProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

export function loadProfile(): DadProfile | null {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    return raw ? (JSON.parse(raw) as DadProfile) : null;
  } catch {
    return null;
  }
}

export function loadHistory(): string[] {
  try {
    const raw = localStorage.getItem(HISTORY_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function addToHistory(books: BookRecommendation[]): void {
  const existing = loadHistory();
  const titles = books.map((b) => b.title);
  const merged = Array.from(new Set([...existing, ...titles]));
  localStorage.setItem(HISTORY_KEY, JSON.stringify(merged));
}
