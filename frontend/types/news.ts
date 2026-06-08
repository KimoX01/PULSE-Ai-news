export type NewsCategory =
  | "world"
  | "science"
  | "tech"
  | "ai"
  | "politics"
  | "business"
  | "health"
  | "climate"
  | "ideas"
  | "culture";

export interface NewsItem {
  id: string;
  source: "rss" | "github" | "arxiv";
  url: string;
  title: string;
  summary: string;
  category: NewsCategory;
  hypeScore: number;
  publishedAt: string;
  imageUrl?: string;
}
