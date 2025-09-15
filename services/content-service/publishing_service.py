"""
Content publishing workflow service
Handles story creation, chapter publishing, IP fingerprinting, and monetization
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_
from typing import Optional, List, Dict, Any
from datetime import datetime, timedelta
import hashlib
import uuid

from models import (
    Story, Chapter, ChapterVersion, StoryStatus, ChapterStatus, 
    ContentRating, MonetizationType
)
from schemas import (
    StoryCreateRequest, StoryUpdateRequest, ChapterCreateRequest, 
    ChapterUpdateRequest, StoryResponse, ChapterResponse
)
from content_validator import ContentValidator, ContentEncryption, ContentBackup


def story_to_response(story: Story) -> StoryResponse:
    """Convert Story model to StoryResponse"""
    return StoryResponse(
        id=str(story.id),
        author_id=str(story.author_id),
        title=story.title,
        description=story.description,
        synopsis=story.synopsis,
        genre=story.genre,
        subgenres=story.subgenres or [],
        tags=story.tags or [],
        language=story.language,
        status=story.status,
        content_rating=story.content_rating,
        monetization_type=story.monetization_type,
        coin_price_per_chapter=story.coin_price_per_chapter,
        total_chapters=story.total_chapters,
        total_words=story.total_words,
        view_count=story.view_count,
        like_count=story.like_count,
        bookmark_count=story.bookmark_count,
        cover_image_url=story.cover_image_url,
        slug=story.slug,
        first_published_at=story.first_published_at,
        last_updated_at=story.last_updated_at,
        created_at=story.created_at,
        updated_at=story.updated_at
    )


def chapter_to_response(chapter: Chapter) -> ChapterResponse:
    """Convert Chapter model to ChapterResponse"""
    return ChapterResponse(
        id=str(chapter.id),
        story_id=str(chapter.story_id),
        chapter_number=chapter.chapter_number,
        title=chapter.title,
        content=chapter.content,
        content_hash=chapter.content_hash,
        word_count=chapter.word_count,
        status=chapter.status,
        is_premium=chapter.is_premium,
        coin_price=chapter.coin_price,
        version=chapter.version,
        author_note=chapter.author_note,
        view_count=chapter.view_count,
        like_count=chapter.like_count,
        comment_count=chapter.comment_count,
        published_at=chapter.published_at,
        scheduled_publish_at=chapter.scheduled_publish_at,
        created_at=chapter.created_at,
        updated_at=chapter.updated_at
    )


class IPFingerprintService:
    """Service for generating and managing IP fingerprints"""
    
    @staticmethod
    def generate_story_fingerprint(story_data: Dict[str, Any]) -> str:
        """Generate unique IP fingerprint for story"""
        # Combine story metadata for fingerprinting
        fingerprint_data = {
            'title': story_data.get('title', ''),
            'description': story_data.get('description', ''),
            'synopsis': story_data.get('synopsis', ''),
            'author_id': str(story_data.get('author_id', '')),
            'created_at': story_data.get('created_at', datetime.utcnow()).isoformat()
        }
        
        # Create deterministic hash
        content_string = '|'.join(str(v) for v in fingerprint_data.values())
        fingerprint = hashlib.sha256(content_string.encode('utf-8')).hexdigest()
        
        return f"story_{fingerprint[:16]}"
    
    @staticmethod
    def generate_chapter_fingerprint(chapter_content: str, story_id: str, chapter_number: int) -> str:
        """Generate unique IP fingerprint for chapter content"""
        fingerprint_data = f"{story_id}|{chapter_number}|{chapter_content}"
        fingerprint = hashlib.sha256(fingerprint_data.encode('utf-8')).hexdigest()
        
        return f"chapter_{fingerprint[:16]}"


class ContentModerationService:
    """Service for content moderation and approval workflows"""
    
    def __init__(self, db: Session):
        self.db = db
        self.validator = ContentValidator(db)
    
    def moderate_story(self, story: Story) -> Dict[str, Any]:
        """Moderate story content and metadata"""
        moderation_result = {
            'approved': True,
            'requires_review': False,
            'issues': [],
            'warnings': []
        }
        
        # Validate story content
        validation_result = self.validator.validate_story(
            title=story.title,
            description=story.description,
            synopsis=story.synopsis,
            genre=story.genre,
            tags=story.tags or []
        )
        
        if not validation_result.is_valid:
            moderation_result['approved'] = False
            moderation_result['issues'] = [error.message for error in validation_result.errors]
        
        if validation_result.warnings:
            moderation_result['warnings'] = [warning.message for warning in validation_result.warnings]
            moderation_result['requires_review'] = True
        
        # Additional moderation checks
        if story.content_rating == ContentRating.ADULT:
            moderation_result['requires_review'] = True
            moderation_result['warnings'].append("Adult content requires manual review")
        
        return moderation_result
    
    def moderate_chapter(self, chapter: Chapter) -> Dict[str, Any]:
        """Moderate chapter content"""
        moderation_result = {
            'approved': True,
            'requires_review': False,
            'issues': [],
            'warnings': []
        }
        
        # Validate chapter content
        validation_result = self.validator.validate_chapter(
            title=chapter.title,
            content=chapter.content,
            author_note=chapter.author_note
        )
        
        if not validation_result.is_valid:
            moderation_result['approved'] = False
            moderation_result['issues'] = [error.message for error in validation_result.errors]
        
        if validation_result.warnings:
            moderation_result['warnings'] = [warning.message for warning in validation_result.warnings]
            moderation_result['requires_review'] = True
        
        # Check for premium content requirements
        if chapter.is_premium and chapter.coin_price <= 0:
            moderation_result['issues'].append("Premium chapters must have a coin price greater than 0")
            moderation_result['approved'] = False
        
        return moderation_result


class PublishingWorkflowService:
    """Main service for content publishing workflows"""
    
    def __init__(self, db: Session):
        self.db = db
        self.ip_service = IPFingerprintService()
        self.moderation_service = ContentModerationService(db)
        self.validator = ContentValidator(db)
    
    def create_story(self, story_request: StoryCreateRequest, author_id: str) -> StoryResponse:
        """Create a new story with automatic IP fingerprinting"""
        
        # Validate story data
        validation_result = self.validator.validate_story(
            title=story_request.title,
            description=story_request.description,
            synopsis=story_request.synopsis,
            genre=story_request.genre,
            tags=story_request.tags or []
        )
        
        if not validation_result.is_valid:
            raise ValueError(f"Story validation failed: {validation_result.errors[0].message}")
        
        # Create story instance
        story = Story(
            author_id=uuid.UUID(author_id),
            title=self.validator.sanitize_text(story_request.title),
            description=self.validator.sanitize_text(story_request.description) if story_request.description else None,
            synopsis=self.validator.sanitize_text(story_request.synopsis) if story_request.synopsis else None,
            genre=story_request.genre.lower(),
            subgenres=story_request.subgenres or [],
            tags=story_request.tags or [],
            language=story_request.language,
            content_rating=story_request.content_rating,
            monetization_type=story_request.monetization_type,
            coin_price_per_chapter=story_request.coin_price_per_chapter or 0,
            cover_image_url=story_request.cover_image_url,
            status=StoryStatus.DRAFT
        )
        
        # Generate slug and IP fingerprint
        story.slug = story.generate_slug()
        
        # Generate IP fingerprint
        fingerprint_data = {
            'title': story.title,
            'description': story.description,
            'synopsis': story.synopsis,
            'author_id': author_id,
            'created_at': datetime.utcnow()
        }
        
        # Save to database
        self.db.add(story)
        self.db.commit()
        self.db.refresh(story)
        
        # Update slug with actual ID
        story.slug = story.generate_slug()
        self.db.commit()
        
        return story_to_response(story)
    
    def update_story(self, story_id: str, story_request: StoryUpdateRequest, author_id: str) -> StoryResponse:
        """Update an existing story"""
        
        # Get existing story
        story = self.db.query(Story).filter(
            and_(Story.id == uuid.UUID(story_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not story:
            raise ValueError("Story not found or access denied")
        
        # Update fields if provided
        update_data = story_request.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            if field in ['title', 'description', 'synopsis'] and value:
                # Sanitize text fields
                value = self.validator.sanitize_text(value)
            
            setattr(story, field, value)
        
        # Validate updated story
        validation_result = self.validator.validate_story(
            title=story.title,
            description=story.description,
            synopsis=story.synopsis,
            genre=story.genre,
            tags=story.tags or []
        )
        
        if not validation_result.is_valid:
            raise ValueError(f"Story validation failed: {validation_result.errors[0].message}")
        
        # Update slug if title changed
        if 'title' in update_data:
            story.slug = story.generate_slug()
        
        story.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(story)
        
        return story_to_response(story)
    
    def publish_story(self, story_id: str, author_id: str) -> StoryResponse:
        """Publish a story (change status from draft to published)"""
        
        story = self.db.query(Story).filter(
            and_(Story.id == uuid.UUID(story_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not story:
            raise ValueError("Story not found or access denied")
        
        if story.status != StoryStatus.DRAFT:
            raise ValueError("Only draft stories can be published")
        
        # Moderate story before publishing
        moderation_result = self.moderation_service.moderate_story(story)
        
        if not moderation_result['approved']:
            raise ValueError(f"Story cannot be published: {'; '.join(moderation_result['issues'])}")
        
        # Check if story has at least one published chapter
        published_chapters = self.db.query(Chapter).filter(
            and_(Chapter.story_id == story.id, Chapter.status == ChapterStatus.PUBLISHED)
        ).count()
        
        if published_chapters == 0:
            raise ValueError("Story must have at least one published chapter before it can be published")
        
        # Update story status
        story.status = StoryStatus.PUBLISHED
        story.first_published_at = datetime.utcnow()
        story.last_updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(story)
        
        return story_to_response(story)    

    def create_chapter(self, story_id: str, chapter_request: ChapterCreateRequest, author_id: str) -> ChapterResponse:
        """Create a new chapter with version history tracking"""
        
        # Verify story ownership
        story = self.db.query(Story).filter(
            and_(Story.id == uuid.UUID(story_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not story:
            raise ValueError("Story not found or access denied")
        
        # Check if chapter number already exists
        existing_chapter = self.db.query(Chapter).filter(
            and_(Chapter.story_id == story.id, Chapter.chapter_number == chapter_request.chapter_number)
        ).first()
        
        if existing_chapter:
            raise ValueError(f"Chapter {chapter_request.chapter_number} already exists")
        
        # Validate chapter content
        validation_result = self.validator.validate_chapter(
            title=chapter_request.title,
            content=chapter_request.content,
            author_note=chapter_request.author_note
        )
        
        if not validation_result.is_valid:
            raise ValueError(f"Chapter validation failed: {validation_result.errors[0].message}")
        
        # Sanitize content
        sanitized_content = self.validator.sanitize_content(chapter_request.content)
        
        # Create chapter
        chapter = Chapter(
            story_id=story.id,
            chapter_number=chapter_request.chapter_number,
            title=self.validator.sanitize_text(chapter_request.title),
            content=sanitized_content,
            author_note=self.validator.sanitize_text(chapter_request.author_note) if chapter_request.author_note else None,
            is_premium=chapter_request.is_premium,
            coin_price=chapter_request.coin_price or story.coin_price_per_chapter,
            scheduled_publish_at=chapter_request.scheduled_publish_at,
            status=ChapterStatus.DRAFT
        )
        
        # Generate content hash for IP protection
        chapter.content_hash = chapter.generate_content_hash()
        chapter.original_content_hash = chapter.content_hash
        chapter.word_count = chapter.calculate_word_count()
        
        # Save chapter
        self.db.add(chapter)
        self.db.commit()
        self.db.refresh(chapter)
        
        # Create initial version snapshot
        initial_version = ChapterVersion(
            chapter_id=chapter.id,
            version_number=1,
            content=chapter.content,
            content_hash=chapter.content_hash,
            word_count=chapter.word_count,
            change_summary="Initial version"
        )
        
        self.db.add(initial_version)
        self.db.commit()
        
        return chapter_to_response(chapter)
    
    def update_chapter(self, chapter_id: str, chapter_request: ChapterUpdateRequest, author_id: str) -> ChapterResponse:
        """Update an existing chapter with version history tracking"""
        
        # Get chapter and verify ownership
        chapter = self.db.query(Chapter).join(Story).filter(
            and_(Chapter.id == uuid.UUID(chapter_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found or access denied")
        
        # Create version snapshot before changes
        if chapter_request.content and chapter_request.content != chapter.content:
            version_snapshot = chapter.create_version_snapshot()
            if version_snapshot:
                self.db.add(version_snapshot)
        
        # Update fields
        update_data = chapter_request.dict(exclude_unset=True)
        content_changed = False
        
        for field, value in update_data.items():
            if field == 'content' and value:
                # Sanitize and update content
                sanitized_content = self.validator.sanitize_content(value)
                chapter.content = sanitized_content
                chapter.content_hash = chapter.generate_content_hash()
                chapter.word_count = chapter.calculate_word_count()
                chapter.version += 1
                content_changed = True
            elif field in ['title', 'author_note'] and value:
                # Sanitize text fields
                setattr(chapter, field, self.validator.sanitize_text(value))
            elif field not in ['change_summary']:
                setattr(chapter, field, value)
        
        # Validate updated chapter
        validation_result = self.validator.validate_chapter(
            title=chapter.title,
            content=chapter.content,
            author_note=chapter.author_note
        )
        
        if not validation_result.is_valid:
            raise ValueError(f"Chapter validation failed: {validation_result.errors[0].message}")
        
        # Create new version if content changed
        if content_changed:
            new_version = ChapterVersion(
                chapter_id=chapter.id,
                version_number=chapter.version,
                content=chapter.content,
                content_hash=chapter.content_hash,
                word_count=chapter.word_count,
                change_summary=chapter_request.change_summary or f"Version {chapter.version} update"
            )
            self.db.add(new_version)
        
        chapter.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(chapter)
        
        # Update story statistics
        chapter.story.update_statistics()
        chapter.story.last_updated_at = datetime.utcnow()
        self.db.commit()
        
        return chapter_to_response(chapter)
    
    def publish_chapter(self, chapter_id: str, author_id: str) -> ChapterResponse:
        """Publish a chapter (change status from draft to published)"""
        
        # Get chapter and verify ownership
        chapter = self.db.query(Chapter).join(Story).filter(
            and_(Chapter.id == uuid.UUID(chapter_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found or access denied")
        
        if chapter.status == ChapterStatus.PUBLISHED:
            raise ValueError("Chapter is already published")
        
        # Moderate chapter before publishing
        moderation_result = self.moderation_service.moderate_chapter(chapter)
        
        if not moderation_result['approved']:
            raise ValueError(f"Chapter cannot be published: {'; '.join(moderation_result['issues'])}")
        
        # Update chapter status
        chapter.status = ChapterStatus.PUBLISHED
        chapter.published_at = datetime.utcnow()
        
        # Update story statistics
        chapter.story.update_statistics()
        chapter.story.last_updated_at = datetime.utcnow()
        
        self.db.commit()
        self.db.refresh(chapter)
        
        return ChapterResponse.from_orm(chapter)
    
    def schedule_chapter_publish(self, chapter_id: str, publish_time: datetime, author_id: str) -> ChapterResponse:
        """Schedule a chapter for future publishing"""
        
        # Get chapter and verify ownership
        chapter = self.db.query(Chapter).join(Story).filter(
            and_(Chapter.id == uuid.UUID(chapter_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found or access denied")
        
        if chapter.status == ChapterStatus.PUBLISHED:
            raise ValueError("Cannot schedule already published chapter")
        
        if publish_time <= datetime.utcnow():
            raise ValueError("Scheduled publish time must be in the future")
        
        # Moderate chapter before scheduling
        moderation_result = self.moderation_service.moderate_chapter(chapter)
        
        if not moderation_result['approved']:
            raise ValueError(f"Chapter cannot be scheduled: {'; '.join(moderation_result['issues'])}")
        
        # Update chapter status and schedule
        chapter.status = ChapterStatus.SCHEDULED
        chapter.scheduled_publish_at = publish_time
        
        self.db.commit()
        self.db.refresh(chapter)
        
        return chapter_to_response(chapter)
    
    def configure_monetization(self, story_id: str, monetization_config: Dict[str, Any], author_id: str) -> StoryResponse:
        """Configure monetization settings for a story"""
        
        # Get story and verify ownership
        story = self.db.query(Story).filter(
            and_(Story.id == uuid.UUID(story_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not story:
            raise ValueError("Story not found or access denied")
        
        # Update monetization settings
        if 'monetization_type' in monetization_config:
            story.monetization_type = MonetizationType(monetization_config['monetization_type'])
        
        if 'coin_price_per_chapter' in monetization_config:
            price = monetization_config['coin_price_per_chapter']
            if price < 0:
                raise ValueError("Coin price cannot be negative")
            story.coin_price_per_chapter = price
        
        # Apply monetization to existing chapters if specified
        if monetization_config.get('apply_to_existing_chapters', False):
            chapters = self.db.query(Chapter).filter(Chapter.story_id == story.id).all()
            
            for chapter in chapters:
                if 'default_premium_status' in monetization_config:
                    chapter.is_premium = monetization_config['default_premium_status']
                
                if 'coin_price_per_chapter' in monetization_config and not chapter.coin_price:
                    chapter.coin_price = story.coin_price_per_chapter
        
        story.updated_at = datetime.utcnow()
        self.db.commit()
        self.db.refresh(story)
        
        return story_to_response(story)
    
    def get_chapter_versions(self, chapter_id: str, author_id: str) -> List[Dict[str, Any]]:
        """Get version history for a chapter"""
        
        # Verify chapter ownership
        chapter = self.db.query(Chapter).join(Story).filter(
            and_(Chapter.id == uuid.UUID(chapter_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found or access denied")
        
        # Get all versions
        versions = self.db.query(ChapterVersion).filter(
            ChapterVersion.chapter_id == chapter.id
        ).order_by(ChapterVersion.version_number.desc()).all()
        
        return [
            {
                'version_number': version.version_number,
                'content_hash': version.content_hash,
                'word_count': version.word_count,
                'change_summary': version.change_summary,
                'created_at': version.created_at
            }
            for version in versions
        ]
    
    def revert_chapter_version(self, chapter_id: str, version_number: int, author_id: str) -> ChapterResponse:
        """Revert chapter to a previous version"""
        
        # Get chapter and verify ownership
        chapter = self.db.query(Chapter).join(Story).filter(
            and_(Chapter.id == uuid.UUID(chapter_id), Story.author_id == uuid.UUID(author_id))
        ).first()
        
        if not chapter:
            raise ValueError("Chapter not found or access denied")
        
        if chapter.status == ChapterStatus.PUBLISHED:
            raise ValueError("Cannot revert published chapter")
        
        # Get target version
        target_version = self.db.query(ChapterVersion).filter(
            and_(
                ChapterVersion.chapter_id == chapter.id,
                ChapterVersion.version_number == version_number
            )
        ).first()
        
        if not target_version:
            raise ValueError(f"Version {version_number} not found")
        
        # Create snapshot of current version before reverting
        current_snapshot = chapter.create_version_snapshot()
        if current_snapshot:
            current_snapshot.change_summary = f"Pre-revert snapshot (v{chapter.version})"
            self.db.add(current_snapshot)
        
        # Revert to target version
        chapter.content = target_version.content
        chapter.content_hash = target_version.content_hash
        chapter.word_count = target_version.word_count
        chapter.version += 1
        chapter.updated_at = datetime.utcnow()
        
        # Create new version entry for the revert
        revert_version = ChapterVersion(
            chapter_id=chapter.id,
            version_number=chapter.version,
            content=chapter.content,
            content_hash=chapter.content_hash,
            word_count=chapter.word_count,
            change_summary=f"Reverted to version {version_number}"
        )
        
        self.db.add(revert_version)
        self.db.commit()
        self.db.refresh(chapter)
        
        return chapter_to_response(chapter)


class ScheduledPublishingService:
    """Service for handling scheduled chapter publishing"""
    
    def __init__(self, db: Session):
        self.db = db
        self.publishing_service = PublishingWorkflowService(db)
    
    def process_scheduled_chapters(self) -> List[Dict[str, Any]]:
        """Process chapters scheduled for publishing"""
        
        current_time = datetime.utcnow()
        
        # Get chapters scheduled for publishing
        scheduled_chapters = self.db.query(Chapter).filter(
            and_(
                Chapter.status == ChapterStatus.SCHEDULED,
                Chapter.scheduled_publish_at <= current_time
            )
        ).all()
        
        results = []
        
        for chapter in scheduled_chapters:
            try:
                # Publish the chapter
                chapter.status = ChapterStatus.PUBLISHED
                chapter.published_at = current_time
                chapter.scheduled_publish_at = None
                
                # Update story statistics
                chapter.story.update_statistics()
                chapter.story.last_updated_at = current_time
                
                self.db.commit()
                
                results.append({
                    'chapter_id': str(chapter.id),
                    'story_id': str(chapter.story_id),
                    'chapter_number': chapter.chapter_number,
                    'status': 'published',
                    'published_at': current_time
                })
                
            except Exception as e:
                results.append({
                    'chapter_id': str(chapter.id),
                    'story_id': str(chapter.story_id),
                    'chapter_number': chapter.chapter_number,
                    'status': 'error',
                    'error': str(e)
                })
        
        return results