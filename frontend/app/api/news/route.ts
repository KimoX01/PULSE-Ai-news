import { NextResponse } from "next/server";
import { initDb, upsertArticles } from "@/lib/db";

/* ─────────────────────────────────────────────────────────────────
   TYPES
───────────────────────────────────────────────────────────────── */
interface RawItem {
  id: string;
  source: "x" | "rss" | "github" | "arxiv";
  url: string;
  title: string;
  summary: string;
  category: string;
  publishedAt: string;
  imageUrl?: string;
  _stars?: number;
  _points?: number;
  _comments?: number;
  _sourceLabel?: string;
}

/* ─────────────────────────────────────────────────────────────────
   CLASSIFIER — priority order matters (first match wins)
───────────────────────────────────────────────────────────────── */
const RULES: [string, string[]][] = [
  ["security",       ["safety","jailbreak","prompt injection","adversarial","red team","vulnerability","attack","privacy","hallucin","misuse","exploit","cybersecurity","breach","hack","ransomware","malware","phishing","zero-day"]],
  ["agentic",        ["agent","agentic","tool call","tool use","autonomous","multi-agent","multi agent","workflow","orchestrat","planning","computer use","browser use","mcp","model context protocol"]],
  ["research",       ["paper","arxiv","benchmark","dataset","evaluation","rlhf","alignment","experiment","ablation","pretraining","fine-tuning","finetune","training method","loss function","scaling law"]],
  ["tooling",        ["sdk","library","framework","langchain","llamaindex","hugging face","huggingface","vllm","ollama","lmstudio","open webui","cli","plugin","integration"]],
  ["infrastructure", ["gpu","compute","cluster","kubernetes","docker","mlops","pipeline","distributed","scaling","throughput","latency","serving","deployment","cloud","aws","gcp","azure","tpu","inference endpoint","data center","nvidia","chip"]],
  ["llm",            ["gpt","llm","language model","claude","gemini","mistral","llama","qwen","phi","chatgpt","openai","anthropic","palm","transformer","token","inference","prompt","context window","fine-tun","deepseek","grok","copilot"]],
  ["politics",       ["president","congress","senate","election","democrat","republican","parliament","government","policy","legislation","vote","white house","trump","biden","nato","geopolit","sanction","treaty","diplomat"]],
  ["science",        ["nasa","space","climate","physics","biology","chemistry","medical","health","vaccine","cancer","gene","dna","quantum","asteroid","mars","moon","ocean","earthquake","volcano","fossil"]],
  ["business",       ["stock","market","economy","gdp","fed","federal reserve","inflation","earnings","ipo","merger","acquisition","startup","venture","funding","revenue","profit","recession","trade","tariff","nasdaq","s&p"]],
  ["world",          ["war","conflict","attack","killed","military","protest","crisis","flood","earthquake","hurricane","disaster","refugee","united nations","un ","ceasefire","troops","missile","explosion","shooting"]],
  ["tech",           ["apple","google","microsoft","samsung","amazon","meta","tesla","chip","semiconductor","iphone","android","5g","broadband","internet","social media","tiktok","spotify","netflix","uber","startup"]],
];

function classify(title: string, summary: string): string {
  const text = (title + " " + summary).toLowerCase();
  for (const [cat, kws] of RULES) {
    for (const kw of kws) {
      if (text.includes(kw)) return cat;
    }
  }
  return "world";
}

/* ─────────────────────────────────────────────────────────────────
   INTEREST SCORING  (40–99)
───────────────────────────────────────────────────────────────── */
const HIGH_SIGNAL = [
  "released","launched","announces","open source","open-source",
  "breakthrough","state-of-the-art","sota","outperforms","beats",
  "funding","raises","trillion","billion","regulation","ban",
  "jailbreak","vulnerability","exploit","attack","backdoor",
  "new model","new paper","show hn","releases","breaking",
  "exclusive","first","record","historic",
];
const MEDIUM_SIGNAL = [
  "benchmark","dataset","model","agent","tool","framework","api",
  "research","paper","evaluation","training","inference","fine-tun",
  "report","study","survey","analysis",
];
const LOW_QUALITY = [
  "5 ways","10 tips","10 things","10 reasons","you need to know",
  "ultimate guide","beginner guide","sponsored","[ad]","advertis",
  "review:","vs.","comparison","what is ","how to use ","explained",
  "everything about","pros and cons",
];

