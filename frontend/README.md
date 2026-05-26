# Pulse — Global Intelligence Feed

A real-time news aggregator for AI, tech, and world news. Ranked by interest score, stored in a local SQLite database, with read tracking, dark/light mode, and historical archive views.

---

## Features

- **5 live data sources** — arXiv, Hacker News, GitHub trending, NewsAPI, and RSS feeds (BBC, Reuters, NPR, TechCrunch, VentureBeat, MIT Tech Review, and more)
- **Interest scoring** — every article gets a score (0–99) based on freshness, keyword signals, engagement, and source quality
- **11 categories** — LLM, Agents, Tooling, Research, Infra, Security, World, Politics, Science, Business, Tech
- **Auto-refresh every 60 seconds** with new-article detection and a live banner
- **Read tracking** — articles you've opened are dimmed; your history is saved in localStorage
- **SQLite archive** — every fetch is persisted locally; browse Yesterday, This Week, This Month
- **Dark / light mode** — toggle in the nav, preference saved across sessions
- **Infinite scroll** — loads more as you reach the bottom
- **Responsive 3-column card grid** with hero images for top stories

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| Language | TypeScript 5, React 19 |
| Styling | Tailwind CSS v4 + CSS custom properties |
| Animations | Framer Motion |
| Icons | Lucide React |
| Database | libsql (WASM SQLite, no native deps) |
| Data sources | arXiv API, HN Algolia, GitHub Search API, NewsAPI.org, RSS/Atom feeds |

---

## Prerequisites

- **Node.js** 18+ (20+ recommended)
- **npm** 9+
- A free **NewsAPI** key from [newsapi.org](https://newsapi.org) (takes 30 seconds to get)

---

## Local Setup

### 1. Clone the repo

```bash
git clone https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
cd YOUR_REPO_NAME
```

### 2. Install dependencies

```bash
npm install
```

### 3. Add your NewsAPI key

Create a `.env.local` file in the project root:

```
NEWSAPI_KEY=your_key_here
```

Get a free key at [newsapi.org/register](https://newsapi.org/register). Without it the feed still works — it just uses arXiv, HN, GitHub, and RSS only.

### 4. Run the development server

```bash
npm run dev
# or on a specific port:
PORT=3002 npm run dev
```

Open [http://localhost:3000](http://localhost:3000) (or your chosen port).

The SQLite database is created automatically in `data/pulse.db` on the first request to `/api/news`. It grows with every refresh cycle.

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `NEWSAPI_KEY` | Optional | NewsAPI.org API key — adds 25 curated articles per fetch from major outlets |

---

## Project Structure

```
├── app/
│   ├── api/
│   │   └── news/
│   │       ├── route.ts          # Main feed — fetches all sources, scores, stores
│   │       └── history/
│   │           └── route.ts      # Archive endpoint (?range=yesterday|week|month)
│   ├── globals.css               # CSS custom properties, dark/light themes
│   ├── layout.tsx                # Root layout with theme-flash prevention script
│   └── page.tsx                  # Entry point
├── components/
│   ├── dashboard/
│   │   └── PulseDashboard.tsx    # Main shell — nav, tabs, grid, sidebar, read state
│   ├── news/
│   │   ├── BentoGrid.tsx         # 3-column card grid with hero card
│   │   └── NewsCard.tsx          # Individual article card
│   └── live/
│       └── LiveFeed.tsx          # Sidebar live stream list
├── context/
│   └── ReadContext.tsx           # Read state shared across card tree
├── lib/
│   ├── api.ts                    # Client-side fetch wrapper
│   ├── db.ts                     # SQLite layer (initDb, upsertArticles, queryArticles)
│   ├── mockFeed.ts               # Seed data shown while live fetch is loading
│   └── timeAgo.ts                # "2 hours ago" helper
├── types/
│   └── news.ts                   # NewsItem, NewsCategory types
└── data/
    └── pulse.db                  # SQLite database (auto-created, gitignored)
```

---

## How the Feed Works

1. Every 60 seconds, `/api/news` fetches all 5 sources in parallel
2. Articles are deduplicated by URL and normalized title
3. Each article is classified into one of 11 categories using keyword rules
4. An interest score is computed (freshness + keywords + engagement + source signals)
5. Articles below score 52 are dropped; top 120 are returned
6. The same 120 articles are upserted into the local SQLite database
7. The client detects which article IDs are new since the last fetch and shows a banner

---

## Building for Production

```bash
npm run build
npm start
```

> **Note on deployment:** The SQLite database writes to a local file path. For cloud deployments (Vercel, Railway, etc.) you need either a persistent volume or a hosted SQLite service like [Turso](https://turso.tech). Update `lib/db.ts` to use `TURSO_DATABASE_URL` + `TURSO_AUTH_TOKEN` env vars instead of the local file URL.

---

## Pushing to a New GitHub Repository

### Step 1 — Create the repo on GitHub

Go to [github.com/new](https://github.com/new):
- Give it a name (e.g. `pulse-feed`)
- Leave it **completely empty** — no README, no .gitignore, no license
- Click **Create repository**

Copy the HTTPS URL shown (e.g. `https://github.com/your-username/pulse-feed.git`).

### Step 2 — Initialize git and make the first commit

Run these commands inside the project folder:

```bash
git init
git add .
git commit -m "Initial commit — Pulse news aggregator"
```

### Step 3 — Connect to GitHub and push

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

After the first push, all future updates are just:

```bash
git add .
git commit -m "describe what changed"
git push
```

### What gets committed vs ignored

| Committed | Ignored |
|---|---|
| All source code (`app/`, `components/`, `lib/`, `types/`) | `node_modules/` |
| `package.json`, `tsconfig.json`, config files | `.next/` (build output) |
| `.gitignore`, `README.md` | `.env.local` (your API key — never commit this) |
| — | `data/` (SQLite database — recreated automatically on first run) |

> Anyone who clones the repo needs to create their own `.env.local` with their own NewsAPI key.

---

## License

MIT
