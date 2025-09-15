"""
User Management Service API Routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.orm import Session
from typing import List, Optional
import logging

from database import get_database
from user_service import UserProfileService, UserRelationshipService, UserSubscriptionService
from schemas import (
    UserProfileResponse, UserProfileUpdateRequest, UserPreferencesResponse,
    UserPreferencesUpdateRequest, UserRelationshipResponse, FollowUserRequest,
    UnfollowUserRequest, BlockUserRequest, UserListResponse, UserSubscriptionResponse,
    CreateSubscriptionRequest, UpdateSubscriptionRequest, FanClubMembershipRequest,
    UserStatsResponse, SearchUsersRequest, ErrorResponse, SuccessResponse
)

logger = logging.getLogger(__name__)

# Create router
router = APIRouter(prefix="/api/v1/users", tags=["users"])

# Profile Management Endpoints
@router.get("/{user_id}/profile", response_model=UserProfileResponse)
async def get_user_profile(
    user_id: str,
    db: Session = Depends(get_database)
):
    """Get user profile by user ID"""
    try:
        service = UserProfileService(db)
        profile = service.get_profile_by_user_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{user_id}/profile", response_model=UserProfileResponse)
async def create_user_profile(
    user_id: str,
    profile_data: UserProfileUpdateRequest,
    db: Session = Depends(get_database)
):
    """Create a new user profile"""
    try:
        service = UserProfileService(db)
        
        # Check if profile already exists
        existing_profile = service.get_profile_by_user_id(user_id)
        if existing_profile:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="User profile already exists"
            )
        
        # Create profile
        profile_dict = profile_data.dict(exclude_unset=True)
        profile = service.create_profile(user_id, profile_dict)
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.put("/{user_id}/profile", response_model=UserProfileResponse)
async def update_user_profile(
    user_id: str,
    profile_data: UserProfileUpdateRequest,
    db: Session = Depends(get_database)
):
    """Update user profile"""
    try:
        service = UserProfileService(db)
        profile = service.update_profile(user_id, profile_data)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return profile
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{user_id}/preferences", response_model=UserPreferencesResponse)
async def get_user_preferences(
    user_id: str,
    db: Session = Depends(get_database)
):
    """Get user preferences"""
    try:
        service = UserProfileService(db)
        profile = service.get_profile_by_user_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        # Build preferences response
        preferences = UserPreferencesResponse(
            notification_preferences=profile.notification_preferences or {},
            preferred_genres=profile.preferred_genres or [],
            content_rating_preference=profile.content_rating_preference,
            show_reading_activity=profile.show_reading_activity,
            allow_direct_messages=profile.allow_direct_messages
        )
        
        return preferences
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.put("/{user_id}/preferences", response_model=SuccessResponse)
async def update_user_preferences(
    user_id: str,
    preferences_data: UserPreferencesUpdateRequest,
    db: Session = Depends(get_database)
):
    """Update user preferences"""
    try:
        service = UserProfileService(db)
        success = service.update_preferences(user_id, preferences_data)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        return SuccessResponse(message="Preferences updated successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user preferences: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# User Relationship Endpoints
@router.post("/{user_id}/follow", response_model=SuccessResponse)
async def follow_user(
    user_id: str,
    follow_request: FollowUserRequest,
    db: Session = Depends(get_database)
):
    """Follow a user"""
    try:
        service = UserRelationshipService(db)
        success = service.follow_user(user_id, follow_request.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to follow user"
            )
        
        return SuccessResponse(message="User followed successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error following user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{user_id}/unfollow", response_model=SuccessResponse)
async def unfollow_user(
    user_id: str,
    unfollow_request: UnfollowUserRequest,
    db: Session = Depends(get_database)
):
    """Unfollow a user"""
    try:
        service = UserRelationshipService(db)
        success = service.unfollow_user(user_id, unfollow_request.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to unfollow user"
            )
        
        return SuccessResponse(message="User unfollowed successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error unfollowing user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{user_id}/block", response_model=SuccessResponse)
async def block_user(
    user_id: str,
    block_request: BlockUserRequest,
    db: Session = Depends(get_database)
):
    """Block a user"""
    try:
        service = UserRelationshipService(db)
        success = service.block_user(user_id, block_request.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to block user"
            )
        
        return SuccessResponse(message="User blocked successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error blocking user: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{user_id}/followers", response_model=UserListResponse)
async def get_user_followers(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_database)
):
    """Get user followers"""
    try:
        service = UserRelationshipService(db)
        profiles, total = service.get_followers(user_id, page, per_page)
        
        return UserListResponse(
            users=profiles,
            total=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        logger.error(f"Error getting user followers: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{user_id}/following", response_model=UserListResponse)
async def get_user_following(
    user_id: str,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_database)
):
    """Get users that this user is following"""
    try:
        service = UserRelationshipService(db)
        profiles, total = service.get_following(user_id, page, per_page)
        
        return UserListResponse(
            users=profiles,
            total=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        logger.error(f"Error getting user following: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Subscription Management Endpoints
@router.get("/{user_id}/subscription", response_model=UserSubscriptionResponse)
async def get_user_subscription(
    user_id: str,
    db: Session = Depends(get_database)
):
    """Get user's current subscription"""
    try:
        service = UserSubscriptionService(db)
        subscription = service.get_subscription(user_id)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No subscription found"
            )
        
        return subscription
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{user_id}/subscription", response_model=UserSubscriptionResponse)
async def create_user_subscription(
    user_id: str,
    subscription_data: CreateSubscriptionRequest,
    db: Session = Depends(get_database)
):
    """Create a new subscription"""
    try:
        service = UserSubscriptionService(db)
        subscription = service.create_subscription(user_id, subscription_data)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Unable to create subscription"
            )
        
        return subscription
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating user subscription: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.post("/{user_id}/fan-club/{creator_id}", response_model=SuccessResponse)
async def join_fan_club(
    user_id: str,
    creator_id: str,
    db: Session = Depends(get_database)
):
    """Join a creator's fan club"""
    try:
        service = UserSubscriptionService(db)
        subscription = service.get_subscription(user_id)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        subscription.add_fan_club_membership(creator_id)
        db.commit()
        
        return SuccessResponse(message="Joined fan club successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error joining fan club: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.delete("/{user_id}/fan-club/{creator_id}", response_model=SuccessResponse)
async def leave_fan_club(
    user_id: str,
    creator_id: str,
    db: Session = Depends(get_database)
):
    """Leave a creator's fan club"""
    try:
        service = UserSubscriptionService(db)
        subscription = service.get_subscription(user_id)
        
        if not subscription:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active subscription found"
            )
        
        subscription.remove_fan_club_membership(creator_id)
        db.commit()
        
        return SuccessResponse(message="Left fan club successfully")
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error leaving fan club: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

# Search and Discovery Endpoints
@router.get("/search", response_model=UserListResponse)
async def search_users(
    query: str = Query(..., min_length=1, max_length=100),
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    db: Session = Depends(get_database)
):
    """Search users"""
    try:
        service = UserProfileService(db)
        profiles, total = service.search_profiles(query, page, per_page)
        
        return UserListResponse(
            users=profiles,
            total=total,
            page=page,
            per_page=per_page
        )
    except Exception as e:
        logger.error(f"Error searching users: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )

@router.get("/{user_id}/stats", response_model=UserStatsResponse)
async def get_user_stats(
    user_id: str,
    db: Session = Depends(get_database)
):
    """Get user statistics"""
    try:
        service = UserProfileService(db)
        profile = service.get_profile_by_user_id(user_id)
        
        if not profile:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User profile not found"
            )
        
        stats = UserStatsResponse(
            user_id=user_id,
            followers_count=profile.followers_count,
            following_count=profile.following_count,
            stories_count=profile.stories_count,
            total_reads=0,  # This would come from analytics service
            total_likes=0,  # This would come from analytics service
            join_date=profile.created_at
        )
        
        return stats
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user stats: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Internal server error"
        )