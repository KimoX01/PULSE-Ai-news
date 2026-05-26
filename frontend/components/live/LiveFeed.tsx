"use client";

import { AnimatePresence, motion } from "framer-motion";
import { timeAgo } from "@/lib/timeAgo";
import type { NewsItem, NewsCategory } from "@/types/news";

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  llm: "#3b82f6",
  agentic: "#8b5cf6",
  tooling: "#f97316",
  research: "#22c55e",
  infrastructure: "#06b6d4",
  security: "#ef4444",
  world: "#e879f9",
  politics: "#f43f5e",
  science: "#14b8a6",
  business: "#eab308",
  tech: "#64748b",
};

export function LiveFeed({ items }: { items: NewsItem[] }) {
  const latest = items.slice(0, 10);

  return (
    <div style={{ padding: "8px 0", maxHeight: 480, overflowY: "auto" }}>
      <AnimatePresence initial={false}>
        {latest.map((item) => {
          const accent = CATEGORY_COLOR[item.category];
          return (
            <motion.a
              key={item.id}
              href={item.url}
              target="_blank"
              rel="noreferrer noopener"
              layout
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, height: 0, marginBottom: 0 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              style={{
                display: "block",
                padding: "10px 16px",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                textDecoration: "none",
                transition: "background 120ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              {/* Category dot + source */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 6,
                  marginBottom: 5,
                }}
              >
                <span
                  style={{
                    width: 6,
                    height: 6,
                    borderRadius: "50%",
                    background: accent,
                    flexShrink: 0,
                  }}
                />
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: accent,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                  }}
                >
                  {item.category}
                </span>
                <span style={{ flex: 1 }} />
                <span
                  style={{
                    fontSize: 10,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono)",
                  }}
                >
                  {timeAgo(item.publishedAt)}
                </span>
              </div>

              {/* Title */}
              <p
                style={{
                  margin: 0,
                  fontSize: 12,
                  fontWeight: 500,
                  lineHeight: 1.45,
                  color: "var(--text-primary)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}
              >
                {item.title}
              </p>

              {/* Score bar */}
              <div style={{ marginTop: 7 }}>
                <div className="score-bar">
                  <div
                    className="score-fill"
                    style={{
                      width: `${item.hypeScore}%`,
                      background: accent,
                      opacity: 0.6,
                    }}
                  />
                </div>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "flex-end",
                    marginTop: 2,
                    fontSize: 9,
                    color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono)",
                    letterSpacing: "0.04em",
                  }}
                >
                  score {item.hypeScore}
                </div>
              </div>
            </motion.a>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
