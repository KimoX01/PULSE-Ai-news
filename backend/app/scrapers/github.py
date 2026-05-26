"""GitHub scraper — trending AI/ML repos via GitHub Search API."""

import hashlib
import math
from datetime import datetime, timezone

import httpx

from app.classify import classify
from app.models import NewsItem

_GITHUB_SEARCH = (
    "https://api.github.com/search/repositories"
    "?q=topic:artificial-intelligence+topic:machine-learning+stars:>500"
    "&sort=stars&order=desc&per_page=10"
)

_HEADERS = {
    "Accept": "application/vnd.github.v3+json",
    "User-Agent": "AI-Pulse/1.0",
}


def _stable_id(full_name: str) -> str:
    return "gh-" + hashlib.md5(full_name.encode()).hexdigest()[:10]


def _hype_from_stars(stars: int) -> int:
    """Logarithmic scale: 500 stars ≈ 65, 10k ≈ 82, 100k ≈ 95."""
    score = int(50 + math.log10(max(stars, 1)) * 15)
    return min(99, max(60, score))


async def fetch_github_news() -> list[NewsItem]:
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(_GITHUB_SEARCH, headers=_HEADERS)
            if resp.status_code != 200:
                return []
            data = resp.json()
    except Exception:
        return []

    items: list[NewsItem] = []
    for repo in data.get("items", []):
        name = repo.get("full_name", "")
        desc = repo.get("description") or ""
        url = repo.get("html_url", "")
        stars = repo.get("stargazers_count", 0)
        pushed = repo.get("pushed_at") or repo.get("updated_at") or ""

        if not name or not url:
            continue

        try:
            published_at = datetime.fromisoformat(pushed.replace("Z", "+00:00")).isoformat()
        except Exception:
            published_at = datetime.now(timezone.utc).isoformat()

        title = f"{name} — {desc[:80]}" if desc else name
        summary = (
            f"{desc} · {stars:,} GitHub stars"
            if desc
            else f"{stars:,} GitHub stars · Recently updated"
        )

        items.append(NewsItem(
            id=_stable_id(name),
            source="github",
            url=url,
            title=title,
            summary=summary[:280],
            category=classify(name + " " + desc, ""),
            hypeScore=_hype_from_stars(stars),
            publishedAt=published_at,
        ))

    return items
