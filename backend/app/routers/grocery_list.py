from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.database import get_db
from app.models import UserIngredient, GroceryList, GroceryListItem, User
from app.routers.auth import get_current_user

router = APIRouter(prefix="/api/grocery-list", tags=["Grocery List"])


# --- USER STORY 5.2: Generate Grocery List ---
@router.post("/generate")
def generate_grocery_list(
    recipe_ids: list[int],
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Generate grocery list for selected recipes.
    Lists only missing ingredients (no quantities).
    """
    # Temporary test data until RecipeIngredient model exists
    recipe_ingredients = {"tomato", "onion", "garlic", "pasta"}


    # Step 2: Get user’s pantry ingredients
    pantry_items = db.query(UserIngredient).filter(
        UserIngredient.user_id == current_user.id
    ).all()
    pantry_names = {p.ingredient_name.lower() for p in pantry_items}


    # Step 3: Determine missing ingredients
    missing_ingredients = sorted(list(recipe_ingredients - pantry_names))

    return {"grocery_list": missing_ingredients}


# --- USER STORY 5.3: Save Grocery List ---
@router.post("/save")
def save_grocery_list(
    data: dict,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Save generated grocery list to database.
    """
    items = data.get("grocery_list", [])
    if not items:
        raise HTTPException(status_code=400, detail="No items to save")

    new_list = GroceryList(
        user_id=current_user.id,
        name=f"Grocery List {datetime.now():%Y-%m-%d %H:%M}",
        created_at=datetime.now()
    )
    db.add(new_list)
    db.commit()
    db.refresh(new_list)

    for name in items:
        entry = GroceryListItem(
            grocery_list_id=new_list.id,
            ingredient_name=name
        )
        db.add(entry)
    db.commit()

    return {"message": "Grocery list saved", "list_id": new_list.id}
