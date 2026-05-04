import pytest
from fastapi.testclient import TestClient
from sqlmodel import Session, SQLModel, create_engine
from sqlmodel.pool import StaticPool

from app.database import get_session
from app.main import app
# Import models so SQLModel.metadata picks up every table
from app.models import user, health_metrics, activity, nutrition, goals, ai_recommendation  # noqa: F401


@pytest.fixture()
def session():
    engine = create_engine(
        "sqlite://",
        connect_args={"check_same_thread": False},
        poolclass=StaticPool,
    )
    SQLModel.metadata.create_all(engine)
    with Session(engine) as s:
        yield s


@pytest.fixture()
def client(session):
    def _override_get_session():
        yield session

    app.dependency_overrides[get_session] = _override_get_session
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


@pytest.fixture()
def registered_user(client):
    payload = {"email": "test@example.com", "name": "Test User", "password": "password123"}
    resp = client.post("/auth/register", json=payload)
    assert resp.status_code == 201, resp.text
    return {**payload, **resp.json()}


@pytest.fixture()
def auth_headers(client, registered_user):
    resp = client.post(
        "/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    assert resp.status_code == 200, resp.text
    token = resp.json()["access_token"]
    return {"Authorization": f"Bearer {token}"}
