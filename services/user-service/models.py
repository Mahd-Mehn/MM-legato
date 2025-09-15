"""
User Management Service Models
Handles user profiles, relationships, and preferences
"""
from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text, ForeignKey, JSON, Integer
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Dict, Any, Optional

Base = declarative_base()

class RelationshipType(enum.Enum):
    """Types of user relationships"""
    FOLLOWING = "following"
    BLOCKED = "blocked"
    MUTED = "muted"

class SubscriptionPlan(enum.Enum):
    """Subscription plan types"""
    FREE = "free"
    BASIC = "basic"
    PREMIUM = "premium"
    CREATOR = "creator"

class SubscriptionStatus(enum.Enum):
    """Subscription status types"""
    ACTIVE = "active"
    EXPIRED = "expired"
    CANCELLED = "cancelled"
    PENDING = "pending"

class UserProfile(Base):
    """Extended user profile with preferences and settings"""
    __tablename__ = "user_profiles"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), nullable=False, unique=True, index=True)
    display_name = Column(String(150))
    bio = Column(Text)
    avatar_url = Column(String(500))
    cover_image_url = Column(String(500))
    location = Column(String(100))
    website_url = Column(String(500))
    
    # Preferences
    language_preference = Column(String(10), default="en")
    timezone = Column(String(50), default="UTC")
    theme_preference = Column(String(20), default="light")  # light, dark, auto
    
    # Privacy settings
    profile_visibility = Column(String(20), default="public")  # public, followers, private
    show_reading_activity = Column(Boolean, default=True)
    allow_direct_messages = Column(Boolean, default=True)
    
    # Notification preferences (stored as JSON)
    notification_preferences = Column(JSON, default={
        "email_notifications": True,
        "push_notifications": True,
        "new_followers": True,
        "story_updates": True,
        "comments": True,
        "likes": True,
        "mentions": True,
        "newsletter": False
    })
    
    # Content preferences
    preferred_genres = Column(JSON, default=[])  # List of genre preferences
    content_rating_preference = Column(String(10), default="all")  # all, teen, mature
    
    # Statistics
    followers_count = Column(Integer, default=0)
    following_count = Column(Integer, default=0)
    stories_count = Column(Integer, default=0)
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    relationships_as_follower = relationship(
        "UserRelationship", 
        foreign_keys="UserRelationship.follower_id",
        primaryjoin="UserProfile.user_id == UserRelationship.follower_id",
        cascade="all, delete-orphan"
    )
    relationships_as_following = relationship(
        "UserRelationship", 
        foreign_keys="UserRelationship.following_id",
        primaryjoin="UserProfile.user_id == UserRelationship.following_id",
        cascade="all, delete-orphan"
    )
    subscriptions = relationship("UserSubscription", back_populates="profile", cascade="all, delete-orphan")
    
    def update_preferences(self, preferences: Dict[str, Any]) -> None:
        """Update user preferences"""
        if self.notification_preferences is None:
            self.notification_preferences = {}
        
        # Update notification preferences
        if "notification_preferences" in preferences:
            self.notification_preferences.update(preferences["notification_preferences"])
        
        # Update other preferences
        for key, value in preferences.items():
            if key != "notification_preferences" and hasattr(self, key):
                setattr(self, key, value)
    
    def get_preference(self, key: str, default: Any = None) -> Any:
        """Get a specific preference value"""
        if key in self.notification_preferences:
            return self.notification_preferences.get(key, default)
        return getattr(self, key, default)
    
    def __repr__(self):
        return f"<UserProfile(user_id={self.user_id}, display_name={self.display_name})>"

class UserRelationship(Base):
    """User relationships (following, blocking, muting)"""
    __tablename__ = "user_relationships"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    follower_id = Column(String(36), nullable=False, index=True)
    following_id = Column(String(36), nullable=False, index=True)
    relationship_type = Column(Enum(RelationshipType), nullable=False, default=RelationshipType.FOLLOWING)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    follower = relationship(
        "UserProfile", 
        foreign_keys=[follower_id],
        primaryjoin="UserRelationship.follower_id == UserProfile.user_id",
        overlaps="relationships_as_follower"
    )
    following = relationship(
        "UserProfile", 
        foreign_keys=[following_id],
        primaryjoin="UserRelationship.following_id == UserProfile.user_id",
        overlaps="relationships_as_following"
    )
    
    __table_args__ = (
        # Ensure unique relationship per pair
        {"schema": None},
    )
    
    def __repr__(self):
        return f"<UserRelationship(follower={self.follower_id}, following={self.following_id}, type={self.relationship_type.value})>"

