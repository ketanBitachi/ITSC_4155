from pydantic import BaseModel
from datetime import datetime

class IngredientCreate(BaseModel):
   ingredient_name: str

class IngredientResponse(BaseModel):
    id: int
    ingredient_name: str
    created_at: datetime
    
    class Config:
        orm_mode = True