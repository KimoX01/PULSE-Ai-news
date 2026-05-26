export type NewsCategory =
  | "llm"
  | "agentic"
  | "tooling"
  | "research"
  | "infrastructure"
  | "security"
  | "world"
  | "politics"
  | "science"
  | "business"
  | "tech";

export interface NewsItem {
  id: string;
  source: "x" | "rss" | "github" | "arxiv";
  url: string;
  title: string;
  summary: string;
  category: NewsCategory;
  hypeScore: number;
  publishedAt: string;
  imageUrl?: string;
}
