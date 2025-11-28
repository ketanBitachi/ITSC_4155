# backend_testing/test_models.py

from app.models.user import User
from app.models.user_preference import UserPreference
from app.models.ingredient import UserIngredient


def test_user_model_tablename_and_fields():
    """Basic structure of the User model."""
    assert User.__tablename__ == "users"

    # Check field presence (attributes on the class)
    for attr in ("id", "username", "email", "password_hash", "created_at", "last_login"):
        assert hasattr(User, attr)


def test_user_preference_model_tablename_and_fields():
    """Basic structure of UserPreference model."""
    assert UserPreference.__tablename__ == "user_preferences"

    for attr in ("id", "user_id", "preference_type"):
        assert hasattr(UserPreference, attr)


def test_user_ingredient_model_tablename_and_fields():
    """Basic structure of UserIngredient model."""
    assert UserIngredient.__tablename__ == "user_ingredients"

    for attr in ("id", "user_id", "ingredient_name"):
        assert hasattr(UserIngredient, attr)


def test_user_persistence(db):
    """Create a User in the DB and ensure it persists."""
    user = User(
        username="modeluser",
        email="model@example.com",
        password_hash="hashedpassword",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    assert user.id is not None
    assert user.email == "model@example.com"
    # created_at should be set, last_login should default to None
    assert user.created_at is not None
    assert user.last_login is None


def test_user_preference_relationship_to_user(db):
    """UserPreference.user relationship should resolve to the owning user."""
    user = User(
        username="prefuser",
        email="pref@example.com",
        password_hash="hash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    pref = UserPreference(user_id=user.id, preference_type="vegan")
    db.add(pref)
    db.commit()
    db.refresh(pref)

    assert pref.id is not None
    assert pref.user_id == user.id
    assert pref.preference_type == "vegan"
    # Relationship backref
    assert pref.user == user
    # And that the user sees the preference if relationship is configured that way
    if hasattr(user, "preferences"):
        assert pref in user.preferences


def test_user_ingredient_relationship_to_user(db):
    """UserIngredient.user relationship should resolve to the owning user."""
    user = User(
        username="ingredientowner",
        email="owner@example.com",
        password_hash="hash",
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    ingredient = UserIngredient(user_id=user.id, ingredient_name="Tomato")
    db.add(ingredient)
    db.commit()
    db.refresh(ingredient)

    assert ingredient.id is not None
    assert ingredient.user_id == user.id
    assert ingredient.ingredient_name == "Tomato"
    # relationship backref
    assert ingredient.user == user
    if hasattr(user, "ingredients"):
        assert ingredient in user.ingredients
