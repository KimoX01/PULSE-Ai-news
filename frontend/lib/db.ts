import { createClient } from "@libsql/client";
import path from "path";
import fs from "fs";

declare global {
  // eslint-disable-next-line no-var
  var _pulseDb: ReturnType<typeof createClient> | undefined;
}

function createDb() {
  // Production: use Turso remote database
  if (process.env.TURSO_DATABASE_URL) {
    return createClient({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
  }
  // Development: local SQLite file
  const DATA_DIR = path.join(process.cwd(), "data");
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
  return createClient({ url: `file:${path.join(DATA_DIR, "pulse.db")}` });
}

export const db = globalThis._pulseDb ?? createDb();
if (process.env.NODE_ENV !== "production") globalThis._pulseDb = db;

/* ── Initialize schema ─────────────────────────────────────── */
export async function initDb() {
  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS articles (
      id          TEXT PRIMARY KEY,
      source      TEXT NOT NULL,
      url         TEXT NOT NULL,
      title       TEXT NOT NULL,
      summary     TEXT DEFAULT '',
      category    TEXT NOT NULL,
      hype_score  INTEGER NOT NULL DEFAULT 50,
      published_at TEXT NOT NULL,
      image_url   TEXT,
      fetched_at  TEXT NOT NULL
    );
    CREATE UNIQUE INDEX IF NOT EXISTS idx_url        ON articles(url);
    CREATE INDEX IF NOT EXISTS idx_published        ON articles(published_at DESC);
    CREATE INDEX IF NOT EXISTS idx_category         ON articles(category);
    CREATE INDEX IF NOT EXISTS idx_score            ON articles(hype_score DESC);
  `);
}

/* ── Upsert a batch of articles ────────────────────────────── */
export async function upsertArticles(articles: {
  id: string; source: string; url: string; title: string;
  summary: string; category: string; hypeScore: number;
  publishedAt: string; imageUrl?: string;
}[]) {
  if (articles.length === 0) return;
  const now = new Date().toISOString();
  // libsql doesn't support batch inserts with transactions in the same way,
  // so we run individual upserts (still fast for <200 rows)
  await db.batch(
    articles.map(a => ({
      sql: `INSERT OR REPLACE INTO articles
              (id, source, url, title, summary, category, hype_score, published_at, image_url, fetched_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [a.id, a.source, a.url, a.title, a.summary, a.category, a.hypeScore, a.publishedAt, a.imageUrl ?? null, now],
    })),
    "write",
  );
}

/* ── Query by date range ───────────────────────────────────── */
export type DbArticle = {
  id: string; source: string; url: string; title: string;
  summary: string; category: string; hypeScore: number;
  publishedAt: string; imageUrl?: string;
};

export async function queryArticles(since: string, until?: string, limit = 200): Promise<DbArticle[]> {
  const result = until
    ? await db.execute({
        sql: `SELECT * FROM articles WHERE published_at >= ? AND published_at < ?
              ORDER BY hype_score DESC, published_at DESC LIMIT ?`,
        args: [since, until, limit],
      })
    : await db.execute({
        sql: `SELECT * FROM articles WHERE published_at >= ?
              ORDER BY hype_score DESC, published_at DESC LIMIT ?`,
        args: [since, limit],
      });

  return result.rows.map(r => ({
    id:          String(r.id),
    source:      String(r.source),
    url:         String(r.url),
    title:       String(r.title),
    summary:     String(r.summary ?? ""),
    category:    String(r.category),
    hypeScore:   Number(r.hype_score),
    publishedAt: String(r.published_at),
    imageUrl:    r.image_url ? String(r.image_url) : undefined,
  }));
}

export async function getArticleCount(): Promise<number> {
  const r = await db.execute("SELECT COUNT(*) as cnt FROM articles");
  return Number(r.rows[0]?.cnt ?? 0);
}
