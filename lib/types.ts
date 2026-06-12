export interface BookEntry {
  title: string;
  word: string;
}

export interface DadProfile {
  lovedBooks: BookEntry[];
  dislikedBooks: BookEntry[];
  favoriteMedia: string;
  likedAuthors: string;
  avoidTopics: string;
  greatBookMeans: string;
}

export interface RecommendRequest {
  profile: DadProfile | null;
  readingMood: string;
  avoidThis: string;
  length: "quick" | "medium" | "long" | "any";
  history: string[]; // titles already shown
  exclude?: string[]; // extra titles to exclude (used for replacements)
  rejected?: string[]; // titles explicitly rejected via "Not for me"
  enjoyed?: string[]; // titles marked as enjoyed
}

export interface BookRecommendation {
  id: string;
  title: string;
  author: string;
  description: string;
  whyYoudLoveIt: string;
  criticsQuote: string;
  length: "Quick" | "Medium" | "Long";
}

export interface ReadingListEntry {
  id: string;
  title: string;
  author: string;
  description: string;
  whyYoudLoveIt: string;
}

export interface RecommendResponse {
  books: BookRecommendation[];
}
