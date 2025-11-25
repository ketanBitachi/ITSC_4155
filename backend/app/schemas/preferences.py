# backend/app/schemas/preferences.py

from typing import List
from pydantic import BaseModel


class PreferencesUpdate(BaseModel):
    preferences: List[str]


class PreferencesResponse(BaseModel):
    preferences: List[str]

    class Config:
        orm_mode = True
