"""
Tests for content publishing workflow
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient
import uuid

from main import app
from database import get_db
from models import Base, Story, Chapter, StoryStatus, ChapterStatus, ContentRating, MonetizationType
from publishing_service import PublishingWorkflowService, IPFingerprintService, ContentModerationService
from schemas import StoryCreateRequest, ChapterCreateRequest

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_publishing.db"
engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="module")
def setup_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    yield
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    """Create a database session for testing"""
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def sample_author_id():
    """Sample author ID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_story_request():
    """Sample story creation request"""
    return StoryCreateRequest(
        title="Test Story",
        description="A test story for unit testing",
        synopsis="This is a longer synopsis for the test story",
        genre="fantasy",
        subgenres=["epic", "adventure"],
        tags=["magic", "dragons", "heroes"],
        language="en",
        content_rating=ContentRating.TEEN,
        monetization_type=MonetizationType.COINS,
        coin_price_per_chapter=10
    )

@pytest.fixture
def sample_chapter_request():
    """Sample chapter creation request"""
    return ChapterCreateRequest(
        chapter_number=1,
        title="Chapter 1: The Beginning",
        content="This is the content of the first chapter. " * 20,  # Ensure minimum length
        author_note="This is the first chapter of our story",
        is_premium=True,
        coin_price=15
    )

class TestIPFingerprintService:
    """Test IP fingerprinting functionality"""
    
    def test_generate_story_fingerprint(self):
        """Test story fingerprint generation"""
        story_data = {
            'title': 'Test Story',
            'description': 'Test description',
            'author_id': str(uuid.uuid4()),
            'created_at': datetime.utcnow()
        }
        
        fingerprint = IPFingerprintService.generate_story_fingerprint(story_data)
        
        assert fingerprint.startswith('story_')
        assert len(fingerprint) == 22  # 'story_' + 16 chars
        
        # Same data should generate same fingerprint
        fingerprint2 = IPFingerprintService.generate_story_fingerprint(story_data)
        assert fingerprint == fingerprint2
    
    def test_generate_chapter_fingerprint(self):
        """Test chapter fingerprint generation"""
        content = "This is test chapter content"
        story_id = str(uuid.uuid4())
        chapter_number = 1
        
        fingerprint = IPFingerprintService.generate_chapter_fingerprint(content, story_id, chapter_number)
        
        assert fingerprint.startswith('chapter_')
        assert len(fingerprint) == 24  # 'chapter_' + 16 chars
        
        # Same data should generate same fingerprint
        fingerprint2 = IPFingerprintService.generate_chapter_fingerprint(content, story_id, chapter_number)
        assert fingerprint == fingerprint2
        
        # Different content should generate different fingerprint
        fingerprint3 = IPFingerprintService.generate_chapter_fingerprint("Different content", story_id, chapter_number)
        assert fingerprint != fingerprint3

class TestContentModerationService:
    """Test content moderation functionality"""
    
    def test_moderate_valid_story(self, db_session):
        """Test moderation of valid story"""
        moderation_service = ContentModerationService(db_session)
        
        story = Story(
            title="Valid Story Title",
            description="Valid story description",
            genre="fantasy",
            content_rating=ContentRating.GENERAL
        )
        
        result = moderation_service.moderate_story(story)
        
        assert result['approved'] is True
        assert result['requires_review'] is False
        assert len(result['issues']) == 0
    
    def test_moderate_adult_content_story(self, db_session):
        """Test moderation of adult content story"""
        moderation_service = ContentModerationService(db_session)
        
        story = Story(
            title="Adult Story Title",
            description="Adult story description",
            genre="romance",
            content_rating=ContentRating.ADULT
        )
        
        result = moderation_service.moderate_story(story)
        
        assert result['approved'] is True
        assert result['requires_review'] is True
        assert "Adult content requires manual review" in result['warnings']
    
    def test_moderate_valid_chapter(self, db_session):
        """Test moderation of valid chapter"""
        moderation_service = ContentModerationService(db_session)
        
        chapter = Chapter(
            title="Valid Chapter Title",
            content="This is valid chapter content. " * 20,  # Ensure minimum length
            is_premium=False
        )
        
        result = moderation_service.moderate_chapter(chapter)
        
        assert result['approved'] is True
        assert result['requires_review'] is False
        assert len(result['issues']) == 0
    
    def test_moderate_premium_chapter_without_price(self, db_session):
        """Test moderation of premium chapter without price"""
        moderation_service = ContentModerationService(db_session)
        
        chapter = Chapter(
            title="Premium Chapter",
            content="This is premium chapter content. " * 20,
            is_premium=True,
            coin_price=0
        )
        
        result = moderation_service.moderate_chapter(chapter)
        
        assert result['approved'] is False
        assert "Premium chapters must have a coin price greater than 0" in result['issues']

