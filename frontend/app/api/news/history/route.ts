import { NextResponse } from "next/server";
import { initDb, queryArticles } from "@/lib/db";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const range = searchParams.get("range") ?? "yesterday";

  const now = new Date();
  let since: string;
  let until: string | undefined;

  if (range === "yesterday") {
    const yStart = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    const yEnd   = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    since = yStart.toISOString();
    until = yEnd.toISOString();
  } else if (range === "week") {
    const weekAgo = new Date(now);
    weekAgo.setDate(weekAgo.getDate() - 7);
    since = weekAgo.toISOString();
  } else if (range === "month") {
    const monthAgo = new Date(now);
    monthAgo.setMonth(monthAgo.getMonth() - 1);
    since = monthAgo.toISOString();
  } else {
    return NextResponse.json({ error: "invalid range" }, { status: 400 });
  }

  try {
    await initDb();
    const articles = await queryArticles(since, until, 300);
    return NextResponse.json(articles, {
      headers: { "Cache-Control": "s-maxage=300, stale-while-revalidate=60" },
    });
  } catch (e) {
    console.error("[history] query failed:", e);
    return NextResponse.json({ error: "database error" }, { status: 500 });
  }
}
