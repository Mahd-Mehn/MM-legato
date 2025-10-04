from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.moderation_service import ModerationService
from app.schemas.comment import (
    CommentReportResponse,
    ModerationActionRequest,
    ModerationLogResponse,
    ModerationDashboardResponse
)

router = APIRouter()

@router.get("/dashboard", response_model=ModerationDashboardResponse)
async def get_moderation_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get moderation dashboard for book authors"""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can access moderation features"
        )
    
    service = ModerationService(db)
    return service.get_moderation_dashboard(current_user.id)

@router.get("/reports", response_model=List[CommentReportResponse])
async def get_pending_reports(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Reports per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get pending reports for moderation (book authors only)"""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can access moderation features"
        )
    
    service = ModerationService(db)
    return service.get_pending_reports(current_user.id, page, page_size)

@router.post("/reports/{report_id}/resolve", response_model=CommentReportResponse)
async def resolve_report(
    report_id: UUID,
    action_data: ModerationActionRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Resolve a comment report"""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can moderate reports"
        )
    
    service = ModerationService(db)
    return service.resolve_report(
        report_id, 
        current_user.id, 
        action_data.action,
        action_data.resolution_notes
    )

@router.get("/logs", response_model=List[ModerationLogResponse])
async def get_moderation_logs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Logs per page"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get moderation logs for the current user"""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can access moderation logs"
        )
    
    service = ModerationService(db)
    return service.get_moderation_logs(current_user.id, page, page_size)