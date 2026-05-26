"""RSS feed scraper — HN Algolia, The Verge AI, TechCrunch AI."""

import hashlib
from datetime import datetime, timezone

import feedparser
import httpx

from app.classify import classify
from app.models import NewsItem

_RSS_SOURCES = [
    ("https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "The Verge"),
    ("https://techcrunch.com/category/artificial-intelligence/feed/", "TechCrunch"),
    ("https://feeds.arstechnica.com/arstechnica/index", "Ars Technica"),
]

_HN_ALGOLIA = "https://hn.algolia.com/api/v1/search?tags=story&query=AI+LLM+machine+learning+agent&hitsPerPage=8&numericFilters=created_at_i>0"


def _stable_id(url: str) -> str:
    return hashlib.md5(url.encode()).hexdigest()[:12]


def _parse_date(entry) -> str:
    for attr in ("published_parsed", "updated_parsed"):
        parsed = getattr(entry, attr, None)
        if parsed:
            try:
                return datetime(*parsed[:6], tzinfo=timezone.utc).isoformat()
            except Exception:
                pass
    return datetime.now(timezone.utc).isoformat()


def _hype_from_position(position: int, total: int) -> int:
    # First item = 88, last = 65
    base = 88 - int((position / max(total - 1, 1)) * 23)
    return min(99, max(60, base))


async def fetch_rss_news() -> list[NewsItem]:
    items: list[NewsItem] = []

    # 1. RSS feeds
    for feed_url, _source_label in _RSS_SOURCES:
        try:
            async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
                resp = await client.get(feed_url, headers={"User-Agent": "AI-Pulse/1.0"})
                feed = feedparser.parse(resp.text)
            entries = feed.entries[:6]
            for i, entry in enumerate(entries):
                title = entry.get("title", "").strip()
                summary = entry.get("summary", entry.get("description", "")).strip()
                # Strip HTML tags from summary
                import re
                summary = re.sub(r"<[^>]+>", " ", summary)[:280].strip()
                url = entry.get("link", "")
                if not title or not url:
                    continue
                items.append(NewsItem(
                    id=_stable_id(url),
                    source="rss",
                    url=url,
                    title=title,
                    summary=summary or title,
                    category=classify(title, summary),
                    hypeScore=_hype_from_position(i, len(entries)),
                    publishedAt=_parse_date(entry),
                ))
        except Exception:
            continue

    # 2. Hacker News via Algolia
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(_HN_ALGOLIA)
            data = resp.json()
        hits = data.get("hits", [])[:8]
        for i, hit in enumerate(hits):
            title = hit.get("title", "").strip()
            url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            if not title:
                continue
            items.append(NewsItem(
                id=_stable_id(url),
                source="rss",
                url=url,
                title=title,
                summary=f"Trending on Hacker News — {hit.get('points', 0)} points, {hit.get('num_comments', 0)} comments.",
                category=classify(title, ""),
                hypeScore=min(99, max(60, 60 + int(hit.get("points", 0) / 10))),
                publishedAt=datetime.fromtimestamp(
                    hit.get("created_at_i", datetime.now().timestamp()), tz=timezone.utc
                ).isoformat(),
            ))
    except Exception:
        pass

    return items
