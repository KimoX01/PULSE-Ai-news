"use client";

import type { NewsItem } from "@/types/news";

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch("/api/news", {
    signal: AbortSignal.timeout(58_000),
  });
  if (!res.ok) throw new Error(`/api/news returned ${res.status}`);
  return res.json();
}
