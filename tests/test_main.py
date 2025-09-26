import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database import get_db  # <--- import get_db

# Fixture for TestClient
@pytest.fixture
def client():
    return TestClient(app)

def test_root_ok(client):
    r = client.get("/")
    assert r.status_code == 200
    assert r.json() == {"message": "Hello, Easy Kitchen!"}

def test_health_ok(client):
    r = client.get("/health")
    assert r.status_code == 200
    assert r.json() == {"status": "ok"}


##### Bita's portion ####
def test_db_test_ok(client):
    class MockSession:
        def execute(self, query):
            class MockResult:
                def fetchone(self):
                    return ["itsc4155"]  # pretend DB name
            return MockResult()

    # Override the get_db dependency
    def mock_get_db():
        yield MockSession()

    client.app.dependency_overrides[get_db] = mock_get_db

    r = client.get("/db-test")
    assert r.status_code == 200
    assert r.json() == {"connected_to": "itsc4155"}

    # Clean up overrides
    client.app.dependency_overrides = {}
