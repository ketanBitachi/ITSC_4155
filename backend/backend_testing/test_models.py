from app.models.user import User
from app.models.ingredient import UserIngredient

def test_user_model_fields():
    u = User(username="u", email="e@e.com", password_hash="hash")
    assert u.username == "u"
    assert hasattr(u, "created_at")

def test_useringredient_model_fields():
    ing = UserIngredient(user_id=1, ingredient_name="apple")
    assert ing.ingredient_name == "apple"
    assert hasattr(ing, "created_at")
