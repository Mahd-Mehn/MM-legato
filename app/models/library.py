from sqlalchemy import Column, Boolean, ForeignKey, DECIMAL, UniqueConstraint, String, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import BaseModel

class UserLibrary(BaseModel):
    __tablename__ = "user_library"
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    is_in_vault = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)  # For soft delete
    
    # Relationships
    user = relationship("User", back_populates="library")
    book = relationship("Book", back_populates="library_entries")
    
    __table_args__ = (UniqueConstraint('user_id', 'book_id', name='_user_book_uc'),)

class Bookmark(BaseModel):
    __tablename__ = "bookmarks"
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    position_percentage = Column(DECIMAL(5, 2))
    
    # Relationships
    user = relationship("User", back_populates="bookmarks")
    chapter = relationship("Chapter", back_populates="bookmarks")
    
    __table_args__ = (UniqueConstraint('user_id', 'chapter_id', name='_user_chapter_bookmark_uc'),)

class ReadingProgress(BaseModel):
    __tablename__ = "reading_progress"
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False)
    book_id = Column(String, ForeignKey("books.id"), nullable=False)
    chapter_id = Column(String, ForeignKey("chapters.id"), nullable=False)
    position_percentage = Column(DECIMAL(5, 2), default=0)
    last_read_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="reading_progress")
    book = relationship("Book", back_populates="reading_progress")
    chapter = relationship("Chapter", back_populates="reading_progress")
    
    __table_args__ = (UniqueConstraint('user_id', 'book_id', name='_user_book_progress_uc'),)