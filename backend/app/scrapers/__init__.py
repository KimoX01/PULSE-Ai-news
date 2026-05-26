import asyncio
from app.models import NewsItem
from app.scrapers.rss import fetch_rss_news
from app.scrapers.arxiv import fetch_arxiv_news
from app.scrapers.github import fetch_github_news
from app.scrapers.newsapi import fetch_newsapi_news


async def fetch_all_news() -> list[NewsItem]:
    results = await asyncio.gather(
        fetch_rss_news(),
        fetch_arxiv_news(),
        fetch_github_news(),
        fetch_newsapi_news(),
        return_exceptions=True,
    )

    all_items: list[NewsItem] = []
    for result in results:
        if isinstance(result, list):
            all_items.extend(result)

    # Deduplicate by id, sort newest-first
    seen: set[str] = set()
    unique: list[NewsItem] = []
    for item in all_items:
        if item.id not in seen:
            seen.add(item.id)
            unique.append(item)

    unique.sort(key=lambda x: x.publishedAt, reverse=True)
    return unique[:40]
