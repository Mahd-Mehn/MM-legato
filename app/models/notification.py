from sqlalchemy import Column, String, Boolean, DateTime, Text, ForeignKey, Enum
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from app.models.base import Base

class NotificationType(enum.Enum):
    LIKE = "like"
    REPLY = "reply"
    PURCHASE = "purchase"
    NEW_CHAPTER = "new_chapter"
    REVIEW = "review"
    REVIEW_LIKE = "review_like"

class Notification(Base):
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False, index=True)
    type = Column(Enum(NotificationType), nullable=False)
    title = Column(String(255), nullable=False)
    message = Column(Text, nullable=False)
    is_read = Column(Boolean, default=False)
    
    # Optional references to related entities
    book_id = Column(String(36), ForeignKey("books.id"), nullable=True)
    chapter_id = Column(String(36), ForeignKey("chapters.id"), nullable=True)
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=True)
    review_id = Column(String(36), ForeignKey("book_reviews.id"), nullable=True)
    
    # Metadata
    data = Column(Text, nullable=True)  # JSON string for additional data
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user = relationship("User", back_populates="notifications")
    book = relationship("Book")
    chapter = relationship("Chapter")
    comment = relationship("Comment")
    review = relationship("BookReview")