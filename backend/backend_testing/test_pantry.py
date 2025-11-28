# backend_testing/test_pantry.py

from app.models.user import User
from app.models.ingredient import UserIngredient
from app.security import create_access_token


def _auth_headers_for_email(email: str) -> dict:
    """
    Helper that creates a JWT whose `sub` claim is the user's email,
    matching get_current_user() logic in app.security.
    """
    token = create_access_token({"sub": email})
    return {"Authorization": f"Bearer {token}"}


# def test_add_ingredient(client, db):
#     # Create a user directly in the test DB
#     user = User(
#         username="pantryuser",
#         email="pantry@example.com",
#         password_hash="hashedpw",
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     headers = _auth_headers_for_email(user.email)

#     res = client.post(
#         "/api/pantry/",
#         json={"ingredient_name": "Tomato"},
#         headers=headers,
#     )

#     assert res.status_code == 201
#     data = res.json()
#     assert data["ingredient_name"].lower() == "tomato"
#     assert data["user_id"] == user.id


# def test_get_ingredients_after_add(client, db):
#     user = User(
#         username="pantryuser2",
#         email="pantry2@example.com",
#         password_hash="hash",
#     )
#     db.add(user)
#     db.commit()
#     db.refresh(user)

#     headers = _auth_headers_for_email(user.email)

#     # Add an ingredient
#     add_res = client.post(
#         "/api/pantry/",
#         json={"ingredient_name": "Onion"},
#         headers=headers,
#     )
#     assert add_res.status_code == 201

#     res = client.get("/api/pantry/", headers=headers)
#     assert res.status_code == 200
#     body = res.json()
#     assert len(body) == 1
#     assert body[0]["ingredient_name"].lower() == "onion"
#     assert body[0]["user_id"] == user.id


def test_remove_ingredient(client, db):
    user = User(
        username="pantryuser3",
        email="pantry3@example.com",
        password_hash="hash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    headers = _auth_headers_for_email(user.email)

    # Add first
    add_res = client.post(
        "/api/pantry/",
        json={"ingredient_name": "Garlic"},
        headers=headers,
    )
    assert add_res.status_code == 201
    ingredient_id = add_res.json()["id"]

    # Now delete
    del_res = client.delete(f"/api/pantry/{ingredient_id}", headers=headers)
    assert del_res.status_code in (200, 204)

    # Confirm it's actually gone
    list_res = client.get("/api/pantry/", headers=headers)
    assert list_res.status_code == 200
    remaining = list_res.json()
    assert all(item["id"] != ingredient_id for item in remaining)


def test_pantry_requires_auth_for_list(client):
    # No headers -> should be 401/403
    res = client.get("/api/pantry/")
    assert res.status_code in (401, 403)


def test_pantry_requires_auth_for_add(client):
    res = client.post(
        "/api/pantry/",
        json={"ingredient_name": "Carrot"},
    )
    assert res.status_code in (401, 403)
