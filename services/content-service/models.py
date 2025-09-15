from sqlalchemy import Column, String, DateTime, Boolean, Enum, Text, ForeignKey, Integer, JSON, DECIMAL
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum
from datetime import datetime
from typing import Optional, Dict, Any
import hashlib
import json

Base = declarative_base()

class StoryStatus(enum.Enum):
    """Story publication status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    COMPLETED = "completed"
    HIATUS = "hiatus"
    CANCELLED = "cancelled"

class ChapterStatus(enum.Enum):
    """Chapter publication status"""
    DRAFT = "draft"
    PUBLISHED = "published"
    SCHEDULED = "scheduled"
    ARCHIVED = "archived"

class ContentRating(enum.Enum):
    """Content rating for age appropriateness"""
    GENERAL = "general"  # All ages
    TEEN = "teen"        # 13+
    MATURE = "mature"    # 17+
    ADULT = "adult"      # 18+

class MonetizationType(enum.Enum):
    """Content monetization options"""
    FREE = "free"
    COINS = "coins"
    SUBSCRIPTION = "subscription"
    PREMIUM = "premium"  # Both coins and subscription

class Story(Base):
    """Story model with metadata, status, and categorization"""
    __tablename__ = "stories"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    author_id = Column(UUID(as_uuid=True), nullable=False, index=True)  # References user from auth service
    title = Column(String(200), nullable=False, index=True)
    description = Column(Text)
    synopsis = Column(Text)  # Longer description for discovery
    
    # Categorization
    genre = Column(String(50), nullable=False, index=True)
    subgenres = Column(JSON)  # List of subgenres
    tags = Column(JSON)  # List of tags for discovery
    language = Column(String(10), nullable=False, default="en", index=True)
    
    # Status and metadata
    status = Column(Enum(StoryStatus), nullable=False, default=StoryStatus.DRAFT, index=True)
    content_rating = Column(Enum(ContentRating), nullable=False, default=ContentRating.GENERAL)
    
    # Monetization
    monetization_type = Column(Enum(MonetizationType), nullable=False, default=MonetizationType.FREE)
    coin_price_per_chapter = Column(Integer, default=0)  # Price in coins for premium chapters
    
    # Statistics
    total_chapters = Column(Integer, default=0)
    total_words = Column(Integer, default=0)
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    bookmark_count = Column(Integer, default=0)
    
    # Publishing metadata
    first_published_at = Column(DateTime(timezone=True))
    last_updated_at = Column(DateTime(timezone=True))
    
    # Cover and media
    cover_image_url = Column(String(500))
    
    # SEO and discovery
    slug = Column(String(250), unique=True, index=True)  # URL-friendly identifier
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    chapters = relationship("Chapter", back_populates="story", cascade="all, delete-orphan", order_by="Chapter.chapter_number")
    translations = relationship("StoryTranslation", back_populates="story", cascade="all, delete-orphan")
    
    def generate_slug(self) -> str:
        """Generate URL-friendly slug from title"""
        import re
        slug = re.sub(r'[^\w\s-]', '', self.title.lower())
        slug = re.sub(r'[-\s]+', '-', slug)
        return f"{slug}-{str(self.id)[:8]}"
    
    def update_statistics(self):
        """Update story statistics based on chapters"""
        if self.chapters:
            self.total_chapters = len([c for c in self.chapters if c.status == ChapterStatus.PUBLISHED])
            self.total_words = sum(c.word_count or 0 for c in self.chapters if c.status == ChapterStatus.PUBLISHED)
    
    def __repr__(self):
        return f"<Story(id={self.id}, title={self.title}, status={self.status.value})>"

class Chapter(Base):
    """Chapter model with content, versioning, and publishing status"""
    __tablename__ = "chapters"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id"), nullable=False, index=True)
    
    # Chapter identification
    chapter_number = Column(Integer, nullable=False)
    title = Column(String(200), nullable=False)
    
    # Content
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False, index=True)  # SHA-256 hash for IP protection
    word_count = Column(Integer)
    
    # Status and publishing
    status = Column(Enum(ChapterStatus), nullable=False, default=ChapterStatus.DRAFT, index=True)
    is_premium = Column(Boolean, default=False)  # Requires coins/subscription
    coin_price = Column(Integer, default=0)  # Override story default if needed
    
    # Versioning
    version = Column(Integer, default=1)
    original_content_hash = Column(String(64))  # Hash of first published version for IP
    
    # Publishing metadata
    published_at = Column(DateTime(timezone=True))
    scheduled_publish_at = Column(DateTime(timezone=True))  # For scheduled publishing
    
    # Author notes and metadata
    author_note = Column(Text)  # Author's note for this chapter
    
    # Statistics
    view_count = Column(Integer, default=0)
    like_count = Column(Integer, default=0)
    comment_count = Column(Integer, default=0)
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    story = relationship("Story", back_populates="chapters")
    versions = relationship("ChapterVersion", back_populates="chapter", cascade="all, delete-orphan")
    translations = relationship("ChapterTranslation", back_populates="chapter", cascade="all, delete-orphan")
    
    def generate_content_hash(self) -> str:
        """Generate SHA-256 hash of content for IP protection"""
        content_bytes = self.content.encode('utf-8')
        return hashlib.sha256(content_bytes).hexdigest()
    
    def calculate_word_count(self) -> int:
        """Calculate word count from content"""
        import re
        words = re.findall(r'\b\w+\b', self.content)
        return len(words)
    
    def create_version_snapshot(self):
        """Create a version snapshot before content changes"""
        if self.content:
            version = ChapterVersion(
                chapter_id=self.id,
                version_number=self.version,
                content=self.content,
                content_hash=self.content_hash,
                word_count=self.word_count,
                created_at=datetime.utcnow()
            )
            return version
        return None
    
    def __repr__(self):
        return f"<Chapter(id={self.id}, story_id={self.story_id}, number={self.chapter_number}, status={self.status.value})>"

class ChapterVersion(Base):
    """Chapter version history for tracking content changes"""
    __tablename__ = "chapter_versions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id"), nullable=False, index=True)
    
    version_number = Column(Integer, nullable=False)
    content = Column(Text, nullable=False)
    content_hash = Column(String(64), nullable=False)
    word_count = Column(Integer)
    
    # Change metadata
    change_summary = Column(String(500))  # Brief description of changes
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    # Relationships
    chapter = relationship("Chapter", back_populates="versions")
    
    def __repr__(self):
        return f"<ChapterVersion(chapter_id={self.chapter_id}, version={self.version_number})>"

class StoryTranslation(Base):
    """Story translations for multilingual support"""
    __tablename__ = "story_translations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    story_id = Column(UUID(as_uuid=True), ForeignKey("stories.id"), nullable=False, index=True)
    
    language = Column(String(10), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    description = Column(Text)
    synopsis = Column(Text)
    
    # Translation metadata
    is_ai_generated = Column(Boolean, default=True)
    translator_id = Column(UUID(as_uuid=True))  # Human translator if applicable
    translation_quality_score = Column(DECIMAL(3, 2))  # 0.00 to 1.00
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    story = relationship("Story", back_populates="translations")
    
    def __repr__(self):
        return f"<StoryTranslation(story_id={self.story_id}, language={self.language})>"

class ChapterTranslation(Base):
    """Chapter translations for multilingual support"""
    __tablename__ = "chapter_translations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    chapter_id = Column(UUID(as_uuid=True), ForeignKey("chapters.id"), nullable=False, index=True)
    
    language = Column(String(10), nullable=False, index=True)
    title = Column(String(200), nullable=False)
    content = Column(Text, nullable=False)
    author_note = Column(Text)
    
    # Translation metadata
    is_ai_generated = Column(Boolean, default=True)
    translator_id = Column(UUID(as_uuid=True))  # Human translator if applicable
    translation_quality_score = Column(DECIMAL(3, 2))  # 0.00 to 1.00
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    # Relationships
    chapter = relationship("Chapter", back_populates="translations")
    
    def __repr__(self):
        return f"<ChapterTranslation(chapter_id={self.chapter_id}, language={self.language})>"

class ContentValidationRule(Base):
    """Content validation and moderation rules"""
    __tablename__ = "content_validation_rules"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    rule_name = Column(String(100), nullable=False, unique=True)
    rule_type = Column(String(50), nullable=False)  # 'length', 'content', 'format', etc.
    
    # Rule configuration
    parameters = Column(JSON)  # Rule-specific parameters
    error_message = Column(String(500))
    
    # Rule status
    is_active = Column(Boolean, default=True)
    severity = Column(String(20), default="error")  # 'error', 'warning', 'info'
    
    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), server_default=func.now(), onupdate=func.now())
    
    def __repr__(self):
        return f"<ContentValidationRule(name={self.rule_name}, type={self.rule_type})>"