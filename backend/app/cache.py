"""Simple TTL in-memory cache."""

import time
from typing import Any

_store: dict[str, tuple[Any, float]] = {}


def get(key: str, ttl: float) -> Any | None:
    entry = _store.get(key)
    if entry and (time.time() - entry[1]) < ttl:
        return entry[0]
    return None


def set(key: str, value: Any) -> None:
    _store[key] = (value, time.time())
