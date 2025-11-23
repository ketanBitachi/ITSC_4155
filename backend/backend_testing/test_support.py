from sqlalchemy import text


def test_send_support_message_success(client, db):
    payload = {"name": "Archita", "email": "a@b.com", "message": "Hello there"}
    res = client.post("/api/support/send_message", json=payload)
    assert res.status_code == 200
    assert "success" in res.json()["message"].lower()

    # Verify row inserted
    count = db.execute(text("SELECT COUNT(*) FROM support_messages")).scalar()
    assert count == 1


def test_send_support_message_invalid_email(client):
    payload = {"name": "A", "email": "not-an-email", "message": "Hi"}
    res = client.post("/api/support/send_message", json=payload)
    # Pydantic validation should reject with 422
    assert res.status_code == 422


def test_send_support_message_empty_message(client):
    payload = {"name": "A", "email": "a@b.com", "message": "  "}
    res = client.post("/api/support/send_message", json=payload)
    assert res.status_code == 400
    assert "cannot be empty" in res.json()["detail"]