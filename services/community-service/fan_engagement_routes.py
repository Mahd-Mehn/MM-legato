"""
Fan engagement API routes for fan clubs, exclusive content, and direct messaging
"""
from fastapi import APIRouter, HTTPException, Depends, Query, Path
from typing import List, Optional
import logging

from fan_engagement_service import FanEngagementService
from schemas import (
    FanClubCreateRequest, FanClubUpdateRequest, FanClubResponse, FanClubListResponse,
    FanClubMembershipRequest, FanClubMembershipResponse,
    ExclusiveContentCreateRequest, ExclusiveContentResponse, ExclusiveContentListResponse,
    DirectMessageCreateRequest, DirectMessageResponse, DirectMessageListResponse,
    ExclusiveEventCreateRequest, ExclusiveEventResponse, ExclusiveEventListResponse,
    EventRegistrationRequest, EventRegistrationResponse,
    EarlyAccessContentRequest, EarlyAccessContentResponse,
    SuccessResponse, ErrorResponse,
    FanClubFilterRequest, ExclusiveContentFilterRequest, DirectMessageFilterRequest,
    ExclusiveEventFilterRequest
)

router = APIRouter(prefix="/fan-engagement", tags=["fan-engagement"])
logger = logging.getLogger(__name__)

# Dependency to get current user ID (placeholder - implement based on auth system)
def get_current_user_id() -> str:
    """Get current authenticated user ID"""
    # TODO: Implement actual authentication
    return "user-123"

def get_fan_engagement_service() -> FanEngagementService:
    """Get fan engagement service instance"""
    return FanEngagementService()

# Fan Club Management Endpoints

