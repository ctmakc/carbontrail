"""Unit tests for the local Ollama-Cloud LLM client and ai fallback wiring.

All network access is mocked — these tests never hit a real endpoint.
"""
import sys
sys.path.insert(0, "/data/projects/carbontrail/backend")

import requests

from app.services import llm
from app.services import ai


class _FakeResponse:
    def __init__(self, payload):
        self._payload = payload

    def raise_for_status(self):
        return None

    def json(self):
        return self._payload


def _ok_payload(content):
    return {"choices": [{"message": {"content": content, "reasoning": "hidden cot"}}]}


def test_chat_success_returns_content(monkeypatch):
    captured = {}

    def fake_post(url, json=None, timeout=None):
        captured["url"] = url
        captured["json"] = json
        return _FakeResponse(_ok_payload("Hello world"))

    monkeypatch.delenv("AI_DISABLED", raising=False)
    monkeypatch.setattr(requests, "post", fake_post)

    result = llm.chat("sys", "usr", max_tokens=123, temperature=0.5)
    assert result == "Hello world"
    # Hit the OpenAI-compatible chat completions endpoint
    assert captured["url"].endswith("/chat/completions")
    body = captured["json"]
    assert body["model"] == llm.LLM_MODEL
    assert body["max_tokens"] == 123
    assert body["temperature"] == 0.5
    assert body["messages"][0] == {"role": "system", "content": "sys"}
    assert body["messages"][1] == {"role": "user", "content": "usr"}


def test_chat_empty_content_returns_none(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        return _FakeResponse(_ok_payload("   \n  "))

    monkeypatch.delenv("AI_DISABLED", raising=False)
    monkeypatch.setattr(requests, "post", fake_post)

    assert llm.chat("sys", "usr") is None


def test_chat_none_content_returns_none(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        return _FakeResponse(_ok_payload(None))

    monkeypatch.delenv("AI_DISABLED", raising=False)
    monkeypatch.setattr(requests, "post", fake_post)

    assert llm.chat("sys", "usr") is None


def test_chat_exception_returns_none(monkeypatch):
    def fake_post(url, json=None, timeout=None):
        raise requests.exceptions.ConnectionError("boom")

    monkeypatch.delenv("AI_DISABLED", raising=False)
    monkeypatch.setattr(requests, "post", fake_post)

    assert llm.chat("sys", "usr") is None


def test_chat_ai_disabled_skips_network(monkeypatch):
    calls = {"n": 0}

    def fake_post(url, json=None, timeout=None):
        calls["n"] += 1
        return _FakeResponse(_ok_payload("should not be reached"))

    monkeypatch.setenv("AI_DISABLED", "1")
    monkeypatch.setattr(requests, "post", fake_post)

    assert llm.chat("sys", "usr") is None
    assert calls["n"] == 0


def test_explain_pattern_falls_back_when_chat_none(monkeypatch):
    # Force the LLM layer to return None — explain_pattern must use rule-based text.
    monkeypatch.setattr(ai.llm, "chat", lambda *a, **k: None)

    data = {
        "vendor_name": "Acme Corp",
        "contract_value": 1_000_000,
        "is_sole_source": True,
    }
    out = ai.explain_pattern("revolving_door", data)
    # The exact rule-based wording from _fallback_explanation
    assert "Acme Corp" in out
    assert "former public servant" in out
    assert out == ai._fallback_explanation("revolving_door", data)


def test_explain_pattern_uses_llm_when_available(monkeypatch):
    monkeypatch.setattr(ai.llm, "chat", lambda *a, **k: "LLM generated answer")
    out = ai.explain_pattern("revolving_door", {"vendor_name": "Acme Corp"})
    assert out == "LLM generated answer"
