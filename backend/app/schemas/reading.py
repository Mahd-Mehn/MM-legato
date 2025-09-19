from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class BookmarkCreate(BaseModel):
    chapter_id: UUID
    position_percentage: Decimal = Field(..., ge=0, le=100, description="Reading position as percentage (0-100)")

class BookmarkResponse(BaseModel):
    id: UUID
    user_id: UUID
    chapter_id: UUID
    position_percentage: Decimal
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ReadingProgressCreate(BaseModel):
    book_id: UUID
    chapter_id: UUID
    position_percentage: Decimal = Field(..., ge=0, le=100, description="Reading position as percentage (0-100)")

class ReadingProgressUpdate(BaseModel):
    chapter_id: UUID
    position_percentage: Decimal = Field(..., ge=0, le=100, description="Reading position as percentage (0-100)")

class ReadingProgressResponse(BaseModel):
    id: UUID
    user_id: UUID
    book_id: UUID
    chapter_id: UUID
    position_percentage: Decimal
    last_read_at: datetime
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class ContinueReadingBook(BaseModel):
    id: UUID
    book_id: UUID
    title: str
    author: str
    cover_url: Optional[str] = None
    current_chapter_id: UUID
    current_chapter_title: str
    current_chapter_number: int
    progress: Decimal
    last_read_at: datetime

    class Config:
        from_attributes = True

class ChapterNavigationInfo(BaseModel):
    id: UUID
    title: str
    chapter_number: int
    is_published: bool

class BookNavigationResponse(BaseModel):
    book_id: UUID
    book_title: str
    chapters: List[ChapterNavigationInfo]
    current_chapter_id: Optional[UUID] = None
    previous_chapter: Optional[ChapterNavigationInfo] = None
    next_chapter: Optional[ChapterNavigationInfo] = None

class ChapterReadingResponse(BaseModel):
    id: UUID
    book_id: UUID
    title: str
    content: str
    chapter_number: int
    word_count: Optional[int]
    audio_url: Optional[str]
    created_at: datetime
    updated_at: datetime
    
    # Book information
    book_title: str
    book_author: str
    book_cover_url: Optional[str]
    
    # Navigation
    previous_chapter: Optional[ChapterNavigationInfo] = None
    next_chapter: Optional[ChapterNavigationInfo] = None
    
    # User-specific data
    bookmark: Optional[BookmarkResponse] = None
    reading_time_minutes: Optional[int] = None

    class Config:
        from_attributes = True

class ReadingPreferences(BaseModel):
    user_id: UUID
    font_family: str = Field(default="serif", description="Font family: serif, sans-serif, monospace")
    font_size: int = Field(default=16, ge=12, le=24, description="Font size in pixels")
    line_height: float = Field(default=1.6, ge=1.0, le=2.5, description="Line height multiplier")
    background_color: str = Field(default="#ffffff", description="Background color hex code")
    text_color: str = Field(default="#000000", description="Text color hex code")
    page_width: int = Field(default=800, ge=400, le=1200, description="Reading area width in pixels")
    brightness: int = Field(default=100, ge=10, le=150, description="Screen brightness percentage")
    wallpaper_url: Optional[str] = Field(default=None, description="Background wallpaper URL")
    theme_preset: str = Field(default="light", description="Theme preset: light, dark, sepia, night")

    class Config:
        from_attributes = True

class ReadingPreferencesUpdate(BaseModel):
    font_family: Optional[str] = Field(None, description="Font family: serif, sans-serif, monospace")
    font_size: Optional[int] = Field(None, ge=12, le=24, description="Font size in pixels")
    line_height: Optional[float] = Field(None, ge=1.0, le=2.5, description="Line height multiplier")
    background_color: Optional[str] = Field(None, description="Background color hex code")
    text_color: Optional[str] = Field(None, description="Text color hex code")
    page_width: Optional[int] = Field(None, ge=400, le=1200, description="Reading area width in pixels")
    brightness: Optional[int] = Field(None, ge=10, le=150, description="Screen brightness percentage")
    wallpaper_url: Optional[str] = Field(None, description="Background wallpaper URL")
    theme_preset: Optional[str] = Field(None, description="Theme preset: light, dark, sepia, night")