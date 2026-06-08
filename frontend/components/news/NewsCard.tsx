"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowUpRight, Clock } from "lucide-react";
import { timeAgo } from "@/lib/timeAgo";
import { useReadContext } from "@/context/ReadContext";
import type { NewsItem, NewsCategory } from "@/types/news";

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  world: "World", science: "Science", tech: "Tech", ai: "AI",
  politics: "Politics", business: "Business", health: "Health",
  climate: "Climate", ideas: "Ideas", culture: "Culture",
};

const CATEGORY_COLOR: Record<NewsCategory, string> = {
  world:    "#e879f9",
  science:  "#22d3ee",
  tech:     "#94a3b8",
  ai:       "#60a5fa",
  politics: "#fb7185",
  business: "#fbbf24",
  health:   "#34d399",
  climate:  "#4ade80",
  ideas:    "#c084fc",
  culture:  "#fb923c",
};

const CATEGORY_GRADIENT: Record<NewsCategory, string> = {
  world:    "linear-gradient(135deg, #4c1d95 0%, #7c3aed 50%, #e879f9 100%)",
  science:  "linear-gradient(135deg, #164e63 0%, #0891b2 50%, #22d3ee 100%)",
  tech:     "linear-gradient(135deg, #1e293b 0%, #334155 50%, #94a3b8 100%)",
  ai:       "linear-gradient(135deg, #1e3a5f 0%, #1d4ed8 50%, #60a5fa 100%)",
  politics: "linear-gradient(135deg, #4c0519 0%, #be123c 50%, #fb7185 100%)",
  business: "linear-gradient(135deg, #451a03 0%, #b45309 50%, #fbbf24 100%)",
  health:   "linear-gradient(135deg, #064e3b 0%, #059669 50%, #34d399 100%)",
  climate:  "linear-gradient(135deg, #14532d 0%, #15803d 50%, #4ade80 100%)",
  ideas:    "linear-gradient(135deg, #3b0764 0%, #7e22ce 50%, #c084fc 100%)",
  culture:  "linear-gradient(135deg, #431407 0%, #c2410c 50%, #fb923c 100%)",
};

const SOURCE_LABEL: Record<string, string> = {
  github: "GitHub", arxiv: "arXiv", rss: "Web",
};

function catLabel(cat: string): string {
  return CATEGORY_LABELS[cat as NewsCategory] ?? cat;
}
function catColor(cat: string): string {
  return CATEGORY_COLOR[cat as NewsCategory] ?? "#6366f1";
}
function catGradient(cat: string): string {
  return CATEGORY_GRADIENT[cat as NewsCategory] ?? CATEGORY_GRADIENT.world;
}

function ArticleImage({ src, alt, aspectRatio }: { src: string; alt: string; aspectRatio: string }) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError]   = useState(false);
  if (error) return null;
  return (
    <div style={{ position: "relative", width: "100%", aspectRatio, overflow: "hidden", background: "var(--bg-elevated)" }}>
      {!loaded && (
        <div style={{
          position: "absolute", inset: 0,
          background: "var(--bg-elevated)",
          animation: "skeletonPulse 1.5s ease-in-out infinite",
        }} />
      )}
      <img
        src={src} alt={alt}
        onLoad={() => setLoaded(true)}
        onError={() => setError(true)}
        className="card-img"
        style={{
          width: "100%", height: "100%",
          objectFit: "cover", display: "block",
          opacity: loaded ? 1 : 0,
          transition: "opacity 0.4s ease",
        }}
      />
    </div>
  );
}

