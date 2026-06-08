from pydantic import BaseModel
from typing import Literal

NewsCategory = Literal[
    "world", "science", "tech", "ai",
    "politics", "business", "health", "climate", "ideas", "culture",
]
NewsSource = Literal["rss", "github", "arxiv"]


class NewsItem(BaseModel):
    id: str
    source: NewsSource
    url: str
    title: str
    summary: str
    category: NewsCategory
    hypeScore: int
    publishedAt: str  # ISO 8601
    imageUrl: str | None = None