@router.post("/fan-clubs", response_model=FanClubResponse)
async def create_fan_club(
    request: FanClubCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Create a new fan club for the current writer"""
    try:
        fan_club = service.create_fan_club(current_user_id, request)
        return FanClubResponse.from_orm(fan_club)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating fan club: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/fan-clubs", response_model=FanClubListResponse)
async def list_fan_clubs(
    writer_id: Optional[str] = Query(None, description="Filter by writer ID"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    min_members: Optional[int] = Query(None, description="Minimum member count"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """List fan clubs with filtering and pagination"""
    try:
        fan_clubs, total = service.list_fan_clubs(
            page=page, per_page=per_page, writer_id=writer_id,
            is_active=is_active, min_members=min_members,
            sort_by=sort_by, sort_order=sort_order
        )
        
        total_pages = (total + per_page - 1) // per_page
        
        return FanClubListResponse(
            fan_clubs=[FanClubResponse.from_orm(fc) for fc in fan_clubs],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Error listing fan clubs: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/fan-clubs/{fan_club_id}", response_model=FanClubResponse)
async def get_fan_club(
    fan_club_id: str = Path(..., description="Fan club ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get fan club details"""
    try:
        fan_club = service.get_fan_club(fan_club_id, current_user_id)
        if not fan_club:
            raise HTTPException(status_code=404, detail="Fan club not found")
        
        return FanClubResponse.from_orm(fan_club)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting fan club: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.put("/fan-clubs/{fan_club_id}", response_model=FanClubResponse)
async def update_fan_club(
    fan_club_id: str = Path(..., description="Fan club ID"),
    request: FanClubUpdateRequest = ...,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Update fan club details"""
    try:
        fan_club = service.update_fan_club(fan_club_id, current_user_id, request)
        return FanClubResponse.from_orm(fan_club)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating fan club: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/writers/{writer_id}/fan-club", response_model=FanClubResponse)
async def get_writer_fan_club(
    writer_id: str = Path(..., description="Writer ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get fan club for a specific writer"""
    try:
        fan_club = service.get_writer_fan_club(writer_id)
        if not fan_club:
            raise HTTPException(status_code=404, detail="Fan club not found")
        
        return FanClubResponse.from_orm(fan_club)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting writer fan club: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Fan Club Membership Endpoints

@router.post("/fan-clubs/{fan_club_id}/join", response_model=FanClubMembershipResponse)
async def join_fan_club(
    fan_club_id: str = Path(..., description="Fan club ID"),
    request: FanClubMembershipRequest = ...,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Join a fan club with specified tier"""
    try:
        membership = service.join_fan_club(fan_club_id, current_user_id, request)
        return FanClubMembershipResponse.from_orm(membership)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error joining fan club: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/memberships/{membership_id}", response_model=SuccessResponse)
async def cancel_membership(
    membership_id: str = Path(..., description="Membership ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Cancel fan club membership"""
    try:
        service.cancel_membership(membership_id, current_user_id)
        return SuccessResponse(message="Membership cancelled successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling membership: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/users/{user_id}/memberships", response_model=List[FanClubMembershipResponse])
async def get_user_memberships(
    user_id: str = Path(..., description="User ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get all fan club memberships for a user"""
    try:
        # Only allow users to see their own memberships or public info
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        memberships = service.get_user_memberships(user_id)
        return [FanClubMembershipResponse.from_orm(m) for m in memberships]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user memberships: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Exclusive Content Endpoints

@router.post("/fan-clubs/{fan_club_id}/exclusive-content", response_model=ExclusiveContentResponse)
async def create_exclusive_content(
    fan_club_id: str = Path(..., description="Fan club ID"),
    request: ExclusiveContentCreateRequest = ...,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Create exclusive content for fan club members"""
    try:
        content = service.create_exclusive_content(fan_club_id, current_user_id, request)
        return ExclusiveContentResponse.from_orm(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating exclusive content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/fan-clubs/{fan_club_id}/exclusive-content", response_model=ExclusiveContentListResponse)
async def list_exclusive_content(
    fan_club_id: str = Path(..., description="Fan club ID"),
    content_type: Optional[str] = Query(None, description="Filter by content type"),
    required_tier: Optional[str] = Query(None, description="Filter by required tier"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    is_early_access: Optional[bool] = Query(None, description="Filter by early access"),
    is_featured: Optional[bool] = Query(None, description="Filter by featured status"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """List exclusive content with access control"""
    try:
        filters = {
            "content_type": content_type,
            "required_tier": required_tier,
            "is_published": is_published,
            "is_early_access": is_early_access,
            "is_featured": is_featured,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        content, total = service.list_exclusive_content(
            fan_club_id, current_user_id, page, per_page, **filters
        )
        
        total_pages = (total + per_page - 1) // per_page
        
        return ExclusiveContentListResponse(
            content=[ExclusiveContentResponse.from_orm(c) for c in content],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Error listing exclusive content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/exclusive-content/{content_id}", response_model=ExclusiveContentResponse)
async def get_exclusive_content(
    content_id: str = Path(..., description="Content ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get exclusive content details"""
    try:
        content = service.get_exclusive_content(content_id, current_user_id)
        if not content:
            raise HTTPException(status_code=404, detail="Content not found")
        
        # Check access permissions
        if not service.check_membership_access(current_user_id, content.fan_club_id, content.required_tier.value):
            raise HTTPException(status_code=403, detail="Insufficient membership tier")
        
        # Record view interaction
        service.interact_with_content(content_id, current_user_id, "view")
        
        return ExclusiveContentResponse.from_orm(content)
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting exclusive content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/exclusive-content/{content_id}/like", response_model=SuccessResponse)
async def like_exclusive_content(
    content_id: str = Path(..., description="Content ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Like exclusive content"""
    try:
        service.interact_with_content(content_id, current_user_id, "like")
        return SuccessResponse(message="Content liked successfully")
    except Exception as e:
        logger.error(f"Error liking content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/exclusive-content/{content_id}/like", response_model=SuccessResponse)
async def unlike_exclusive_content(
    content_id: str = Path(..., description="Content ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Unlike exclusive content"""
    try:
        service.interact_with_content(content_id, current_user_id, "unlike")
        return SuccessResponse(message="Content unliked successfully")
    except Exception as e:
        logger.error(f"Error unliking content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/exclusive-content/{content_id}/publish", response_model=ExclusiveContentResponse)
async def publish_exclusive_content(
    content_id: str = Path(..., description="Content ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Publish exclusive content"""
    try:
        content = service.publish_exclusive_content(content_id, current_user_id)
        return ExclusiveContentResponse.from_orm(content)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error publishing content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Direct Messaging Endpoints

@router.post("/direct-messages", response_model=DirectMessageResponse)
async def send_direct_message(
    request: DirectMessageCreateRequest,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Send direct message"""
    try:
        message = service.send_direct_message(current_user_id, request)
        return DirectMessageResponse.from_orm(message)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending direct message: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/users/{user_id}/messages", response_model=DirectMessageListResponse)
async def get_user_messages(
    user_id: str = Path(..., description="User ID"),
    thread_id: Optional[str] = Query(None, description="Filter by thread ID"),
    sender_id: Optional[str] = Query(None, description="Filter by sender ID"),
    recipient_id: Optional[str] = Query(None, description="Filter by recipient ID"),
    status: Optional[str] = Query(None, description="Filter by message status"),
    is_fan_club_exclusive: Optional[bool] = Query(None, description="Filter by fan club exclusive"),
    sort_by: str = Query("sent_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get messages for a user"""
    try:
        # Only allow users to see their own messages
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        filters = {
            "sender_id": sender_id,
            "recipient_id": recipient_id,
            "status": status,
            "is_fan_club_exclusive": is_fan_club_exclusive,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        messages, total = service.get_user_messages(
            user_id, page, per_page, thread_id, **filters
        )
        
        # Count unread messages
        unread_count = sum(1 for m in messages if m.recipient_id == user_id and m.status != "read")
        total_pages = (total + per_page - 1) // per_page
        
        return DirectMessageListResponse(
            messages=[DirectMessageResponse.from_orm(m) for m in messages],
            total=total,
            unread_count=unread_count,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user messages: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/messages/{message_id}/read", response_model=SuccessResponse)
async def mark_message_read(
    message_id: str = Path(..., description="Message ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Mark message as read"""
    try:
        service.mark_message_read(message_id, current_user_id)
        return SuccessResponse(message="Message marked as read")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error marking message as read: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Exclusive Events Endpoints

@router.post("/fan-clubs/{fan_club_id}/events", response_model=ExclusiveEventResponse)
async def create_exclusive_event(
    fan_club_id: str = Path(..., description="Fan club ID"),
    request: ExclusiveEventCreateRequest = ...,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Create exclusive event for fan club members"""
    try:
        event = service.create_exclusive_event(fan_club_id, current_user_id, request)
        return ExclusiveEventResponse.from_orm(event)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating exclusive event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/fan-clubs/{fan_club_id}/events", response_model=ExclusiveEventListResponse)
async def list_exclusive_events(
    fan_club_id: str = Path(..., description="Fan club ID"),
    event_type: Optional[str] = Query(None, description="Filter by event type"),
    status: Optional[str] = Query(None, description="Filter by event status"),
    required_tier: Optional[str] = Query(None, description="Filter by required tier"),
    upcoming_only: Optional[bool] = Query(None, description="Show only upcoming events"),
    sort_by: str = Query("starts_at", description="Sort field"),
    sort_order: str = Query("asc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """List exclusive events with access control"""
    try:
        filters = {
            "event_type": event_type,
            "status": status,
            "required_tier": required_tier,
            "upcoming_only": upcoming_only,
            "sort_by": sort_by,
            "sort_order": sort_order
        }
        
        events, total = service.list_exclusive_events(
            fan_club_id, current_user_id, page, per_page, **filters
        )
        
        total_pages = (total + per_page - 1) // per_page
        
        return ExclusiveEventListResponse(
            events=[ExclusiveEventResponse.from_orm(e) for e in events],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        logger.error(f"Error listing exclusive events: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/events/{event_id}/register", response_model=EventRegistrationResponse)
async def register_for_event(
    event_id: str = Path(..., description="Event ID"),
    request: EventRegistrationRequest = ...,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Register for exclusive event"""
    try:
        registration = service.register_for_event(event_id, current_user_id, request)
        return EventRegistrationResponse.from_orm(registration)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error registering for event: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/events/{event_id}/register", response_model=SuccessResponse)
async def cancel_event_registration(
    event_id: str = Path(..., description="Event ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Cancel event registration"""
    try:
        service.cancel_event_registration(event_id, current_user_id)
        return SuccessResponse(message="Event registration cancelled successfully")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error cancelling event registration: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/users/{user_id}/event-registrations", response_model=List[EventRegistrationResponse])
async def get_user_event_registrations(
    user_id: str = Path(..., description="User ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get all event registrations for a user"""
    try:
        # Only allow users to see their own registrations
        if user_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        registrations = service.get_user_event_registrations(user_id)
        return [EventRegistrationResponse.from_orm(r) for r in registrations]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user event registrations: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

# Early Access Content Endpoints

@router.post("/early-access", response_model=EarlyAccessContentResponse)
async def create_early_access(
    request: EarlyAccessContentRequest,
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Create early access configuration for content"""
    try:
        early_access = service.create_early_access(current_user_id, request)
        return EarlyAccessContentResponse.from_orm(early_access)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating early access: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/early-access/check/{content_type}/{content_id}")
async def check_early_access(
    content_type: str = Path(..., description="Content type"),
    content_id: str = Path(..., description="Content ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Check if user has early access to content"""
    try:
        has_access = service.check_early_access(current_user_id, content_type, content_id)
        return {"has_early_access": has_access}
    except Exception as e:
        logger.error(f"Error checking early access: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.post("/early-access/grant/{content_type}/{content_id}")
async def grant_early_access(
    content_type: str = Path(..., description="Content type"),
    content_id: str = Path(..., description="Content ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Grant early access to user and update count"""
    try:
        granted = service.grant_early_access(current_user_id, content_type, content_id)
        return {"access_granted": granted}
    except Exception as e:
        logger.error(f"Error granting early access: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.get("/writers/{writer_id}/early-access", response_model=List[EarlyAccessContentResponse])
async def get_writer_early_access_content(
    writer_id: str = Path(..., description="Writer ID"),
    current_user_id: str = Depends(get_current_user_id),
    service: FanEngagementService = Depends(get_fan_engagement_service)
):
    """Get all early access content for a writer"""
    try:
        # Only allow writers to see their own early access content
        if writer_id != current_user_id:
            raise HTTPException(status_code=403, detail="Access denied")
        
        early_access_content = service.get_writer_early_access_content(writer_id)
        return [EarlyAccessContentResponse.from_orm(eac) for eac in early_access_content]
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting writer early access content: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")