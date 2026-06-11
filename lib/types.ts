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

export interface RecommendResponse {
  books: BookRecommendation[];
}
