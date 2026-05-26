"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon } from "lucide-react";
import { BentoGrid } from "@/components/news/BentoGrid";
import { LiveFeed } from "@/components/live/LiveFeed";
import { fetchNews } from "@/lib/api";
import { getInitialFeed } from "@/lib/mockFeed";
import { ReadContext } from "@/context/ReadContext";
import type { NewsItem, NewsCategory } from "@/types/news";

const ALL_CATEGORIES: NewsCategory[] = [
  "llm", "agentic", "tooling", "research", "infrastructure", "security",
  "world", "politics", "science", "business", "tech",
];

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  llm: "LLM", agentic: "Agents", tooling: "Tooling",
  research: "Research", infrastructure: "Infra", security: "Security",
  world: "World", politics: "Politics", science: "Science",
  business: "Business", tech: "Tech",
};

const PAGE_SIZE = 12;
const REFRESH_INTERVAL = 60_000;

type FetchState = "loading" | "live" | "mock" | "error";
type TimePeriod = "live" | "yesterday" | "week" | "month";

const PERIOD_LABELS: Record<TimePeriod, string> = {
  live: "Live", yesterday: "Yesterday", week: "This Week", month: "This Month",
};

export function PulseDashboard() {
  /* ── Feed state ────────────────────────────────────────── */
  const [allItems, setAllItems]         = useState<NewsItem[]>(() => getInitialFeed());
  const [historyItems, setHistoryItems] = useState<NewsItem[]>([]);
  const [timePeriod, setTimePeriod]     = useState<TimePeriod>("live");
  const [activeCategory, setActiveCategory] = useState<NewsCategory | "all">("all");
  const [fetchState, setFetchState]     = useState<FetchState>("loading");
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const [now, setNow]                   = useState(() => new Date());

  /* ── Theme ─────────────────────────────────────────────── */
  const [theme, setTheme] = useState<"dark" | "light">("dark");
  useEffect(() => {
    const t = document.documentElement.getAttribute("data-theme") as "dark" | "light";
    if (t) setTheme(t);
  }, []);
  const toggleTheme = useCallback(() => {
    const next = theme === "dark" ? "light" : "dark";
    setTheme(next);
    document.documentElement.setAttribute("data-theme", next);
    try { localStorage.setItem("pulse_theme", next); } catch {}
  }, [theme]);

  /* ── Read history ──────────────────────────────────────── */
  const [readIds, setReadIds]     = useState<Set<string>>(new Set());
  const [lastVisit, setLastVisit] = useState<Date | null>(null);

  /* ── New article detection ─────────────────────────────── */
  const prevIdsRef                = useRef<Set<string>>(new Set());
  const [newIds, setNewIds]       = useState<Set<string>>(new Set());
  const [newBanner, setNewBanner] = useState(0);

  /* ── Countdown ─────────────────────────────────────────── */
  const lastRefreshAt             = useRef<number>(Date.now());
  const [secsLeft, setSecsLeft]   = useState(REFRESH_INTERVAL / 1000);

  /* ── Infinite scroll ───────────────────────────────────── */
  const sentinelRef = useRef<HTMLDivElement>(null);

  /* ── localStorage init ─────────────────────────────────── */
  useEffect(() => {
    try {
      const raw = localStorage.getItem("pulse_read");
      if (raw) setReadIds(new Set(JSON.parse(raw)));
      const lv = localStorage.getItem("pulse_last_visit");
      if (lv) setLastVisit(new Date(lv));
      localStorage.setItem("pulse_last_visit", new Date().toISOString());
    } catch {}
  }, []);

  const markRead = useCallback((id: string) => {
    setReadIds(prev => {
      const next = new Set(prev);
      next.add(id);
      try { localStorage.setItem("pulse_read", JSON.stringify([...next].slice(-2000))); } catch {}
      return next;
    });
  }, []);

  /* ── Clock ─────────────────────────────────────────────── */
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(t);
  }, []);

  /* ── Countdown ticker ──────────────────────────────────── */
  useEffect(() => {
    if (timePeriod !== "live") return;
    const t = setInterval(() => {
      const elapsed = (Date.now() - lastRefreshAt.current) / 1000;
      setSecsLeft(Math.max(0, Math.round(REFRESH_INTERVAL / 1000 - elapsed)));
    }, 1000);
    return () => clearInterval(t);
  }, [timePeriod]);

  /* ── Fetch live ────────────────────────────────────────── */
  const loadNews = useCallback(async () => {
    try {
      const data = await fetchNews();
      if (data.length === 0) { setFetchState("mock"); return; }
      if (prevIdsRef.current.size > 0) {
        const fresh = data.filter(d => !prevIdsRef.current.has(d.id));
        if (fresh.length > 0) {
          setNewIds(new Set(fresh.map(d => d.id)));
          setNewBanner(fresh.length);
          setTimeout(() => setNewIds(new Set()), 20_000);
        }
      }
      prevIdsRef.current = new Set(data.map(d => d.id));
      lastRefreshAt.current = Date.now();
      setSecsLeft(REFRESH_INTERVAL / 1000);
      setAllItems(data);
      setFetchState("live");
    } catch { setFetchState("error"); }
  }, []);

  /* ── Fetch history ─────────────────────────────────────── */
  const loadHistory = useCallback(async (period: TimePeriod) => {
    if (period === "live") return;
    setFetchState("loading");
    try {
      const res = await fetch(`/api/news/history?range=${period}`);
      if (!res.ok) throw new Error();
      const data: NewsItem[] = await res.json();
      setHistoryItems(data);
      setFetchState(data.length > 0 ? "live" : "mock");
    } catch { setFetchState("error"); }
  }, []);

  useEffect(() => {
    if (timePeriod !== "live") return;
    loadNews();
    const t = setInterval(loadNews, REFRESH_INTERVAL);
    return () => clearInterval(t);
  }, [loadNews, timePeriod]);

  useEffect(() => {
    if (timePeriod !== "live") loadHistory(timePeriod);
  }, [timePeriod, loadHistory]);

  useEffect(() => { setVisibleCount(PAGE_SIZE); }, [activeCategory, timePeriod]);

  /* ── Derived ───────────────────────────────────────────── */
  const displayItems = timePeriod === "live" ? allItems : historyItems;

  const filtered = useMemo(
    () => activeCategory === "all" ? displayItems : displayItems.filter(i => i.category === activeCategory),
    [displayItems, activeCategory],
  );

  const visible    = filtered.slice(0, visibleCount);
  const hasMore    = visibleCount < filtered.length;
  const allLoaded  = !hasMore;
  const trendingCount = useMemo(() => displayItems.filter(i => i.hypeScore > 80).length, [displayItems]);
  const readCount  = useMemo(() => visible.filter(i => readIds.has(i.id)).length, [visible, readIds]);
  const readPct    = visible.length > 0 ? Math.round((readCount / visible.length) * 100) : 0;

  /* ── Infinite scroll ───────────────────────────────────── */
  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting && hasMore) setVisibleCount(c => Math.min(c + PAGE_SIZE, filtered.length)); },
      { rootMargin: "400px" },
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [hasMore, filtered.length]);

  const dateStr = now.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
  const isLive  = timePeriod === "live";
  const statusColor = fetchState === "live" ? "#22c55e" : fetchState === "loading" ? "var(--text-muted)" : fetchState === "error" ? "#ef4444" : "#f59e0b";

  return (
    <ReadContext.Provider value={{ readIds, markRead, newIds, lastVisit }}>
      <div style={{ minHeight: "100vh", background: "var(--bg)" }}>

        {/* ── Nav ─────────────────────────────────────────── */}
        <nav style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--nav-bg)",
          backdropFilter: "blur(20px)",
          position: "sticky", top: 0, zIndex: 50,
        }}>
          <div style={{
            maxWidth: 1380, margin: "0 auto", padding: "0 24px",
            height: 54, display: "flex", alignItems: "center", gap: 20,
          }}>
            {/* Logo */}
            <span style={{ fontWeight: 800, fontSize: 17, letterSpacing: "-0.5px", color: "var(--text-primary)", fontFamily: "var(--font-geist-mono)", flexShrink: 0 }}>
              <span style={{ color: "var(--brand)" }}>P</span>ULSE
            </span>

            {/* Period tabs — in nav */}
            <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
              {(["live", "yesterday", "week", "month"] as TimePeriod[]).map(period => {
                const active = timePeriod === period;
                return (
                  <button key={period} onClick={() => setTimePeriod(period)} style={{
                    padding: "5px 13px", borderRadius: 7,
                    border: active ? `1px solid ${period === "live" ? "rgba(99,102,241,0.35)" : "var(--border-strong)"}` : "1px solid transparent",
                    background: active ? (period === "live" ? "var(--brand-dim)" : "var(--bg-elevated)") : "transparent",
                    color: active ? (period === "live" ? "var(--brand)" : "var(--text-primary)") : "var(--text-muted)",
                    fontSize: 12, fontWeight: active ? 700 : 400,
                    cursor: "pointer", whiteSpace: "nowrap",
                    transition: "all 140ms ease",
                    display: "flex", alignItems: "center", gap: 6,
                  }}>
                    {period === "live" && (
                      <span
                        className={active ? "live-dot" : undefined}
                        style={{ width: 6, height: 6, borderRadius: "50%", background: active ? "var(--brand)" : "var(--text-muted)", display: "inline-block", flexShrink: 0 }}
                      />
                    )}
                    {PERIOD_LABELS[period]}
                  </button>
                );
              })}
            </div>

            <div style={{ flex: 1 }} />

            {/* Date */}
            <span style={{ fontSize: 12, color: "var(--text-muted)", flexShrink: 0 }}>{dateStr}</span>

            {/* Status */}
            {isLive && (
              <div style={{ display: "flex", alignItems: "center", gap: 5, flexShrink: 0 }}>
                <span
                  className={fetchState === "live" ? "live-dot" : undefined}
                  style={{ width: 6, height: 6, borderRadius: "50%", background: statusColor }}
                />
                <span style={{ fontSize: 11, color: statusColor, letterSpacing: "0.05em", fontFamily: "var(--font-geist-mono)" }}>
                  {fetchState === "loading" ? "CONNECTING" : fetchState === "live" ? "LIVE" : fetchState === "error" ? "ERROR" : "DEMO"}
                </span>
              </div>
            )}

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
              style={{
                width: 34, height: 34, borderRadius: 8, flexShrink: 0,
                border: "1px solid var(--border-strong)",
                background: "var(--bg-elevated)",
                color: "var(--text-secondary)",
                cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center",
                transition: "background 150ms ease, color 150ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-primary)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "var(--text-secondary)"; }}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
            </button>
          </div>
        </nav>

        {/* ── Ticker ──────────────────────────────────────── */}
        <div style={{
          borderBottom: "1px solid var(--border)",
          background: "var(--bg-card)",
          overflow: "hidden", height: 30,
          display: "flex", alignItems: "center",
        }}>
          <div style={{
            flexShrink: 0, padding: "0 12px", fontSize: 9, fontWeight: 800,
            letterSpacing: "0.14em", color: "#fff",
            background: isLive ? "var(--brand)" : "#64748b",
            height: "100%", display: "flex", alignItems: "center",
          }}>
            {isLive ? "BREAKING" : PERIOD_LABELS[timePeriod].toUpperCase()}
          </div>
          <div style={{ overflow: "hidden", flex: 1 }}>
            <div className="ticker-inner">
              {[...displayItems.slice(0, 8), ...displayItems.slice(0, 8)].map((item, i) => (
                <span key={`${item.id}-${i}`} style={{
                  fontSize: 11.5, color: "var(--text-secondary)", padding: "0 24px", whiteSpace: "nowrap",
                }}>
                  <span style={{ color: "var(--text-primary)", fontWeight: 500 }}>{item.title}</span>
                  <span style={{ margin: "0 14px", color: "var(--border-strong)" }}>·</span>
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Category filter ──────────────────────────────── */}
        <div style={{ borderBottom: "1px solid var(--border)", background: "var(--bg)", overflowX: "auto" }}>
          <div style={{
            maxWidth: 1380, margin: "0 auto", padding: "0 24px",
            display: "flex", alignItems: "center", gap: 2, height: 42,
          }}>
            {(["all", ...ALL_CATEGORIES] as const).map(cat => {
              const active  = activeCategory === cat;
              const count   = cat === "all" ? displayItems.length : displayItems.filter(i => i.category === cat).length;
              const unread  = cat === "all"
                ? displayItems.filter(i => !readIds.has(i.id)).length
                : displayItems.filter(i => i.category === cat && !readIds.has(i.id)).length;
              return (
                <button key={cat} onClick={() => setActiveCategory(cat)} style={{
                  padding: "4px 10px", borderRadius: 6, border: "none",
                  cursor: "pointer", fontSize: 12,
                  fontWeight: active ? 600 : 400,
                  background: active ? "var(--bg-elevated)" : "transparent",
                  color: active ? "var(--text-primary)" : "var(--text-muted)",
                  transition: "all 130ms ease", whiteSpace: "nowrap", position: "relative",
                }}>
                  {cat === "all" ? "All" : CATEGORY_LABELS[cat]}
                  <span style={{ marginLeft: 4, fontSize: 10, opacity: 0.55 }}>({count})</span>
                  {unread > 0 && unread < count && (
                    <span style={{
                      position: "absolute", top: 3, right: 3,
                      width: 4, height: 4, borderRadius: "50%", background: "var(--brand)",
                    }} />
                  )}
                </button>
              );
            })}
            <div style={{ flex: 1 }} />
            {trendingCount > 0 && isLive && fetchState === "live" && (
              <span style={{
                fontSize: 11, padding: "2px 9px", borderRadius: 20, flexShrink: 0,
                background: "var(--brand-dim)", color: "var(--brand)",
                fontWeight: 600, border: "1px solid rgba(99,102,241,0.22)",
              }}>
                {trendingCount} trending
              </span>
            )}
          </div>
        </div>

        {/* ── Main layout ──────────────────────────────────── */}
        <div style={{
          maxWidth: 1380, margin: "0 auto", padding: "28px 24px",
          display: "grid", gridTemplateColumns: "1fr 288px", gap: 28, alignItems: "start",
        }}>
          <main>
            {/* New articles banner */}
            {isLive && (
              <AnimatePresence>
                {newBanner > 0 && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    style={{
                      marginBottom: 20, padding: "10px 16px", borderRadius: 8,
                      border: "1px solid rgba(99,102,241,0.3)",
                      background: "var(--brand-dim)",
                      display: "flex", alignItems: "center", justifyContent: "space-between",
                      cursor: "pointer",
                    }}
                    onClick={() => { window.scrollTo({ top: 0, behavior: "smooth" }); setNewBanner(0); }}
                  >
                    <span style={{ fontSize: 13, color: "var(--brand)", fontWeight: 600 }}>
                      ↑ {newBanner} new {newBanner === 1 ? "story" : "stories"} arrived
                    </span>
                    <button onClick={e => { e.stopPropagation(); setNewBanner(0); }}
                      style={{ background: "none", border: "none", cursor: "pointer", color: "var(--text-muted)", fontSize: 18, lineHeight: 1, padding: "0 4px" }}>
                      ×
                    </button>
                  </motion.div>
                )}
              </AnimatePresence>
            )}

            {fetchState === "loading" ? (
              <LoadingSkeleton />
            ) : filtered.length === 0 ? (
              <EmptyState category={activeCategory} period={timePeriod} />
            ) : (
              <>
                <BentoGrid items={visible} />
                <div ref={sentinelRef} style={{ height: 1 }} />

                {hasMore && (
                  <div style={{ padding: "28px 0", textAlign: "center", display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
                    {[0, 1, 2].map(i => (
                      <span key={i} style={{
                        width: 5, height: 5, borderRadius: "50%",
                        background: "var(--border-strong)", display: "inline-block",
                        animation: `skeletonPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
                      }} />
                    ))}
                    <span style={{ fontSize: 11, color: "var(--text-muted)", marginLeft: 4 }}>
                      {visibleCount} / {filtered.length}
                    </span>
                  </div>
                )}

                {allLoaded && (
                  <CaughtUp
                    total={filtered.length} readCount={readCount}
                    readPct={readPct} secsLeft={secsLeft}
                    onRefresh={loadNews} isLive={isLive}
                    period={timePeriod} onSwitchLive={() => setTimePeriod("live")}
                  />
                )}
              </>
            )}
          </main>

          {/* ── Sidebar ───────────────────────────────────── */}
          <aside style={{ position: "sticky", top: 62, display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Live feed */}
            <div style={{
              borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg-card)", overflow: "hidden",
            }}>
              <div style={{
                padding: "12px 16px", borderBottom: "1px solid var(--border)",
                display: "flex", alignItems: "center", justifyContent: "space-between",
              }}>
                <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)" }}>
                  {isLive ? "LIVE STREAM" : "TOP STORIES"}
                </span>
                {isLive && (
                  <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                    <span className={fetchState === "live" ? "live-dot" : undefined}
                      style={{ width: 5, height: 5, borderRadius: "50%", background: statusColor }} />
                    <span style={{ fontSize: 10, color: statusColor, letterSpacing: "0.07em" }}>
                      {fetchState === "live" ? "LIVE" : "—"}
                    </span>
                  </div>
                )}
              </div>
              <LiveFeed items={displayItems} />
            </div>

            {/* Stats */}
            <div style={{
              borderRadius: 10, border: "1px solid var(--border)",
              background: "var(--bg-card)", padding: "16px",
            }}>
              <p style={{ fontSize: 10, fontWeight: 700, letterSpacing: "0.1em", color: "var(--text-muted)", marginBottom: 14 }}>
                {isLive ? "SESSION" : "ARCHIVE"}
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: 11 }}>
                <StatRow label="Stories" value={String(displayItems.length)} />
                <StatRow label="Unread" value={String(displayItems.filter(i => !readIds.has(i.id)).length)} color="var(--brand)" />
                <StatRow label="Read" value={String(readIds.size)} />
                <StatRow label="Trending" value={String(trendingCount)} />
                {isLive && <StatRow label="Refreshes in" value={`${secsLeft}s`} />}
              </div>

              {readPct > 0 && (
                <div style={{ marginTop: 16 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 10, color: "var(--text-muted)", marginBottom: 5 }}>
                    <span>Read progress</span><span>{readPct}%</span>
                  </div>
                  <div style={{ height: 3, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
                    <motion.div animate={{ width: `${readPct}%` }} transition={{ duration: 0.4 }}
                      style={{ height: "100%", background: "var(--brand)", borderRadius: 2 }} />
                  </div>
                </div>
              )}

              {!isLive && (
                <button onClick={() => setTimePeriod("live")} style={{
                  marginTop: 16, width: "100%", padding: "8px 0",
                  background: "var(--brand-dim)", border: "1px solid rgba(99,102,241,0.25)",
                  borderRadius: 7, cursor: "pointer", fontSize: 12,
                  color: "var(--brand)", fontWeight: 600,
                }}>
                  ← Back to Live
                </button>
              )}
            </div>
          </aside>
        </div>

        <footer style={{
          borderTop: "1px solid var(--border)", padding: "18px 24px",
          textAlign: "center", fontSize: 11, color: "var(--text-muted)",
        }}>
          Pulse · arXiv · Hacker News · GitHub · Reuters · BBC · NPR · TechCrunch · VentureBeat
        </footer>
      </div>
    </ReadContext.Provider>
  );
}

/* ── Sub-components ───────────────────────────────────────── */

function CaughtUp({ total, readCount, readPct, secsLeft, onRefresh, isLive, period, onSwitchLive }: {
  total: number; readCount: number; readPct: number; secsLeft: number;
  onRefresh: () => void; isLive: boolean; period: TimePeriod; onSwitchLive: () => void;
}) {
  const progress = Math.max(0, Math.min(100, ((60 - secsLeft) / 60) * 100));
  const allRead  = readPct === 100;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      style={{
        marginTop: 36, padding: "36px 24px",
        borderRadius: 12, border: "1px solid var(--border)",
        background: "var(--bg-card)", textAlign: "center",
      }}
    >
      <div style={{ fontSize: 26, marginBottom: 10, opacity: 0.7 }}>{allRead ? "✓" : "◎"}</div>
      <p style={{ margin: 0, fontSize: 16, fontWeight: 600, color: "var(--text-primary)" }}>
        {!isLive ? `${total} archived stories` : allRead ? "You're all caught up" : `${total} stories loaded`}
      </p>
      <p style={{ margin: "6px 0 0", fontSize: 13, color: "var(--text-muted)", lineHeight: 1.5 }}>
        {!isLive
          ? `${total - readCount} unread from ${PERIOD_LABELS[period].toLowerCase()}`
          : allRead ? "New stories arrive every minute" : `${total - readCount} unread · scroll up to continue`}
      </p>

      {isLive && (
        <div style={{ maxWidth: 220, margin: "22px auto 0" }}>
          <div style={{ height: 2, background: "var(--border)", borderRadius: 2, overflow: "hidden" }}>
            <motion.div animate={{ width: `${progress}%` }} transition={{ duration: 1, ease: "linear" }}
              style={{ height: "100%", background: "var(--brand)", borderRadius: 2 }} />
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", marginTop: 7, fontSize: 11, color: "var(--text-muted)" }}>
            <span>Next refresh</span>
            <button onClick={onRefresh} style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 11, color: "var(--brand)", fontWeight: 600, padding: 0,
            }}>
              {secsLeft > 0 ? `in ${secsLeft}s` : "Refreshing…"}
            </button>
          </div>
        </div>
      )}

      {!isLive && (
        <button onClick={onSwitchLive} style={{
          marginTop: 20, padding: "9px 22px",
          background: "var(--brand-dim)", border: "1px solid rgba(99,102,241,0.3)",
          borderRadius: 8, cursor: "pointer", fontSize: 13,
          color: "var(--brand)", fontWeight: 600,
        }}>
          Switch to Live Feed
        </button>
      )}
    </motion.div>
  );
}

function EmptyState({ category, period }: { category: string; period: TimePeriod }) {
  return (
    <div style={{ padding: "80px 0", textAlign: "center", color: "var(--text-muted)", fontSize: 14, lineHeight: 1.6 }}>
      <div style={{ fontSize: 28, marginBottom: 14, opacity: 0.4 }}>○</div>
      {period !== "live"
        ? `No archived stories for ${PERIOD_LABELS[period].toLowerCase()} yet.\nThe database fills as the live feed runs.`
        : <>No stories in <strong style={{ color: "var(--text-secondary)" }}>{category}</strong> right now — check back shortly.</>
      }
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: 16 }}>
      {[3, 1, 1, 1, 1, 1, 1, 1, 1].map((span, i) => (
        <div key={i} style={{
          gridColumn: `span ${span}`, height: i === 0 ? 260 : 180,
          borderRadius: 10, background: "var(--bg-card)",
          border: "1px solid var(--border)",
          animation: `skeletonPulse 1.5s ease-in-out ${i * 80}ms infinite`,
        }} />
      ))}
    </div>
  );
}

function StatRow({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
      <span style={{ fontSize: 12, color: "var(--text-muted)" }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 600, color: color ?? "var(--text-primary)", fontFamily: "var(--font-geist-mono)" }}>
        {value}
      </span>
    </div>
  );
}
