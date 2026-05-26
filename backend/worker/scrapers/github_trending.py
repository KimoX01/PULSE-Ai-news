from datetime import datetime, timedelta, timezone

from .base import BaseScraper, RawItem


class GithubTrendingScraper(BaseScraper):
    source = "github"

    def fetch(self) -> list[RawItem]:
        return [
            RawItem(
                source=self.source,
                url="https://github.com/trending",
                raw_title="A model routing library climbs GitHub Trending",
                raw_content="It offers provider fallback, budget limits, and response tracing.",
                published_at=datetime.now(timezone.utc) - timedelta(minutes=10),
            )
        ]
