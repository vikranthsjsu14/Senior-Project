from datetime import date


def test_log_and_fetch_daily_metrics(client, auth_headers):
    today = date.today().isoformat()
    payload = {
        "date": today,
        "steps": 8000,
        "calories_burned": 300.5,
        "calories_consumed": 1900.0,
        "water_intake_ml": 2000,
        "active_minutes": 45,
    }
    created = client.post("/metrics/daily", json=payload, headers=auth_headers)
    assert created.status_code == 200
    body = created.json()
    assert body["steps"] == 8000
    assert body["user_id"]

    listed = client.get("/metrics/daily", headers=auth_headers)
    assert listed.status_code == 200
    assert any(m["date"] == today and m["steps"] == 8000 for m in listed.json())


def test_post_daily_twice_updates_same_row(client, auth_headers):
    today = date.today().isoformat()
    first = client.post("/metrics/daily", json={"date": today, "steps": 1000}, headers=auth_headers)
    second = client.post("/metrics/daily", json={"date": today, "steps": 5000}, headers=auth_headers)
    assert first.status_code == 200 and second.status_code == 200
    assert first.json()["id"] == second.json()["id"]
    assert second.json()["steps"] == 5000


def test_users_cannot_see_each_others_metrics(client):
    # User A
    client.post("/auth/register", json={"email": "a@x.com", "name": "A", "password": "pw12345678"})
    a_token = client.post(
        "/auth/login", data={"username": "a@x.com", "password": "pw12345678"}
    ).json()["access_token"]
    # User B
    client.post("/auth/register", json={"email": "b@x.com", "name": "B", "password": "pw12345678"})
    b_token = client.post(
        "/auth/login", data={"username": "b@x.com", "password": "pw12345678"}
    ).json()["access_token"]

    today = date.today().isoformat()
    client.post(
        "/metrics/daily",
        json={"date": today, "steps": 12345},
        headers={"Authorization": f"Bearer {a_token}"},
    )
    b_list = client.get("/metrics/daily", headers={"Authorization": f"Bearer {b_token}"}).json()
    assert all(m["steps"] != 12345 for m in b_list)


def test_patch_nonexistent_metrics_returns_404(client, auth_headers):
    resp = client.patch("/metrics/daily/99999", json={"steps": 1}, headers=auth_headers)
    assert resp.status_code == 404
