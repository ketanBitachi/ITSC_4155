# tests/test_main.py

from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


def test_read_root():
    """Root endpoint should return a welcome message and docs hint."""
    response = client.get("/")
    assert response.status_code == 200
    data = response.json()
    assert data["message"] == "Welcome to Easy Kitchen API"
    assert "version" in data
    # The docs path should be clearly returned
    assert data["docs"] == "/docs"


def test_health_check():
    """Health check should report healthy and include database key."""
    response = client.get("/health")
    assert response.status_code == 200
    data = response.json()
    assert data["status"] == "healthy"
    assert "database" in data  # should be "connected" when DB wiring is OK


def test_config_endpoint():
    """
    /config is meant for debugging.
    We just assert that it returns all expected keys.
    """
    response = client.get("/config")
    assert response.status_code == 200
    data = response.json()

    for key in ("db_host", "db_name", "db_port", "use_supabase"):
        assert key in data

    # basic type checks so we exercise that data is live
    assert isinstance(data["db_name"], str)
    assert isinstance(data["db_host"], str)
    assert isinstance(data["db_port"], (int, str))
