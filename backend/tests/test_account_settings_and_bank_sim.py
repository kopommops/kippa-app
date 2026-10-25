from datetime import datetime


def register(client, email="owner@example.com", business="Dumela Foods"):
    response = client.post("/api/auth/register", json={
        "owner_name": "Test Owner",
        "email": email,
        "password": "a-safe-test-password-194",
        "business_name": business,
        "business_type": "Food vendor",
        "opening_balance": 250.50,
    })
    assert response.status_code == 201, response.text
    payload = response.json()
    return payload, {"Authorization": f"Bearer {payload['access_token']}"}


def test_settings_can_be_updated_and_email_is_not_mutable(client):
    payload, headers = register(client, email="settings-owner@example.com", business="Old Shop")
    result = client.patch("/api/account/settings", headers=headers, json={
        "owner_name": "Updated Owner",
        "business_name": "Updated Shop",
        "business_type": "Retail / tuck shop",
    })
    assert result.status_code == 200, result.text
    data = result.json()
    assert data["owner_name"] == "Updated Owner"
    assert data["business_name"] == "Updated Shop"
    assert data["email"] == "settings-owner@example.com"

    me = client.get("/api/auth/me", headers=headers).json()
    assert me["user"]["email"] == payload["user"]["email"]
    assert me["user"]["owner_name"] == "Updated Owner"


def test_settings_reject_invalid_business_type(client):
    _, headers = register(client)
    response = client.patch("/api/account/settings", headers=headers, json={
        "owner_name": "Owner Person", "business_name": "My Shop", "business_type": "Banking institution",
    })
    assert response.status_code == 422


def test_simulated_bank_event_creates_account_transaction_and_notification(client):
    _, headers = register(client, email="bank-owner@example.com", business="Bank Test Shop")
    connected = client.post("/api/account/bank/connections", headers=headers, json={
        "provider_code": "demo_fnb", "account_label": "Main demo account",
    })
    assert connected.status_code == 201, connected.text
    connection = connected.json()
    assert connection["is_simulated"] is True
    assert "simulation only" in connection["provider_name"].lower()

    event = client.post(f"/api/account/bank/connections/{connection['id']}/simulate-event", headers=headers, json={
        "kind": "income", "amount": 125.50, "category": "Sales", "description": "Demo incoming payment",
    })
    assert event.status_code == 201, event.text
    transaction = event.json()
    assert transaction["source"] == "bank_simulation"
    assert transaction["amount"] == 125.50

    activity = client.get("/api/account/transactions", headers=headers).json()
    assert any(item["id"] == transaction["id"] and item["source"] == "bank_simulation" for item in activity)

    notifications = client.get("/api/account/notifications", headers=headers).json()
    assert len(notifications) == 1
    assert notifications[0]["is_read"] is False
    assert "no real bank activity occurred" in notifications[0]["body"].lower()
    marked = client.post(f"/api/account/notifications/{notifications[0]['id']}/read", headers=headers)
    assert marked.status_code == 200
    assert marked.json()["is_read"] is True


def test_simulated_connection_and_notification_are_account_scoped(client):
    _, owner_headers = register(client, email="bank-one@example.com", business="Shop One")
    _, other_headers = register(client, email="bank-two@example.com", business="Shop Two")
    connection = client.post("/api/account/bank/connections", headers=owner_headers, json={
        "provider_code": "demo_savings", "account_label": "Savings simulation",
    }).json()
    attempt = client.post(f"/api/account/bank/connections/{connection['id']}/simulate-event", headers=other_headers, json={
        "kind": "expense", "amount": 20, "category": "Stock", "description": "Should not be allowed",
    })
    assert attempt.status_code == 404
    assert client.get("/api/account/notifications", headers=other_headers).json() == []


def test_export_excludes_password_hash_and_access_tokens(client):
    _, headers = register(client, email="export-owner@example.com", business="Export Shop")
    response = client.get("/api/account/export", headers=headers)
    assert response.status_code == 200, response.text
    raw = response.text.lower()
    assert "password_hash" not in raw
    assert "access_token" not in raw
    assert response.headers.get("cache-control") == "no-store"
    assert response.json()["notice"].startswith("Simulated bank events")


def test_account_deletion_removes_user_and_prevents_future_login(client):
    payload, headers = register(client, email="delete-owner@example.com", business="Delete Shop")
    created = client.post("/api/account/transactions", headers=headers, json={
        "kind": "income", "amount": 25, "category": "Sales", "description": "To be deleted",
        "occurred_at": datetime.now().isoformat(),
    })
    assert created.status_code == 201
    deleted = client.delete("/api/account")
    assert deleted.status_code == 401  # deletion is authenticated
    deleted = client.delete("/api/account", headers=headers)
    assert deleted.status_code == 204

    login = client.post("/api/auth/login", json={
        "email": payload["user"]["email"], "password": "a-safe-test-password-194",
    })
    assert login.status_code == 401
    assert client.get("/api/account/dashboard", headers=headers).status_code == 401
