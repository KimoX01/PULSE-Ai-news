from __future__ import annotations

from ..scrapers.arxiv import ArxivScraper
from ..scrapers.github_trending import GithubTrendingScraper
from ..scrapers.rss import RssScraper
from ..scrapers.twitter_mock import TwitterMockScraper
from .dedup import deduplicate
from .process_llm import ProcessedItem, mock_llm_enrich


def collect_raw_items():
    scrapers = [
        TwitterMockScraper(),
        RssScraper(),
        GithubTrendingScraper(),
        ArxivScraper(),
    ]
    raw_items = []
    for scraper in scrapers:
        raw_items.extend(scraper.fetch())
    return raw_items


def run_pipeline() -> list[ProcessedItem]:
    raw_items = collect_raw_items()
    unique_items = deduplicate(raw_items)
    processed = [mock_llm_enrich(item) for item in unique_items]
    return processed


if __name__ == "__main__":
    for item in run_pipeline():
        print(
            {
                "title": item.title,
                "category": item.category,
                "hype_score": item.hype_score,
                "source": item.source,
            }
        )
