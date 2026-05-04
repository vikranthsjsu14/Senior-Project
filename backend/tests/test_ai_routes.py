"""Integration tests for the AI routers with anthropic mocked out."""
import io
import json
from types import SimpleNamespace
from unittest.mock import MagicMock

import anthropic
import httpx
import pytest


def _fake_response(text):
    return SimpleNamespace(content=[SimpleNamespace(text=text)])


def _status_error(cls, status_code):
    request = httpx.Request("POST", "http://test")
    response = httpx.Response(status_code, request=request)
    return cls(message="boom", response=response, body=None)


@pytest.fixture()
def mock_anthropic(monkeypatch):
    """Patch anthropic.Anthropic in every module that instantiates it."""
    state = {"client": MagicMock()}

    def factory(**_kwargs):
        return state["client"]

    from app.routers import chat as chat_mod
    from app.routers import food_scan as food_mod
    from app.services import ai_service as svc_mod

    monkeypatch.setattr(chat_mod.anthropic, "Anthropic", factory)
    monkeypatch.setattr(food_mod.anthropic, "Anthropic", factory)
    monkeypatch.setattr(svc_mod.anthropic, "Anthropic", factory)
    return state["client"]


# ---------- chat ----------

def test_chat_happy_path(client, auth_headers, mock_anthropic):
    mock_anthropic.messages.create.return_value = _fake_response("Great question! Keep it up.")
    resp = client.post(
        "/chat",
        headers=auth_headers,
        json={"messages": [{"role": "user", "content": "How many steps today?"}]},
    )
    assert resp.status_code == 200
    assert resp.json()["reply"] == "Great question! Keep it up."


def test_chat_requires_auth(client):
    resp = client.post("/chat", json={"messages": [{"role": "user", "content": "hi"}]})
    assert resp.status_code == 401


def test_chat_empty_messages_rejected(client, auth_headers):
    resp = client.post("/chat", headers=auth_headers, json={"messages": []})
    assert resp.status_code == 422


def test_chat_invalid_role_rejected(client, auth_headers):
    resp = client.post(
        "/chat",
        headers=auth_headers,
        json={"messages": [{"role": "system", "content": "hi"}]},
    )
    assert resp.status_code == 422


def test_chat_last_message_must_be_user(client, auth_headers):
    resp = client.post(
        "/chat",
        headers=auth_headers,
        json={
            "messages": [
                {"role": "user", "content": "hi"},
                {"role": "assistant", "content": "hey"},
            ]
        },
    )
    assert resp.status_code == 400


def test_chat_rate_limit_returns_429(client, auth_headers, mock_anthropic):
    mock_anthropic.messages.create.side_effect = _status_error(anthropic.RateLimitError, 429)
    resp = client.post(
        "/chat",
        headers=auth_headers,
        json={"messages": [{"role": "user", "content": "hi"}]},
    )
    assert resp.status_code == 429


# ---------- food scan ----------

def test_food_scan_rejects_non_image(client, auth_headers):
    resp = client.post(
        "/food-scan/analyze",
        headers=auth_headers,
        files={"file": ("note.txt", b"just text", "text/plain")},
    )
    assert resp.status_code == 400


def test_food_scan_requires_auth(client):
    resp = client.post(
        "/food-scan/analyze",
        files={"file": ("x.jpg", b"\xff\xd8\xff", "image/jpeg")},
    )
    assert resp.status_code == 401


def test_food_scan_happy_path(client, auth_headers, mock_anthropic):
    analysis = {"food_name": "Salad", "estimated_calories": 300}
    mock_anthropic.messages.create.return_value = _fake_response(json.dumps(analysis))
    resp = client.post(
        "/food-scan/analyze",
        headers=auth_headers,
        files={"file": ("s.jpg", b"\xff\xd8\xff\xe0", "image/jpeg")},
    )
    assert resp.status_code == 200
    assert resp.json()["analysis"] == analysis


def test_food_scan_malformed_json_returns_502(client, auth_headers, mock_anthropic):
    mock_anthropic.messages.create.return_value = _fake_response("not json at all")
    resp = client.post(
        "/food-scan/analyze",
        headers=auth_headers,
        files={"file": ("s.jpg", b"\xff\xd8\xff\xe0", "image/jpeg")},
    )
    assert resp.status_code == 502


# ---------- recommendations ----------

def test_recommendations_requires_profile(client, auth_headers):
    # fresh user has no age or fitness_goal
    resp = client.post("/ai/recommendations", headers=auth_headers, json={})
    assert resp.status_code == 400
    assert "profile" in resp.json()["detail"].lower()


def test_recommendations_happy_path(client, auth_headers, mock_anthropic, session):
    # Fill in the profile so the guard passes
    from app.models.user import User
    from sqlmodel import select
    u = session.exec(select(User)).first()
    u.age = 22
    u.fitness_goal = "general_wellness"
    session.add(u)
    session.commit()

    plan = {
        "workout_plan": {"weekly_schedule": [], "key_exercises": [], "rationale": "x"},
        "nutrition_advice": {
            "daily_calorie_target": 2000,
            "macro_targets": {"protein_g": 150, "carbs_g": 200, "fat_g": 65},
            "meal_suggestions": [],
            "foods_to_focus_on": [],
            "foods_to_limit": [],
            "rationale": "x",
        },
        "insights": [],
        "warnings": [],
    }
    mock_anthropic.messages.create.return_value = _fake_response(json.dumps(plan))
    resp = client.post("/ai/recommendations", headers=auth_headers, json={"force_refresh": True})
    assert resp.status_code == 200
    assert resp.json()["data"] == plan
    assert resp.json()["cached"] is False
