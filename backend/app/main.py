import os
from dotenv import load_dotenv

load_dotenv(dotenv_path=os.path.join(os.path.dirname(__file__), "..", ".env"))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.cache import get as cache_get, set as cache_set
from app.scrapers import fetch_all_news

app = FastAPI(title="AI Intelligence Pulse API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:3003",
    ],
    allow_methods=["GET"],
    allow_headers=["*"],
)

_NEWS_TTL = 300  # cache for 5 minutes


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/news")
async def news() -> list:
    cached = cache_get("news", _NEWS_TTL)
    if cached is not None:
        return cached

    items = await fetch_all_news()
    payload = [item.model_dump() for item in items]
    cache_set("news", payload)
    return payload
