from pydantic import BaseModel
from pydantic import ConfigDict
from datetime import datetime

class IngredientCreate(BaseModel):
   ingredient_name: str

class IngredientResponse(BaseModel):
    id: int
    ingredient_name: str
    created_at: datetime
    
    # Pydantic v2 replacement for orm_mode=True
    model_config = ConfigDict(from_attributes=True)