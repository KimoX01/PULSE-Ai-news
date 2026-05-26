"""Keyword-based category classifier for news items."""

from typing import Literal

_RULES: list[tuple[str, list[str]]] = [
    ("security",        ["safety", "jailbreak", "prompt injection", "adversarial", "red team",
                         "vulnerability", "attack", "defense", "privacy", "bias", "hallucin"]),
    ("agentic",         ["agent", "agentic", "tool call", "tool use", "autonomous", "multi-agent",
                         "multi agent", "workflow", "orchestrat", "planning", "reasoning", "react framework"]),
    ("research",        ["paper", "arxiv", "benchmark", "dataset", "evaluation", "rlhf",
                         "alignment", "experiment", "ablation", "pretraining", "fine-tuning", "finetune"]),
    ("tooling",         ["sdk", "library", "framework", "langchain", "llamaindex", "hugging face",
                         "huggingface", "vllm", "ollama", "openai sdk", "anthropic sdk", "cli"]),
    ("infrastructure",  ["gpu", "compute", "cluster", "kubernetes", "docker", "mlops", "pipeline",
                         "distributed", "scaling", "throughput", "latency", "serving", "deployment",
                         "cloud", "aws", "gcp", "azure", "tpu"]),
    ("llm",             ["gpt", "llm", "language model", "claude", "gemini", "mistral", "llama",
                         "chatgpt", "openai", "anthropic", "palm", "transformer", "token",
                         "inference", "prompt", "context window"]),
]


def classify(title: str, summary: str) -> Literal["llm", "agentic", "tooling", "research", "infrastructure", "security"]:
    text = (title + " " + summary).lower()
    for category, keywords in _RULES:
        for kw in keywords:
            if kw in text:
                return category  # type: ignore[return-value]
    return "llm"  # default
