from sqlalchemy import Column, Text, Integer, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from sqlalchemy.dialects.postgresql import UUID
from .base import BaseModel

class Comment(BaseModel):
    __tablename__ = "comments"
    
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    parent_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"))
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    is_reported = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    chapter = relationship("Chapter", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side="Comment.id", backref="replies")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")

class CommentLike(BaseModel):
    __tablename__ = "comment_likes"
    
    comment_id = Column(UUID(as_uuid=True), ForeignKey("comments.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    comment = relationship("Comment", back_populates="likes")
    user = relationship("User", back_populates="comment_likes")
    
    __table_args__ = (UniqueConstraint('comment_id', 'user_id', name='_comment_user_like_uc'),)