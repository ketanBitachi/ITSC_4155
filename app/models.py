# app/models.py
from sqlalchemy import Column, Integer, String, Enum, TIMESTAMP, text
from sqlalchemy.orm import declarative_base
import enum
from app.database import Base

# Enum definitions for role and status
class RoleEnum(str, enum.Enum):
    user = "user"
    admin = "admin"

class StatusEnum(str, enum.Enum):
    active = "active"
    inactive = "inactive"

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    username = Column(String(50), unique=True, nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    role = Column(Enum(RoleEnum), server_default="user")
    status = Column(Enum(StatusEnum), server_default="active")
    created_at = Column(TIMESTAMP, server_default=text("CURRENT_TIMESTAMP"))
    last_login = Column(TIMESTAMP, nullable=True)