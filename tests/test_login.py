import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# Placeholder test for login success
@pytest.mark.skip(reason="Test not implemented yet")
def test_login_success():
    response = client.post("/login", json={"email": "student1@uncc.edu", "password": "SecurePass123"})
    assert response.status_code == 200
    assert "access_token" in response.json()

# Placeholder test for login failure
@pytest.mark.skip(reason="Test not implemented yet")
def test_login_failure():
    response = client.post("/login", json={"email": "student1@uncc.edu", "password": "WrongPass!"})
    assert response.status_code == 401
    assert response.json() == {"detail": "Incorrect email or password."}

# Placeholder test for token expiry
@pytest.mark.skip(reason="Test not implemented yet")
def test_token_expiry():
    pytest.fail("Token expiry test not implemented yet")