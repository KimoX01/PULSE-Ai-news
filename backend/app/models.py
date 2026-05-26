from pydantic import BaseModel
from typing import Literal

NewsCategory = Literal["llm", "agentic", "tooling", "research", "infrastructure", "security"]
NewsSource = Literal["x", "rss", "github", "arxiv"]


class NewsItem(BaseModel):
    id: str
    source: NewsSource
    url: str
    title: str
    summary: str
    category: NewsCategory
    hypeScore: int
    publishedAt: str  # ISO 8601
