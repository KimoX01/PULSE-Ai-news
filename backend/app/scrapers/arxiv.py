"""arXiv scraper — latest AI/ML/CL papers via the public Atom API."""

import hashlib
import re
import xml.etree.ElementTree as ET
from datetime import datetime, timezone

import httpx

from app.classify import classify
from app.models import NewsItem

_ARXIV_URL = (
    "https://export.arxiv.org/api/query"
    "?search_query=cat:cs.AI+OR+cat:cs.LG+OR+cat:cs.CL+OR+cat:cs.CV"
    "&sortBy=submittedDate&sortOrder=descending&max_results=10"
)

_NS = {"atom": "http://www.w3.org/2005/Atom"}


def _stable_id(url: str) -> str:
    return "arxiv-" + hashlib.md5(url.encode()).hexdigest()[:10]


def _clean(text: str) -> str:
    return re.sub(r"\s+", " ", text).strip()


async def fetch_arxiv_news() -> list[NewsItem]:
    try:
        async with httpx.AsyncClient(timeout=12) as client:
            resp = await client.get(_ARXIV_URL, headers={"User-Agent": "AI-Pulse/1.0"})
        root = ET.fromstring(resp.text)
    except Exception:
        return []

    items: list[NewsItem] = []
    entries = root.findall("atom:entry", _NS)

    for i, entry in enumerate(entries):
        title_el = entry.find("atom:title", _NS)
        summary_el = entry.find("atom:summary", _NS)
        link_el = entry.find("atom:link[@rel='alternate']", _NS) or entry.find("atom:link", _NS)
        published_el = entry.find("atom:published", _NS)

        title = _clean(title_el.text or "") if title_el is not None else ""
        summary = _clean(summary_el.text or "") if summary_el is not None else ""
        url = link_el.get("href", "") if link_el is not None else ""

        if not title or not url:
            continue

        try:
            published_at = datetime.fromisoformat(
                (published_el.text or "").replace("Z", "+00:00")
            ).isoformat()
        except Exception:
            published_at = datetime.now(timezone.utc).isoformat()

        # Score: most recent = 85, older = 68
        hype = max(68, 85 - i * 2)

        items.append(NewsItem(
            id=_stable_id(url),
            source="arxiv",
            url=url,
            title=title,
            summary=summary[:300] + ("…" if len(summary) > 300 else ""),
            category=classify(title, summary),
            hypeScore=hype,
            publishedAt=published_at,
        ))

    return items
