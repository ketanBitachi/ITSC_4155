from typing import Any, Dict
from pydantic import BaseModel
from datetime import datetime

class FavoriteCreate(BaseModel):
    recipe_json: Dict[str, Any]

class FavoriteResponse(BaseModel):
    id: int
    recipe_id: str
    recipe_json: Dict[str, Any]
    created_at: datetime | None = None

    class Config:
        orm_mode = True