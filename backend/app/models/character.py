from sqlalchemy import Column, String, Text, Integer, ForeignKey, Table
from sqlalchemy.orm import relationship
from .base import BaseModel

# Association table for many-to-many relationship between characters and books
character_book_association = Table(
    'character_books',
    BaseModel.metadata,
    Column('character_id', String(36), ForeignKey('characters.id'), primary_key=True),
    Column('book_id', String(36), ForeignKey('books.id'), primary_key=True)
)

class Character(BaseModel):
    __tablename__ = "characters"
    
    name = Column(String(255), nullable=False)
    image_url = Column(String(500))
    description = Column(Text)
    title = Column(String(255))  # e.g., "Princess", "Knight", "Wizard"
    gender = Column(String(50))
    age = Column(Integer)
    relationships = Column(Text)  # JSON string for character relationships
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    author = relationship("User", back_populates="characters")
    books = relationship("Book", secondary="character_books", back_populates="characters")