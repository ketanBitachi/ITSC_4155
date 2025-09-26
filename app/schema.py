# app/schemas.py
from pydantic import BaseModel, EmailStr
from enum import Enum

class RoleEnum(str, Enum):
    user = "user"
    admin = "admin"

class StatusEnum(str, Enum):
    active = "active"
    inactive = "inactive"

class UserCreate(BaseModel):
    username: str
    email: EmailStr
    password: str
    role: RoleEnum = RoleEnum.user
    status: StatusEnum = StatusEnum.active

class UserResponse(BaseModel):
    id: int
    username: str
    email: EmailStr
    role: RoleEnum
    status: StatusEnum

class LoginRequest(BaseModel):
    email: EmailStr
    password: str


    class Config:
        orm_mode = True

    
