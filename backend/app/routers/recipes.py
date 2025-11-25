# backend/app/routers/recipes.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
import httpx  # pip install httpx

from ..database import get_db
from ..models.user import User
from ..models.user_preference import UserPreference
from .auth import get_current_user

router = APIRouter(
    prefix="/api/recipes",
    tags=["recipes"],
)

THEMEALDB_BASE_URL = "https://www.themealdb.com/api/json/v1/1"

PREFERENCE_TO_CATEGORY = {
    "vegan": "Vegan",
    "vegetarian": "Vegetarian",
    # add more mappings if TheMealDB supports them
}


def pick_category_from_preferences(prefs: set[str]) -> str | None:
    """
    Choose a TheMealDB category based on the user's preferences.
    If multiple prefs are set, we pick the first supported one in a chosen priority order.
    """
    # Priority: vegan > vegetarian
    if "vegan" in prefs and "vegan" in PREFERENCE_TO_CATEGORY:
        return PREFERENCE_TO_CATEGORY["vegan"]
    if "vegetarian" in prefs and "vegetarian" in PREFERENCE_TO_CATEGORY:
        return PREFERENCE_TO_CATEGORY["vegetarian"]

    # No supported dietary preference found
    return None


@router.get("/recommendations")
async def get_recommended_recipes(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    Get recipe recommendations from TheMealDB, filtered by the user's dietary preferences.
    Uses TheMealDB endpoint:
        /filter.php?c=<category>
    where <category> might be Vegan, Vegetarian, etc.
    """
    # 1. Load user preferences from DB
    user_prefs = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id)
        .all()
    )
    pref_values = {p.preference_type for p in user_prefs}  # e.g., {"vegan", "nut_free"}

    # 2. Decide which category to use for TheMealDB
    category = pick_category_from_preferences(pref_values)

    if category is None:
        # No supported category prefs: you can either
        # - return an error
        # - or fall back to some default category
        # Here we'll just fall back to "Seafood" as an example.
        category = "Seafood"

    # 3. Call TheMealDB filter endpoint
    url = f"{THEMEALDB_BASE_URL}/filter.php"
    params = {"c": category}

    async with httpx.AsyncClient() as client:
        resp = await client.get(url, params=params)
        if resp.status_code != 200:
            raise HTTPException(
                status_code=status.HTTP_502_BAD_GATEWAY,
                detail=f"Failed to fetch recipes from TheMealDB (status {resp.status_code})",
            )

        data = resp.json()

    # TheMealDB returns something like { "meals": [ { "idMeal": "...", "strMeal": "...", "strMealThumb": "..." }, ... ] }
    # You can return it as-is or wrap it:
    return {
        "category": category,
        "preferences_used": list(pref_values),
        "meals": data.get("meals", []),
    }
