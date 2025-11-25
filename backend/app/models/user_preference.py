# backend/app/models/user_preference.py

from sqlalchemy import Column, Integer, String, ForeignKey
from sqlalchemy.orm import relationship

from ..database import Base


class UserPreference(Base):
    __tablename__ = "user_preferences"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    preference_type = Column(String(50), nullable=False)

    # Relationship back to User
    user = relationship("User", back_populates="dietary_preferences")
