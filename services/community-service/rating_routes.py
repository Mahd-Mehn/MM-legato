"""
Rating API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import logging

from database import get_database
from rating_service import RatingService
from schemas import (
    RatingCreateRequest, RatingUpdateRequest, RatingResponse,
    RatingListResponse, RatingStatsResponse, RatingFilterRequest,
    HelpfulnessVoteRequest, ReportCreateRequest, ModerationActionRequest,
    ErrorResponse, SuccessResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/ratings", tags=["ratings"])

# Mock auth dependency - replace with actual auth service integration
def get_current_user_id() -> str:
    """Mock function to get current user ID - replace with actual auth"""
    return "550e8400-e29b-41d4-a716-446655440000"

def get_current_user_id_optional() -> Optional[str]:
    """Mock function to get current user ID (optional) - replace with actual auth"""
    return "550e8400-e29b-41d4-a716-446655440000"

def verify_moderator(user_id: str = Depends(get_current_user_id)) -> str:
    """Mock function to verify moderator permissions - replace with actual auth"""
    # TODO: Implement actual moderator verification
    return user_id

@router.post("/", response_model=RatingResponse, status_code=status.HTTP_201_CREATED)
async def create_rating(
    request: RatingCreateRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new rating/review"""
    try:
        service = RatingService(db)
        rating = service.create_rating(request, user_id)
        
        return RatingResponse(
            id=str(rating.id),
            story_id=str(rating.story_id),
            user_id=str(rating.user_id),
            rating=rating.rating,
            review_title=rating.review_title,
            review_content=rating.review_content,
            helpful_count=rating.helpful_count,
            not_helpful_count=rating.not_helpful_count,
            status=rating.status,
            is_verified_reader=rating.is_verified_reader,
            user_helpfulness_vote=None,  # TODO: Get user's vote
            created_at=rating.created_at,
            updated_at=rating.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating rating: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/{rating_id}", response_model=RatingResponse)
async def get_rating(
    rating_id: str,
    db: Session = Depends(get_database),
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Get a rating by ID"""
    try:
        service = RatingService(db)
        rating = service.get_rating(rating_id, user_id)
        
        if not rating:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
        
        # Get user's helpfulness vote if user is authenticated
        user_helpfulness_vote = None
        if user_id and rating.helpfulness_votes:
            for vote in rating.helpfulness_votes:
                if str(vote.user_id) == user_id:
                    user_helpfulness_vote = vote.is_helpful
                    break
        
        return RatingResponse(
            id=str(rating.id),
            story_id=str(rating.story_id),
            user_id=str(rating.user_id),
            rating=rating.rating,
            review_title=rating.review_title,
            review_content=rating.review_content,
            helpful_count=rating.helpful_count,
            not_helpful_count=rating.not_helpful_count,
            status=rating.status,
            is_verified_reader=rating.is_verified_reader,
            user_helpfulness_vote=user_helpfulness_vote,
            created_at=rating.created_at,
            updated_at=rating.updated_at
        )
        
    except Exception as e:
        logger.error(f"Error getting rating {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/story/{story_id}/user", response_model=RatingResponse)
async def get_user_rating_for_story(
    story_id: str,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Get current user's rating for a specific story"""
    try:
        service = RatingService(db)
        rating = service.get_user_rating_for_story(story_id, user_id)
        
        if not rating:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
        
        return RatingResponse(
            id=str(rating.id),
            story_id=str(rating.story_id),
            user_id=str(rating.user_id),
            rating=rating.rating,
            review_title=rating.review_title,
            review_content=rating.review_content,
            helpful_count=rating.helpful_count,
            not_helpful_count=rating.not_helpful_count,
            status=rating.status,
            is_verified_reader=rating.is_verified_reader,
            user_helpfulness_vote=None,
            created_at=rating.created_at,
            updated_at=rating.updated_at
        )
        
    except Exception as e:
        logger.error(f"Error getting user rating for story {story_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/{rating_id}", response_model=RatingResponse)
async def update_rating(
    rating_id: str,
    request: RatingUpdateRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Update a rating (author only)"""
    try:
        service = RatingService(db)
        rating = service.update_rating(rating_id, request, user_id)
        
        if not rating:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found or not authorized")
        
        return RatingResponse(
            id=str(rating.id),
            story_id=str(rating.story_id),
            user_id=str(rating.user_id),
            rating=rating.rating,
            review_title=rating.review_title,
            review_content=rating.review_content,
            helpful_count=rating.helpful_count,
            not_helpful_count=rating.not_helpful_count,
            status=rating.status,
            is_verified_reader=rating.is_verified_reader,
            user_helpfulness_vote=None,
            created_at=rating.created_at,
            updated_at=rating.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating rating {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/{rating_id}", response_model=SuccessResponse)
async def delete_rating(
    rating_id: str,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a rating (author only)"""
    try:
        service = RatingService(db)
        success = service.delete_rating(rating_id, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found or not authorized")
        
        return SuccessResponse(message="Rating deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting rating {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/", response_model=RatingListResponse)
async def get_ratings(
    story_id: Optional[str] = Query(None, description="Filter by story ID"),
    user_id_filter: Optional[str] = Query(None, alias="user_id", description="Filter by user ID"),
    min_rating: Optional[int] = Query(None, ge=1, le=5, description="Minimum rating"),
    max_rating: Optional[int] = Query(None, ge=1, le=5, description="Maximum rating"),
    has_review: Optional[bool] = Query(None, description="Filter by review presence"),
    status: Optional[str] = Query(None, description="Filter by status"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_database),
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Get ratings with filtering and pagination"""
    try:
        # Build filter request
        filters = RatingFilterRequest(
            story_id=story_id,
            user_id=user_id_filter,
            min_rating=min_rating,
            max_rating=max_rating,
            has_review=has_review,
            status=status,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )
        
        service = RatingService(db)
        ratings, total = service.get_ratings(filters, user_id)
        
        # Convert to response format
        rating_responses = []
        for rating in ratings:
            # Get user's helpfulness vote if authenticated
            user_helpfulness_vote = None
            if user_id and rating.helpfulness_votes:
                for vote in rating.helpfulness_votes:
                    if str(vote.user_id) == user_id:
                        user_helpfulness_vote = vote.is_helpful
                        break
            
            rating_responses.append(RatingResponse(
                id=str(rating.id),
                story_id=str(rating.story_id),
                user_id=str(rating.user_id),
                rating=rating.rating,
                review_title=rating.review_title,
                review_content=rating.review_content,
                helpful_count=rating.helpful_count,
                not_helpful_count=rating.not_helpful_count,
                status=rating.status,
                is_verified_reader=rating.is_verified_reader,
                user_helpfulness_vote=user_helpfulness_vote,
                created_at=rating.created_at,
                updated_at=rating.updated_at
            ))
        
        total_pages = (total + per_page - 1) // per_page
        
        # Calculate additional stats if filtering by story
        average_rating = None
        rating_distribution = {}
        if story_id:
            stats = service.get_story_rating_stats(story_id)
            average_rating = stats['average_rating']
            rating_distribution = stats['rating_distribution']
        
        return RatingListResponse(
            ratings=rating_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages,
            average_rating=average_rating,
            rating_distribution=rating_distribution
        )
        
    except Exception as e:
        logger.error(f"Error getting ratings: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/story/{story_id}/stats", response_model=RatingStatsResponse)
async def get_story_rating_stats(
    story_id: str,
    db: Session = Depends(get_database)
):
    """Get rating statistics for a story"""
    try:
        service = RatingService(db)
        stats = service.get_story_rating_stats(story_id)
        
        return RatingStatsResponse(
            story_id=stats['story_id'],
            total_ratings=stats['total_ratings'],
            average_rating=stats['average_rating'],
            rating_distribution=stats['rating_distribution'],
            total_reviews=stats['total_reviews']
        )
        
    except Exception as e:
        logger.error(f"Error getting story rating stats for {story_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{rating_id}/helpful", response_model=SuccessResponse)
async def vote_helpfulness(
    rating_id: str,
    request: HelpfulnessVoteRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Vote on rating helpfulness"""
    try:
        service = RatingService(db)
        success = service.vote_helpfulness(rating_id, request, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
        
        vote_type = "helpful" if request.is_helpful else "not helpful"
        return SuccessResponse(message=f"Rating marked as {vote_type} successfully")
        
    except Exception as e:
        logger.error(f"Error voting on rating helpfulness {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/{rating_id}/helpful", response_model=SuccessResponse)
async def remove_helpfulness_vote(
    rating_id: str,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Remove helpfulness vote from a rating"""
    try:
        service = RatingService(db)
        success = service.remove_helpfulness_vote(rating_id, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Helpfulness vote not found")
        
        return SuccessResponse(message="Helpfulness vote removed successfully")
        
    except Exception as e:
        logger.error(f"Error removing helpfulness vote from rating {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{rating_id}/report", response_model=SuccessResponse)
async def report_rating(
    rating_id: str,
    request: ReportCreateRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Report a rating for moderation"""
    try:
        service = RatingService(db)
        success = service.report_rating(rating_id, request, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Rating not found or already reported")
        
        return SuccessResponse(message="Rating reported successfully")
        
    except Exception as e:
        logger.error(f"Error reporting rating {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{rating_id}/moderate", response_model=SuccessResponse)
async def moderate_rating(
    rating_id: str,
    request: ModerationActionRequest,
    db: Session = Depends(get_database),
    moderator_id: str = Depends(verify_moderator)
):
    """Moderate a rating (moderator only)"""
    try:
        service = RatingService(db)
        success = service.moderate_rating(rating_id, request, moderator_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Rating not found")
        
        return SuccessResponse(message=f"Rating {request.action.value} successfully")
        
    except Exception as e:
        logger.error(f"Error moderating rating {rating_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")