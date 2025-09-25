### this portion added to mock DB for unit testing purposes
import sys, os
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

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


##### Bita's portion ####
def test_db_test_ok(monkeypatch):
    """Test /db-test endpoint with a mocked DB session to avoid real MySQL connection."""

    # Mock the execute method for a fake DB session
    def mock_execute(query):
        class MockResult:
            def fetchone(self):
                return ["itsc4155"]  # pretend DB name
        return MockResult()

    # Create a mock session object with execute method
    MockSession = type("MockSession", (), {"execute": mock_execute})

    # Patch the get_db dependency in main.py to return an iterator with the mock session
    monkeypatch.setattr("app.main.get_db", lambda: iter([MockSession()]))

    # Perform the test request
    r = client.get("/db-test")
    assert r.status_code == 200
    assert r.json() == {"connected_to": "itsc4155"}
