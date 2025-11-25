from pydantic import BaseModel
from datetime import datetime

class IngredientCreate(BaseModel):
   ingredient_name: str

class IngredientResponse(BaseModel):
    id: int
    ingredient_name: str
    created_at: datetime

    # Pydantic v1 configuration to support from_orm
    class Config:
        orm_mode = True