function interestScore(item: RawItem): number {
  const text = (item.title + " " + item.summary).toLowerCase();
  let score = 50;

  for (const w of HIGH_SIGNAL)   if (text.includes(w)) score += 7;
  for (const w of MEDIUM_SIGNAL) if (text.includes(w)) score += 3;
  for (const w of LOW_QUALITY)   if (text.includes(w)) score -= 8;

  /* Freshness */
  const ageH = (Date.now() - new Date(item.publishedAt).getTime()) / 3_600_000;
  if      (ageH < 1)   score += 22;
  else if (ageH < 3)   score += 16;
  else if (ageH < 6)   score += 10;
  else if (ageH < 24)  score += 4;
  else if (ageH > 168) score -= 22; // week+: heavy penalty
  else if (ageH > 72)  score -= 14; // 3-7 days: significant penalty
  else if (ageH > 48)  score -= 8;  // 2-3 days

  /* Engagement */
  if (item.source === "arxiv")           score += 6;
  if ((item._points  ?? 0) > 400)        score += 14;
  else if ((item._points ?? 0) > 150)    score += 9;
  else if ((item._points ?? 0) > 50)     score += 4;
  if ((item._comments ?? 0) > 200)       score += 5;
  if ((item._stars   ?? 0) > 50_000)     score += 8;
  else if ((item._stars ?? 0) > 10_000)  score += 5;

  /* Bonus for having an image */
  if (item.imageUrl) score += 3;

  return Math.min(99, Math.max(40, Math.round(score)));
}

/* ─────────────────────────────────────────────────────────────────
   HTML ENTITY DECODING
───────────────────────────────────────────────────────────────── */
const HTML_ENTITIES: Record<string, string> = {
  "&amp;": "&", "&lt;": "<", "&gt;": ">", "&quot;": '"',
  "&#8216;": "'", "&#8217;": "'", "&#8220;": '"', "&#8221;": '"',
  "&#8211;": "–", "&#8212;": "—", "&#8230;": "…", "&nbsp;": " ",
  "&#39;": "'", "&#x27;": "'",
};
function decodeEntities(str: string): string {
  return str.replace(/&#?\w+;/g, (m) => HTML_ENTITIES[m] ?? m);
}

/* ─────────────────────────────────────────────────────────────────
   QUALITY FILTER
───────────────────────────────────────────────────────────────── */
const SKIP_PATTERNS = [
  /^\d+ (ways|tips|things|reasons|tools|examples)/i,
  /\[sponsored\]/i, /\[removed\]/i, /\[ad\]/i,
  /^(advertisement|sponsor):/i,
  /(memorial day|black friday|cyber monday|holiday sale|deal|discount|coupon|gift guide)/i,
  /^(unboxing:|review: )/i,
  /* Sports / entertainment — not relevant for this platform */
  /\b(tennis|golf|nfl|nba|mlb|nhl|soccer|football|basketball|cricket|rugby|f1|formula one|wimbledon|french open|us open|premier league|la liga|serie a|bundesliga|champions league)\b/i,
  /\b(celebrity|kardashian|taylor swift|beyoncé|beyonce|hollywood|oscars?|grammys?|emmys?|golden globes?|box office)\b/i,
  /\b(recipe|cooking|restaurant review|diet tips|weight loss tips|horoscope|zodiac)\b/i,
];

/* GitHub repos must be AI-specific — not just "AI" in a tangential way */
const GITHUB_AI_PATTERNS = [
  /\bllm\b/i, /\bgpt\b/i, /\bclaude\b/i, /\bgemini\b/i, /\bllama\b/i, /\bmistral\b/i,
  /language model/i, /ai.agent/i, /ai.native/i, /\binference\b/i,
  /\bembedding/i, /\brag\b/i, /retrieval.augmented/i, /\bfine.tun/i,
  /\bprompt/i, /\bvector\b/i, /\bchatbot/i, /\btransformer\b/i,
  /openai/i, /anthropic/i, /\bhugging.face/i, /\bvllm\b/i, /\bollama\b/i,
  /machine.learning/i, /\bdeep.learn/i, /\bmcp\b/i, /model.context/i,
  /\bagentic\b/i, /\bmultimodal/i, /\bdiffusion\b/i, /foundation.model/i,
  /\bcopilot\b/i, /code.assistant/i, /ai.code/i, /\bdeepseek\b/i,
];

function isQualityContent(item: RawItem): boolean {
  if (!item.title || item.title.length < 10) return false;
  if (!item.url) return false;
  if (SKIP_PATTERNS.some((p) => p.test(item.title))) return false;
  if (item.source === "arxiv") return true;
  if (item.source === "github") {
    if (!item.summary || item.summary.length < 15) return false;
    const text = item.title + " " + item.summary;
    return GITHUB_AI_PATTERNS.some((p) => p.test(text));
  }
  /* RSS/NewsAPI: accept everything — world news is welcome now */
  return item.title.length > 15;
}

/* ─────────────────────────────────────────────────────────────────
   STABLE ID
───────────────────────────────────────────────────────────────── */
function stableId(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}

/* ─────────────────────────────────────────────────────────────────
   FETCH WITH TIMEOUT
───────────────────────────────────────────────────────────────── */
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = 12_000): Promise<Response> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    return await fetch(url, { ...opts, signal: ctrl.signal });
  } finally {
    clearTimeout(timer);
  }
}

