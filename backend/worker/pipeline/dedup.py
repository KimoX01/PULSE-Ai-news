from __future__ import annotations

from difflib import SequenceMatcher

from ..scrapers.base import RawItem


def deduplicate(items: list[RawItem], threshold: float = 0.82) -> list[RawItem]:
    """Placeholder dedup stage using string similarity."""
    kept: list[RawItem] = []
    seen_signatures: list[str] = []

    for item in items:
        signature = (
            f"{item.raw_title.strip().lower()}::{item.raw_content.strip().lower()[:160]}"
        )
        if any(
            SequenceMatcher(None, signature, prev).ratio() >= threshold
            for prev in seen_signatures
        ):
            continue
        kept.append(item)
        seen_signatures.append(signature)

    return kept
