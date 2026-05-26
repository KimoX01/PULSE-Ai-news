from datetime import datetime, timedelta, timezone

from .base import BaseScraper, RawItem


class ArxivScraper(BaseScraper):
    source = "arxiv"

    def fetch(self) -> list[RawItem]:
        return [
            RawItem(
                source=self.source,
                url="https://arxiv.org/abs/1234.5678",
                raw_title="Paper proposes robust planning for tool-calling agents",
                raw_content="A new planner improves multi-step reliability under latency constraints.",
                published_at=datetime.now(timezone.utc) - timedelta(minutes=14),
            )
        ]
