"""
Comment API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import Optional, List
import uuid
import logging

from database import get_database
from comment_service import CommentService
from schemas import (
    CommentCreateRequest, CommentUpdateRequest, CommentResponse,
    CommentListResponse, CommentThreadResponse, CommentFilterRequest,
    ReactionRequest, ReactionResponse, ReportCreateRequest,
    ModerationActionRequest, ErrorResponse, SuccessResponse
)

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/comments", tags=["comments"])

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

@router.post("/", response_model=CommentResponse, status_code=status.HTTP_201_CREATED)
async def create_comment(
    request: CommentCreateRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Create a new comment"""
    try:
        service = CommentService(db)
        comment = service.create_comment(request, user_id)
        
        return CommentResponse(
            id=str(comment.id),
            story_id=str(comment.story_id),
            chapter_id=str(comment.chapter_id),
            user_id=str(comment.user_id),
            parent_comment_id=str(comment.parent_comment_id) if comment.parent_comment_id else None,
            thread_root_id=str(comment.thread_root_id) if comment.thread_root_id else None,
            reply_depth=comment.reply_depth,
            content=comment.content,
            content_html=comment.content_html,
            status=comment.status,
            is_spoiler=comment.is_spoiler,
            is_pinned=comment.is_pinned,
            like_count=comment.like_count,
            dislike_count=comment.dislike_count,
            reply_count=comment.reply_count,
            user_reaction=None,  # TODO: Get user's reaction
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating comment: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/{comment_id}", response_model=CommentResponse)
async def get_comment(
    comment_id: str,
    db: Session = Depends(get_database),
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Get a comment by ID"""
    try:
        service = CommentService(db)
        comment = service.get_comment(comment_id, user_id)
        
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        
        # Get user's reaction if user is authenticated
        user_reaction = None
        if user_id and comment.reactions:
            for reaction in comment.reactions:
                if str(reaction.user_id) == user_id:
                    user_reaction = reaction.is_like
                    break
        
        return CommentResponse(
            id=str(comment.id),
            story_id=str(comment.story_id),
            chapter_id=str(comment.chapter_id),
            user_id=str(comment.user_id),
            parent_comment_id=str(comment.parent_comment_id) if comment.parent_comment_id else None,
            thread_root_id=str(comment.thread_root_id) if comment.thread_root_id else None,
            reply_depth=comment.reply_depth,
            content=comment.content,
            content_html=comment.content_html,
            status=comment.status,
            is_spoiler=comment.is_spoiler,
            is_pinned=comment.is_pinned,
            like_count=comment.like_count,
            dislike_count=comment.dislike_count,
            reply_count=comment.reply_count,
            user_reaction=user_reaction,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
        
    except Exception as e:
        logger.error(f"Error getting comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: str,
    request: CommentUpdateRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Update a comment (author only)"""
    try:
        service = CommentService(db)
        comment = service.update_comment(comment_id, request, user_id)
        
        if not comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found or not authorized")
        
        return CommentResponse(
            id=str(comment.id),
            story_id=str(comment.story_id),
            chapter_id=str(comment.chapter_id),
            user_id=str(comment.user_id),
            parent_comment_id=str(comment.parent_comment_id) if comment.parent_comment_id else None,
            thread_root_id=str(comment.thread_root_id) if comment.thread_root_id else None,
            reply_depth=comment.reply_depth,
            content=comment.content,
            content_html=comment.content_html,
            status=comment.status,
            is_spoiler=comment.is_spoiler,
            is_pinned=comment.is_pinned,
            like_count=comment.like_count,
            dislike_count=comment.dislike_count,
            reply_count=comment.reply_count,
            user_reaction=None,
            created_at=comment.created_at,
            updated_at=comment.updated_at
        )
        
    except ValueError as e:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        logger.error(f"Error updating comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/{comment_id}", response_model=SuccessResponse)
async def delete_comment(
    comment_id: str,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Delete a comment (author only)"""
    try:
        service = CommentService(db)
        success = service.delete_comment(comment_id, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found or not authorized")
        
        return SuccessResponse(message="Comment deleted successfully")
        
    except Exception as e:
        logger.error(f"Error deleting comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/", response_model=CommentListResponse)
async def get_comments(
    story_id: Optional[str] = Query(None, description="Filter by story ID"),
    chapter_id: Optional[str] = Query(None, description="Filter by chapter ID"),
    user_id_filter: Optional[str] = Query(None, alias="user_id", description="Filter by user ID"),
    status: Optional[str] = Query(None, description="Filter by status"),
    is_spoiler: Optional[bool] = Query(None, description="Filter by spoiler flag"),
    parent_comment_id: Optional[str] = Query(None, description="Filter by parent comment ID"),
    sort_by: str = Query("created_at", description="Sort field"),
    sort_order: str = Query("desc", description="Sort order"),
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    db: Session = Depends(get_database),
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Get comments with filtering and pagination"""
    try:
        # Build filter request
        filters = CommentFilterRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            user_id=user_id_filter,
            status=status,
            is_spoiler=is_spoiler,
            parent_comment_id=parent_comment_id,
            sort_by=sort_by,
            sort_order=sort_order,
            page=page,
            per_page=per_page
        )
        
        service = CommentService(db)
        comments, total = service.get_comments(filters, user_id)
        
        # Convert to response format
        comment_responses = []
        for comment in comments:
            # Get user's reaction if authenticated
            user_reaction = None
            if user_id and comment.reactions:
                for reaction in comment.reactions:
                    if str(reaction.user_id) == user_id:
                        user_reaction = reaction.is_like
                        break
            
            comment_responses.append(CommentResponse(
                id=str(comment.id),
                story_id=str(comment.story_id),
                chapter_id=str(comment.chapter_id),
                user_id=str(comment.user_id),
                parent_comment_id=str(comment.parent_comment_id) if comment.parent_comment_id else None,
                thread_root_id=str(comment.thread_root_id) if comment.thread_root_id else None,
                reply_depth=comment.reply_depth,
                content=comment.content,
                content_html=comment.content_html,
                status=comment.status,
                is_spoiler=comment.is_spoiler,
                is_pinned=comment.is_pinned,
                like_count=comment.like_count,
                dislike_count=comment.dislike_count,
                reply_count=comment.reply_count,
                user_reaction=user_reaction,
                created_at=comment.created_at,
                updated_at=comment.updated_at
            ))
        
        total_pages = (total + per_page - 1) // per_page
        
        return CommentListResponse(
            comments=comment_responses,
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
        
    except Exception as e:
        logger.error(f"Error getting comments: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{comment_id}/react", response_model=SuccessResponse)
async def react_to_comment(
    comment_id: str,
    request: ReactionRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Add or update a reaction to a comment"""
    try:
        service = CommentService(db)
        success = service.react_to_comment(comment_id, request, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        
        reaction_type = "like" if request.is_like else "dislike"
        return SuccessResponse(message=f"Comment {reaction_type} added successfully")
        
    except Exception as e:
        logger.error(f"Error reacting to comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.delete("/{comment_id}/react", response_model=SuccessResponse)
async def remove_reaction(
    comment_id: str,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Remove reaction from a comment"""
    try:
        service = CommentService(db)
        success = service.remove_reaction(comment_id, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Reaction not found")
        
        return SuccessResponse(message="Reaction removed successfully")
        
    except Exception as e:
        logger.error(f"Error removing reaction from comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{comment_id}/report", response_model=SuccessResponse)
async def report_comment(
    comment_id: str,
    request: ReportCreateRequest,
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Report a comment for moderation"""
    try:
        service = CommentService(db)
        success = service.report_comment(comment_id, request, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Comment not found or already reported")
        
        return SuccessResponse(message="Comment reported successfully")
        
    except Exception as e:
        logger.error(f"Error reporting comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{comment_id}/moderate", response_model=SuccessResponse)
async def moderate_comment(
    comment_id: str,
    request: ModerationActionRequest,
    db: Session = Depends(get_database),
    moderator_id: str = Depends(verify_moderator)
):
    """Moderate a comment (moderator only)"""
    try:
        service = CommentService(db)
        success = service.moderate_comment(comment_id, request, moderator_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found")
        
        return SuccessResponse(message=f"Comment {request.action.value} successfully")
        
    except Exception as e:
        logger.error(f"Error moderating comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.post("/{comment_id}/pin", response_model=SuccessResponse)
async def pin_comment(
    comment_id: str,
    story_id: str = Query(..., description="Story ID for authorization"),
    db: Session = Depends(get_database),
    user_id: str = Depends(get_current_user_id)
):
    """Pin/unpin a comment (story author only)"""
    try:
        service = CommentService(db)
        success = service.pin_comment(comment_id, story_id, user_id)
        
        if not success:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment not found or not authorized")
        
        return SuccessResponse(message="Comment pin status updated successfully")
        
    except Exception as e:
        logger.error(f"Error pinning comment {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")

@router.get("/{comment_id}/thread", response_model=CommentThreadResponse)
async def get_comment_thread(
    comment_id: str,
    db: Session = Depends(get_database),
    user_id: Optional[str] = Depends(get_current_user_id_optional)
):
    """Get a comment thread with nested replies"""
    try:
        service = CommentService(db)
        root_comment = service.get_comment_thread(comment_id, user_id)
        
        if not root_comment:
            raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Comment thread not found")
        
        # Convert to response format (simplified - in production, build proper nested structure)
        comment_response = CommentResponse(
            id=str(root_comment.id),
            story_id=str(root_comment.story_id),
            chapter_id=str(root_comment.chapter_id),
            user_id=str(root_comment.user_id),
            parent_comment_id=str(root_comment.parent_comment_id) if root_comment.parent_comment_id else None,
            thread_root_id=str(root_comment.thread_root_id) if root_comment.thread_root_id else None,
            reply_depth=root_comment.reply_depth,
            content=root_comment.content,
            content_html=root_comment.content_html,
            status=root_comment.status,
            is_spoiler=root_comment.is_spoiler,
            is_pinned=root_comment.is_pinned,
            like_count=root_comment.like_count,
            dislike_count=root_comment.dislike_count,
            reply_count=root_comment.reply_count,
            user_reaction=None,  # TODO: Get user's reaction
            created_at=root_comment.created_at,
            updated_at=root_comment.updated_at
        )
        
        return CommentThreadResponse(
            comment=comment_response,
            replies=[],  # TODO: Build nested replies
            total_replies=root_comment.reply_count
        )
        
    except Exception as e:
        logger.error(f"Error getting comment thread {comment_id}: {e}")
        raise HTTPException(status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")