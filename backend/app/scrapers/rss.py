"""RSS feed scraper — quality journalism and science sources with image extraction."""

import hashlib
import re
from datetime import datetime, timezone

import feedparser
import httpx

from app.classify import classify
from app.models import NewsItem

_RSS_SOURCES = [
    # World & general news
    ("https://feeds.bbci.co.uk/news/world/rss.xml",            "BBC World"),
    ("https://feeds.npr.org/1001/rss.xml",                      "NPR"),
    ("https://www.theguardian.com/world/rss",                   "The Guardian"),
    # Science
    ("https://rss.sciam.com/ScientificAmerican-Global",         "Scientific American"),
    ("https://www.newscientist.com/feed/home/",                 "New Scientist"),
    # Tech & ideas
    ("https://feeds.arstechnica.com/arstechnica/index",         "Ars Technica"),
    ("https://www.technologyreview.com/feed/",                  "MIT Technology Review"),
    # AI specifically
    ("https://www.theverge.com/rss/ai-artificial-intelligence/index.xml", "The Verge"),
    ("https://techcrunch.com/category/artificial-intelligence/feed/",     "TechCrunch"),
]

# Hacker News top stories — broad, no topic filter (science/tech/ideas/world)
_HN_ALGOLIA = (
    "https://hn.algolia.com/api/v1/search"
    "?tags=story&hitsPerPage=10&numericFilters=created_at_i>0"
)

_IMG_EXTS = (".jpg", ".jpeg", ".png", ".webp", ".gif")


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
    base = 88 - int((position / max(total - 1, 1)) * 23)
    return min(99, max(60, base))


def _is_image_url(url: str) -> bool:
    return any(url.lower().split("?")[0].endswith(ext) for ext in _IMG_EXTS)


def _extract_image(entry) -> str | None:
    """Try every standard RSS image field — return first valid URL."""
    # media:content (most common for BBC, Guardian, Ars Technica)
    for mc in getattr(entry, "media_content", []):
        url = mc.get("url", "")
        mime = mc.get("type", "")
        if url and ("image" in mime or _is_image_url(url)):
            return url

    # media:thumbnail
    thumb = getattr(entry, "media_thumbnail", None)
    if thumb and isinstance(thumb, list) and thumb:
        url = thumb[0].get("url", "")
        if url:
            return url

    # enclosures (NPR, Scientific American)
    for enc in getattr(entry, "enclosures", []):
        url = enc.get("url", "") or enc.get("href", "")
        mime = enc.get("type", "") or enc.get("mime_type", "")
        if url and "image" in mime:
            return url

    # links with image type
    for link in getattr(entry, "links", []):
        if "image" in link.get("type", ""):
            url = link.get("href", "") or link.get("url", "")
            if url:
                return url

    # <img> tag inside content/summary (The Verge, TechCrunch)
    for attr in ("content", "summary", "description"):
        raw = ""
        val = getattr(entry, attr, None)
        if isinstance(val, list) and val:
            raw = val[0].get("value", "")
        elif isinstance(val, str):
            raw = val
        m = re.search(r'<img[^>]+src=["\']([^"\']+)["\']', raw)
        if m:
            url = m.group(1)
            if _is_image_url(url) and not url.startswith("data:"):
                return url

    return None


async def fetch_rss_news() -> list[NewsItem]:
    items: list[NewsItem] = []

    # 1. RSS feeds — cap each source at 5 articles for diversity
    for feed_url, _label in _RSS_SOURCES:
        try:
            async with httpx.AsyncClient(timeout=8, follow_redirects=True) as client:
                resp = await client.get(feed_url, headers={"User-Agent": "Pulse/1.0"})
                feed = feedparser.parse(resp.text)
            entries = feed.entries[:5]
            for i, entry in enumerate(entries):
                title = entry.get("title", "").strip()
                summary = entry.get("summary", entry.get("description", "")).strip()
                summary = re.sub(r"<[^>]+>", " ", summary)[:280].strip()
                url = entry.get("link", "")
                if not title or not url:
                    continue
                image_url = _extract_image(entry)
                items.append(NewsItem(
                    id=_stable_id(url),
                    source="rss",
                    url=url,
                    title=title,
                    summary=summary or title,
                    category=classify(title, summary),
                    hypeScore=_hype_from_position(i, len(entries)),
                    publishedAt=_parse_date(entry),
                    imageUrl=image_url,
                ))
        except Exception:
            continue

    # 2. Hacker News top stories — naturally diverse
    try:
        async with httpx.AsyncClient(timeout=8) as client:
            resp = await client.get(_HN_ALGOLIA)
            data = resp.json()
        hits = data.get("hits", [])[:10]
        for i, hit in enumerate(hits):
            title = hit.get("title", "").strip()
            url = hit.get("url") or f"https://news.ycombinator.com/item?id={hit.get('objectID')}"
            if not title:
                continue
            pts = hit.get("points", 0)
            items.append(NewsItem(
                id=_stable_id(url),
                source="rss",
                url=url,
                title=title,
                summary=f"On Hacker News — {pts} points, {hit.get('num_comments', 0)} comments.",
                category=classify(title, ""),
                hypeScore=min(99, max(60, 60 + int(pts / 10))),
                publishedAt=datetime.fromtimestamp(
                    hit.get("created_at_i", datetime.now().timestamp()), tz=timezone.utc
                ).isoformat(),
            ))
    except Exception:
        pass

    return items
