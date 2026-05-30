# Pulse — Global Intelligence Feed

**Live at [pulse-ai-news-jn3x.vercel.app](https://pulse-ai-news-jn3x.vercel.app)** ← update this to your new Vercel URL

Pulse is a real-time news aggregator that surfaces what matters across AI, tech, and world events. It pulls from five live sources — arXiv, Hacker News, GitHub trending, major RSS feeds, and NewsAPI — ranks every article by an interest score, and keeps the feed fresh with automatic 60-second refreshes.

No accounts. No ads. Just signal.

---

## What it does

- **Real-time feed** — arXiv papers, HN threads, GitHub trending repos, and articles from BBC, Reuters, NPR, TechCrunch, VentureBeat, and more — all in one place, refreshed every minute
- **Interest scoring** — every article is scored 0–99 based on freshness, keyword signals, engagement, and source quality; low-signal articles are dropped before they reach you
- **11 categories** — LLM · Agents · Tooling · Research · Infra · Security · World · Politics · Science · Business · Tech
- **Archive** — browse Yesterday, This Week, or This Month — everything is persisted in SQLite as the feed runs
- **Read tracking** — articles you've opened are dimmed and marked; your history is saved locally across sessions
- **Dark / light mode** — toggle in the nav, preference saved across sessions
- **New article banner** — get notified when fresh stories arrive between refreshes
- **Responsive** — works on desktop, tablet, and mobile

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | libsql / Turso (SQLite on Vercel) |
| Data sources | arXiv API, HN Algolia, GitHub Search API, NewsAPI.org, RSS/Atom feeds |

---

## How the feed works

1. Every 60 seconds the backend fetches all five sources in parallel
2. Articles are deduplicated by URL and normalized title
3. Each article is classified into one of 11 categories using keyword rules
4. An interest score is computed (freshness + keywords + engagement + source signals)
5. Articles below score 52 are dropped; the top 120 are returned and displayed
6. Every article is also upserted into SQLite, powering the archive views
7. The client detects new IDs since the last fetch and shows a live banner

---

## License

MIT