/* ─────────────────────────────────────────────────────────────────
   ARXIV
───────────────────────────────────────────────────────────────── */
async function fetchArxiv(): Promise<RawItem[]> {
  const url =
    "https://export.arxiv.org/api/query" +
    "?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV" +
    "&sortBy=submittedDate&sortOrder=descending&max_results=30";
  let xml: string;
  try {
    const res = await fetchWithTimeout(url, { headers: { "User-Agent": "AI-Pulse/1.0" } }, 25_000);
    if (!res.ok) { console.error("[arxiv] HTTP", res.status); return []; }
    xml = await res.text();
  } catch (e) { console.error("[arxiv] fetch error:", e); return []; }

  const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)];
  return entries.map((m) => {
    const e = m[1];
    const title = (e.match(/<title>([\s\S]*?)<\/title>/)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const summary = (e.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] ?? "").replace(/\s+/g, " ").trim();
    const entryUrl = e.match(/href="(https:\/\/arxiv\.org\/abs\/[^"]+)"/)?.[1]
      ?? e.match(/<id>(https:\/\/arxiv\.org\/abs\/[^<]+)<\/id>/)?.[1] ?? "";
    const published = (e.match(/<published>([\s\S]*?)<\/published>/)?.[1] ?? "").trim();
    return {
      id: "ax-" + stableId(entryUrl || title),
      source: "arxiv" as const,
      url: entryUrl,
      title,
      summary: summary.slice(0, 320),
      category: classify(title, summary),
      publishedAt: published || new Date().toISOString(),
    };
  }).filter((x) => x.title && x.url);
}

/* ─────────────────────────────────────────────────────────────────
   HACKER NEWS — parallel single-term queries
───────────────────────────────────────────────────────────────── */
async function fetchHN(): Promise<RawItem[]> {
  const HN_QUERIES = ["LLM", "AI", "GPT", "Claude", "Llama", "Mistral", "Gemini"];
  const base = "https://hn.algolia.com/api/v1/search_by_date?tags=story&numericFilters=points%3E5&hitsPerPage=15&query=";
  const results = await Promise.allSettled(
    HN_QUERIES.map((q) => fetchWithTimeout(base + encodeURIComponent(q), {}, 10_000).then((r) => r.json())),
  );
  const seen = new Set<string>();
  const items: RawItem[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const h of (r.value.hits ?? []) as Record<string, unknown>[]) {
      const title = String(h.title ?? "");
      if (!title) continue;
      const url = String(h.url ?? `https://news.ycombinator.com/item?id=${h.objectID}`);
      if (seen.has(url)) continue;
      seen.add(url);
      const pts = Number(h.points ?? 0);
      const comments = Number(h.num_comments ?? 0);
      items.push({
        id: "hn-" + stableId(url),
        source: "rss" as const,
        url,
        title,
        summary: `${pts} points · ${comments} comments on Hacker News`,
        category: classify(title, ""),
        publishedAt: new Date(Number(h.created_at_i) * 1000).toISOString(),
        _points: pts,
        _comments: comments,
      });
    }
  }
  return items;
}