class UserSubscription(Base):
    """User subscription and membership management"""
    __tablename__ = "user_subscriptions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("user_profiles.user_id"), nullable=False, index=True)
    plan_type = Column(Enum(SubscriptionPlan), nullable=False, default=SubscriptionPlan.FREE)
    status = Column(Enum(SubscriptionStatus), nullable=False, default=SubscriptionStatus.ACTIVE)
    
    # Subscription details
    started_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))
    cancelled_at = Column(DateTime(timezone=True))
    
    # Payment information
    stripe_subscription_id = Column(String(100))  # External payment provider ID
    price_paid = Column(String(20))  # Amount paid (stored as string to handle different currencies)
    currency = Column(String(3), default="USD")
    
    # Fan club memberships (JSON array of creator IDs)
    fan_club_memberships = Column(JSON, default=[])
    
    # Subscription benefits
    benefits = Column(JSON, default={
        "ad_free": False,
        "early_access": False,
        "exclusive_content": False,
        "priority_support": False,
        "advanced_analytics": False
    })
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    profile = relationship("UserProfile", back_populates="subscriptions")
    
    def is_active(self) -> bool:
        """Check if subscription is currently active"""
        if self.status != SubscriptionStatus.ACTIVE:
            return False
        
        if self.expires_at is None:
            return True  # Lifetime subscription
        
        from datetime import datetime, timezone
        now = datetime.now(timezone.utc)
        expires_at = self.expires_at
        
        # Handle timezone-aware and naive datetimes
        if expires_at.tzinfo is None:
            expires_at = expires_at.replace(tzinfo=timezone.utc)
        
        return now < expires_at
    
    def add_fan_club_membership(self, creator_id: str) -> None:
        """Add fan club membership for a creator"""
        if self.fan_club_memberships is None:
            self.fan_club_memberships = []
        
        if creator_id not in self.fan_club_memberships:
            # Create a new list to trigger SQLAlchemy change detection
            self.fan_club_memberships = self.fan_club_memberships + [creator_id]
    
    def remove_fan_club_membership(self, creator_id: str) -> None:
        """Remove fan club membership for a creator"""
        if self.fan_club_memberships and creator_id in self.fan_club_memberships:
            # Create a new list to trigger SQLAlchemy change detection
            self.fan_club_memberships = [m for m in self.fan_club_memberships if m != creator_id]
    
    def has_benefit(self, benefit: str) -> bool:
        """Check if subscription includes a specific benefit"""
        return self.benefits.get(benefit, False) if self.benefits else False
    
    def __repr__(self):
        return f"<UserSubscription(user_id={self.user_id}, plan={self.plan_type.value}, status={self.status.value})>"

class UserPreference(Base):
    """Additional user preferences and settings"""
    __tablename__ = "user_preferences"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(36), ForeignKey("user_profiles.user_id"), nullable=False, index=True)
    
    # Reading preferences
    reading_speed = Column(String(20), default="normal")  # slow, normal, fast
    font_size = Column(String(20), default="medium")  # small, medium, large, xl
    font_family = Column(String(50), default="default")
    line_spacing = Column(String(20), default="normal")  # compact, normal, relaxed
    
    # Content discovery preferences
    discovery_algorithm = Column(String(20), default="balanced")  # trending, personalized, balanced
    show_mature_content = Column(Boolean, default=False)
    preferred_story_length = Column(String(20), default="any")  # short, medium, long, any
    
    # Language and localization
    preferred_languages = Column(JSON, default=["en"])  # Ordered list of language preferences
    auto_translate = Column(Boolean, default=True)
    translation_quality = Column(String(20), default="balanced")  # fast, balanced, quality
    
    # Monetization preferences (for writers)
    default_monetization = Column(String(20), default="free")  # free, coins, subscription
    coin_price_per_chapter = Column(Integer, default=10)  # Default coin price for chapters
    
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<UserPreference(user_id={self.user_id})>"