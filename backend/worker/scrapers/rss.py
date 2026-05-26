from datetime import datetime, timedelta, timezone

from .base import BaseScraper, RawItem


class RssScraper(BaseScraper):
    source = "rss"

    def fetch(self) -> list[RawItem]:
        return [
            RawItem(
                source=self.source,
                url="https://example-rss.com/post/ai-news",
                raw_title="AI infra startup launches lower-latency API edge",
                raw_content="The rollout focuses on token streaming and reliability for app builders.",
                published_at=datetime.now(timezone.utc) - timedelta(minutes=6),
            )
        ]
