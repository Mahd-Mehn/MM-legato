from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class Transaction(BaseModel):
    __tablename__ = "transactions"
    
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # 'topup', 'purchase'
    amount = Column(Integer, nullable=False)  # in coins
    stripe_session_id = Column(String(255))
    book_id = Column(UUID(as_uuid=True), ForeignKey("books.id"))
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id"))
    status = Column(String(20), default='pending')  # 'pending', 'completed', 'failed'
    
    # Relationships
    user = relationship("User", back_populates="transactions")
    book = relationship("Book", back_populates="transactions")
    chapter = relationship("Chapter", back_populates="transactions")