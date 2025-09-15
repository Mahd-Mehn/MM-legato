"""
Community service models for comments, ratings, and social features
"""
from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text, ForeignKey, Integer, JSON, DECIMAL, Index
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Optional, Dict, Any

Base = declarative_base()

class CommentStatus(enum.Enum):
    """Comment moderation status"""
    PENDING = "pending"
    APPROVED = "approved"
    REJECTED = "rejected"
    FLAGGED = "flagged"
    HIDDEN = "hidden"

class ReportReason(enum.Enum):
    """Report reason categories"""
    SPAM = "spam"
    HARASSMENT = "harassment"
    INAPPROPRIATE_CONTENT = "inappropriate_content"
    SPOILERS = "spoilers"
    OFF_TOPIC = "off_topic"
    HATE_SPEECH = "hate_speech"
    OTHER = "other"

class ReportStatus(enum.Enum):
    """Report processing status"""
    PENDING = "pending"
    UNDER_REVIEW = "under_review"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"

class ModerationAction(enum.Enum):
    """Moderation actions"""
    APPROVE = "approve"
    REJECT = "reject"
    HIDE = "hide"
    DELETE = "delete"
    WARN_USER = "warn_user"
    SUSPEND_USER = "suspend_user"

class Comment(Base):
    """Chapter-level comments with threading support"""
    __tablename__ = "comments"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Content references
    story_id = Column(String(36), nullable=False, index=True)
    chapter_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)  # References user from auth service
    
    # Threading support
    parent_comment_id = Column(String(36), ForeignKey("comments.id"), nullable=True, index=True)
    thread_root_id = Column(String(36), ForeignKey("comments.id"), nullable=True, index=True)
    reply_depth = Column(Integer, default=0)  # 0 for root comments, 1+ for replies
    
    # Comment content
    content = Column(Text, nullable=False)
    content_html = Column(Text)  # Processed HTML version with mentions, etc.
    
    # Moderation and status
    status = Column(Enum(CommentStatus), nullable=False, default=CommentStatus.PENDING, index=True)
    is_spoiler = Column(Boolean, default=False)
    is_pinned = Column(Boolean, default=False)  # Author can pin comments
    
    # Engagement metrics
    like_count = Column(Integer, default=0)
    dislike_count = Column(Integer, default=0)
    reply_count = Column(Integer, default=0)
    report_count = Column(Integer, default=0)
    
    # Moderation metadata
    moderated_by = Column(String(36), nullable=True)  # Moderator user ID
    moderated_at = Column(DateTime(timezone=True), nullable=True)
    moderation_reason = Column(String(500), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    parent_comment = relationship("Comment", remote_side=[id], foreign_keys=[parent_comment_id], backref="replies")
    thread_root = relationship("Comment", remote_side=[id], foreign_keys=[thread_root_id])
    reactions = relationship("CommentReaction", back_populates="comment", cascade="all, delete-orphan")
    reports = relationship("CommentReport", back_populates="comment", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<Comment(id={self.id}, chapter_id={self.chapter_id}, user_id={self.user_id})>"

# Add indexes for performance
Index('idx_comments_chapter_status', Comment.chapter_id, Comment.status)
Index('idx_comments_user_created', Comment.user_id, Comment.created_at)
Index('idx_comments_thread_depth', Comment.thread_root_id, Comment.reply_depth)

class CommentReaction(Base):
    """User reactions to comments (like/dislike)"""
    __tablename__ = "comment_reactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Reaction type
    is_like = Column(Boolean, nullable=False)  # True for like, False for dislike
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    comment = relationship("Comment", back_populates="reactions")
    
    # Unique constraint to prevent duplicate reactions
    __table_args__ = (
        Index('idx_unique_comment_user_reaction', 'comment_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<CommentReaction(comment_id={self.comment_id}, user_id={self.user_id}, like={self.is_like})>"

class StoryRating(Base):
    """Story ratings and reviews"""
    __tablename__ = "story_ratings"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    story_id = Column(String(36), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Rating (1-5 stars)
    rating = Column(Integer, nullable=False)  # 1-5 scale
    
    # Optional review text
    review_title = Column(String(200), nullable=True)
    review_content = Column(Text, nullable=True)
    
    # Review helpfulness
    helpful_count = Column(Integer, default=0)
    not_helpful_count = Column(Integer, default=0)
    
    # Moderation
    status = Column(Enum(CommentStatus), nullable=False, default=CommentStatus.APPROVED, index=True)
    is_verified_reader = Column(Boolean, default=False)  # Has read significant portion
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    helpfulness_votes = relationship("RatingHelpfulness", back_populates="rating", cascade="all, delete-orphan")
    reports = relationship("RatingReport", back_populates="rating", cascade="all, delete-orphan")
    
    # Unique constraint to prevent duplicate ratings
    __table_args__ = (
        Index('idx_unique_story_user_rating', 'story_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<StoryRating(story_id={self.story_id}, user_id={self.user_id}, rating={self.rating})>"

class RatingHelpfulness(Base):
    """User votes on rating helpfulness"""
    __tablename__ = "rating_helpfulness"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rating_id = Column(String(36), ForeignKey("story_ratings.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    is_helpful = Column(Boolean, nullable=False)  # True for helpful, False for not helpful
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    rating = relationship("StoryRating", back_populates="helpfulness_votes")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_unique_rating_user_helpfulness', 'rating_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<RatingHelpfulness(rating_id={self.rating_id}, user_id={self.user_id}, helpful={self.is_helpful})>"

class CommentReport(Base):
    """Reports for inappropriate comments"""
    __tablename__ = "comment_reports"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    comment_id = Column(String(36), ForeignKey("comments.id"), nullable=False, index=True)
    reporter_user_id = Column(String(36), nullable=False, index=True)
    
    # Report details
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)
    
    # Report status
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.PENDING, index=True)
    
    # Moderation
    reviewed_by = Column(String(36), nullable=True)  # Moderator user ID
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    comment = relationship("Comment", back_populates="reports")
    
    def __repr__(self):
        return f"<CommentReport(comment_id={self.comment_id}, reason={self.reason.value}, status={self.status.value})>"

class RatingReport(Base):
    """Reports for inappropriate ratings/reviews"""
    __tablename__ = "rating_reports"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    rating_id = Column(String(36), ForeignKey("story_ratings.id"), nullable=False, index=True)
    reporter_user_id = Column(String(36), nullable=False, index=True)
    
    # Report details
    reason = Column(Enum(ReportReason), nullable=False)
    description = Column(Text, nullable=True)
    
    # Report status
    status = Column(Enum(ReportStatus), nullable=False, default=ReportStatus.PENDING, index=True)
    
    # Moderation
    reviewed_by = Column(String(36), nullable=True)
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    rating = relationship("StoryRating", back_populates="reports")
    
    def __repr__(self):
        return f"<RatingReport(rating_id={self.rating_id}, reason={self.reason.value}, status={self.status.value})>"

class ModerationLog(Base):
    """Log of moderation actions"""
    __tablename__ = "moderation_logs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Target of moderation
    target_type = Column(String(50), nullable=False)  # 'comment', 'rating', 'user'
    target_id = Column(String(36), nullable=False, index=True)
    
    # Moderation details
    moderator_id = Column(String(36), nullable=False, index=True)
    action = Column(Enum(ModerationAction), nullable=False)
    reason = Column(String(500), nullable=True)
    notes = Column(Text, nullable=True)
    
    # Context
    related_report_id = Column(String(36), nullable=True)  # If action was due to a report
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<ModerationLog(target_type={self.target_type}, action={self.action.value}, moderator_id={self.moderator_id})>"

class UserModerationStatus(Base):
    """Track user moderation status and warnings"""
    __tablename__ = "user_moderation_status"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, unique=True, index=True)
    
    # Moderation metrics
    warning_count = Column(Integer, default=0)
    comment_violations = Column(Integer, default=0)
    rating_violations = Column(Integer, default=0)
    
    # Status flags
    is_suspended = Column(Boolean, default=False)
    suspension_expires_at = Column(DateTime(timezone=True), nullable=True)
    is_banned = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserModerationStatus(user_id={self.user_id}, warnings={self.warning_count})>"

# Social Engagement Models

class UserFollow(Base):
    """User following relationships"""
    __tablename__ = "user_follows"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    follower_id = Column(String(36), nullable=False, index=True)  # User who follows
    following_id = Column(String(36), nullable=False, index=True)  # User being followed
    
    # Follow metadata
    is_active = Column(Boolean, default=True)  # Can be used for soft unfollow
    notification_enabled = Column(Boolean, default=True)  # Receive notifications from this user
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Unique constraint to prevent duplicate follows
    __table_args__ = (
        Index('idx_unique_user_follow', 'follower_id', 'following_id', unique=True),
    )
    
    def __repr__(self):
        return f"<UserFollow(follower_id={self.follower_id}, following_id={self.following_id})>"

class NotificationType(enum.Enum):
    """Notification types"""
    NEW_CHAPTER = "new_chapter"
    NEW_STORY = "new_story"
    COMMENT_REPLY = "comment_reply"
    COMMENT_LIKE = "comment_like"
    STORY_RATING = "story_rating"
    NEW_FOLLOWER = "new_follower"
    ACHIEVEMENT_EARNED = "achievement_earned"
    CONTEST_UPDATE = "contest_update"
    SYSTEM_ANNOUNCEMENT = "system_announcement"

class Notification(Base):
    """User notifications"""
    __tablename__ = "notifications"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)  # Recipient
    
    # Notification content
    type = Column(Enum(NotificationType), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    message = Column(Text, nullable=False)
    
    # Related entities
    related_user_id = Column(String(36), nullable=True)  # User who triggered notification
    related_story_id = Column(String(36), nullable=True)
    related_chapter_id = Column(String(36), nullable=True)
    related_comment_id = Column(String(36), nullable=True)
    
    # Notification metadata
    data = Column(JSON, nullable=True)  # Additional structured data
    action_url = Column(String(500), nullable=True)  # Deep link URL
    
    # Status
    is_read = Column(Boolean, default=False, index=True)
    is_dismissed = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    def __repr__(self):
        return f"<Notification(user_id={self.user_id}, type={self.type.value}, read={self.is_read})>"

class AchievementType(enum.Enum):
    """Achievement categories"""
    WRITING = "writing"
    READING = "reading"
    COMMUNITY = "community"
    ENGAGEMENT = "engagement"
    MILESTONE = "milestone"
    SPECIAL = "special"

class Achievement(Base):
    """Achievement definitions"""
    __tablename__ = "achievements"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Achievement details
    name = Column(String(100), nullable=False, unique=True)
    description = Column(Text, nullable=False)
    type = Column(Enum(AchievementType), nullable=False, index=True)
    
    # Achievement criteria
    criteria = Column(JSON, nullable=False)  # Structured criteria for earning
    points = Column(Integer, default=0)  # Points awarded
    
    # Display
    icon_url = Column(String(500), nullable=True)
    badge_color = Column(String(7), nullable=True)  # Hex color
    
    # Metadata
    is_active = Column(Boolean, default=True)
    is_hidden = Column(Boolean, default=False)  # Hidden until earned
    rarity = Column(String(20), default="common")  # common, rare, epic, legendary
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    user_achievements = relationship("UserAchievement", back_populates="achievement")
    
    def __repr__(self):
        return f"<Achievement(name={self.name}, type={self.type.value}, points={self.points})>"

class UserAchievement(Base):
    """User earned achievements"""
    __tablename__ = "user_achievements"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    achievement_id = Column(String(36), ForeignKey("achievements.id"), nullable=False, index=True)
    
    # Achievement progress
    progress = Column(JSON, nullable=True)  # Progress tracking data
    earned_at = Column(DateTime(timezone=True), nullable=True)
    
    # Display preferences
    is_displayed = Column(Boolean, default=True)  # Show on profile
    is_featured = Column(Boolean, default=False)  # Featured achievement
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    achievement = relationship("Achievement", back_populates="user_achievements")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_unique_user_achievement', 'user_id', 'achievement_id', unique=True),
    )
    
    def __repr__(self):
        return f"<UserAchievement(user_id={self.user_id}, achievement_id={self.achievement_id})>"

class UserStats(Base):
    """User engagement statistics"""
    __tablename__ = "user_stats"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, unique=True, index=True)
    
    # Writing stats
    stories_published = Column(Integer, default=0)
    chapters_published = Column(Integer, default=0)
    total_words_written = Column(Integer, default=0)
    
    # Reading stats
    stories_read = Column(Integer, default=0)
    chapters_read = Column(Integer, default=0)
    total_reading_time = Column(Integer, default=0)  # in minutes
    
    # Community stats
    comments_posted = Column(Integer, default=0)
    ratings_given = Column(Integer, default=0)
    likes_received = Column(Integer, default=0)
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    
    # Engagement stats
    total_points = Column(Integer, default=0)
    achievements_earned = Column(Integer, default=0)
    contests_participated = Column(Integer, default=0)
    contests_won = Column(Integer, default=0)
    
    # Streaks
    daily_login_streak = Column(Integer, default=0)
    writing_streak = Column(Integer, default=0)
    reading_streak = Column(Integer, default=0)
    
    # Last activity
    last_login_at = Column(DateTime(timezone=True), nullable=True)
    last_story_published_at = Column(DateTime(timezone=True), nullable=True)
    last_chapter_read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserStats(user_id={self.user_id}, total_points={self.total_points})>"

class ContestStatus(enum.Enum):
    """Contest status"""
    DRAFT = "draft"
    UPCOMING = "upcoming"
    ACTIVE = "active"
    JUDGING = "judging"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class Contest(Base):
    """Writing contests and challenges"""
    __tablename__ = "contests"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Contest details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    rules = Column(Text, nullable=False)
    
    # Contest parameters
    theme = Column(String(100), nullable=True)
    genre_restrictions = Column(JSON, nullable=True)  # List of allowed genres
    word_limit_min = Column(Integer, nullable=True)
    word_limit_max = Column(Integer, nullable=True)
    
    # Timing
    registration_starts_at = Column(DateTime(timezone=True), nullable=False)
    registration_ends_at = Column(DateTime(timezone=True), nullable=False)
    contest_starts_at = Column(DateTime(timezone=True), nullable=False)
    contest_ends_at = Column(DateTime(timezone=True), nullable=False)
    judging_ends_at = Column(DateTime(timezone=True), nullable=True)
    
    # Status and metadata
    status = Column(Enum(ContestStatus), nullable=False, default=ContestStatus.DRAFT, index=True)
    max_participants = Column(Integer, nullable=True)
    entry_fee = Column(DECIMAL(10, 2), default=0)  # In platform currency
    
    # Prizes
    prize_pool = Column(DECIMAL(10, 2), default=0)
    prize_distribution = Column(JSON, nullable=True)  # Prize breakdown
    
    # Organization
    organizer_id = Column(String(36), nullable=False, index=True)
    judges = Column(JSON, nullable=True)  # List of judge user IDs
    
    # Display
    banner_url = Column(String(500), nullable=True)
    is_featured = Column(Boolean, default=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    participants = relationship("ContestParticipant", back_populates="contest")
    submissions = relationship("ContestSubmission", back_populates="contest")
    
    def __repr__(self):
        return f"<Contest(title={self.title}, status={self.status.value})>"

class ContestParticipant(Base):
    """Contest participants"""
    __tablename__ = "contest_participants"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contest_id = Column(String(36), ForeignKey("contests.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Registration
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    is_active = Column(Boolean, default=True)
    
    # Payment (if entry fee required)
    payment_status = Column(String(20), default="pending")  # pending, paid, refunded
    payment_transaction_id = Column(String(36), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    contest = relationship("Contest", back_populates="participants")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_unique_contest_participant', 'contest_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<ContestParticipant(contest_id={self.contest_id}, user_id={self.user_id})>"

class ContestSubmission(Base):
    """Contest submissions"""
    __tablename__ = "contest_submissions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    contest_id = Column(String(36), ForeignKey("contests.id"), nullable=False, index=True)
    participant_id = Column(String(36), ForeignKey("contest_participants.id"), nullable=False, index=True)
    
    # Submission content
    story_id = Column(String(36), nullable=False, index=True)  # Reference to submitted story
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    
    # Submission metadata
    word_count = Column(Integer, nullable=False)
    submitted_at = Column(DateTime(timezone=True), server_default=func.now())
    is_final = Column(Boolean, default=False)  # Can be updated until marked final
    
    # Judging
    judge_scores = Column(JSON, nullable=True)  # Scores from each judge
    total_score = Column(DECIMAL(5, 2), nullable=True)
    rank = Column(Integer, nullable=True)
    
    # Public voting (if enabled)
    public_votes = Column(Integer, default=0)
    public_score = Column(DECIMAL(3, 2), nullable=True)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    contest = relationship("Contest", back_populates="submissions")
    
    def __repr__(self):
        return f"<ContestSubmission(contest_id={self.contest_id}, story_id={self.story_id})>"

class SocialShare(Base):
    """Social sharing tracking"""
    __tablename__ = "social_shares"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    user_id = Column(String(36), nullable=False, index=True)
    
    # Content being shared
    content_type = Column(String(50), nullable=False)  # story, chapter, achievement, contest
    content_id = Column(String(36), nullable=False, index=True)
    
    # Share details
    platform = Column(String(50), nullable=False)  # twitter, facebook, whatsapp, etc.
    share_url = Column(String(1000), nullable=False)
    share_text = Column(Text, nullable=True)
    
    # Tracking
    clicks = Column(Integer, default=0)
    conversions = Column(Integer, default=0)  # Users who signed up from this share
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    def __repr__(self):
        return f"<SocialShare(user_id={self.user_id}, platform={self.platform}, content_type={self.content_type})>"

class Leaderboard(Base):
    """Leaderboard entries"""
    __tablename__ = "leaderboards"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Leaderboard type
    category = Column(String(50), nullable=False, index=True)  # writers, readers, community, monthly, etc.
    period = Column(String(20), nullable=False, index=True)  # daily, weekly, monthly, all_time
    
    # User and ranking
    user_id = Column(String(36), nullable=False, index=True)
    rank = Column(Integer, nullable=False, index=True)
    score = Column(DECIMAL(10, 2), nullable=False)
    
    # Metadata
    data = Column(JSON, nullable=True)  # Additional ranking data
    
    # Period boundaries
    period_start = Column(DateTime(timezone=True), nullable=False)
    period_end = Column(DateTime(timezone=True), nullable=False)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Unique constraint for user per category/period
    __table_args__ = (
        Index('idx_unique_leaderboard_entry', 'category', 'period', 'user_id', 'period_start', unique=True),
    )
    
    def __repr__(self):
        return f"<Leaderboard(category={self.category}, user_id={self.user_id}, rank={self.rank})>"

# Fan Club and Exclusive Content Models

class FanClubTier(enum.Enum):
    """Fan club membership tiers"""
    BRONZE = "bronze"
    SILVER = "silver"
    GOLD = "gold"
    PLATINUM = "platinum"
    DIAMOND = "diamond"

class FanClub(Base):
    """Writer fan clubs"""
    __tablename__ = "fan_clubs"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    writer_id = Column(String(36), nullable=False, unique=True, index=True)
    
    # Club details
    name = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    banner_url = Column(String(500), nullable=True)
    
    # Membership tiers and pricing
    tiers = Column(JSON, nullable=False)  # Tier configurations with pricing and benefits
    
    # Club settings
    is_active = Column(Boolean, default=True)
    auto_accept_members = Column(Boolean, default=True)
    welcome_message = Column(Text, nullable=True)
    
    # Statistics
    total_members = Column(Integer, default=0)
    total_revenue = Column(DECIMAL(10, 2), default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    memberships = relationship("FanClubMembership", back_populates="fan_club", cascade="all, delete-orphan")
    exclusive_content = relationship("ExclusiveContent", back_populates="fan_club", cascade="all, delete-orphan")
    events = relationship("ExclusiveEvent", back_populates="fan_club", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<FanClub(writer_id={self.writer_id}, name={self.name})>"

class FanClubMembership(Base):
    """Fan club memberships"""
    __tablename__ = "fan_club_memberships"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fan_club_id = Column(String(36), ForeignKey("fan_clubs.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Membership details
    tier = Column(Enum(FanClubTier), nullable=False, default=FanClubTier.BRONZE)
    status = Column(String(20), default="active")  # active, paused, cancelled, expired
    
    # Subscription details
    monthly_fee = Column(DECIMAL(10, 2), nullable=False)
    next_billing_date = Column(DateTime(timezone=True), nullable=False)
    auto_renew = Column(Boolean, default=True)
    
    # Payment tracking
    total_paid = Column(DECIMAL(10, 2), default=0)
    last_payment_date = Column(DateTime(timezone=True), nullable=True)
    payment_method_id = Column(String(100), nullable=True)
    
    # Membership benefits tracking
    exclusive_content_access = Column(Boolean, default=True)
    early_access_enabled = Column(Boolean, default=True)
    direct_messaging_enabled = Column(Boolean, default=True)
    
    # Timestamps
    joined_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True), nullable=True)
    cancelled_at = Column(DateTime(timezone=True), nullable=True)
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    fan_club = relationship("FanClub", back_populates="memberships")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_unique_fan_club_membership', 'fan_club_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<FanClubMembership(fan_club_id={self.fan_club_id}, user_id={self.user_id}, tier={self.tier.value})>"

class ExclusiveContentType(enum.Enum):
    """Exclusive content types"""
    CHAPTER = "chapter"
    STORY = "story"
    BONUS_CONTENT = "bonus_content"
    BEHIND_SCENES = "behind_scenes"
    CHARACTER_PROFILES = "character_profiles"
    ARTWORK = "artwork"
    AUDIO_MESSAGE = "audio_message"
    VIDEO_MESSAGE = "video_message"

class ExclusiveContent(Base):
    """Exclusive content for fan club members"""
    __tablename__ = "exclusive_content"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fan_club_id = Column(String(36), ForeignKey("fan_clubs.id"), nullable=False, index=True)
    
    # Content details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=True)
    content_type = Column(Enum(ExclusiveContentType), nullable=False)
    
    # Content access
    content_url = Column(String(500), nullable=True)  # For files/media
    content_text = Column(Text, nullable=True)  # For text content
    content_data = Column(JSON, nullable=True)  # For structured content
    
    # Access control
    required_tier = Column(Enum(FanClubTier), nullable=False, default=FanClubTier.BRONZE)
    is_early_access = Column(Boolean, default=False)
    early_access_hours = Column(Integer, default=0)  # Hours before public release
    
    # Related content
    story_id = Column(String(36), nullable=True, index=True)
    chapter_id = Column(String(36), nullable=True, index=True)
    
    # Status
    is_published = Column(Boolean, default=False)
    is_featured = Column(Boolean, default=False)
    
    # Engagement
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    published_at = Column(DateTime(timezone=True), nullable=True)
    public_release_at = Column(DateTime(timezone=True), nullable=True)  # When it becomes public
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    fan_club = relationship("FanClub", back_populates="exclusive_content")
    interactions = relationship("ExclusiveContentInteraction", back_populates="content", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ExclusiveContent(fan_club_id={self.fan_club_id}, title={self.title}, type={self.content_type.value})>"

class ExclusiveContentInteraction(Base):
    """User interactions with exclusive content"""
    __tablename__ = "exclusive_content_interactions"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    content_id = Column(String(36), ForeignKey("exclusive_content.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Interaction types
    has_viewed = Column(Boolean, default=False)
    has_liked = Column(Boolean, default=False)
    view_duration = Column(Integer, default=0)  # in seconds
    
    # Timestamps
    first_viewed_at = Column(DateTime(timezone=True), nullable=True)
    last_viewed_at = Column(DateTime(timezone=True), nullable=True)
    liked_at = Column(DateTime(timezone=True), nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    content = relationship("ExclusiveContent", back_populates="interactions")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_unique_content_user_interaction', 'content_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<ExclusiveContentInteraction(content_id={self.content_id}, user_id={self.user_id})>"

class DirectMessageStatus(enum.Enum):
    """Direct message status"""
    SENT = "sent"
    DELIVERED = "delivered"
    READ = "read"
    ARCHIVED = "archived"

class DirectMessage(Base):
    """Direct messages between writers and fan club members"""
    __tablename__ = "direct_messages"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Message participants
    sender_id = Column(String(36), nullable=False, index=True)
    recipient_id = Column(String(36), nullable=False, index=True)
    fan_club_id = Column(String(36), ForeignKey("fan_clubs.id"), nullable=True, index=True)
    
    # Message content
    subject = Column(String(200), nullable=True)
    content = Column(Text, nullable=False)
    message_type = Column(String(50), default="text")  # text, image, audio, video
    
    # Attachments
    attachment_url = Column(String(500), nullable=True)
    attachment_type = Column(String(50), nullable=True)
    attachment_size = Column(Integer, nullable=True)
    
    # Message status
    status = Column(Enum(DirectMessageStatus), nullable=False, default=DirectMessageStatus.SENT)
    is_fan_club_exclusive = Column(Boolean, default=False)
    
    # Threading
    thread_id = Column(String(36), nullable=True, index=True)
    reply_to_id = Column(String(36), ForeignKey("direct_messages.id"), nullable=True)
    
    # Timestamps
    sent_at = Column(DateTime(timezone=True), server_default=func.now())
    delivered_at = Column(DateTime(timezone=True), nullable=True)
    read_at = Column(DateTime(timezone=True), nullable=True)
    
    # Relationships
    replies = relationship("DirectMessage", backref="parent_message", remote_side=[id])
    
    def __repr__(self):
        return f"<DirectMessage(sender_id={self.sender_id}, recipient_id={self.recipient_id})>"

class ExclusiveEventType(enum.Enum):
    """Exclusive event types"""
    LIVE_CHAT = "live_chat"
    Q_AND_A = "q_and_a"
    WRITING_SESSION = "writing_session"
    BOOK_READING = "book_reading"
    MEET_AND_GREET = "meet_and_greet"
    WORKSHOP = "workshop"
    CONTEST = "contest"

class ExclusiveEvent(Base):
    """Exclusive events for fan club members"""
    __tablename__ = "exclusive_events"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    fan_club_id = Column(String(36), ForeignKey("fan_clubs.id"), nullable=False, index=True)
    
    # Event details
    title = Column(String(200), nullable=False)
    description = Column(Text, nullable=False)
    event_type = Column(Enum(ExclusiveEventType), nullable=False)
    
    # Access control
    required_tier = Column(Enum(FanClubTier), nullable=False, default=FanClubTier.BRONZE)
    max_participants = Column(Integer, nullable=True)
    
    # Event timing
    starts_at = Column(DateTime(timezone=True), nullable=False)
    ends_at = Column(DateTime(timezone=True), nullable=False)
    timezone = Column(String(50), default="UTC")
    
    # Event location/access
    location_type = Column(String(50), default="online")  # online, physical, hybrid
    access_url = Column(String(500), nullable=True)  # For online events
    location_details = Column(Text, nullable=True)
    
    # Event status
    status = Column(String(20), default="scheduled")  # scheduled, live, completed, cancelled
    is_recurring = Column(Boolean, default=False)
    recurrence_pattern = Column(JSON, nullable=True)
    
    # Registration
    requires_registration = Column(Boolean, default=True)
    registration_deadline = Column(DateTime(timezone=True), nullable=True)
    
    # Content
    event_data = Column(JSON, nullable=True)  # Event-specific data
    recording_url = Column(String(500), nullable=True)  # For recorded events
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    fan_club = relationship("FanClub", back_populates="events")
    registrations = relationship("EventRegistration", back_populates="event", cascade="all, delete-orphan")
    
    def __repr__(self):
        return f"<ExclusiveEvent(fan_club_id={self.fan_club_id}, title={self.title}, type={self.event_type.value})>"

class EventRegistration(Base):
    """Event registrations"""
    __tablename__ = "event_registrations"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    event_id = Column(String(36), ForeignKey("exclusive_events.id"), nullable=False, index=True)
    user_id = Column(String(36), nullable=False, index=True)
    
    # Registration details
    status = Column(String(20), default="registered")  # registered, attended, no_show, cancelled
    registration_data = Column(JSON, nullable=True)  # Additional registration info
    
    # Attendance tracking
    joined_at = Column(DateTime(timezone=True), nullable=True)
    left_at = Column(DateTime(timezone=True), nullable=True)
    attendance_duration = Column(Integer, nullable=True)  # in minutes
    
    # Timestamps
    registered_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    event = relationship("ExclusiveEvent", back_populates="registrations")
    
    # Unique constraint
    __table_args__ = (
        Index('idx_unique_event_registration', 'event_id', 'user_id', unique=True),
    )
    
    def __repr__(self):
        return f"<EventRegistration(event_id={self.event_id}, user_id={self.user_id})>"

class EarlyAccessContent(Base):
    """Early access content tracking"""
    __tablename__ = "early_access_content"
    
    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    
    # Content reference
    content_type = Column(String(50), nullable=False)  # chapter, story, announcement
    content_id = Column(String(36), nullable=False, index=True)
    writer_id = Column(String(36), nullable=False, index=True)
    
    # Early access settings
    early_access_hours = Column(Integer, nullable=False, default=24)
    required_tier = Column(Enum(FanClubTier), nullable=False, default=FanClubTier.BRONZE)
    
    # Timing
    early_release_at = Column(DateTime(timezone=True), nullable=False)
    public_release_at = Column(DateTime(timezone=True), nullable=False)
    
    # Status
    is_active = Column(Boolean, default=True)
    early_access_granted = Column(Integer, default=0)  # Count of users granted access
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<EarlyAccessContent(content_type={self.content_type}, content_id={self.content_id})>"

# Additional indexes for performance
Index('idx_story_ratings_story_rating', StoryRating.story_id, StoryRating.rating)
Index('idx_reports_status_created', CommentReport.status, CommentReport.created_at)
Index('idx_moderation_logs_target', ModerationLog.target_type, ModerationLog.target_id)

# Social engagement indexes
Index('idx_user_follows_follower', UserFollow.follower_id, UserFollow.is_active)
Index('idx_user_follows_following', UserFollow.following_id, UserFollow.is_active)
Index('idx_notifications_user_unread', Notification.user_id, Notification.is_read)
Index('idx_notifications_type_created', Notification.type, Notification.created_at)
Index('idx_user_achievements_user', UserAchievement.user_id, UserAchievement.earned_at)
Index('idx_contests_status_dates', Contest.status, Contest.contest_starts_at, Contest.contest_ends_at)
Index('idx_contest_submissions_contest_score', ContestSubmission.contest_id, ContestSubmission.total_score)
Index('idx_leaderboards_category_period', Leaderboard.category, Leaderboard.period, Leaderboard.rank)

# Fan club and exclusive content indexes
Index('idx_fan_club_memberships_user', FanClubMembership.user_id, FanClubMembership.status)
Index('idx_fan_club_memberships_club', FanClubMembership.fan_club_id, FanClubMembership.status)
Index('idx_exclusive_content_club_tier', ExclusiveContent.fan_club_id, ExclusiveContent.required_tier)
Index('idx_exclusive_content_published', ExclusiveContent.is_published, ExclusiveContent.published_at)
Index('idx_direct_messages_thread', DirectMessage.thread_id, DirectMessage.sent_at)
Index('idx_direct_messages_participants', DirectMessage.sender_id, DirectMessage.recipient_id)
Index('idx_exclusive_events_club_time', ExclusiveEvent.fan_club_id, ExclusiveEvent.starts_at)
Index('idx_event_registrations_user', EventRegistration.user_id, EventRegistration.status)
Index('idx_early_access_content_timing', EarlyAccessContent.content_type, EarlyAccessContent.early_release_at)
