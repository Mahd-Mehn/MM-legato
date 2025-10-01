from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from uuid import UUID

class CommentBase(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000, description="Comment content")

class CommentCreate(CommentBase):
    chapter_id: UUID
    parent_id: Optional[UUID] = None

class CommentUpdate(BaseModel):
    content: str = Field(..., min_length=1, max_length=2000)

class CommentAuthor(BaseModel):
    id: UUID
    username: str
    profile_picture_url: Optional[str] = None
    is_writer: bool = False
    is_book_author: bool = False

class CommentResponse(CommentBase):
    id: UUID
    chapter_id: UUID
    user_id: UUID
    parent_id: Optional[UUID] = None
    like_count: int = 0
    is_reported: bool = False
    is_deleted: bool = False
    created_at: datetime
    updated_at: datetime
    
    # Author information
    author: CommentAuthor
    
    # Nested replies
    replies: List['CommentResponse'] = []
    
    # User interaction flags
    is_liked_by_user: bool = False
    is_liked_by_author: bool = False
    can_delete: bool = False

    class Config:
        from_attributes = True

class CommentLikeResponse(BaseModel):
    comment_id: UUID
    is_liked: bool
    like_count: int

class CommentReportRequest(BaseModel):
    reason: str = Field(..., description="Report reason from predefined list")
    description: Optional[str] = Field(None, max_length=1000, description="Additional details about the report")

class CommentReportResponse(BaseModel):
    id: UUID
    comment_id: UUID
    reporter_id: UUID
    reason: str
    description: Optional[str] = None
    status: str
    reviewed_by: Optional[UUID] = None
    reviewed_at: Optional[str] = None
    resolution_notes: Optional[str] = None
    created_at: datetime
    updated_at: datetime
    
    # Related data
    comment: Optional[CommentResponse] = None
    reporter_username: Optional[str] = None
    reviewer_username: Optional[str] = None

    class Config:
        from_attributes = True

class ModerationActionRequest(BaseModel):
    action: str = Field(..., description="Moderation action to take")
    reason: Optional[str] = Field(None, max_length=1000, description="Reason for the action")
    resolution_notes: Optional[str] = Field(None, max_length=2000, description="Notes about the resolution")

class ModerationLogResponse(BaseModel):
    id: UUID
    moderator_id: UUID
    action: str
    target_type: str
    target_id: UUID
    reason: Optional[str] = None
    details: Optional[str] = None
    created_at: datetime
    
    # Related data
    moderator_username: Optional[str] = None

    class Config:
        from_attributes = True

class ModerationDashboardResponse(BaseModel):
    pending_reports: List[CommentReportResponse]
    recent_actions: List[ModerationLogResponse]
    total_pending: int
    total_resolved_today: int

class CommentListResponse(BaseModel):
    comments: List[CommentResponse]
    total_count: int
    page: int
    page_size: int

# Update forward references
CommentResponse.model_rebuild()