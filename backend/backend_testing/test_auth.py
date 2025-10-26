def test_register_user(client):
    res = client.post("/api/register", json={
        "username": "testuser",
        "email": "test@example.com",
        "password": "securepass"
    })
    assert res.status_code == 201
    assert res.json()["message"] == "User registered successfully"

def test_register_duplicate_email(client):
    client.post("/api/register", json={
        "username": "a", "email": "dup@example.com", "password": "pw12345"
    })
    res = client.post("/api/register", json={
        "username": "b", "email": "dup@example.com", "password": "pw12345"
    })
    assert res.status_code == 400
    assert "already registered" in res.json()["detail"]

def test_login_user(client):
    client.post("/api/register", json={
        "username": "loginuser",
        "email": "login@example.com",
        "password": "securepass"
    })
    res = client.post("/api/login", data={"username": "login@example.com", "password": "securepass"})
    assert res.status_code == 200
    assert "access_token" in res.json()
