"""NewsAPI.org scraper — requires NEWSAPI_KEY env var."""

import hashlib
import os
from datetime import datetime, timezone

import httpx

from app.classify import classify
from app.models import NewsItem

_BASE = "https://newsapi.org/v2/everything"
_QUERY = (
    "artificial intelligence OR machine learning OR LLM OR "
    "large language model OR AI agent OR GPT OR Claude OR Gemini"
)


def _stable_id(url: str) -> str:
    return "na-" + hashlib.md5(url.encode()).hexdigest()[:10]


async def fetch_newsapi_news() -> list[NewsItem]:
    key = os.getenv("NEWSAPI_KEY", "")
    if not key or key == "your_key_here":
        return []

    params = {
        "q": _QUERY,
        "language": "en",
        "sortBy": "publishedAt",
        "pageSize": "10",
        "apiKey": key,
    }

    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(_BASE, params=params)
            if resp.status_code != 200:
                return []
            data = resp.json()
    except Exception:
        return []

    items: list[NewsItem] = []
    for i, article in enumerate(data.get("articles", [])):
        title = (article.get("title") or "").strip()
        description = (article.get("description") or "").strip()
        url = article.get("url") or ""
        published = article.get("publishedAt") or ""

        if not title or not url or title == "[Removed]":
            continue

        try:
            published_at = datetime.fromisoformat(published.replace("Z", "+00:00")).isoformat()
        except Exception:
            published_at = datetime.now(timezone.utc).isoformat()

        # Score by position (NewsAPI sorts by date)
        hype = max(63, 88 - i * 3)

        items.append(NewsItem(
            id=_stable_id(url),
            source="rss",
            url=url,
            title=title,
            summary=description[:280] if description else title,
            category=classify(title, description),
            hypeScore=hype,
            publishedAt=published_at,
        ))

    return items
