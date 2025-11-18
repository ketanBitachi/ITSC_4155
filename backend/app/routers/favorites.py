from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models.user import User
from ..models.favorite import FavoriteRecipe
from ..schemas.favorites import FavoriteCreate, FavoriteResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/favorites", tags=["favorites"])

@router.post("/{recipe_id}", response_model=FavoriteResponse, status_code=status.HTTP_201_CREATED)
def add_favorite(
    recipe_id: str,
    payload: FavoriteCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    existing = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.user_id == current_user.id,
        FavoriteRecipe.recipe_id == recipe_id
    ).first()
    if existing:
        return FavoriteResponse.from_orm(existing)

    favorite = FavoriteRecipe(
        user_id=current_user.id,
        recipe_id=recipe_id,
        recipe_json=payload.recipe_json
    )
    db.add(favorite)
    db.commit()
    db.refresh(favorite)
    return FavoriteResponse.from_orm(favorite)

@router.delete("/{recipe_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_favorite(
    recipe_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorite = db.query(FavoriteRecipe).filter(
        FavoriteRecipe.user_id == current_user.id,
        FavoriteRecipe.recipe_id == recipe_id
    ).first()
    if not favorite:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Favorite not found")
    db.delete(favorite)
    db.commit()
    return None

@router.get("/", response_model=List[FavoriteResponse])
def list_favorites(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    favorites = db.query(FavoriteRecipe).filter(FavoriteRecipe.user_id == current_user.id).all()
    return [FavoriteResponse.from_orm(f) for f in favorites]