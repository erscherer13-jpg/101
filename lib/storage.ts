"use client";

import type { DadProfile, BookRecommendation } from "./types";

const PROFILE_KEY = "jbm_dad_profile";
const HISTORY_KEY = "jbm_recommendation_history";
const REJECTED_KEY = "jbm_rejected_books";
const ENJOYED_KEY = "jbm_enjoyed_books";

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

function loadStringList(key: string): string[] {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

function addToStringList(key: string, title: string): void {
  const existing = loadStringList(key);
  localStorage.setItem(key, JSON.stringify(Array.from(new Set([...existing, title]))));
}

export function loadRejected(): string[] {
  return loadStringList(REJECTED_KEY);
}

export function addRejected(title: string): void {
  addToStringList(REJECTED_KEY, title);
}

export function loadEnjoyed(): string[] {
  return loadStringList(ENJOYED_KEY);
}

export function addEnjoyed(title: string): void {
  addToStringList(ENJOYED_KEY, title);
}
