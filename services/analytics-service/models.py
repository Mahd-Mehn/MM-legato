from pydantic import BaseModel, Field
from typing import Optional, Dict, Any, List
from datetime import datetime
from enum import Enum
import uuid

class EventType(str, Enum):
    """Types of analytics events"""
    CHAPTER_READ = "chapter_read"
    STORY_VIEW = "story_view"
    USER_REGISTRATION = "user_registration"
    PAYMENT_MADE = "payment_made"
    COMMENT_POSTED = "comment_posted"
    STORY_RATED = "story_rated"
    STORY_SHARED = "story_shared"
    SEARCH_PERFORMED = "search_performed"
    PROFILE_VIEWED = "profile_viewed"
    FOLLOW_ACTION = "follow_action"
    BOOKMARK_ADDED = "bookmark_added"
    AUDIO_PLAYED = "audio_played"
    TRANSLATION_USED = "translation_used"

class AnalyticsEvent(BaseModel):
    """Base analytics event model"""
    event_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    event_type: EventType
    user_id: Optional[str] = None
    session_id: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    properties: Dict[str, Any] = Field(default_factory=dict)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ContentEngagementEvent(AnalyticsEvent):
    """Content-specific engagement event"""
    story_id: Optional[str] = None
    chapter_id: Optional[str] = None
    author_id: Optional[str] = None
    read_duration: Optional[int] = None  # in seconds
    completion_percentage: Optional[float] = None
    scroll_depth: Optional[float] = None

class UserBehaviorEvent(AnalyticsEvent):
    """User behavior tracking event"""
    page_url: Optional[str] = None
    referrer: Optional[str] = None
    device_type: Optional[str] = None
    browser: Optional[str] = None
    location: Optional[str] = None

class RevenueEvent(AnalyticsEvent):
    """Revenue-related event"""
    transaction_id: Optional[str] = None
    amount: Optional[float] = None
    currency: Optional[str] = None
    payment_method: Optional[str] = None
    content_id: Optional[str] = None

class AggregatedMetrics(BaseModel):
    """Aggregated metrics model"""
    metric_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    metric_type: str
    entity_id: str  # story_id, user_id, etc.
    entity_type: str  # story, user, chapter, etc.
    time_period: str  # daily, weekly, monthly
    date: datetime
    value: float
    metadata: Dict[str, Any] = Field(default_factory=dict)

class ContentPerformanceMetrics(BaseModel):
    """Content performance metrics"""
    content_id: str
    content_type: str  # story, chapter
    total_views: int = 0
    unique_viewers: int = 0
    total_read_time: int = 0  # in seconds
    average_read_time: float = 0.0
    completion_rate: float = 0.0
    engagement_score: float = 0.0
    revenue_generated: float = 0.0
    comments_count: int = 0
    ratings_count: int = 0
    average_rating: float = 0.0
    shares_count: int = 0
    bookmarks_count: int = 0
    date: datetime = Field(default_factory=datetime.utcnow)

class UserEngagementMetrics(BaseModel):
    """User engagement metrics"""
    user_id: str
    total_reading_time: int = 0  # in seconds
    stories_read: int = 0
    chapters_read: int = 0
    comments_posted: int = 0
    ratings_given: int = 0
    stories_shared: int = 0
    last_active: Optional[datetime] = None
    engagement_score: float = 0.0
    retention_days: int = 0
    date: datetime = Field(default_factory=datetime.utcnow)

class ABTestVariant(BaseModel):
    """A/B test variant configuration"""
    test_id: str
    variant_id: str
    variant_name: str
    traffic_percentage: float
    configuration: Dict[str, Any]
    is_active: bool = True
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ABTestResult(BaseModel):
    """A/B test result tracking"""
    test_id: str
    variant_id: str
    user_id: str
    event_type: str
    conversion: bool = False
    value: Optional[float] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    metadata: Dict[str, Any] = Field(default_factory=dict)

class RealtimeMetrics(BaseModel):
    """Real-time metrics for dashboard"""
    active_users: int = 0
    concurrent_readers: int = 0
    stories_being_read: List[str] = Field(default_factory=list)
    revenue_today: float = 0.0
    new_registrations_today: int = 0
    top_stories: List[Dict[str, Any]] = Field(default_factory=list)
    timestamp: datetime = Field(default_factory=datetime.utcnow)