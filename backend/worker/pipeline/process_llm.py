from __future__ import annotations

from dataclasses import dataclass

from ..scrapers.base import RawItem


@dataclass
class ProcessedItem:
    source: str
    url: str
    title: str
    summary: str
    category: str
    hype_score: int
    published_at: str


def mock_llm_enrich(item: RawItem) -> ProcessedItem:
    title = item.raw_title.strip().capitalize()
    summary = item.raw_content.strip()
    category = infer_category(title + " " + summary)
    hype_score = min(100, max(0, 62 + (len(summary) % 39)))

    return ProcessedItem(
        source=item.source,
        url=item.url,
        title=title,
        summary=summary,
        category=category,
        hype_score=hype_score,
        published_at=item.published_at.isoformat(),
    )


def infer_category(text: str) -> str:
    lower = text.lower()
    if "security" in lower or "attack" in lower:
        return "security"
    if "research" in lower or "paper" in lower:
        return "research"
    if "infra" in lower or "latency" in lower or "routing" in lower:
        return "infrastructure"
    if "agent" in lower:
        return "agentic"
    return "tooling"
