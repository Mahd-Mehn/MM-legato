from sqlalchemy import Column, String, Integer, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class Transaction(BaseModel):
    __tablename__ = "transactions"
    
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    transaction_type = Column(String(20), nullable=False)  # 'topup', 'purchase'
    amount = Column(Integer, nullable=False)  # in coins
    stripe_session_id = Column(String(255))
    book_id = Column(String(36), ForeignKey("books.id"))
    chapter_id = Column(String(36), ForeignKey("chapters.id"))
    status = Column(String(20), default='pending')  # 'pending', 'completed', 'failed'
    
    # Relationships
    user = relationship("User")
    book = relationship("Book")
    chapter = relationship("Chapter")
    earnings = relationship("WriterEarnings", back_populates="transaction")