/* ─────────────────────────────────────────────────────────────────
   GITHUB
───────────────────────────────────────────────────────────────── */
async function fetchGithub(): Promise<RawItem[]> {
  const recentDate = new Date(Date.now() - 90 * 24 * 3_600_000).toISOString().slice(0, 10);
  const queries = [
    `topic:llm+topic:ai+created:>${recentDate}&sort=stars&order=desc&per_page=20`,
    `topic:llm+stars:>500&sort=updated&order=desc&per_page=15`,
    `topic:artificial-intelligence+topic:machine-learning+stars:>2000&sort=updated&order=desc&per_page=15`,
  ];
  const headers = { Accept: "application/vnd.github.v3+json", "User-Agent": "AI-Pulse/1.0" };
  const results = await Promise.allSettled(
    queries.map((q) =>
      fetchWithTimeout(`https://api.github.com/search/repositories?q=${q}`, { headers }, 10_000)
        .then((r) => (r.ok ? r.json() : { items: [] })),
    ),
  );
  const items: RawItem[] = [];
  for (const r of results) {
    if (r.status !== "fulfilled") continue;
    for (const repo of r.value.items ?? []) {
      const name = String(repo.full_name ?? "");
      const desc = String(repo.description ?? "");
      if (!desc) continue;
      const url = String(repo.html_url ?? "");
      const stars = Number(repo.stargazers_count ?? 0);
      const pushed = String(repo.pushed_at ?? repo.updated_at ?? new Date().toISOString());
      const shortName = name.split("/")[1] ?? name;
      const cleanDesc = desc.replace(/^(a |an |the )/i, "").trim();
      items.push({
        id: "gh-" + stableId(name),
        source: "github" as const,
        url,
        title: cleanDesc.slice(0, 110),
        summary: `${shortName} · ★ ${stars.toLocaleString()} on GitHub`,
        category: classify(name + " " + desc, ""),
        publishedAt: new Date(pushed).toISOString(),
        _stars: stars,
      });
    }
  }
  return items.filter((x) => x.url);
}

/* ─────────────────────────────────────────────────────────────────
   NEWSAPI — tech + world journalism
───────────────────────────────────────────────────────────────── */
async function fetchNewsApi(): Promise<RawItem[]> {
  const key = process.env.NEWSAPI_KEY;
  if (!key || key === "your_key_here") return [];

  const DOMAINS = [
    "techcrunch.com","venturebeat.com","wired.com","theverge.com",
    "technologyreview.com","arstechnica.com","theregister.com",
    "reuters.com","apnews.com","bbc.com","npr.org","politico.com",
    "wsj.com","bloomberg.com","ft.com",
  ].join(",");

  const params = new URLSearchParams({
    q: '"artificial intelligence" OR "machine learning" OR semiconductor OR cybersecurity OR OpenAI OR Anthropic OR "climate change" OR inflation OR "federal reserve" OR geopolitics OR Ukraine OR Taiwan OR sanctions OR "stock market" OR regulation OR "data center" OR "interest rates" OR hacking OR "nuclear" OR election',
    domains: DOMAINS,
    language: "en",
    sortBy: "publishedAt",
    pageSize: "40",
    apiKey: key,
  });

  const res = await fetchWithTimeout(`https://newsapi.org/v2/everything?${params}`, {}, 10_000);
  if (!res.ok) {
    console.error("[newsapi] HTTP", res.status, await res.text().catch(() => ""));
    return [];
  }
  const data = await res.json();

  return (data.articles ?? [])
    .map((a: Record<string, unknown>) => {
      const title = decodeEntities(String(a.title ?? "").trim())
        .replace(/\s*[|\-—]\s*(TechCrunch|VentureBeat|Wired|The Verge|Ars Technica|MIT Technology Review|The Register|Reuters|AP News|BBC|NPR|Politico|WSJ|Bloomberg|FT)$/i, "")
        .trim();
      const desc = decodeEntities(String(a.description ?? "").trim());
      const url = String(a.url ?? "");
      const published = String(a.publishedAt ?? new Date().toISOString());
      const imageUrl = String((a.urlToImage as string) ?? "").trim() || undefined;
      return {
        id: "na-" + stableId(url),
        source: "rss" as const,
        url,
        title,
        summary: desc.slice(0, 280) || title,
        category: classify(title, desc),
        publishedAt: published,
        imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : undefined,
        _sourceLabel: String((a.source as Record<string, unknown>)?.name ?? ""),
        _points: 30,
      };
    })
    .filter((x: RawItem) => x.title && x.url && x.title !== "[Removed]");
}

