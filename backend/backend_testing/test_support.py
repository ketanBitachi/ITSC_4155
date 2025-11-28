# backend_testing/test_support.py

from app.models.user import User
from app.security import create_access_token


def _auth_headers_for_user(user_id: int) -> dict:
    token = create_access_token({"sub": str(user_id)})
    return {"Authorization": f"Bearer {token}"}


# def test_support_submit_message(client, db):
#     user = User(
#         username="supportuser",
#         email="support@example.com",
#         password_hash="hash",
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     headers = _auth_headers_for_user(user.id)

#     res = client.post(
#         "/api/support/",
#         json={"subject": "Help", "message": "I need assistance"},
#         headers=headers,
#     )
#     assert res.status_code == 201
#     body = res.json()
#     assert body["subject"] == "Help"
#     assert body["message"] == "I need assistance"
#     assert body["user_id"] == user.id


# def test_support_list_messages(client, db):
#     user = User(
#         username="supportuser2",
#         email="support2@example.com",
#         password_hash="hash",
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     headers = _auth_headers_for_user(user.id)

#     # Create a message
#     client.post(
#         "/api/support/",
#         json={"subject": "Question", "message": "Some question"},
#         headers=headers,
#     )

#     res = client.get("/api/support/", headers=headers)
#     assert res.status_code == 200
#     messages = res.json()
#     assert len(messages) >= 1
#     assert messages[0]["user_id"] == user.id


# def test_support_requires_auth(client):
#     # No Authorization header
#     res_post = client.post(
#         "/api/support/",
#         json={"subject": "NoAuth", "message": "Should fail"},
#     )
#     res_get = client.get("/api/support/")
#     assert res_post.status_code in (401, 403)
#     assert res_get.status_code in (401, 403)
