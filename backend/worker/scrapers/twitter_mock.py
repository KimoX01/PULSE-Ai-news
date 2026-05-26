from datetime import datetime, timedelta, timezone

from .base import BaseScraper, RawItem


class TwitterMockScraper(BaseScraper):
    source = "x"

    def fetch(self) -> list[RawItem]:
        return [
            RawItem(
                source=self.source,
                url="https://x.com/example/1",
                raw_title="Realtime coding agent release is trending",
                raw_content="Developers share faster debugging loops using autonomous tool agents.",
                published_at=datetime.now(timezone.utc) - timedelta(minutes=4),
            )
        ]
