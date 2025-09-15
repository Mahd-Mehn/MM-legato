"""
Pydantic schemas for content management API
"""
from pydantic import BaseModel, Field, validator
from typing import Optional, List, Dict, Any
from datetime import datetime
from models import StoryStatus, ChapterStatus, ContentRating, MonetizationType
import re

class StoryCreateRequest(BaseModel):
    """Story creation request schema"""
    title: str = Field(..., min_length=1, max_length=200, description="Story title")
    description: Optional[str] = Field(None, max_length=2000, description="Short description")
    synopsis: Optional[str] = Field(None, max_length=5000, description="Detailed synopsis")
    genre: str = Field(..., min_length=1, max_length=50, description="Primary genre")
    subgenres: Optional[List[str]] = Field(default=[], description="List of subgenres")
    tags: Optional[List[str]] = Field(default=[], description="List of tags")
    language: str = Field(default="en", max_length=10, description="Content language")
    content_rating: ContentRating = Field(default=ContentRating.GENERAL, description="Age rating")
    monetization_type: MonetizationType = Field(default=MonetizationType.FREE, description="Monetization model")
    coin_price_per_chapter: Optional[int] = Field(default=0, ge=0, description="Default coin price per chapter")
    cover_image_url: Optional[str] = Field(None, max_length=500, description="Cover image URL")
    
    @validator('title')
    def validate_title(cls, v):
        """Validate title format"""
        if not v.strip():
            raise ValueError('Title cannot be empty')
        return v.strip()
    
    @validator('tags', 'subgenres')
    def validate_lists(cls, v):
        """Validate tag and subgenre lists"""
        if v and len(v) > 10:
            raise ValueError('Maximum 10 items allowed')
        return [item.strip().lower() for item in v if item.strip()] if v else []
    
    @validator('cover_image_url')
    def validate_cover_url(cls, v):
        """Validate cover image URL"""
        if v and not re.match(r'^https?://', v):
            raise ValueError('Cover image URL must be a valid HTTP/HTTPS URL')
        return v

