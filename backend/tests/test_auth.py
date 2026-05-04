def test_register_creates_user(client):
    resp = client.post(
        "/auth/register",
        json={"email": "alice@example.com", "name": "Alice", "password": "secret123"},
    )
    assert resp.status_code == 201
    body = resp.json()
    assert body["email"] == "alice@example.com"
    assert body["name"] == "Alice"
    assert "id" in body
    assert "hashed_password" not in body
    assert "password" not in body


def test_register_duplicate_email_rejected(client):
    payload = {"email": "dup@example.com", "name": "Dup", "password": "pw12345678"}
    first = client.post("/auth/register", json=payload)
    assert first.status_code == 201
    second = client.post("/auth/register", json=payload)
    assert second.status_code == 400
    assert "already registered" in second.json()["detail"].lower()


def test_login_success_returns_token(client, registered_user):
    resp = client.post(
        "/auth/login",
        data={"username": registered_user["email"], "password": registered_user["password"]},
    )
    assert resp.status_code == 200
    body = resp.json()
    assert body["token_type"] == "bearer"
    assert body["access_token"]
    assert body["user"]["email"] == registered_user["email"]


def test_login_wrong_password_rejected(client, registered_user):
    resp = client.post(
        "/auth/login",
        data={"username": registered_user["email"], "password": "wrong-password"},
    )
    assert resp.status_code == 401


def test_login_unknown_email_rejected(client):
    resp = client.post(
        "/auth/login",
        data={"username": "nobody@example.com", "password": "whatever"},
    )
    assert resp.status_code == 401


def test_protected_route_requires_token(client):
    resp = client.get("/metrics/daily")
    assert resp.status_code == 401


def test_protected_route_rejects_bad_token(client):
    resp = client.get("/metrics/daily", headers={"Authorization": "Bearer not-a-real-token"})
    assert resp.status_code == 401
