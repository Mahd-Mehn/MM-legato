from sqlalchemy import Column, String, Text, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class Character(BaseModel):
    __tablename__ = "characters"
    
    name = Column(String(255), nullable=False)
    image_url = Column(String(500))
    description = Column(Text)
    title = Column(String(255))
    gender = Column(String(50))
    age = Column(Integer)
    relationships = Column(Text)  # JSON string or text description
    creator_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    creator = relationship("User", back_populates="characters")
    book_characters = relationship("BookCharacter", back_populates="character", cascade="all, delete-orphan")

class BookCharacter(BaseModel):
    __tablename__ = "book_characters"
    
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"), nullable=False)
    character_id = Column(UUID(as_uuid=True), ForeignKey("characters.id"), nullable=False)
    
    # Relationships
    book = relationship("Book", back_populates="book_characters")
    character = relationship("Character", back_populates="book_characters")