class StoryUpdateRequest(BaseModel):
    """Story update request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Story title")
    description: Optional[str] = Field(None, max_length=2000, description="Short description")
    synopsis: Optional[str] = Field(None, max_length=5000, description="Detailed synopsis")
    genre: Optional[str] = Field(None, min_length=1, max_length=50, description="Primary genre")
    subgenres: Optional[List[str]] = Field(None, description="List of subgenres")
    tags: Optional[List[str]] = Field(None, description="List of tags")
    content_rating: Optional[ContentRating] = Field(None, description="Age rating")
    monetization_type: Optional[MonetizationType] = Field(None, description="Monetization model")
    coin_price_per_chapter: Optional[int] = Field(None, ge=0, description="Default coin price per chapter")
    cover_image_url: Optional[str] = Field(None, max_length=500, description="Cover image URL")
    status: Optional[StoryStatus] = Field(None, description="Story status")

class ChapterCreateRequest(BaseModel):
    """Chapter creation request schema"""
    chapter_number: int = Field(..., ge=1, description="Chapter number")
    title: str = Field(..., min_length=1, max_length=200, description="Chapter title")
    content: str = Field(..., min_length=100, description="Chapter content")
    author_note: Optional[str] = Field(None, max_length=1000, description="Author's note")
    is_premium: bool = Field(default=False, description="Premium content flag")
    coin_price: Optional[int] = Field(None, ge=0, description="Chapter-specific coin price")
    scheduled_publish_at: Optional[datetime] = Field(None, description="Scheduled publication time")
    
    @validator('content')
    def validate_content(cls, v):
        """Validate chapter content"""
        if len(v.strip()) < 100:
            raise ValueError('Chapter content must be at least 100 characters')
        if len(v) > 50000:
            raise ValueError('Chapter content cannot exceed 50,000 characters')
        return v.strip()
    
    @validator('title')
    def validate_title(cls, v):
        """Validate chapter title"""
        if not v.strip():
            raise ValueError('Chapter title cannot be empty')
        return v.strip()

class ChapterUpdateRequest(BaseModel):
    """Chapter update request schema"""
    title: Optional[str] = Field(None, min_length=1, max_length=200, description="Chapter title")
    content: Optional[str] = Field(None, min_length=100, description="Chapter content")
    author_note: Optional[str] = Field(None, max_length=1000, description="Author's note")
    is_premium: Optional[bool] = Field(None, description="Premium content flag")
    coin_price: Optional[int] = Field(None, ge=0, description="Chapter-specific coin price")
    status: Optional[ChapterStatus] = Field(None, description="Chapter status")
    scheduled_publish_at: Optional[datetime] = Field(None, description="Scheduled publication time")
    change_summary: Optional[str] = Field(None, max_length=500, description="Summary of changes")

class StoryResponse(BaseModel):
    """Story response schema"""
    id: str = Field(..., description="Story ID")
    author_id: str = Field(..., description="Author ID")
    title: str = Field(..., description="Story title")
    description: Optional[str] = Field(None, description="Short description")
    synopsis: Optional[str] = Field(None, description="Detailed synopsis")
    genre: str = Field(..., description="Primary genre")
    subgenres: List[str] = Field(default=[], description="List of subgenres")
    tags: List[str] = Field(default=[], description="List of tags")
    language: str = Field(..., description="Content language")
    status: StoryStatus = Field(..., description="Story status")
    content_rating: ContentRating = Field(..., description="Age rating")
    monetization_type: MonetizationType = Field(..., description="Monetization model")
    coin_price_per_chapter: int = Field(..., description="Default coin price per chapter")
    total_chapters: int = Field(..., description="Total published chapters")
    total_words: int = Field(..., description="Total word count")
    view_count: int = Field(..., description="Total views")
    like_count: int = Field(..., description="Total likes")
    bookmark_count: int = Field(..., description="Total bookmarks")
    cover_image_url: Optional[str] = Field(None, description="Cover image URL")
    slug: Optional[str] = Field(None, description="URL slug")
    first_published_at: Optional[datetime] = Field(None, description="First publication date")
    last_updated_at: Optional[datetime] = Field(None, description="Last update date")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: datetime = Field(..., description="Last modification date")
    
    model_config = {"from_attributes": True}

class ChapterResponse(BaseModel):
    """Chapter response schema"""
    id: str = Field(..., description="Chapter ID")
    story_id: str = Field(..., description="Story ID")
    chapter_number: int = Field(..., description="Chapter number")
    title: str = Field(..., description="Chapter title")
    content: str = Field(..., description="Chapter content")
    content_hash: str = Field(..., description="Content hash for IP protection")
    word_count: Optional[int] = Field(None, description="Word count")
    status: ChapterStatus = Field(..., description="Chapter status")
    is_premium: bool = Field(..., description="Premium content flag")
    coin_price: int = Field(..., description="Coin price")
    version: int = Field(..., description="Content version")
    author_note: Optional[str] = Field(None, description="Author's note")
    view_count: int = Field(..., description="View count")
    like_count: int = Field(..., description="Like count")
    comment_count: int = Field(..., description="Comment count")
    published_at: Optional[datetime] = Field(None, description="Publication date")
    scheduled_publish_at: Optional[datetime] = Field(None, description="Scheduled publication time")
    created_at: datetime = Field(..., description="Creation date")
    updated_at: datetime = Field(..., description="Last modification date")
    
    model_config = {"from_attributes": True}

class ChapterSummaryResponse(BaseModel):
    """Chapter summary response (without content)"""
    id: str = Field(..., description="Chapter ID")
    story_id: str = Field(..., description="Story ID")
    chapter_number: int = Field(..., description="Chapter number")
    title: str = Field(..., description="Chapter title")
    word_count: Optional[int] = Field(None, description="Word count")
    status: ChapterStatus = Field(..., description="Chapter status")
    is_premium: bool = Field(..., description="Premium content flag")
    coin_price: int = Field(..., description="Coin price")
    published_at: Optional[datetime] = Field(None, description="Publication date")
    
    model_config = {"from_attributes": True}

class StoryListResponse(BaseModel):
    """Story list response with pagination"""
    stories: List[StoryResponse] = Field(..., description="List of stories")
    total: int = Field(..., description="Total number of stories")
    page: int = Field(..., description="Current page")
    per_page: int = Field(..., description="Items per page")
    total_pages: int = Field(..., description="Total pages")

class ChapterListResponse(BaseModel):
    """Chapter list response"""
    chapters: List[ChapterSummaryResponse] = Field(..., description="List of chapters")
    total: int = Field(..., description="Total number of chapters")

class ContentValidationError(BaseModel):
    """Content validation error schema"""
    field: str = Field(..., description="Field with validation error")
    message: str = Field(..., description="Error message")
    code: str = Field(..., description="Error code")

class ContentValidationResponse(BaseModel):
    """Content validation response schema"""
    is_valid: bool = Field(..., description="Validation status")
    errors: List[ContentValidationError] = Field(default=[], description="Validation errors")
    warnings: List[ContentValidationError] = Field(default=[], description="Validation warnings")

class StoryStatsResponse(BaseModel):
    """Story statistics response"""
    story_id: str = Field(..., description="Story ID")
    total_chapters: int = Field(..., description="Total chapters")
    published_chapters: int = Field(..., description="Published chapters")
    total_words: int = Field(..., description="Total word count")
    view_count: int = Field(..., description="Total views")
    like_count: int = Field(..., description="Total likes")
    bookmark_count: int = Field(..., description="Total bookmarks")
    comment_count: int = Field(..., description="Total comments")
    average_chapter_length: Optional[float] = Field(None, description="Average chapter word count")
    last_chapter_published: Optional[datetime] = Field(None, description="Last chapter publication date")

class TranslationRequest(BaseModel):
    """Translation request schema"""
    target_language: str = Field(..., max_length=10, description="Target language code")
    translator_id: Optional[str] = Field(None, description="Human translator ID")
    
class TranslationResponse(BaseModel):
    """Translation response schema"""
    id: str = Field(..., description="Translation ID")
    language: str = Field(..., description="Language code")
    title: str = Field(..., description="Translated title")
    content: Optional[str] = Field(None, description="Translated content")
    is_ai_generated: bool = Field(..., description="AI generation flag")
    translation_quality_score: Optional[float] = Field(None, description="Quality score")
    created_at: datetime = Field(..., description="Creation date")
    
    model_config = {"from_attributes": True}

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[Dict[str, Any]] = Field(None, description="Additional error details")
    timestamp: datetime = Field(default_factory=datetime.utcnow, description="Error timestamp")

class SuccessResponse(BaseModel):
    """Success response schema"""
    success: bool = Field(default=True, description="Success status")
    message: str = Field(..., description="Success message")
    data: Optional[Dict[str, Any]] = Field(None, description="Additional data")

# Content filtering and search schemas
class ContentFilterRequest(BaseModel):
    """Content filtering request schema"""
    genre: Optional[str] = Field(None, description="Filter by genre")
    subgenres: Optional[List[str]] = Field(None, description="Filter by subgenres")
    tags: Optional[List[str]] = Field(None, description="Filter by tags")
    language: Optional[str] = Field(None, description="Filter by language")
    content_rating: Optional[ContentRating] = Field(None, description="Filter by content rating")
    status: Optional[StoryStatus] = Field(None, description="Filter by status")
    monetization_type: Optional[MonetizationType] = Field(None, description="Filter by monetization")
    min_chapters: Optional[int] = Field(None, ge=0, description="Minimum chapter count")
    max_chapters: Optional[int] = Field(None, ge=0, description="Maximum chapter count")
    sort_by: Optional[str] = Field("updated_at", description="Sort field")
    sort_order: Optional[str] = Field("desc", description="Sort order (asc/desc)")
    page: int = Field(1, ge=1, description="Page number")
    per_page: int = Field(20, ge=1, le=100, description="Items per page")

class ContentSearchRequest(BaseModel):
    """Content search request schema"""
    query: str = Field(..., min_length=1, max_length=200, description="Search query")
    search_in: Optional[List[str]] = Field(default=["title", "description"], description="Fields to search in")
    filters: Optional[ContentFilterRequest] = Field(None, description="Additional filters")
    
    @validator('search_in')
    def validate_search_fields(cls, v):
        """Validate search fields"""
        allowed_fields = ["title", "description", "synopsis", "tags", "content"]
        if v:
            invalid_fields = [field for field in v if field not in allowed_fields]
            if invalid_fields:
                raise ValueError(f"Invalid search fields: {invalid_fields}")
        return v or ["title", "description"]