from pydantic import BaseModel, EmailStr, Field, ConfigDict
from datetime import datetime


class SupportMessageCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    # Note: Pydantic EmailStr does not enforce max_length; do length check in route
    email: EmailStr = Field(...)
    message: str = Field(..., min_length=1, max_length=5000)


class SupportMessageResponse(BaseModel):
    id: int
    name: str
    email: EmailStr
    message: str
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)