from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.reviews_service import ReviewsService
from app.schemas.reviews import (
    ReviewCreate, ReviewUpdate, ReviewResponse, BookReviewsResponse
)

router = APIRouter()

@router.post("/", response_model=ReviewResponse)
async def create_review(
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new book review"""
    reviews_service = ReviewsService(db)
    return reviews_service.create_review(current_user.id, review_data)

@router.put("/{review_id}", response_model=ReviewResponse)
async def update_review(
    review_id: UUID,
    review_data: ReviewUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update an existing review"""
    reviews_service = ReviewsService(db)
    return reviews_service.update_review(current_user.id, review_id, review_data)

@router.delete("/{review_id}")
async def delete_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a review"""
    reviews_service = ReviewsService(db)
    success = reviews_service.delete_review(current_user.id, review_id)
    if success:
        return {"message": "Review deleted successfully"}
    else:
        raise HTTPException(status_code=400, detail="Failed to delete review")

@router.get("/book/{book_id}", response_model=BookReviewsResponse)
async def get_book_reviews(
    book_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Number of reviews per page"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all reviews for a book"""
    reviews_service = ReviewsService(db)
    current_user_id = current_user.id if current_user else None
    return reviews_service.get_book_reviews(book_id, current_user_id, page, limit)

@router.post("/{review_id}/like")
async def like_review(
    review_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Like or unlike a review"""
    reviews_service = ReviewsService(db)
    is_liked = reviews_service.like_review(current_user.id, review_id)
    return {
        "message": "Review liked" if is_liked else "Review unliked",
        "is_liked": is_liked
    }

@router.get("/user/{user_id}/book/{book_id}", response_model=Optional[ReviewResponse])
async def get_user_review_for_book(
    user_id: UUID,
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get a specific user's review for a book"""
    reviews_service = ReviewsService(db)
    review = reviews_service.get_user_review(user_id, book_id)
    if review:
        return reviews_service._build_review_response(review, current_user.id)
    return None

@router.get("/can-review/{book_id}")
async def can_user_review_book(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user can review a book (has started reading and hasn't reviewed yet)"""
    reviews_service = ReviewsService(db)
    
    has_started_reading = reviews_service.has_user_started_reading(current_user.id, book_id)
    existing_review = reviews_service.get_user_review(current_user.id, book_id)
    
    return {
        "can_review": has_started_reading and existing_review is None,
        "has_started_reading": has_started_reading,
        "has_existing_review": existing_review is not None
    }