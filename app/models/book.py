from sqlalchemy import Column, String, Text, Boolean, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class Book(BaseModel):
    __tablename__ = "books"
    
    title = Column(String(255), nullable=False)
    description = Column(Text)
    cover_image_url = Column(String(500))
    author_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    pricing_model = Column(String(20), nullable=False)  # 'free', 'fixed', 'per_chapter'
    fixed_price = Column(Integer)  # in coins
    per_chapter_price = Column(Integer)  # in coins
    genre = Column(String(100))
    tags = Column(Text)  # JSON string for SQLite compatibility
    is_published = Column(Boolean, default=False)
    license_hash = Column(String(255), unique=True, nullable=False)
    
    # Relationships
    author = relationship("User", back_populates="books")
    chapters = relationship("Chapter", back_populates="book", cascade="all, delete-orphan", order_by="Chapter.chapter_number")
    library_entries = relationship("UserLibrary", back_populates="book")
    reading_progress = relationship("ReadingProgress", back_populates="book")
    reviews = relationship("BookReview", back_populates="book", cascade="all, delete-orphan")
    characters = relationship("Character", secondary="character_books", back_populates="books")

class Chapter(BaseModel):
    __tablename__ = "chapters"
    
    book_id = Column(String(36), ForeignKey("books.id"), nullable=False)
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    chapter_number = Column(Integer, nullable=False)
    word_count = Column(Integer)
    is_published = Column(Boolean, default=False)
    audio_url = Column(String(500))
    
    # Relationships
    book = relationship("Book", back_populates="chapters")
    bookmarks = relationship("Bookmark", back_populates="chapter")
    reading_progress = relationship("ReadingProgress", back_populates="chapter")
    comments = relationship("Comment", back_populates="chapter")