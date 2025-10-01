from sqlalchemy import Column, Text, Integer, Boolean, ForeignKey, UniqueConstraint, String, Float, Enum
from sqlalchemy.orm import relationship
from .base import BaseModel
import enum

class Comment(BaseModel):
    __tablename__ = "comments"
    
    chapter_id = Column(String(36), ForeignKey("chapters.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    parent_id = Column(String(36), ForeignKey("comments.id"))
    content = Column(Text, nullable=False)
    like_count = Column(Integer, default=0)
    is_reported = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    chapter = relationship("Chapter", back_populates="comments")
    user = relationship("User", back_populates="comments")
    parent = relationship("Comment", remote_side="Comment.id", backref="replies")
    likes = relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")
    reports = relationship("CommentReport", back_populates="comment", cascade="all, delete-orphan")

class CommentLike(BaseModel):
    __tablename__ = "comment_likes"
    
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    comment = relationship("Comment", back_populates="likes")
    user = relationship("User", back_populates="comment_likes")
    
    __table_args__ = (UniqueConstraint('comment_id', 'user_id', name='_comment_user_like_uc'),)

class BookReview(BaseModel):
    __tablename__ = "book_reviews"
    
    book_id = Column(String(36), ForeignKey("books.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    rating = Column(Integer, nullable=False)  # 1-5 stars
    title = Column(String(255), nullable=False)
    content = Column(Text, nullable=False)
    is_spoiler = Column(Boolean, default=False)
    like_count = Column(Integer, default=0)
    is_reported = Column(Boolean, default=False)
    is_deleted = Column(Boolean, default=False)
    
    # Relationships
    book = relationship("Book", back_populates="reviews")
    user = relationship("User", back_populates="book_reviews")
    likes = relationship("ReviewLike", back_populates="review", cascade="all, delete-orphan")
    
    __table_args__ = (UniqueConstraint('book_id', 'user_id', name='_book_user_review_uc'),)

class ReviewLike(BaseModel):
    __tablename__ = "review_likes"
    
    review_id = Column(String(36), ForeignKey("book_reviews.id"), nullable=False)
    user_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    
    # Relationships
    review = relationship("BookReview", back_populates="likes")
    user = relationship("User", back_populates="review_likes")
    
    __table_args__ = (UniqueConstraint('review_id', 'user_id', name='_review_user_like_uc'),)

class ReportReason(enum.Enum):
    SPAM = "spam"
    HARASSMENT = "harassment"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    HATE_SPEECH = "hate_speech"
    VIOLENCE = "violence"
    COPYRIGHT = "copyright"
    OTHER = "other"

class ReportStatus(enum.Enum):
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class CommentReport(BaseModel):
    __tablename__ = "comment_reports"
    
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=False)
    reporter_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text)
    status = Column(Enum(ReportStatus), default=ReportStatus.PENDING)
    reviewed_by = Column(String(36), ForeignKey("users.id"))
    reviewed_at = Column(String(50))  # ISO datetime string
    resolution_notes = Column(Text)
    
    # Relationships
    comment = relationship("Comment", back_populates="reports")
    reporter = relationship("User", foreign_keys=[reporter_id], back_populates="filed_reports")
    reviewer = relationship("User", foreign_keys=[reviewed_by], back_populates="reviewed_reports")
    
    __table_args__ = (UniqueConstraint('comment_id', 'reporter_id', name='_comment_reporter_uc'),)

class ModerationAction(enum.Enum):
    DELETE_COMMENT = "delete_comment"
    RESTORE_COMMENT = "restore_comment"
    DISMISS_REPORT = "dismiss_report"
    WARN_USER = "warn_user"
    SUSPEND_USER = "suspend_user"

class ModerationLog(BaseModel):
    __tablename__ = "moderation_logs"
    
    moderator_id = Column(String(36), ForeignKey("users.id"), nullable=False)
    action = Column(Enum(ModerationAction), nullable=False)
    target_type = Column(String(50), nullable=False)  # 'comment', 'user', 'report'
    target_id = Column(String(36), nullable=False)
    reason = Column(Text)
    details = Column(Text)  # JSON string for additional details
    
    # Relationships
    moderator = relationship("User", back_populates="moderation_actions")