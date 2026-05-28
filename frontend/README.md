# Pulse — Global Intelligence Feed

A real-time news aggregator for AI, tech, and world news. Ranked by interest score, stored in a database, with read tracking, dark/light mode, and historical archive views. Fully responsive across mobile, tablet, and desktop.

---

## Features

- **5 live data sources** — arXiv, Hacker News, GitHub Trending, NewsAPI, and RSS feeds (BBC, Reuters, NPR, TechCrunch, VentureBeat, MIT Tech Review, and more)
- **Interest scoring** — every article gets a score (0–99) based on freshness, keyword signals, engagement, and source quality
- **11 categories** — LLM, Agents, Tooling, Research, Infra, Security, World, Politics, Science, Business, Tech
- **Auto-refresh every 60 seconds** with new-article detection and a live banner
- **Read tracking** — articles you've opened are dimmed; your history is saved in localStorage
- **Database archive** — every fetch is persisted; browse Yesterday, This Week, This Month
- **Dark / light mode** — toggle in the nav, preference saved across sessions
- **Infinite scroll** — loads more as you reach the bottom
- **Fully responsive** — single-column on mobile, 2-column on tablet, 3-column + sidebar on desktop

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | libsql / Turso (SQLite-compatible) |
| Data sources | arXiv API, HN Algolia, GitHub Search API, NewsAPI.org, RSS/Atom feeds |
| Testing | Vitest (19 tests) |

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** 9+
- A free **NewsAPI** key from [newsapi.org](https://newsapi.org) (takes 30 seconds to get)

---

## Local Setup

### 1. Clone and install

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME/frontend
npm install
```

### 2. Add environment variables

Create `frontend/.env.local`:

```
NEWSAPI_KEY=your_key_here
```

Get a free key at [newsapi.org/register](https://newsapi.org/register). Without it the feed still works using arXiv, HN, GitHub, and RSS.

### 3. Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The database is created automatically at `data/pulse.db` on the first request.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEWSAPI_KEY` | Optional | NewsAPI.org key — adds curated articles from major outlets |
| `TURSO_DATABASE_URL` | Production | libsql URL from Turso — required for Vercel deployment |
| `TURSO_AUTH_TOKEN` | Production | Auth token from Turso — required for Vercel deployment |

---

## Running Tests

```bash
npm test
```

19 unit tests covering `timeAgo`, `stableId`, and `decodeEntities`.

---

## Project Structure

```
frontend/
├── app/
│   ├── api/
│   │   └── news/
│   │       ├── route.ts          # Main feed — fetches all sources, scores, stores
│   │       └── history/
│   │           └── route.ts      # Archive endpoint (?range=yesterday|week|month)
│   ├── globals.css               # Themes + responsive layout classes
│   ├── layout.tsx                # Root layout with theme-flash prevention
│   └── page.tsx                  # Entry point
├── components/
│   ├── dashboard/
│   │   └── PulseDashboard.tsx    # Main shell — nav, tabs, grid, sidebar
│   ├── news/
│   │   ├── BentoGrid.tsx         # Responsive card grid
│   │   └── NewsCard.tsx          # Individual article card
│   └── live/
│       └── LiveFeed.tsx          # Sidebar live stream list
├── context/
│   └── ReadContext.tsx           # Read state shared across card tree
├── lib/
│   ├── api.ts                    # Client fetch wrapper
│   ├── db.ts                     # Database layer (initDb, upsertArticles, queryArticles)
│   ├── utils.ts                  # stableId, decodeEntities
│   ├── timeAgo.ts                # "2 hours ago" helper
│   └── __tests__/               # Vitest unit tests
├── types/
│   └── news.ts                   # NewsItem, NewsCategory types
└── data/
    └── pulse.db                  # SQLite database (auto-created, gitignored)
```

---

## How the Feed Works

1. Every 60 seconds, `/api/news` fetches all 5 sources in parallel
2. Articles are deduplicated by URL and normalised title
3. Each article is classified into one of 11 categories using keyword rules
4. An interest score is computed (freshness + keywords + engagement + source signals)
5. Articles below score 52 are dropped; top 120 are returned
6. The same 120 articles are upserted into the database
7. The client detects which article IDs are new since the last fetch and shows a banner

---

## Deploying to Vercel + Turso (Free)

### 1. Set up Turso

```bash
brew install tursodatabase/tap/turso
turso auth login
turso db create pulse-db
turso db show pulse-db          # copy the libsql:// URL
turso db tokens create pulse-db # copy the token
```

### 2. Push to GitHub

```bash
git add .
git commit -m "Ready for deployment"
git push
```

### 3. Deploy on Vercel

1. Go to [vercel.com](https://vercel.com) → **Add New Project** → import your repo
2. Set **Root Directory** to `frontend`
3. Add these environment variables before deploying:

| Name | Value |
|---|---|
| `NEWSAPI_KEY` | your NewsAPI key |
| `TURSO_DATABASE_URL` | `libsql://pulse-db-yourname.turso.io` |
| `TURSO_AUTH_TOKEN` | your Turso token |

4. Click **Deploy**

The database schema initialises automatically on the first request.

### 4. Custom Vercel subdomain (free)

To change your URL from `random-hash.vercel.app` to something memorable without buying a domain:

1. Go to your project on Vercel → **Settings** → **Domains**
2. Click **Edit** next to your current `.vercel.app` domain
3. Type a new name — e.g. `pulse-news` → your URL becomes `pulse-news.vercel.app`
4. Click **Save** — takes effect immediately, no DNS wait

---

## License

MIT
