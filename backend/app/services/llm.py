"""
CarbonTrail LLM client — local Ollama-Cloud via OpenAI-compatible endpoint.

Talks to the Chat Completions API exposed by the Ollama proxy. No Anthropic /
Bedrock anywhere. Callers fall back to rule-based logic when this returns None.
"""
import os
import logging

import requests

logger = logging.getLogger(__name__)

OLLAMA_BASE_URL = os.environ.get("OLLAMA_BASE_URL", "http://localhost:11434/v1")
LLM_MODEL = os.environ.get("LLM_MODEL", "gpt-oss:120b-cloud")

# (connect, read) timeout in seconds
_TIMEOUT = (60, 60)


def chat(system: str, user: str, max_tokens: int = 1200, temperature: float = 0.3) -> str | None:
    """Send a system+user prompt to the LLM and return the visible answer.

    Returns None (so the caller can use a rule-based fallback) when:
      - AI_DISABLED == "1" (no network call is made)
      - the response content is empty/whitespace
      - any error occurs (timeout, connection, bad status, JSON error)

    Note: the gpt-oss model emits chain-of-thought in a separate `reasoning`
    field and the user-visible answer in `content`. With too-low max_tokens the
    reasoning consumes the whole budget and `content` comes back empty — hence
    the generous default.
    """
    if os.environ.get("AI_DISABLED") == "1":
        logger.info("AI_DISABLED=1 — skipping LLM call, using fallback")
        return None

    url = f"{OLLAMA_BASE_URL}/chat/completions"
    payload = {
        "model": LLM_MODEL,
        "messages": [
            {"role": "system", "content": system},
            {"role": "user", "content": user},
        ],
        "max_tokens": max_tokens,
        "temperature": temperature,
    }

    try:
        resp = requests.post(url, json=payload, timeout=_TIMEOUT)
        resp.raise_for_status()
        data = resp.json()
        content = data["choices"][0]["message"]["content"]
        if content is None or not content.strip():
            logger.warning("LLM returned empty content (raise max_tokens?) — using fallback")
            return None
        return content
    except Exception as e:
        logger.warning(f"LLM call failed: {e}")
        return None
