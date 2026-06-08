"use client";

import { AnimatePresence, motion } from "framer-motion";
import { timeAgo } from "@/lib/timeAgo";
import type { NewsItem, NewsCategory } from "@/types/news";

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  world:    "#e879f9",
  science:  "#22d3ee",
  tech:     "#64748b",
  ai:       "#3b82f6",
  politics: "#f43f5e",
  business: "#f59e0b",
  health:   "#34d399",
  climate:  "#4ade80",
  ideas:    "#c084fc",
  culture:  "#fb923c",
};

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  world: "World", science: "Science", tech: "Tech", ai: "AI",
  politics: "Politics", business: "Business", health: "Health",
  climate: "Climate", ideas: "Ideas", culture: "Culture",
};

export function LiveFeed({ items }: { items: NewsItem[] }) {
  const latest = items.slice(0, 12);

  return (
    <div style={{ padding: "6px 0", maxHeight: 520, overflowY: "auto" }}>
      <AnimatePresence initial={false}>
        {latest.map((item) => {
          const accent = CATEGORY_COLOR[item.category] ?? "#6366f1";
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
                display: "flex",
                gap: 10,
                padding: "10px 14px",
                borderBottom: "1px solid var(--border)",
                cursor: "pointer",
                textDecoration: "none",
                transition: "background 120ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.background = "var(--bg-elevated)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
            >
              {/* Accent stripe */}
              <div style={{
                width: 2, borderRadius: 2, flexShrink: 0,
                background: accent, alignSelf: "stretch", minHeight: 20,
              }} />

              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Category + time */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 4 }}>
                  <span style={{
                    fontSize: 9, fontWeight: 700, color: accent,
                    letterSpacing: "0.1em", textTransform: "uppercase",
                  }}>
                    {CATEGORY_LABELS[item.category] ?? item.category}
                  </span>
                  <span style={{
                    fontSize: 9, color: "var(--text-muted)",
                    fontFamily: "var(--font-geist-mono)",
                  }}>
                    {timeAgo(item.publishedAt)}
                  </span>
                </div>

                {/* Title */}
                <p style={{
                  margin: 0, fontSize: 11.5, fontWeight: 500,
                  lineHeight: 1.45, color: "var(--text-primary)",
                  display: "-webkit-box",
                  WebkitLineClamp: 2,
                  WebkitBoxOrient: "vertical",
                  overflow: "hidden",
                }}>
                  {item.title}
                </p>
              </div>
            </motion.a>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
