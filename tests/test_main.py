from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

def test_root_ok():
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello, Easy Kitchen!"}

def test_health_ok():
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}
