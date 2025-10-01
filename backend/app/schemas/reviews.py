from pydantic import BaseModel, Field
from typing import Optional
from uuid import UUID
from datetime import datetime

class ReviewCreate(BaseModel):
    book_id: UUID
    rating: int = Field(..., ge=1, le=5, description="Rating from 1 to 5 stars")
    title: str = Field(..., min_length=1, max_length=255, description="Review title")
    content: str = Field(..., min_length=10, description="Review content")
    is_spoiler: bool = False

class ReviewUpdate(BaseModel):
    rating: Optional[int] = Field(None, ge=1, le=5, description="Rating from 1 to 5 stars")
    title: Optional[str] = Field(None, min_length=1, max_length=255, description="Review title")
    content: Optional[str] = Field(None, min_length=10, description="Review content")
    is_spoiler: Optional[bool] = None

class ReviewResponse(BaseModel):
    id: UUID
    book_id: UUID
    user_id: UUID
    rating: int
    title: str
    content: str
    is_spoiler: bool
    like_count: int
    is_reported: bool
    is_deleted: bool
    created_at: datetime
    updated_at: datetime
    
    # User info
    user_username: Optional[str] = None
    user_profile_picture: Optional[str] = None
    
    # Whether current user has liked this review
    is_liked_by_current_user: Optional[bool] = None
    
    # Whether the review author is the book author
    is_author_review: Optional[bool] = None

    class Config:
        from_attributes = True

class ReviewLikeResponse(BaseModel):
    review_id: UUID
    user_id: UUID
    created_at: datetime

    class Config:
        from_attributes = True

class BookReviewsResponse(BaseModel):
    reviews: list[ReviewResponse]
    total_count: int
    average_rating: Optional[float] = None
    rating_distribution: dict[int, int] = {}  # {1: count, 2: count, ...}
    
    class Config:
        from_attributes = True