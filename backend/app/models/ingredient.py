from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, UniqueConstraint
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from ..database import Base

class UserIngredient(Base):
    __tablename__ = "user_ingredients"
    
    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    ingredient_name = Column(String(120), nullable=False)
    created_at = Column(DateTime, server_default=func.now())
    
    # Relationship to user
    user = relationship("User", back_populates="ingredients")
    
    # Ensure no duplicate ingredients per user
    __table_args__ = (
        UniqueConstraint('user_id', 'ingredient_name', name='unique_user_ingredient'),
    )