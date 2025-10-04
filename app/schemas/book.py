from pydantic import BaseModel, Field
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class BookBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    pricing_model: str = Field(..., pattern="^(free|fixed|per_chapter)$")
    fixed_price: Optional[int] = Field(None, ge=0)
    per_chapter_price: Optional[int] = Field(None, ge=0)
    genre: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = []
    is_published: bool = False

class BookCreate(BookBase):
    pass

class BookUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    description: Optional[str] = None
    cover_image_url: Optional[str] = None
    pricing_model: Optional[str] = Field(None, pattern="^(free|fixed|per_chapter)$")
    fixed_price: Optional[int] = Field(None, ge=0)
    per_chapter_price: Optional[int] = Field(None, ge=0)
    genre: Optional[str] = Field(None, max_length=100)
    tags: Optional[List[str]] = None
    is_published: Optional[bool] = None

class ChapterBase(BaseModel):
    title: str = Field(..., min_length=1, max_length=255)
    content: str = Field(..., min_length=1)
    chapter_number: int = Field(..., ge=1)
    is_published: bool = False

class ChapterCreate(ChapterBase):
    pass

class ChapterUpdate(BaseModel):
    title: Optional[str] = Field(None, min_length=1, max_length=255)
    content: Optional[str] = Field(None, min_length=1)
    chapter_number: Optional[int] = Field(None, ge=1)
    is_published: Optional[bool] = None

class ChapterResponse(ChapterBase):
    id: UUID
    book_id: UUID
    word_count: Optional[int]
    audio_url: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True

class BookResponse(BookBase):
    id: UUID
    author_id: UUID
    license_hash: str
    created_at: datetime
    updated_at: datetime
    author: Optional[dict] = None
    chapters: Optional[List[ChapterResponse]] = []
    chapter_count: Optional[int] = 0
    total_word_count: Optional[int] = 0

    class Config:
        from_attributes = True

class BookListResponse(BaseModel):
    id: UUID
    title: str
    description: Optional[str]
    cover_image_url: Optional[str]
    author_id: UUID
    pricing_model: str
    fixed_price: Optional[int]
    per_chapter_price: Optional[int]
    genre: Optional[str]
    tags: Optional[List[str]]
    is_published: bool
    created_at: datetime
    author: Optional[dict] = None
    chapter_count: Optional[int] = 0
    total_word_count: Optional[int] = 0

    class Config:
        from_attributes = True

class BookFilters(BaseModel):
    search: Optional[str] = None
    genre: Optional[str] = None
    tags: Optional[List[str]] = []
    excluded_tags: Optional[List[str]] = []
    pricing_model: Optional[str] = None
    min_price: Optional[int] = None
    max_price: Optional[int] = None
    min_rating: Optional[float] = None
    author_id: Optional[UUID] = None
    is_published: Optional[bool] = True
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort_by: Optional[str] = Field("created_at", pattern="^(created_at|title|rating|price)$")
    sort_order: Optional[str] = Field("desc", pattern="^(asc|desc)$")

class BookListPaginatedResponse(BaseModel):
    books: List[BookListResponse]
    total: int
    page: int
    limit: int
    total_pages: int
    has_next: bool
    has_prev: bool