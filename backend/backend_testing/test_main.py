def test_health_check(client):
    res = client.get("/health")
    assert res.status_code == 200
    assert res.json()["status"] == "healthy"

def test_root(client):
    res = client.get("/")
    assert res.status_code == 200
    assert "Welcome" in res.json()["message"]
