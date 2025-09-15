"""
Test cases for content service models
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, Story, Chapter, StoryStatus, ChapterStatus, ContentRating, MonetizationType
from content_validator import ContentValidator, ContentEncryption, ContentBackup
import uuid
from datetime import datetime

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_content.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """Create test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_story_creation(db_session):
    """Test story model creation and validation"""
    # Create a test story
    story = Story(
        author_id=uuid.uuid4(),
        title="Test Story",
        description="A test story for validation",
        genre="fantasy",
        subgenres=["epic", "adventure"],
        tags=["magic", "dragons"],
        language="en",
        status=StoryStatus.DRAFT,
        content_rating=ContentRating.GENERAL,
        monetization_type=MonetizationType.FREE
    )
    
    # Generate slug
    story.slug = story.generate_slug()
    
    db_session.add(story)
    db_session.commit()
    db_session.refresh(story)
    
    # Verify story was created
    assert story.id is not None
    assert story.title == "Test Story"
    assert story.genre == "fantasy"
    assert story.status == StoryStatus.DRAFT
    assert story.slug is not None
    assert "test-story" in story.slug

def test_chapter_creation_and_hashing(db_session):
    """Test chapter creation with content hashing"""
    # Create a story first
    story = Story(
        author_id=uuid.uuid4(),
        title="Test Story",
        description="A test story",
        genre="fantasy",
        language="en"
    )
    db_session.add(story)
    db_session.commit()
    
    # Create a chapter
    chapter_content = "This is a test chapter with enough content to meet the minimum requirements for validation. It contains multiple sentences and paragraphs to simulate real chapter content."
    
    chapter = Chapter(
        story_id=story.id,
        chapter_number=1,
        title="Chapter 1: The Beginning",
        content=chapter_content,
        status=ChapterStatus.DRAFT
    )
    
    # Generate content hash and word count
    chapter.content_hash = chapter.generate_content_hash()
    chapter.word_count = chapter.calculate_word_count()
    chapter.original_content_hash = chapter.content_hash
    
    db_session.add(chapter)
    db_session.commit()
    db_session.refresh(chapter)
    
    # Verify chapter was created
    assert chapter.id is not None
    assert chapter.chapter_number == 1
    assert chapter.content_hash is not None
    assert len(chapter.content_hash) == 64  # SHA-256 hash length
    assert chapter.word_count > 0
    assert chapter.original_content_hash == chapter.content_hash

def test_story_statistics_update(db_session):
    """Test story statistics calculation"""
    # Create a story
    story = Story(
        author_id=uuid.uuid4(),
        title="Test Story",
        description="A test story",
        genre="fantasy",
        language="en"
    )
    db_session.add(story)
    db_session.commit()
    
    # Add multiple chapters
    for i in range(3):
        chapter = Chapter(
            story_id=story.id,
            chapter_number=i + 1,
            title=f"Chapter {i + 1}",
            content="This is test content with enough words to meet minimum requirements. " * 10,
            status=ChapterStatus.PUBLISHED if i < 2 else ChapterStatus.DRAFT
        )
        chapter.word_count = chapter.calculate_word_count()
        db_session.add(chapter)
    
    db_session.commit()
    db_session.refresh(story)
    
    # Update statistics
    story.update_statistics()
    
    # Verify statistics
    assert story.total_chapters == 2  # Only published chapters
    assert story.total_words > 0

def test_content_validator():
    """Test content validation functionality"""
    validator = ContentValidator()
    
    # Test valid story validation
    result = validator.validate_story(
        title="Valid Story Title",
        description="A valid description for the story",
        genre="fantasy",
        tags=["magic", "adventure"]
    )
    assert result.is_valid == True
    assert len(result.errors) == 0
    
    # Test invalid story validation (title too short)
    result = validator.validate_story(
        title="",
        description="A valid description",
        genre="fantasy"
    )
    assert result.is_valid == False
    assert len(result.errors) > 0
    
    # Test valid chapter validation
    result = validator.validate_chapter(
        title="Valid Chapter Title",
        content="This is a valid chapter content with enough words to meet the minimum requirements. " * 5
    )
    assert result.is_valid == True
    assert len(result.errors) == 0
    
    # Test invalid chapter validation (content too short)
    result = validator.validate_chapter(
        title="Valid Title",
        content="Too short"
    )
    assert result.is_valid == False
    assert len(result.errors) > 0

def test_content_sanitization():
    """Test content sanitization"""
    validator = ContentValidator()
    
    # Test HTML sanitization
    dirty_content = "<script>alert('xss')</script><p>Safe content</p><b>Bold text</b>"
    clean_content = validator.sanitize_content(dirty_content)
    
    assert "<script>" not in clean_content
    assert "<p>" in clean_content or "Safe content" in clean_content
    assert "<b>" in clean_content or "Bold text" in clean_content
    
    # Test text sanitization
    dirty_text = "<script>alert('xss')</script>Safe text"
    clean_text = validator.sanitize_text(dirty_text)
    
    assert "<script>" not in clean_text
    assert "Safe text" in clean_text

def test_content_encryption():
    """Test content encryption utilities"""
    original_content = "This is secret chapter content that needs to be encrypted."
    
    # Test encryption
    encrypted_content = ContentEncryption.encrypt_content(original_content)
    assert encrypted_content != original_content
    assert len(encrypted_content) > 0
    
    # Test decryption
    decrypted_content = ContentEncryption.decrypt_content(encrypted_content)
    assert decrypted_content == original_content

def test_content_backup():
    """Test content backup utilities"""
    content = "This is chapter content for backup testing."
    author_id = str(uuid.uuid4())
    
    # Test backup metadata creation
    metadata = ContentBackup.create_backup_metadata(content, author_id)
    
    assert 'content_hash' in metadata
    assert 'author_id' in metadata
    assert 'backup_timestamp' in metadata
    assert metadata['author_id'] == author_id
    
    # Test backup integrity verification
    is_valid = ContentBackup.verify_backup_integrity(content, metadata)
    assert is_valid == True
    
    # Test with modified content
    modified_content = content + " Modified"
    is_valid = ContentBackup.verify_backup_integrity(modified_content, metadata)
    assert is_valid == False

def test_chapter_versioning(db_session):
    """Test chapter version tracking"""
    # Create a story
    story = Story(
        author_id=uuid.uuid4(),
        title="Test Story",
        description="A test story",
        genre="fantasy",
        language="en"
    )
    db_session.add(story)
    db_session.commit()
    
    # Create a chapter
    original_content = "This is the original chapter content with enough words for validation. " * 5
    chapter = Chapter(
        story_id=story.id,
        chapter_number=1,
        title="Chapter 1",
        content=original_content,
        status=ChapterStatus.DRAFT
    )
    chapter.content_hash = chapter.generate_content_hash()
    chapter.word_count = chapter.calculate_word_count()
    chapter.original_content_hash = chapter.content_hash
    
    db_session.add(chapter)
    db_session.commit()
    
    # Create version snapshot
    version_snapshot = chapter.create_version_snapshot()
    assert version_snapshot is not None
    assert version_snapshot.content == original_content
    assert version_snapshot.version_number == chapter.version
    
    # Update chapter content
    new_content = "This is the updated chapter content with different words for validation testing. " * 5
    chapter.content = new_content
    chapter.content_hash = chapter.generate_content_hash()
    chapter.word_count = chapter.calculate_word_count()
    chapter.version += 1
    
    db_session.commit()
    
    # Verify content was updated
    assert chapter.content == new_content
    assert chapter.content_hash != chapter.original_content_hash
    assert chapter.version == 2

if __name__ == "__main__":
    pytest.main([__file__])