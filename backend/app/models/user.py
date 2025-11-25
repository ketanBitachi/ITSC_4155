# backend/app/models/user.py

from sqlalchemy import Column, Integer, String, DateTime
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship

from ..database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True)
    username = Column(String(50))
    email = Column(String(100), unique=True)
    password_hash = Column(String(255))
    created_at = Column(DateTime, server_default=func.now())
    last_login = Column(DateTime, nullable=True)

    ingredients = relationship(
        "UserIngredient",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    dietary_preferences = relationship(
        "UserPreference",
        back_populates="user",
        cascade="all, delete-orphan"
    )
