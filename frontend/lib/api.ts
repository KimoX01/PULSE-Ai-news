"use client";

import type { NewsItem } from "@/types/news";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BACKEND_URL}/health`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchNews(): Promise<NewsItem[]> {
  const res = await fetch("/api/news", {
    signal: AbortSignal.timeout(15_000),
  });
  if (!res.ok) throw new Error(`/api/news returned ${res.status}`);
  return res.json();
}