/* ─────────────────────────────────────────────────────────────────
   RSS FEEDS — AI + world news
───────────────────────────────────────────────────────────────── */
const RSS_FEEDS = [
  /* AI / Tech */
  "https://www.theverge.com/rss/ai-artificial-intelligence/index.xml",
  "https://techcrunch.com/category/artificial-intelligence/feed/",
  "https://venturebeat.com/category/ai/feed/",
  "https://www.technologyreview.com/feed/",
  /* World / US News */
  "https://feeds.npr.org/1001/rss.xml",
  "https://rss.nytimes.com/services/xml/rss/nyt/HomePage.xml",
  "https://feeds.bbci.co.uk/news/world/rss.xml",
  "https://feeds.reuters.com/reuters/topNews",
  "https://feeds.arstechnica.com/arstechnica/index",
];

function extractRssImage(raw: string): string | undefined {
  /* Try <media:content url="..."> */
  const media = raw.match(/<media:content[^>]+url="([^"]+)"/i)?.[1];
  if (media) return media;
  /* Try <enclosure url="..." type="image/..."> */
  const enc = raw.match(/<enclosure[^>]+url="([^"]+)"[^>]+type="image/i)?.[1]
    ?? raw.match(/<enclosure[^>]+type="image[^"]*"[^>]+url="([^"]+)"/i)?.[1];
  if (enc) return enc;
  /* Try <media:thumbnail url="..."> */
  const thumb = raw.match(/<media:thumbnail[^>]+url="([^"]+)"/i)?.[1];
  if (thumb) return thumb;
  return undefined;
}

async function fetchRSS(): Promise<RawItem[]> {
  const results = await Promise.allSettled(
    RSS_FEEDS.map(async (feedUrl) => {
      const res = await fetchWithTimeout(feedUrl, {
        headers: { "User-Agent": "AI-Pulse/1.0", "Accept": "application/rss+xml, application/xml, text/xml" },
      }, 10_000);
      const xml = await res.text();
      const rawItems = [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)];
      return rawItems.slice(0, 10).map((m) => {
        const raw = m[1];
        const title = decodeEntities(
          (raw.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/)?.[1]
            ?? raw.match(/<title>([^<]*)<\/title>/)?.[1] ?? "").trim()
        );
        const link = (
          raw.match(/<link><!\[CDATA\[([\s\S]*?)\]\]><\/link>/)?.[1]
          ?? raw.match(/<link>([^<]*)<\/link>/)?.[1]
          ?? raw.match(/<guid[^>]*>([^<]+)<\/guid>/)?.[1] ?? ""
        ).trim();
        const desc = decodeEntities(
          (raw.match(/<description><!\[CDATA\[([\s\S]*?)\]\]><\/description>/)?.[1]
            ?? raw.match(/<description>([^<]*)<\/description>/)?.[1] ?? "")
            .replace(/<[^>]+>/g, " ").trim().slice(0, 280)
        );
        const pubDate = raw.match(/<pubDate>([\s\S]*?)<\/pubDate>/)?.[1] ?? "";
        const imageUrl = extractRssImage(raw);
        return {
          id: "rs-" + stableId(link || title),
          source: "rss" as const,
          url: link,
          title,
          summary: desc || title,
          category: classify(title, desc),
          publishedAt: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          imageUrl: imageUrl && imageUrl.startsWith("http") ? imageUrl : undefined,
        };
      }).filter((x) => x.title && x.url);
    }),
  );
  return results.flatMap((r) => r.status === "fulfilled" ? r.value : []);
}

