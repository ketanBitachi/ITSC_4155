from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from typing import List
from ..database import get_db
from ..models.user import User
from ..models.ingredient import UserIngredient
from ..schemas.pantry import IngredientCreate, IngredientResponse
from ..security import get_current_user

router = APIRouter(prefix="/api/pantry", tags=["pantry"])

@router.post("/", response_model=IngredientResponse, status_code=status.HTTP_201_CREATED)
def add_ingredient(
    ingredient: IngredientCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add an ingredient to user's pantry"""
    try:
        # Check if ingredient already exists for this user
        existing = db.query(UserIngredient).filter(
            UserIngredient.user_id == current_user.id,
            UserIngredient.ingredient_name == ingredient.ingredient_name
        ).first()

        if existing:
            return IngredientResponse.from_orm(existing)

        # Create new ingredient
        new_ingredient = UserIngredient(
            user_id=current_user.id,
            ingredient_name=ingredient.ingredient_name
        )

        db.add(new_ingredient)
        db.commit()
        db.refresh(new_ingredient)

        return IngredientResponse.from_orm(new_ingredient)
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error adding ingredient: {str(e)}"
        )

@router.get("/", response_model=List[IngredientResponse])
def get_ingredients(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all ingredients from user's pantry"""
    try:
        ingredients = db.query(UserIngredient).filter(
            UserIngredient.user_id == current_user.id
        ).all()

        return [IngredientResponse.from_orm(i) for i in ingredients]
    except SQLAlchemyError as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error getting pantry: {str(e)}"
        )

@router.delete("/{ingredient_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_ingredient(
    ingredient_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an ingredient from user's pantry"""
    try:
        ingredient = db.query(UserIngredient).filter(
            UserIngredient.id == ingredient_id,
            UserIngredient.user_id == current_user.id
        ).first()

        if not ingredient:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Ingredient not found"
            )

        db.delete(ingredient)
        db.commit()

        return None
    except SQLAlchemyError as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Database error deleting ingredient: {str(e)}"
        )