function GradientVisual({ item, aspectRatio }: { item: NewsItem; aspectRatio: string }) {
  return (
    <div style={{
      width: "100%", aspectRatio,
      background: catGradient(item.category),
      position: "relative", overflow: "hidden",
    }}>
      <span style={{
        position: "absolute", bottom: -24, right: -8,
        fontSize: "clamp(80px, 18vw, 200px)",
        fontWeight: 900,
        color: "rgba(255,255,255,0.06)",
        lineHeight: 1, userSelect: "none", letterSpacing: "-0.05em",
      }}>
        {catLabel(item.category)[0]}
      </span>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════
   HERO CARD — full-width featured story
═══════════════════════════════════════════════════════ */
export function HeroCard({ item }: { item: NewsItem }) {
  const { readIds, markRead } = useReadContext();
  const isRead = readIds.has(item.id);
  const accent = catColor(item.category);
  const hasImg = !!item.imageUrl;

  return (
    <motion.article
      whileHover={{ y: -1 }}
      transition={{ type: "spring", stiffness: 300, damping: 30 }}
      style={{
        background: "var(--bg-card)",
        borderRadius: 14,
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        opacity: isRead ? 0.6 : 1,
        transition: "box-shadow 200ms ease, opacity 200ms ease",
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-hover)"; }}
      onMouseLeave={e => { (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)"; }}
    >
      {/* Cinematic 21:9 image */}
      <a
        href={item.url} target="_blank" rel="noreferrer noopener"
        onClick={() => markRead(item.id)}
        style={{ display: "block", textDecoration: "none", position: "relative" }}
      >
        <div style={{ position: "relative", overflow: "hidden" }}>
          {hasImg
            ? <ArticleImage src={item.imageUrl!} alt={item.title} aspectRatio="21/9" />
            : <GradientVisual item={item} aspectRatio="21/9" />
          }
          {/* Overlaid badges */}
          <div style={{ position: "absolute", top: 16, left: 16, display: "flex", gap: 7 }}>
            <span style={{
              fontSize: 10, fontWeight: 800, letterSpacing: "0.1em",
              padding: "4px 10px", borderRadius: 20,
              background: accent, color: "#000", textTransform: "uppercase",
            }}>
              {catLabel(item.category)}
            </span>
            {item.hypeScore > 80 && (
              <span style={{
                fontSize: 9, fontWeight: 700, letterSpacing: "0.1em",
                padding: "4px 9px", borderRadius: 20,
                background: "rgba(251,191,36,0.92)", color: "#000", textTransform: "uppercase",
              }}>
                Notable
              </span>
            )}
          </div>
        </div>
      </a>

      {/* Hero body */}
      <div style={{ padding: "20px 24px 22px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, marginBottom: 10 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: accent, letterSpacing: "0.04em", textTransform: "uppercase" }}>
            {SOURCE_LABEL[item.source] ?? item.source}
          </span>
          <span style={{ color: "var(--border-strong)", fontSize: 11 }}>·</span>
          <Clock size={10} color="var(--text-muted)" />
          <span style={{ fontSize: 11, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
            {timeAgo(item.publishedAt)}
          </span>
        </div>

        <a
          href={item.url} target="_blank" rel="noreferrer noopener"
          onClick={() => markRead(item.id)}
          style={{ textDecoration: "none" }}
        >
          <h2 style={{
            margin: "0 0 10px",
            fontSize: "clamp(20px, 2.4vw, 28px)",
            fontWeight: 800,
            lineHeight: 1.22,
            letterSpacing: "-0.03em",
            color: isRead ? "var(--text-muted)" : "var(--text-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 3,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {item.title}
          </h2>
        </a>

        {item.summary && (
          <p style={{
            margin: "0 0 16px", fontSize: 14, lineHeight: 1.65,
            color: "var(--text-secondary)", maxWidth: "70ch",
            display: "-webkit-box",
            WebkitLineClamp: 2,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {item.summary}
          </p>
        )}

        <a
          href={item.url} target="_blank" rel="noreferrer noopener"
          onClick={() => markRead(item.id)}
          style={{
            display: "inline-flex", alignItems: "center", gap: 5,
            fontSize: 11, fontWeight: 700, letterSpacing: "0.06em",
            color: isRead ? "var(--text-muted)" : accent,
            textDecoration: "none", textTransform: "uppercase",
            transition: "opacity 150ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.7"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
        >
          {isRead ? "Read again" : "Read article"}
          <ArrowUpRight size={12} />
        </a>
      </div>
    </motion.article>
  );
}

/* ═══════════════════════════════════════════════════════
   GRID CARD — compact 3-column card
═══════════════════════════════════════════════════════ */
export function GridCard({ item }: { item: NewsItem }) {
  const { readIds, markRead } = useReadContext();
  const isRead = readIds.has(item.id);
  const accent = catColor(item.category);
  const hasImg = !!item.imageUrl;

  return (
    <motion.article
      whileHover={{ y: -3 }}
      transition={{ type: "spring", stiffness: 350, damping: 28 }}
      style={{
        background: "var(--bg-card)",
        borderRadius: 12,
        overflow: "hidden",
        border: "1px solid var(--border)",
        boxShadow: "var(--shadow-card)",
        opacity: isRead ? 0.55 : 1,
        transition: "box-shadow 200ms ease, opacity 200ms ease",
        display: "flex",
        flexDirection: "column",
        height: "100%",
      }}
      onMouseEnter={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-hover)";
        (e.currentTarget as HTMLElement).style.opacity = "1";
      }}
      onMouseLeave={e => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLElement).style.opacity = isRead ? "0.55" : "1";
      }}
    >
      {/* Accent stripe */}
      <div style={{ height: 3, background: accent, flexShrink: 0 }} />

      {/* Image */}
      <a
        href={item.url} target="_blank" rel="noreferrer noopener"
        onClick={() => markRead(item.id)}
        style={{ display: "block", textDecoration: "none", flexShrink: 0 }}
      >
        {hasImg
          ? <ArticleImage src={item.imageUrl!} alt={item.title} aspectRatio="16/9" />
          : <GradientVisual item={item} aspectRatio="16/9" />
        }
      </a>

      {/* Body */}
      <div style={{ padding: "13px 14px 14px", display: "flex", flexDirection: "column", flex: 1 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 7 }}>
          <span style={{ fontSize: 10, fontWeight: 700, color: accent, letterSpacing: "0.08em", textTransform: "uppercase" }}>
            {catLabel(item.category)}
          </span>
          <span style={{ fontSize: 10, color: "var(--text-muted)", fontFamily: "var(--font-geist-mono)" }}>
            {timeAgo(item.publishedAt)}
          </span>
        </div>

        <a
          href={item.url} target="_blank" rel="noreferrer noopener"
          onClick={() => markRead(item.id)}
          style={{ textDecoration: "none", flex: 1 }}
        >
          <h3 style={{
            margin: "0 0 10px",
            fontSize: "clamp(13px, 1.3vw, 15px)",
            fontWeight: 700,
            lineHeight: 1.4,
            letterSpacing: "-0.02em",
            color: isRead ? "var(--text-muted)" : "var(--text-primary)",
            display: "-webkit-box",
            WebkitLineClamp: 4,
            WebkitBoxOrient: "vertical",
            overflow: "hidden",
          }}>
            {item.title}
          </h3>
        </a>

        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: "auto" }}>
          <span style={{ fontSize: 10, color: "var(--text-muted)" }}>
            {SOURCE_LABEL[item.source] ?? item.source}
          </span>
          <a
            href={item.url} target="_blank" rel="noreferrer noopener"
            onClick={() => markRead(item.id)}
            style={{
              display: "inline-flex", alignItems: "center", gap: 3,
              fontSize: 10, fontWeight: 600,
              color: isRead ? "var(--text-muted)" : accent,
              textDecoration: "none", opacity: 0.8,
              transition: "opacity 150ms ease",
            }}
            onMouseEnter={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "1"; }}
            onMouseLeave={e => { (e.currentTarget as HTMLAnchorElement).style.opacity = "0.8"; }}
          >
            Read <ArrowUpRight size={10} />
          </a>
        </div>
      </div>
    </motion.article>
  );
}

export function NewsCard({ item }: { item: NewsItem }) {
  return <GridCard item={item} />;
}
