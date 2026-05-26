"use client";

import type { NewsItem } from "@/types/news";

const seedFeed: NewsItem[] = [
  {
    id: "seed-1", source: "rss", url: "https://techcrunch.com",
    title: "OpenAI releases new reasoning model with record benchmark scores",
    summary: "The new model outperforms all previous versions on math, coding, and logical reasoning tasks.",
    category: "llm", hypeScore: 91,
    publishedAt: new Date(Date.now() - 1000 * 60 * 12).toISOString(),
  },
  {
    id: "seed-2", source: "github", url: "https://github.com/trending",
    title: "Realtime inference gateway hits 30k stars in 48 hours",
    summary: "A Rust-based gateway with smart batching and token-aware routing becomes the top developer trend.",
    category: "infrastructure", hypeScore: 88,
    publishedAt: new Date(Date.now() - 1000 * 60 * 20).toISOString(),
  },
  {
    id: "seed-3", source: "rss", url: "https://apnews.com",
    title: "US and China reach preliminary agreement on trade tariffs",
    summary: "Both nations agreed to pause additional tariffs for 90 days while negotiations continue.",
    category: "world", hypeScore: 86,
    publishedAt: new Date(Date.now() - 1000 * 60 * 8).toISOString(),
  },
  {
    id: "seed-4", source: "arxiv", url: "https://arxiv.org",
    title: "Paper introduces low-latency planning for browser agents",
    summary: "The method reduces tool-call overhead and improves long-horizon browsing reliability under strict budgets.",
    category: "research", hypeScore: 78,
    publishedAt: new Date(Date.now() - 1000 * 60 * 35).toISOString(),
  },
];

export function getInitialFeed(): NewsItem[] {
  return seedFeed;
}
