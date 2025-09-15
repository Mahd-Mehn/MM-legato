"""
Pydantic schemas for User Management Service
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import RelationshipType, SubscriptionPlan, SubscriptionStatus
import re

class UserProfileResponse(BaseModel):
    """User profile response schema"""
    id: str = Field(..., description="Profile ID")
    user_id: str = Field(..., description="User ID")
    display_name: Optional[str] = Field(None, description="Display name")
    bio: Optional[str] = Field(None, description="User biography")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    cover_image_url: Optional[str] = Field(None, description="Cover image URL")
    location: Optional[str] = Field(None, description="User location")
    website_url: Optional[str] = Field(None, description="Website URL")
    language_preference: str = Field(default="en", description="Language preference")
    timezone: str = Field(default="UTC", description="User timezone")
    theme_preference: str = Field(default="light", description="Theme preference")
    profile_visibility: str = Field(default="public", description="Profile visibility")
    followers_count: int = Field(default=0, description="Number of followers")
    following_count: int = Field(default=0, description="Number of following")
    stories_count: int = Field(default=0, description="Number of stories")
    created_at: datetime = Field(..., description="Profile creation date")
    updated_at: datetime = Field(..., description="Profile last update date")
    
    class Config:
        from_attributes = True

class UserProfileUpdateRequest(BaseModel):
    """User profile update request schema"""
    display_name: Optional[str] = Field(None, max_length=150, description="Display name")
    bio: Optional[str] = Field(None, max_length=1000, description="User biography")
    avatar_url: Optional[str] = Field(None, max_length=500, description="Avatar URL")
    cover_image_url: Optional[str] = Field(None, max_length=500, description="Cover image URL")
    location: Optional[str] = Field(None, max_length=100, description="User location")
    website_url: Optional[str] = Field(None, max_length=500, description="Website URL")
    language_preference: Optional[str] = Field(None, max_length=10, description="Language preference")
    timezone: Optional[str] = Field(None, max_length=50, description="User timezone")
    theme_preference: Optional[str] = Field(None, description="Theme preference")
    profile_visibility: Optional[str] = Field(None, description="Profile visibility")
    
    @validator('avatar_url', 'cover_image_url', 'website_url')
    def validate_urls(cls, v):
        """Validate URL format"""
        if v and not re.match(r'^https?://', v):
            raise ValueError('URL must be a valid HTTP/HTTPS URL')
        return v
    
    @validator('theme_preference')
    def validate_theme(cls, v):
        """Validate theme preference"""
        if v and v not in ['light', 'dark', 'auto']:
            raise ValueError('Theme must be light, dark, or auto')
        return v
    
    @validator('profile_visibility')
    def validate_visibility(cls, v):
        """Validate profile visibility"""
        if v and v not in ['public', 'followers', 'private']:
            raise ValueError('Profile visibility must be public, followers, or private')
        return v

class UserPreferencesResponse(BaseModel):
    """User preferences response schema"""
    notification_preferences: Dict[str, Any] = Field(default_factory=dict, description="Notification preferences")
    preferred_genres: List[str] = Field(default_factory=list, description="Preferred genres")
    content_rating_preference: str = Field(default="all", description="Content rating preference")
    show_reading_activity: bool = Field(default=True, description="Show reading activity")
    allow_direct_messages: bool = Field(default=True, description="Allow direct messages")
    reading_speed: str = Field(default="normal", description="Reading speed preference")
    font_size: str = Field(default="medium", description="Font size preference")
    auto_translate: bool = Field(default=True, description="Auto translate content")
    preferred_languages: List[str] = Field(default_factory=lambda: ["en"], description="Preferred languages")
    
    class Config:
        from_attributes = True

class UserPreferencesUpdateRequest(BaseModel):
    """User preferences update request schema"""
    notification_preferences: Optional[Dict[str, Any]] = Field(None, description="Notification preferences")
    preferred_genres: Optional[List[str]] = Field(None, description="Preferred genres")
    content_rating_preference: Optional[str] = Field(None, description="Content rating preference")
    show_reading_activity: Optional[bool] = Field(None, description="Show reading activity")
    allow_direct_messages: Optional[bool] = Field(None, description="Allow direct messages")
    reading_speed: Optional[str] = Field(None, description="Reading speed preference")
    font_size: Optional[str] = Field(None, description="Font size preference")
    auto_translate: Optional[bool] = Field(None, description="Auto translate content")
    preferred_languages: Optional[List[str]] = Field(None, description="Preferred languages")
    
    @validator('content_rating_preference')
    def validate_content_rating(cls, v):
        """Validate content rating preference"""
        if v and v not in ['all', 'teen', 'mature']:
            raise ValueError('Content rating must be all, teen, or mature')
        return v
    
    @validator('reading_speed')
    def validate_reading_speed(cls, v):
        """Validate reading speed"""
        if v and v not in ['slow', 'normal', 'fast']:
            raise ValueError('Reading speed must be slow, normal, or fast')
        return v
    
    @validator('font_size')
    def validate_font_size(cls, v):
        """Validate font size"""
        if v and v not in ['small', 'medium', 'large', 'xl']:
            raise ValueError('Font size must be small, medium, large, or xl')
        return v

class UserRelationshipResponse(BaseModel):
    """User relationship response schema"""
    id: str = Field(..., description="Relationship ID")
    follower_id: str = Field(..., description="Follower user ID")
    following_id: str = Field(..., description="Following user ID")
    relationship_type: RelationshipType = Field(..., description="Relationship type")
    created_at: datetime = Field(..., description="Relationship creation date")
    
    class Config:
        from_attributes = True

class FollowUserRequest(BaseModel):
    """Follow user request schema"""
    user_id: str = Field(..., description="User ID to follow")

class UnfollowUserRequest(BaseModel):
    """Unfollow user request schema"""
    user_id: str = Field(..., description="User ID to unfollow")

class BlockUserRequest(BaseModel):
    """Block user request schema"""
    user_id: str = Field(..., description="User ID to block")

class UserListResponse(BaseModel):
    """User list response schema"""
    users: List[UserProfileResponse] = Field(..., description="List of user profiles")
    total: int = Field(..., description="Total number of users")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")

class UserSubscriptionResponse(BaseModel):
    """User subscription response schema"""
    id: str = Field(..., description="Subscription ID")
    user_id: str = Field(..., description="User ID")
    plan_type: SubscriptionPlan = Field(..., description="Subscription plan type")
    status: SubscriptionStatus = Field(..., description="Subscription status")
    started_at: datetime = Field(..., description="Subscription start date")
    expires_at: Optional[datetime] = Field(None, description="Subscription expiration date")
    benefits: Dict[str, Any] = Field(default_factory=dict, description="Subscription benefits")
    fan_club_memberships: List[str] = Field(default_factory=list, description="Fan club memberships")
    
    class Config:
        from_attributes = True

class CreateSubscriptionRequest(BaseModel):
    """Create subscription request schema"""
    plan_type: SubscriptionPlan = Field(..., description="Subscription plan type")
    payment_method_id: Optional[str] = Field(None, description="Payment method ID")
    
class UpdateSubscriptionRequest(BaseModel):
    """Update subscription request schema"""
    plan_type: Optional[SubscriptionPlan] = Field(None, description="New subscription plan type")
    
class FanClubMembershipRequest(BaseModel):
    """Fan club membership request schema"""
    creator_id: str = Field(..., description="Creator user ID")

class UserStatsResponse(BaseModel):
    """User statistics response schema"""
    user_id: str = Field(..., description="User ID")
    followers_count: int = Field(..., description="Number of followers")
    following_count: int = Field(..., description="Number of following")
    stories_count: int = Field(..., description="Number of stories")
    total_reads: int = Field(default=0, description="Total story reads")
    total_likes: int = Field(default=0, description="Total likes received")
    join_date: datetime = Field(..., description="User join date")

class SearchUsersRequest(BaseModel):
    """Search users request schema"""
    query: str = Field(..., min_length=1, max_length=100, description="Search query")
    page: int = Field(default=1, ge=1, description="Page number")
    per_page: int = Field(default=20, ge=1, le=100, description="Items per page")
    filters: Optional[Dict[str, Any]] = Field(None, description="Additional search filters")

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")

class SuccessResponse(BaseModel):
    """Success response schema"""
    success: bool = Field(default=True, description="Success status")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")

# Validation utilities
def validate_user_id_format(user_id: str) -> bool:
    """Validate user ID format (UUID)"""
    import uuid
    try:
        uuid.UUID(user_id)
        return True
    except ValueError:
        return False

def validate_language_code(language: str) -> bool:
    """Validate language code format (ISO 639-1)"""
    # Basic validation for common language codes
    valid_languages = [
        'en', 'es', 'fr', 'de', 'it', 'pt', 'ru', 'ja', 'ko', 'zh', 
        'ar', 'hi', 'tr', 'pl', 'nl', 'sv', 'da', 'no', 'fi'
    ]
    return language.lower() in valid_languages

def validate_timezone(timezone: str) -> bool:
    """Validate timezone format"""
    try:
        import pytz
        return timezone in pytz.all_timezones
    except ImportError:
        # Basic validation if pytz is not available
        return len(timezone) > 0 and len(timezone) <= 50