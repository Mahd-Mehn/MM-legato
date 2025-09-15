"""
Social engagement API routes for user following, notifications, achievements, and contests
"""
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import logging

from database import get_database as get_db
from social_service import SocialService
from schemas import (
    FollowUserRequest, UnfollowUserRequest, FollowResponse, UserFollowStats,
    NotificationResponse, NotificationListResponse, MarkNotificationRequest,
    UserAchievementResponse, UserStatsResponse, ContestCreateRequest,
    ContestResponse, ContestListResponse, ContestParticipationRequest,
    ContestSubmissionRequest, SocialShareRequest, SocialShareResponse,
    LeaderboardResponse, NotificationFilterRequest, ContestFilterRequest,
    ErrorResponse, SuccessResponse
)

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/social", tags=["social"])

def get_social_service(db: Session = Depends(get_db)) -> SocialService:
    """Get social service instance"""
    return SocialService(db)

# User Following Endpoints

@router.post("/follow", response_model=FollowResponse)
async def follow_user(
    request: FollowUserRequest,
    follower_id: str = Query(..., description="ID of user doing the following"),
    social_service: SocialService = Depends(get_social_service)
):
    """Follow a user"""
    try:
        return social_service.follow_user(follower_id, request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error following user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/follow/{following_id}")
async def unfollow_user(
    following_id: str,
    follower_id: str = Query(..., description="ID of user doing the unfollowing"),
    social_service: SocialService = Depends(get_social_service)
):
    """Unfollow a user"""
    try:
        success = social_service.unfollow_user(follower_id, following_id)
        return SuccessResponse(message="Successfully unfollowed user")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error unfollowing user: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/follow/stats/{user_id}", response_model=UserFollowStats)
async def get_follow_stats(
    user_id: str,
    current_user_id: Optional[str] = Query(None, description="Current user ID for relationship status"),
    social_service: SocialService = Depends(get_social_service)
):
    """Get user follow statistics"""
    try:
        return social_service.get_user_follow_stats(user_id, current_user_id)
    except Exception as e:
        logger.error(f"Error getting follow stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Notification Endpoints

@router.get("/notifications", response_model=NotificationListResponse)
async def get_notifications(
    user_id: str = Query(..., description="User ID"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    type_filter: Optional[str] = Query(None, description="Filter by notification type"),
    is_read: Optional[bool] = Query(None, description="Filter by read status"),
    social_service: SocialService = Depends(get_social_service)
):
    """Get user notifications"""
    try:
        return social_service.get_user_notifications(user_id, page, per_page, type_filter, is_read)
    except Exception as e:
        logger.error(f"Error getting notifications: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.patch("/notifications/{notification_id}")
async def mark_notification(
    notification_id: str,
    request: MarkNotificationRequest,
    user_id: str = Query(..., description="User ID"),
    social_service: SocialService = Depends(get_social_service)
):
    """Mark notification as read/unread or dismissed"""
    try:
        if request.is_read is not None:
            social_service.mark_notification_read(notification_id, user_id, request.is_read)
        
        return SuccessResponse(message="Notification updated successfully")
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        logger.error(f"Error marking notification: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/notifications/mark-all-read")
async def mark_all_notifications_read(
    user_id: str = Query(..., description="User ID"),
    social_service: SocialService = Depends(get_social_service)
):
    """Mark all notifications as read"""
    try:
        count = social_service.mark_all_notifications_read(user_id)
        return SuccessResponse(
            message=f"Marked {count} notifications as read",
            data={"count": count}
        )
    except Exception as e:
        logger.error(f"Error marking all notifications read: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Achievement Endpoints

@router.get("/achievements/{user_id}", response_model=List[UserAchievementResponse])
async def get_user_achievements(
    user_id: str,
    social_service: SocialService = Depends(get_social_service)
):
    """Get user's earned achievements"""
    try:
        return social_service.get_user_achievements(user_id)
    except Exception as e:
        logger.error(f"Error getting user achievements: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# User Statistics Endpoints

@router.get("/stats/{user_id}", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: str,
    social_service: SocialService = Depends(get_social_service)
):
    """Get user statistics"""
    try:
        return social_service.get_user_stats(user_id)
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Leaderboard Endpoints

@router.get("/leaderboard/{category}", response_model=LeaderboardResponse)
async def get_leaderboard(
    category: str,
    period: str = Query("all_time", description="Time period (daily, weekly, monthly, all_time)"),
    limit: int = Query(50, ge=1, le=100, description="Number of entries to return"),
    user_id: Optional[str] = Query(None, description="User ID to get current rank"),
    social_service: SocialService = Depends(get_social_service)
):
    """Get leaderboard for a category"""
    try:
        return social_service.get_leaderboard(category, period, limit, user_id)
    except Exception as e:
        logger.error(f"Error getting leaderboard: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Contest Endpoints

@router.post("/contests", response_model=ContestResponse)
async def create_contest(
    request: ContestCreateRequest,
    organizer_id: str = Query(..., description="Organizer user ID"),
    social_service: SocialService = Depends(get_social_service)
):
    """Create a new contest"""
    try:
        return social_service.create_contest(organizer_id, request)
    except Exception as e:
        logger.error(f"Error creating contest: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/contests", response_model=ContestListResponse)
async def get_contests(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status_filter: Optional[str] = Query(None, description="Filter by contest status"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    social_service: SocialService = Depends(get_social_service)
):
    """Get contests with pagination and filtering"""
    try:
        return social_service.get_contests(page, per_page, status_filter, is_featured)
    except Exception as e:
        logger.error(f"Error getting contests: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/contests/{contest_id}/join")
async def join_contest(
    contest_id: str,
    user_id: str = Query(..., description="User ID"),
    social_service: SocialService = Depends(get_social_service)
):
    """Join a contest"""
    try:
        success = social_service.join_contest(user_id, contest_id)
        return SuccessResponse(message="Successfully joined contest")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error joining contest: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/contests/{contest_id}/submit")
async def submit_to_contest(
    contest_id: str,
    request: ContestSubmissionRequest,
    user_id: str = Query(..., description="User ID"),
    social_service: SocialService = Depends(get_social_service)
):
    """Submit a story to a contest"""
    try:
        success = social_service.submit_to_contest(
            user_id, contest_id, request.story_id, request.title, request.description
        )
        return SuccessResponse(message="Successfully submitted to contest")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error submitting to contest: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Social Sharing Endpoints

@router.post("/share", response_model=SocialShareResponse)
async def create_social_share(
    request: SocialShareRequest,
    user_id: str = Query(..., description="User ID"),
    social_service: SocialService = Depends(get_social_service)
):
    """Create a social share link"""
    try:
        return social_service.create_social_share(user_id, request)
    except Exception as e:
        logger.error(f"Error creating social share: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/share/{share_id}/click")
async def track_share_click(
    share_id: str,
    social_service: SocialService = Depends(get_social_service)
):
    """Track a click on a shared link"""
    try:
        success = social_service.track_share_click(share_id)
        if success:
            return SuccessResponse(message="Share click tracked")
        else:
            raise HTTPException(status_code=404, detail="Share not found")
    except Exception as e:
        logger.error(f"Error tracking share click: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")