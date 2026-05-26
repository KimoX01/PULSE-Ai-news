from __future__ import annotations

from abc import ABC, abstractmethod
from dataclasses import dataclass
from datetime import datetime


@dataclass
class RawItem:
    source: str
    url: str
    raw_title: str
    raw_content: str
    published_at: datetime


class BaseScraper(ABC):
    source: str

    @abstractmethod
    def fetch(self) -> list[RawItem]:
        """Fetch raw content from a source."""
