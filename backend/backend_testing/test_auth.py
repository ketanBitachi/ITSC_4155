# backend_testing/test_auth.py

def test_register_user(client):
    res = client.post("/api/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepass"
    })
    assert res.status_code == 201
    assert res.json()["message"] == "User registered successfully"


def test_register_duplicate_email(client):
    # First registration
    client.post("/api/register", json={
        "username": "a", "email": "dup@example.com", "password": "pw12345"
    })
    # Second registration with same email should fail
    res = client.post("/api/register", json={
        "username": "b", "email": "dup@example.com", "password": "pw12345"
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]


def test_login_user(client):
    # Register user
    client.post("/api/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "securepass"
    })
    # Login with correct credentials
    res = client.post(
        "/api/login",
        data={"username": "login@example.com", "password": "securepass"},
    )
    assert res.status_code == 200
    body = res.json()
    assert "access_token" in body
    assert body["token_type"] == "bearer"
