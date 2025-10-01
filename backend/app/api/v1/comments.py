from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.comment_service import CommentService
from app.schemas.comment import (
    CommentCreate, 
    CommentUpdate, 
    CommentResponse, 
    CommentLikeResponse,
    CommentReportRequest,
    CommentListResponse
)

router = APIRouter()

@router.post("/", response_model=CommentResponse)
async def create_comment(
    comment_data: CommentCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new comment"""
    service = CommentService(db)
    return service.create_comment(comment_data, current_user.id)

@router.get("/chapter/{chapter_id}", response_model=List[CommentResponse])
async def get_chapter_comments(
    chapter_id: UUID,
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(50, ge=1, le=100, description="Comments per page"),
    current_user: Optional[User] = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get comments for a chapter with threading"""
    service = CommentService(db)
    user_id = current_user.id if current_user else None
    return service.get_chapter_comments(chapter_id, user_id, page, page_size)

@router.put("/{comment_id}", response_model=CommentResponse)
async def update_comment(
    comment_id: UUID,
    comment_data: CommentUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a comment (only by the author)"""
    service = CommentService(db)
    return service.update_comment(comment_id, comment_data, current_user.id)

@router.delete("/{comment_id}")
async def delete_comment(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a comment (soft delete)"""
    service = CommentService(db)
    success = service.delete_comment(comment_id, current_user.id)
    return {"success": success, "message": "Comment deleted successfully"}

@router.post("/{comment_id}/like", response_model=CommentLikeResponse)
async def toggle_comment_like(
    comment_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Toggle like on a comment"""
    service = CommentService(db)
    result = service.like_comment(comment_id, current_user.id)
    return CommentLikeResponse(**result)

@router.post("/{comment_id}/report")
async def report_comment(
    comment_id: UUID,
    report_data: CommentReportRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Report a comment for moderation"""
    from app.services.moderation_service import ModerationService
    
    service = ModerationService(db)
    report = service.report_comment(comment_id, current_user.id, report_data.reason, report_data.description)
    return {"success": True, "message": "Comment reported successfully", "report_id": report.id}

@router.get("/chapter/{chapter_id}/count")
async def get_comment_count(
    chapter_id: UUID,
    db: Session = Depends(get_db)
):
    """Get total comment count for a chapter"""
    service = CommentService(db)
    count = service.get_comment_count(chapter_id)
    return {"chapter_id": chapter_id, "comment_count": count}