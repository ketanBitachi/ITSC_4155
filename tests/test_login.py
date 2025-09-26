import pytest
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)

# =========================================
# Placeholder tests for User Authentication : Bita's portion
# =========================================

def test_valid_login():
    """Manual test placeholder: valid login should issue token and redirect to dashboard."""
    pass

def test_invalid_login():
    """Manual test placeholder: login with incorrect credentials should fail."""
    pass

def test_token_expiry_bita():
    """Manual test placeholder: after 30-minute token expiration, access should be denied."""
    pass


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

# Placeholder test for token expiry from main branch
@pytest.mark.skip(reason="Test not implemented yet")
def test_token_expiry_main():
    pytest.fail("Token expiry test not implemented yet")
