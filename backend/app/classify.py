"""Keyword-based category classifier. More specific rules first to avoid overlap."""

from typing import Literal

NewsCategory = Literal[
    "world", "science", "tech", "ai",
    "politics", "business", "health", "climate", "ideas", "culture",
]

_RULES: list[tuple[str, list[str]]] = [
    ("climate", [
        "climate change", "global warming", "carbon emission", "renewable energy",
        "solar panel", "wind energy", "fossil fuel", "greenhouse gas", "net zero",
        "biodiversity", "deforestation", "sustainability", "energy transition",
        "ipcc", "coral reef", "ice sheet", "wildfire", "drought", "flooding",
        "sea level", "decarbonization", "clean energy",
    ]),
    ("health", [
        "vaccine", "cancer", "pandemic", "covid", "mental health",
        "clinical trial", "fda approved", "disease", "obesity",
        "nutrition", "hospital", "antibiotic", "dementia",
        "alzheimer", "diabetes", "public health", "epidemic", "drug trial",
        "mortality", "life expectancy", "wellbeing", "therapy",
    ]),
    ("ai", [
        "artificial intelligence", "machine learning", "deep learning",
        "language model", "llm", "gpt", "claude", "gemini", "mistral", "llama",
        "chatgpt", "openai", "anthropic", "neural network", "transformer",
        "ai agent", "chatbot", "generative ai", "large language model",
        "foundation model", "diffusion model", "reinforcement learning",
    ]),
    ("science", [
        "researchers find", "scientists discover", "new study", "according to researchers",
        "physics", "biology", "chemistry", "astronomy", "quantum",
        "nasa", "space telescope", "galaxy", "genome", "crispr",
        "black hole", "mars", "evolution", "species", "fossil",
        "neuroscience", "particle accelerator", "dark matter", "exoplanet",
    ]),
    ("politics", [
        "election", "president", "congress", "senate", "parliament",
        "prime minister", "vote", "ballot", "legislation", "democrat",
        "republican", "administration", "supreme court", "governor",
        "political party", "campaign", "polling", "referendum", "impeach",
    ]),
    ("business", [
        "startup", "ipo", "acquisition", "merger", "quarterly earnings",
        "revenue", "profit", "stock market", "venture capital",
        "inflation", "gdp", "federal reserve", "interest rate",
        "recession", "wall street", "nasdaq", "s&p", "hedge fund",
        "trade deficit", "supply chain", "layoffs", "hiring freeze",
    ]),
    ("culture", [
        "film", "movie", "music album", "novel", "book review",
        "director", "oscar", "grammy", "pulitzer", "booker prize",
        "exhibition", "theater", "literature", "streaming series",
        "festival", "concert tour", "museum", "gallery opening",
        "sports championship", "olympic",
    ]),
    ("ideas", [
        "the case for", "the case against", "rethinking", "what we get wrong",
        "long read", "philosophy", "essay", "intellectual", "the future of",
        "history of", "how to think about", "a new way to", "opinion:",
        "commentary", "perspective", "against the idea", "in defense of",
        "why we", "the problem with",
    ]),
    ("tech", [
        "software", "hardware", "semiconductor", "chip shortage",
        "apple", "google", "microsoft", "meta platform", "amazon",
        "cybersecurity", "data breach", "encryption", "open source",
        "robotics", "electric vehicle", "autonomous vehicle", "space launch",
        "developer", "programming", "internet", "smartphone",
    ]),
    ("world", [
        "war", "conflict", "military", "ukraine", "russia", "china",
        "middle east", "africa", "europe", "asia", "nato",
        "united nations", "refugee", "humanitarian crisis", "sanctions",
        "diplomacy", "ceasefire", "protest", "coup", "foreign policy",
        "international", "global", "bilateral", "multilateral",
    ]),
]


def classify(title: str, summary: str) -> str:
    text = (title + " " + summary).lower()
    for category, keywords in _RULES:
        for kw in keywords:
            if kw in text:
                return category
    return "world"  # default
