from sqlalchemy import Column, String, Boolean, Integer, DateTime, Text
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid
from app.models.base import Base

class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, nullable=False, index=True)
    username = Column(String(100), unique=True, nullable=False, index=True)
    password_hash = Column(String(255), nullable=False)
    bio = Column(Text, nullable=True)
    profile_picture_url = Column(Text, nullable=True)
    is_writer = Column(Boolean, default=False)
    vault_password_hash = Column(String(255), nullable=True)
    theme_preference = Column(String(20), default='light')
    coin_balance = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    books = relationship("Book", back_populates="author")
    library = relationship("UserLibrary", back_populates="user")
    bookmarks = relationship("Bookmark", back_populates="user")
    reading_preferences = relationship("ReadingPreferences", back_populates="user", uselist=False)
    reading_progress = relationship("ReadingProgress", back_populates="user")