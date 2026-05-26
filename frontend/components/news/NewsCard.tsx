"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ExternalLink, TrendingUp } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import { useReadContext } from "@/context/ReadContext";
import type { NewsItem, NewsCategory } from "@/types/news";

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  llm: "LLM", agentic: "Agents", tooling: "Tooling",
  research: "Research", infrastructure: "Infra", security: "Security",
  world: "World", politics: "Politics", science: "Science",
  business: "Business", tech: "Tech",
};

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  llm: "#3b82f6", agentic: "#8b5cf6", tooling: "#f97316",
  research: "#22c55e", infrastructure: "#06b6d4", security: "#ef4444",
  world: "#e879f9", politics: "#f43f5e", science: "#14b8a6",
  business: "#eab308", tech: "#64748b",
};

const SOURCE_LABEL: Record<string, string> = {
  github: "GitHub", arxiv: "arXiv", rss: "Web", x: "Web",
};

function NewsImage({ src, alt }: { src: string; alt: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (error) return null;
  return (
    <div style={{ position: "relative", width: "100%", height: "100%", overflow: "hidden", background: "var(--bg-elevated)" }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "var(--bg-elevated)",
          animation: "skeletonPulse 1.5s ease-in-out infinite",
        }} />
      )}
      <motion.img
        src={src} alt={alt}
        initial={{ opacity: 0 }}
        animate={{ opacity: loaded ? 1 : 0 }}
        transition={{ duration: 0.3 }}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
      />
    </div>
  );
}

export function NewsCard({ item, featured = false }: { item: NewsItem; featured?: boolean }) {
  const { readIds, markRead, newIds, lastVisit } = useReadContext();

  const accent     = CATEGORY_COLOR[item.category] ?? "#6366f1";
  const isRead     = readIds.has(item.id);
  const isNew      = newIds.has(item.id) ||
    (lastVisit !== null && new Date(item.publishedAt) > lastVisit && !isRead);
  const isTrending = item.hypeScore > 80;
  const hasImage   = !!item.imageUrl && (featured || item.hypeScore > 70);
  const showSummary = !!item.summary && (featured || item.hypeScore > 65);

  return (
    <motion.a
      href={item.url}
      target="_blank"
      rel="noreferrer noopener"
      onClick={() => markRead(item.id)}
      whileHover={{ y: isRead ? 0 : -2 }}
      transition={{ type: "spring", stiffness: 340, damping: 30 }}
      style={{
        display: "flex",
        flexDirection: "column",
        height: "100%",
        background: "var(--bg-card)",
        border: "1px solid var(--border)",
        borderLeft: `3px solid ${isRead ? "var(--border-strong)" : accent}`,
        borderRadius: 10,
        overflow: "hidden",
        cursor: "pointer",
        textDecoration: "none",
        boxShadow: "var(--shadow-card)",
        transition: "box-shadow 200ms ease, opacity 200ms ease",
        opacity: isRead ? 0.55 : 1,
        filter: isRead ? "saturate(0.3)" : "none",
        position: "relative",
      }}
      onMouseEnter={e => {
        const el = e.currentTarget;
        el.style.boxShadow = "var(--shadow-hover)";
        el.style.opacity = "1";
        el.style.filter = "none";
      }}
      onMouseLeave={e => {
        const el = e.currentTarget;
        el.style.boxShadow = "var(--shadow-card)";
        el.style.opacity = isRead ? "0.55" : "1";
        el.style.filter = isRead ? "saturate(0.3)" : "none";
      }}
    >
      {/* NEW badge */}
      {isNew && (
        <div style={{
          position: "absolute", top: 10, right: 10, zIndex: 2,
          display: "flex", alignItems: "center", gap: 4,
          padding: "2px 8px", borderRadius: 20,
          background: "rgba(34,197,94,0.12)",
          border: "1px solid rgba(34,197,94,0.35)",
          fontSize: 9, fontWeight: 700, color: "#22c55e", letterSpacing: "0.08em",
        }}>
          <span style={{
            width: 5, height: 5, borderRadius: "50%",
            background: "#22c55e", display: "inline-block",
            animation: "livePulse 1.8s ease-in-out infinite",
          }} />
          NEW
        </div>
      )}

      {/* Hero image */}
      {hasImage && (
        <div style={{
          width: "100%", height: featured ? 220 : 140,
          flexShrink: 0, overflow: "hidden", position: "relative",
        }}>
          <NewsImage src={item.imageUrl!} alt={item.title} />
          <div style={{
            position: "absolute", bottom: 0, left: 0, right: 0, height: 48,
            background: "linear-gradient(transparent, var(--bg-card))",
          }} />
        </div>
      )}

      {/* Body */}
      <div style={{ padding: featured ? "18px 20px 16px" : "14px 16px 13px", flex: 1, display: "flex", flexDirection: "column", gap: 8 }}>
        {/* Title */}
        <h3 style={{
          margin: 0,
          fontWeight: 650,
          lineHeight: 1.45,
          color: isRead ? "var(--text-muted)" : "var(--text-primary)",
          fontSize: featured ? "1.1rem" : "0.9rem",
          display: "-webkit-box",
          WebkitLineClamp: featured ? 3 : 3,
          WebkitBoxOrient: "vertical",
          overflow: "hidden",
          letterSpacing: "-0.01em",
        }}>
          {item.title}
        </h3>

        {/* Summary */}
        {showSummary && (
          <p style={{
            margin: 0,
            fontSize: featured ? "0.85rem" : "0.8rem",
            lineHeight: 1.6,
            color: "var(--text-secondary)",
            display: "-webkit-box",
            WebkitLineClamp: featured ? 3 : 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {item.summary}
          </p>
        )}

        {/* Spacer */}
        <div style={{ flex: 1 }} />

        {/* Meta line — source · category · time · score */}
        <div style={{
          display: "flex", alignItems: "center", gap: 6,
          paddingTop: 6, borderTop: "1px solid var(--border)",
          flexWrap: "nowrap", overflow: "hidden",
        }}>
          {/* Category pill */}
          <span style={{
            fontSize: 10, fontWeight: 600, letterSpacing: "0.07em",
            padding: "2px 7px", borderRadius: 4, flexShrink: 0,
            background: isRead ? "var(--bg-elevated)" : `${accent}18`,
            color: isRead ? "var(--text-muted)" : accent,
            textTransform: "uppercase",
          }}>
            {CATEGORY_LABELS[item.category] ?? item.category}
          </span>

          {/* Source */}
          <span style={{ fontSize: 10, color: "var(--text-muted)", flexShrink: 0 }}>
            {SOURCE_LABEL[item.source] ?? item.source}
          </span>

          <span style={{ fontSize: 10, color: "var(--border-strong)", flexShrink: 0 }}>·</span>

          {/* Time */}
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
            {timeAgo(item.publishedAt)}
          </span>

          <div style={{ flex: 1 }} />

          {/* Score / read indicator */}
          {isRead ? (
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
              read
            </span>
          ) : isTrending ? (
            <span style={{
              display: "flex", alignItems: "center", gap: 3,
              fontSize: 11, color: "#f59e0b", fontWeight: 600,
              fontFamily: "var(--font-geist-mono)", flexShrink: 0,
            }}>
              <TrendingUp size={10} />
              {item.hypeScore}
            </span>
          ) : (
            <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
              {item.hypeScore}
            </span>
          )}

          <ExternalLink size={9} style={{ color: "var(--border-strong)", flexShrink: 0 }} />
        </div>
      </div>
    </motion.a>
  );
}