class TestPublishingWorkflowService:
    """Test publishing workflow functionality"""
    
    def test_create_story(self, db_session, sample_story_request, sample_author_id, setup_database):
        """Test story creation"""
        publishing_service = PublishingWorkflowService(db_session)
        
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        
        assert story.title == sample_story_request.title
        assert story.author_id == sample_author_id
        assert story.status == StoryStatus.DRAFT
        assert story.slug is not None
        assert story.genre == sample_story_request.genre.lower()
    
    def test_create_story_with_invalid_data(self, db_session, sample_author_id, setup_database):
        """Test story creation with invalid data"""
        publishing_service = PublishingWorkflowService(db_session)
        
        invalid_request = StoryCreateRequest(
            title="",  # Empty title should fail validation
            genre="fantasy"
        )
        
        with pytest.raises(ValueError, match="Story validation failed"):
            publishing_service.create_story(invalid_request, sample_author_id)
    
    def test_create_chapter(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test chapter creation"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # First create a story
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        
        # Then create a chapter
        chapter = publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        
        assert chapter.title == sample_chapter_request.title
        assert chapter.chapter_number == sample_chapter_request.chapter_number
        assert chapter.status == ChapterStatus.DRAFT
        assert chapter.content_hash is not None
        assert chapter.word_count > 0
        assert chapter.version == 1
    
    def test_create_duplicate_chapter_number(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test creating chapter with duplicate number"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # Create story and first chapter
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        
        # Try to create another chapter with same number
        with pytest.raises(ValueError, match="Chapter 1 already exists"):
            publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
    
    def test_update_chapter_with_version_tracking(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test chapter update with version tracking"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # Create story and chapter
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        chapter = publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        
        # Update chapter content
        from schemas import ChapterUpdateRequest
        update_request = ChapterUpdateRequest(
            content="This is updated chapter content. " * 25,
            change_summary="Updated content for better flow"
        )
        
        updated_chapter = publishing_service.update_chapter(str(chapter.id), update_request, sample_author_id)
        
        assert updated_chapter.version == 2
        assert updated_chapter.content != chapter.content
        assert updated_chapter.content_hash != chapter.content_hash
        
        # Check version history
        versions = publishing_service.get_chapter_versions(str(chapter.id), sample_author_id)
        assert len(versions) == 2
        assert versions[0]['version_number'] == 2  # Latest first
        assert versions[1]['version_number'] == 1
    
    def test_publish_story_without_chapters(self, db_session, sample_story_request, sample_author_id, setup_database):
        """Test publishing story without chapters"""
        publishing_service = PublishingWorkflowService(db_session)
        
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        
        with pytest.raises(ValueError, match="Story must have at least one published chapter"):
            publishing_service.publish_story(str(story.id), sample_author_id)
    
    def test_publish_story_with_published_chapter(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test publishing story with published chapter"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # Create story and chapter
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        chapter = publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        
        # Publish chapter first
        published_chapter = publishing_service.publish_chapter(str(chapter.id), sample_author_id)
        assert published_chapter.status == ChapterStatus.PUBLISHED
        
        # Now publish story
        published_story = publishing_service.publish_story(str(story.id), sample_author_id)
        assert published_story.status == StoryStatus.PUBLISHED
        assert published_story.first_published_at is not None
    
    def test_schedule_chapter_publish(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test scheduling chapter for future publishing"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # Create story and chapter
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        chapter = publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        
        # Schedule for future publishing
        future_time = datetime.utcnow() + timedelta(hours=1)
        scheduled_chapter = publishing_service.schedule_chapter_publish(str(chapter.id), future_time, sample_author_id)
        
        assert scheduled_chapter.status == ChapterStatus.SCHEDULED
        assert scheduled_chapter.scheduled_publish_at == future_time
    
    def test_schedule_chapter_in_past(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test scheduling chapter for past time"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # Create story and chapter
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        chapter = publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        
        # Try to schedule for past time
        past_time = datetime.utcnow() - timedelta(hours=1)
        
        with pytest.raises(ValueError, match="Scheduled publish time must be in the future"):
            publishing_service.schedule_chapter_publish(str(chapter.id), past_time, sample_author_id)
    
    def test_configure_monetization(self, db_session, sample_story_request, sample_author_id, setup_database):
        """Test monetization configuration"""
        publishing_service = PublishingWorkflowService(db_session)
        
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        
        # Configure monetization
        monetization_config = {
            'monetization_type': 'premium',
            'coin_price_per_chapter': 20,
            'apply_to_existing_chapters': True,
            'default_premium_status': True
        }
        
        updated_story = publishing_service.configure_monetization(str(story.id), monetization_config, sample_author_id)
        
        assert updated_story.monetization_type == MonetizationType.PREMIUM
        assert updated_story.coin_price_per_chapter == 20
    
    def test_revert_chapter_version(self, db_session, sample_story_request, sample_chapter_request, sample_author_id, setup_database):
        """Test reverting chapter to previous version"""
        publishing_service = PublishingWorkflowService(db_session)
        
        # Create story and chapter
        story = publishing_service.create_story(sample_story_request, sample_author_id)
        chapter = publishing_service.create_chapter(str(story.id), sample_chapter_request, sample_author_id)
        original_content = chapter.content
        
        # Update chapter
        from schemas import ChapterUpdateRequest
        update_request = ChapterUpdateRequest(
            content="This is updated content. " * 25
        )
        publishing_service.update_chapter(str(chapter.id), update_request, sample_author_id)
        
        # Revert to version 1
        reverted_chapter = publishing_service.revert_chapter_version(str(chapter.id), 1, sample_author_id)
        
        assert reverted_chapter.content == original_content
        assert reverted_chapter.version == 3  # Original -> Update -> Revert
        
        # Check version history
        versions = publishing_service.get_chapter_versions(str(chapter.id), sample_author_id)
        assert len(versions) == 4  # Initial + Update + Pre-revert snapshot + Revert
        assert "Reverted to version 1" in versions[0]['change_summary']

class TestContentRoutes:
    """Test content management API routes"""
    
    def test_create_story_endpoint(self, client, sample_story_request, setup_database):
        """Test story creation endpoint"""
        response = client.post("/content/stories", json=sample_story_request.model_dump())
        
        assert response.status_code == 201
        data = response.json()
        assert data['title'] == sample_story_request.title
        assert data['status'] == 'draft'
    
    def test_list_stories_endpoint(self, client, setup_database):
        """Test story listing endpoint"""
        response = client.get("/content/stories")
        
        assert response.status_code == 200
        data = response.json()
        assert 'stories' in data
        assert 'total' in data
        assert 'page' in data
    
    def test_create_chapter_endpoint(self, client, sample_story_request, sample_chapter_request, setup_database):
        """Test chapter creation endpoint"""
        # First create a story
        story_response = client.post("/content/stories", json=sample_story_request.model_dump())
        story_id = story_response.json()['id']
        
        # Then create a chapter
        response = client.post(f"/content/stories/{story_id}/chapters", json=sample_chapter_request.model_dump())
        
        assert response.status_code == 201
        data = response.json()
        assert data['title'] == sample_chapter_request.title
        assert data['chapter_number'] == sample_chapter_request.chapter_number
    
    def test_publish_chapter_endpoint(self, client, sample_story_request, sample_chapter_request, setup_database):
        """Test chapter publishing endpoint"""
        # Create story and chapter
        story_response = client.post("/content/stories", json=sample_story_request.model_dump())
        story_id = story_response.json()['id']
        
        chapter_response = client.post(f"/content/stories/{story_id}/chapters", json=sample_chapter_request.model_dump())
        chapter_id = chapter_response.json()['id']
        
        # Publish chapter
        response = client.post(f"/content/chapters/{chapter_id}/publish")
        
        assert response.status_code == 200
        data = response.json()
        assert data['status'] == 'published'
        assert data['published_at'] is not None
    
    def test_validate_story_endpoint(self, client, sample_story_request, setup_database):
        """Test story validation endpoint"""
        response = client.post("/content/validate/story", json=sample_story_request.model_dump())
        
        assert response.status_code == 200
        data = response.json()
        assert data['is_valid'] is True
        assert 'errors' in data
        assert 'warnings' in data
    
    def test_validate_chapter_endpoint(self, client, sample_chapter_request, setup_database):
        """Test chapter validation endpoint"""
        response = client.post("/content/validate/chapter", json=sample_chapter_request.model_dump())
        
        assert response.status_code == 200
        data = response.json()
        assert data['is_valid'] is True
        assert 'errors' in data
        assert 'warnings' in data

if __name__ == "__main__":
    pytest.main([__file__])