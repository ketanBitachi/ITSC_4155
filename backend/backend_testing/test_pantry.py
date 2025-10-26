from sqlalchemy import text
from app.security import create_access_token

def auth_header(email="pantry@example.com"):
    token = create_access_token({"sub": email})
    return {"Authorization": f"Bearer {token}"}

def test_add_ingredient(client, db):
    db.execute(text("INSERT INTO users (username, email, password_hash) VALUES ('u','pantry@example.com','x')"))
    db.commit()
    res = client.post("/api/pantry/", json={"ingredient_name": "tomato"}, headers=auth_header())
    assert res.status_code == 201
    assert res.json()["ingredient_name"] == "tomato"

def test_get_ingredients(client, db):
    db.execute(text("INSERT INTO users (username, email, password_hash) VALUES ('u','pantry@example.com','x')"))
    db.commit()
    res = client.get("/api/pantry/", headers=auth_header())
    assert res.status_code == 200

def test_delete_ingredient(client, db):
    db.execute(text("INSERT INTO users (username, email, password_hash) VALUES ('u','pantry@example.com','x')"))
    db.execute(text("INSERT INTO user_ingredients (user_id, ingredient_name) VALUES (1,'onion')"))
    db.commit()
    res = client.delete("/api/pantry/1", headers=auth_header())
    assert res.status_code == 204
