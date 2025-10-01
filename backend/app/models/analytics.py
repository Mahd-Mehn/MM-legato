from sqlalchemy import Column, String, Integer, ForeignKey, Date, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from .base import BaseModel

class BookView(BaseModel):
    __tablename__ = "book_views"
    
    book_id = Column(String(36), ForeignKey("books.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # Nullable for anonymous views
    view_date = Column(Date, server_default=func.current_date())
    
    # Relationships
    book = relationship("Book")
    user = relationship("User")

class ChapterView(BaseModel):
    __tablename__ = "chapter_views"
    
    chapter_id = Column(String(36), ForeignKey("chapters.id"), nullable=False)
    book_id = Column(String(36), ForeignKey("books.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=True)  # Nullable for anonymous views
    view_date = Column(Date, server_default=func.current_date())
    
    # Relationships
    chapter = relationship("Chapter")
    book = relationship("Book")
    user = relationship("User")

class WriterEarnings(BaseModel):
    __tablename__ = "writer_earnings"
    
    writer_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    book_id = Column(String(36), ForeignKey("books.id"), nullable=False)
    chapter_id = Column(String(36), ForeignKey("chapters.id"), nullable=True)  # Nullable for book purchases
    transaction_id = Column(String(36), ForeignKey("transactions.id"), nullable=False)
    amount = Column(Integer, nullable=False)  # in coins
    earning_date = Column(Date, server_default=func.current_date())
    
    # Relationships
    writer = relationship("User")
    book = relationship("Book")
    chapter = relationship("Chapter")
    transaction = relationship("Transaction")