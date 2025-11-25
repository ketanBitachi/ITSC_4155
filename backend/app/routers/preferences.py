# backend/app/routers/preferences.py

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from ..database import get_db
from ..models.user import User
from ..models.user_preference import UserPreference
from ..schemas.preferences import PreferencesUpdate, PreferencesResponse
from .auth import get_current_user  # <-- uses your existing auth dependency

router = APIRouter(
    prefix="/api/preferences",
    tags=["preferences"],
)


@router.get("/me", response_model=PreferencesResponse)
def get_my_preferences(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    GET /api/preferences/me
    Return dietary preferences for the currently authenticated user.
    """
    prefs = (
        db.query(UserPreference)
        .filter(UserPreference.user_id == current_user.id)
        .all()
    )

    preference_values = [p.preference_type for p in prefs]
    return PreferencesResponse(preferences=preference_values)


@router.post("/", response_model=PreferencesResponse)
def save_my_preferences(
    prefs: PreferencesUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """
    POST /api/preferences
    Body: { "preferences": ["vegetarian", "vegan", ...] }

    Replaces all existing preferences for the current user with the provided list.
    """
    # Ensure user exists (current_user is already a User from get_current_user)
    if current_user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Not authenticated",
        )

    # Clear existing preferences for this user
    db.query(UserPreference).filter(UserPreference.user_id == current_user.id).delete()

    # Insert new preferences
    for pref in prefs.preferences:
        pref_value = pref.strip()
        if not pref_value:
            continue
        db_pref = UserPreference(
            user_id=current_user.id,
            preference_type=pref_value,
        )
        db.add(db_pref)

    db.commit()

    return PreferencesResponse(preferences=prefs.preferences)
