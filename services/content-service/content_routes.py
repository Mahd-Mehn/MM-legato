"""
Content management API routes
"""
from fastapi import APIRouter, Depends, HTTPException, Query, BackgroundTasks
from fastapi import status as http_status
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from datetime import datetime
import uuid

from database import get_db
from schemas import (
    StoryCreateRequest, StoryUpdateRequest, StoryResponse, StoryListResponse,
    ChapterCreateRequest, ChapterUpdateRequest, ChapterResponse, ChapterListResponse,
    ContentValidationResponse, StoryStatsResponse, ErrorResponse, SuccessResponse,
    ContentFilterRequest, ContentSearchRequest
)
from publishing_service import PublishingWorkflowService, ScheduledPublishingService, story_to_response, chapter_to_response
from models import Story, Chapter, StoryStatus, ChapterStatus

router = APIRouter(prefix="/content", tags=["content"])

# Dependency to get current user (placeholder - integrate with auth service)
async def get_current_user():
    """Get current authenticated user - integrate with auth service"""
    # This should be replaced with actual auth integration
    return {"user_id": "550e8400-e29b-41d4-a716-446655440000"}  # Placeholder


@router.post("/stories", response_model=StoryResponse, status_code=http_status.HTTP_201_CREATED)
async def create_story(
    story_request: StoryCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new story with automatic IP fingerprinting"""
    try:
        publishing_service = PublishingWorkflowService(db)
        story = publishing_service.create_story(story_request, current_user["user_id"])
        return story
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/stories", response_model=StoryListResponse)
async def list_stories(
    page: int = Query(1, ge=1, description="Page number"),
    per_page: int = Query(20, ge=1, le=100, description="Items per page"),
    status: Optional[StoryStatus] = Query(None, description="Filter by status"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    language: Optional[str] = Query(None, description="Filter by language"),
    author_id: Optional[str] = Query(None, description="Filter by author"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List stories with filtering and pagination"""
    try:
        query = db.query(Story)
        
        # Apply filters
        if status:
            query = query.filter(Story.status == status)
        if genre:
            query = query.filter(Story.genre == genre.lower())
        if language:
            query = query.filter(Story.language == language)
        if author_id:
            query = query.filter(Story.author_id == uuid.UUID(author_id))
        
        # Get total count
        total = query.count()
        
        # Apply pagination
        offset = (page - 1) * per_page
        stories = query.offset(offset).limit(per_page).all()
        
        # Calculate total pages
        total_pages = (total + per_page - 1) // per_page
        
        return StoryListResponse(
            stories=[story_to_response(story) for story in stories],
            total=total,
            page=page,
            per_page=per_page,
            total_pages=total_pages
        )
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/stories/{story_id}", response_model=StoryResponse)
async def get_story(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific story by ID"""
    try:
        story = db.query(Story).filter(Story.id == uuid.UUID(story_id)).first()
        if not story:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Story not found")
        
        return story_to_response(story)
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid story ID")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.put("/stories/{story_id}", response_model=StoryResponse)
async def update_story(
    story_id: str,
    story_request: StoryUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing story"""
    try:
        publishing_service = PublishingWorkflowService(db)
        story = publishing_service.update_story(story_id, story_request, current_user["user_id"])
        return story
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/stories/{story_id}/publish", response_model=StoryResponse)
async def publish_story(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Publish a story (change status from draft to published)"""
    try:
        publishing_service = PublishingWorkflowService(db)
        story = publishing_service.publish_story(story_id, current_user["user_id"])
        return story
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/stories/{story_id}/monetization", response_model=StoryResponse)
async def configure_monetization(
    story_id: str,
    monetization_config: Dict[str, Any],
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Configure monetization settings for a story"""
    try:
        publishing_service = PublishingWorkflowService(db)
        story = publishing_service.configure_monetization(story_id, monetization_config, current_user["user_id"])
        return story
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/stories/{story_id}/stats", response_model=StoryStatsResponse)
async def get_story_stats(
    story_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get detailed statistics for a story"""
    try:
        story = db.query(Story).filter(Story.id == uuid.UUID(story_id)).first()
        if not story:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Story not found")
        
        # Get published chapters
        published_chapters = db.query(Chapter).filter(
            Chapter.story_id == story.id,
            Chapter.status == ChapterStatus.PUBLISHED
        ).all()
        
        # Calculate statistics
        total_comments = sum(chapter.comment_count for chapter in published_chapters)
        avg_chapter_length = (
            sum(chapter.word_count or 0 for chapter in published_chapters) / len(published_chapters)
            if published_chapters else None
        )
        
        last_chapter_published = None
        if published_chapters:
            last_chapter_published = max(
                chapter.published_at for chapter in published_chapters if chapter.published_at
            )
        
        return StoryStatsResponse(
            story_id=str(story.id),
            total_chapters=story.total_chapters,
            published_chapters=len(published_chapters),
            total_words=story.total_words,
            view_count=story.view_count,
            like_count=story.like_count,
            bookmark_count=story.bookmark_count,
            comment_count=total_comments,
            average_chapter_length=avg_chapter_length,
            last_chapter_published=last_chapter_published
        )
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid story ID")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# Chapter endpoints
@router.post("/stories/{story_id}/chapters", response_model=ChapterResponse, status_code=http_status.HTTP_201_CREATED)
async def create_chapter(
    story_id: str,
    chapter_request: ChapterCreateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Create a new chapter with version history tracking"""
    try:
        publishing_service = PublishingWorkflowService(db)
        chapter = publishing_service.create_chapter(story_id, chapter_request, current_user["user_id"])
        return chapter
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/stories/{story_id}/chapters", response_model=ChapterListResponse)
async def list_chapters(
    story_id: str,
    status: Optional[ChapterStatus] = Query(None, description="Filter by status"),
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """List chapters for a story"""
    try:
        query = db.query(Chapter).filter(Chapter.story_id == uuid.UUID(story_id))
        
        if status:
            query = query.filter(Chapter.status == status)
        
        chapters = query.order_by(Chapter.chapter_number).all()
        
        return ChapterListResponse(
            chapters=[
                {
                    'id': str(chapter.id),
                    'story_id': str(chapter.story_id),
                    'chapter_number': chapter.chapter_number,
                    'title': chapter.title,
                    'word_count': chapter.word_count,
                    'status': chapter.status,
                    'is_premium': chapter.is_premium,
                    'coin_price': chapter.coin_price,
                    'published_at': chapter.published_at
                }
                for chapter in chapters
            ],
            total=len(chapters)
        )
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid story ID")
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get a specific chapter by ID"""
    try:
        chapter = db.query(Chapter).filter(Chapter.id == uuid.UUID(chapter_id)).first()
        if not chapter:
            raise HTTPException(status_code=http_status.HTTP_404_NOT_FOUND, detail="Chapter not found")
        
        return chapter_to_response(chapter)
    except ValueError:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail="Invalid chapter ID")
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: str,
    chapter_request: ChapterUpdateRequest,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Update an existing chapter with version history tracking"""
    try:
        publishing_service = PublishingWorkflowService(db)
        chapter = publishing_service.update_chapter(chapter_id, chapter_request, current_user["user_id"])
        return chapter
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/chapters/{chapter_id}/publish", response_model=ChapterResponse)
async def publish_chapter(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Publish a chapter (change status from draft to published)"""
    try:
        publishing_service = PublishingWorkflowService(db)
        chapter = publishing_service.publish_chapter(chapter_id, current_user["user_id"])
        return chapter
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/chapters/{chapter_id}/schedule", response_model=ChapterResponse)
async def schedule_chapter_publish(
    chapter_id: str,
    publish_time: datetime,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Schedule a chapter for future publishing"""
    try:
        publishing_service = PublishingWorkflowService(db)
        chapter = publishing_service.schedule_chapter_publish(chapter_id, publish_time, current_user["user_id"])
        return chapter
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.get("/chapters/{chapter_id}/versions")
async def get_chapter_versions(
    chapter_id: str,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Get version history for a chapter"""
    try:
        publishing_service = PublishingWorkflowService(db)
        versions = publishing_service.get_chapter_versions(chapter_id, current_user["user_id"])
        return {"versions": versions}
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/chapters/{chapter_id}/revert/{version_number}", response_model=ChapterResponse)
async def revert_chapter_version(
    chapter_id: str,
    version_number: int,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Revert chapter to a previous version"""
    try:
        publishing_service = PublishingWorkflowService(db)
        chapter = publishing_service.revert_chapter_version(chapter_id, version_number, current_user["user_id"])
        return chapter
    except ValueError as e:
        raise HTTPException(status_code=http_status.HTTP_400_BAD_REQUEST, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# Background task endpoints
@router.post("/admin/process-scheduled", response_model=SuccessResponse)
async def process_scheduled_chapters(
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
    current_user: dict = Depends(get_current_user)
):
    """Process chapters scheduled for publishing (admin endpoint)"""
    try:
        def process_scheduled():
            scheduled_service = ScheduledPublishingService(db)
            results = scheduled_service.process_scheduled_chapters()
            print(f"Processed {len(results)} scheduled chapters")
            return results
        
        background_tasks.add_task(process_scheduled)
        
        return SuccessResponse(
            message="Scheduled chapter processing initiated",
            data={"status": "processing"}
        )
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


# Content validation endpoint
@router.post("/validate/story", response_model=ContentValidationResponse)
async def validate_story_content(
    story_request: StoryCreateRequest,
    db: Session = Depends(get_db)
):
    """Validate story content before creation"""
    try:
        from content_validator import ContentValidator
        
        validator = ContentValidator(db)
        validation_result = validator.validate_story(
            title=story_request.title,
            description=story_request.description,
            synopsis=story_request.synopsis,
            genre=story_request.genre,
            tags=story_request.tags or []
        )
        
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")


@router.post("/validate/chapter", response_model=ContentValidationResponse)
async def validate_chapter_content(
    chapter_request: ChapterCreateRequest,
    db: Session = Depends(get_db)
):
    """Validate chapter content before creation"""
    try:
        from content_validator import ContentValidator
        
        validator = ContentValidator(db)
        validation_result = validator.validate_chapter(
            title=chapter_request.title,
            content=chapter_request.content,
            author_note=chapter_request.author_note
        )
        
        return validation_result
    except Exception as e:
        raise HTTPException(status_code=http_status.HTTP_500_INTERNAL_SERVER_ERROR, detail="Internal server error")