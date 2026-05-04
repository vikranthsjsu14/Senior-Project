"""Unit tests for the ai_errors helpers.

These exercise the translation layer directly — no network, no FastAPI —
so they pin down the contract call_claude/parse_ai_json expose to routers.
"""
import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import anthropic
import httpx
import pytest
from fastapi import HTTPException

from app.services.ai_errors import call_claude, parse_ai_json


def _fake_response(text):
    return SimpleNamespace(content=[SimpleNamespace(text=text)])


def _status_error(cls, status_code):
    """Build a real anthropic error instance without hitting the network."""
    request = httpx.Request("POST", "http://test")
    response = httpx.Response(status_code, request=request)
    return cls(message="boom", response=response, body=None)


def test_call_claude_returns_text():
    client = MagicMock()
    client.messages.create.return_value = _fake_response("  hello world  ")
    assert call_claude(client, model="x") == "hello world"


def test_call_claude_empty_content_is_502():
    client = MagicMock()
    client.messages.create.return_value = SimpleNamespace(content=[])
    with pytest.raises(HTTPException) as ei:
        call_claude(client)
    assert ei.value.status_code == 502


def test_call_claude_rate_limit_becomes_429():
    client = MagicMock()
    client.messages.create.side_effect = _status_error(anthropic.RateLimitError, 429)
    with pytest.raises(HTTPException) as ei:
        call_claude(client)
    assert ei.value.status_code == 429


def test_call_claude_auth_error_becomes_500_generic():
    client = MagicMock()
    client.messages.create.side_effect = _status_error(anthropic.AuthenticationError, 401)
    with pytest.raises(HTTPException) as ei:
        call_claude(client)
    assert ei.value.status_code == 500
    # Must not leak internals to the user
    assert "api" not in ei.value.detail.lower() or "misconfigured" in ei.value.detail.lower()


def test_call_claude_connection_error_becomes_503():
    client = MagicMock()
    client.messages.create.side_effect = anthropic.APIConnectionError(
        request=httpx.Request("POST", "http://test")
    )
    with pytest.raises(HTTPException) as ei:
        call_claude(client)
    assert ei.value.status_code == 503


def test_call_claude_server_error_becomes_503():
    client = MagicMock()
    client.messages.create.side_effect = _status_error(anthropic.InternalServerError, 500)
    with pytest.raises(HTTPException) as ei:
        call_claude(client)
    assert ei.value.status_code == 503


def test_parse_ai_json_plain():
    assert parse_ai_json('{"a": 1}') == {"a": 1}


def test_parse_ai_json_strips_markdown_fence():
    wrapped = '```json\n{"a": 1}\n```'
    assert parse_ai_json(wrapped) == {"a": 1}


def test_parse_ai_json_strips_bare_fence():
    wrapped = '```\n{"a": 1}\n```'
    assert parse_ai_json(wrapped) == {"a": 1}


def test_parse_ai_json_malformed_is_502():
    with pytest.raises(HTTPException) as ei:
        parse_ai_json("this is not json, sorry")
    assert ei.value.status_code == 502