/* ─────────────────────────────────────────────────────────────────
   HANDLER
───────────────────────────────────────────────────────────────── */
export async function GET() {
  const [arxiv, hn, github, newsapi, rss] = await Promise.allSettled([
    fetchArxiv(), fetchHN(), fetchGithub(), fetchNewsApi(), fetchRSS(),
  ]);

  const counts = {
    arxiv:   arxiv.status   === "fulfilled" ? arxiv.value.length   : (console.error("[arxiv fail]",   (arxiv   as PromiseRejectedResult).reason), 0),
    hn:      hn.status      === "fulfilled" ? hn.value.length      : (console.error("[hn fail]",      (hn      as PromiseRejectedResult).reason), 0),
    github:  github.status  === "fulfilled" ? github.value.length  : (console.error("[github fail]",  (github  as PromiseRejectedResult).reason), 0),
    newsapi: newsapi.status === "fulfilled" ? newsapi.value.length : (console.error("[newsapi fail]", (newsapi as PromiseRejectedResult).reason), 0),
    rss:     rss.status     === "fulfilled" ? rss.value.length     : (console.error("[rss fail]",     (rss     as PromiseRejectedResult).reason), 0),
  };
  console.log("[pulse/news] source counts:", counts);

  const all: RawItem[] = [
    ...(arxiv.status   === "fulfilled" ? arxiv.value   : []),
    ...(hn.status      === "fulfilled" ? hn.value      : []),
    ...(github.status  === "fulfilled" ? github.value  : []),
    ...(newsapi.status === "fulfilled" ? newsapi.value : []),
    ...(rss.status     === "fulfilled" ? rss.value     : []),
  ];

  /* Deduplicate by ID then by normalized title */
  const seenIds    = new Set<string>();
  const seenTitles = new Set<string>();
  const unique = all.filter((x) => {
    if (seenIds.has(x.id)) return false;
    seenIds.add(x.id);
    const normalTitle = x.title.toLowerCase().replace(/[^a-z0-9 ]/g, "").replace(/\s+/g, " ").trim().slice(0, 60);
    if (normalTitle.length > 10 && seenTitles.has(normalTitle)) return false;
    seenTitles.add(normalTitle);
    return true;
  });

  /* Decode HTML entities */
  const decoded = unique.map((item) => ({
    ...item,
    title: decodeEntities(item.title),
    summary: decodeEntities(item.summary),
  }));

  /* Quality filter */
  const quality = decoded.filter(isQualityContent);

  /* Score */
  const scored = quality.map((item) => ({ ...item, hypeScore: interestScore(item) }));

  /* Keep NewsAPI with guaranteed slots; fill rest from other sources */
  const MIN_SCORE = 52;
  const newsapiItems = scored.filter((x) => x.id.startsWith("na-")).sort((a, b) => b.hypeScore - a.hypeScore);
  const otherItems   = scored.filter((x) => !x.id.startsWith("na-")).sort((a, b) => b.hypeScore - a.hypeScore);

  const guaranteed = newsapiItems.filter((x) => x.hypeScore >= MIN_SCORE).slice(0, 25);
  const filler     = otherItems.filter((x) => x.hypeScore >= MIN_SCORE).slice(0, 120 - guaranteed.length);
  const combined   = [...guaranteed, ...filler].sort((a, b) => b.hypeScore - a.hypeScore);

  const output = combined.map(
    ({ _stars: _s, _points: _p, _comments: _c, _sourceLabel: _l, ...rest }) => rest,
  );

  /* Persist to database for historical views */
  try {
    await initDb();
    await upsertArticles(output.slice(0, 120));
  } catch (e) {
    console.error("[db] upsert failed:", e);
  }

  return NextResponse.json(output.slice(0, 120), {
    headers: { "Cache-Control": "s-maxage=60, stale-while-revalidate=30" },
  });
}
