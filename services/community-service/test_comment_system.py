"""
Tests for comment system functionality
"""
import pytest
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Comment, CommentReaction, CommentReport, CommentStatus, ReportReason
from comment_service import CommentService
from schemas import CommentCreateRequest, CommentUpdateRequest, CommentFilterRequest, ReactionRequest, ReportCreateRequest

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_comments.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    """Create a test database session"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_data():
    """Sample test data"""
    return {
        'story_id': str(uuid.uuid4()),
        'chapter_id': str(uuid.uuid4()),
        'user_id': str(uuid.uuid4()),
        'user_id_2': str(uuid.uuid4()),
        'moderator_id': str(uuid.uuid4())
    }

class TestCommentCreation:
    """Test comment creation functionality"""
    
    def test_create_root_comment(self, db_session, sample_data):
        """Test creating a root comment"""
        service = CommentService(db_session)
        
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="This is a great chapter!",
            is_spoiler=False
        )
        
        comment = service.create_comment(request, sample_data['user_id'])
        
        assert comment is not None
        assert comment.content == "This is a great chapter!"
        assert comment.reply_depth == 0
        assert comment.parent_comment_id is None
        assert comment.thread_root_id is None
        assert comment.status == CommentStatus.PENDING
        assert not comment.is_spoiler
    
    def test_create_reply_comment(self, db_session, sample_data):
        """Test creating a reply to another comment"""
        service = CommentService(db_session)
        
        # Create parent comment first
        parent_request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Parent comment",
            is_spoiler=False
        )
        parent_comment = service.create_comment(parent_request, sample_data['user_id'])
        
        # Create reply
        reply_request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Reply to parent",
            parent_comment_id=str(parent_comment.id),
            is_spoiler=False
        )
        reply_comment = service.create_comment(reply_request, sample_data['user_id_2'])
        
        assert reply_comment is not None
        assert reply_comment.parent_comment_id == parent_comment.id
        assert reply_comment.thread_root_id == parent_comment.id
        assert reply_comment.reply_depth == 1
        
        # Check parent reply count updated
        db_session.refresh(parent_comment)
        assert parent_comment.reply_count == 1
    
    def test_create_spoiler_comment(self, db_session, sample_data):
        """Test creating a spoiler comment"""
        service = CommentService(db_session)
        
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="This reveals the ending!",
            is_spoiler=True
        )
        
        comment = service.create_comment(request, sample_data['user_id'])
        
        assert comment.is_spoiler is True
    
    def test_create_comment_invalid_parent(self, db_session, sample_data):
        """Test creating comment with invalid parent ID"""
        service = CommentService(db_session)
        
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Reply to non-existent comment",
            parent_comment_id=str(uuid.uuid4()),
            is_spoiler=False
        )
        
        with pytest.raises(ValueError, match="Parent comment not found"):
            service.create_comment(request, sample_data['user_id'])

class TestCommentRetrieval:
    """Test comment retrieval functionality"""
    
    def test_get_comment_by_id(self, db_session, sample_data):
        """Test retrieving a comment by ID"""
        service = CommentService(db_session)
        
        # Create comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Test comment",
            is_spoiler=False
        )
        created_comment = service.create_comment(request, sample_data['user_id'])
        
        # Retrieve comment
        retrieved_comment = service.get_comment(str(created_comment.id))
        
        assert retrieved_comment is not None
        assert retrieved_comment.id == created_comment.id
        assert retrieved_comment.content == "Test comment"
    
    def test_get_comments_with_filters(self, db_session, sample_data):
        """Test retrieving comments with filters"""
        service = CommentService(db_session)
        
        # Create multiple comments
        for i in range(5):
            request = CommentCreateRequest(
                story_id=sample_data['story_id'],
                chapter_id=sample_data['chapter_id'],
                content=f"Comment {i}",
                is_spoiler=i % 2 == 0  # Every other comment is spoiler
            )
            comment = service.create_comment(request, sample_data['user_id'])
            # Approve comments for testing
            comment.status = CommentStatus.APPROVED
            db_session.commit()
        
        # Test filtering by chapter
        filters = CommentFilterRequest(
            chapter_id=sample_data['chapter_id'],
            page=1,
            per_page=10
        )
        comments, total = service.get_comments(filters)
        
        assert total == 5
        assert len(comments) == 5
        
        # Test filtering by spoiler flag
        filters = CommentFilterRequest(
            chapter_id=sample_data['chapter_id'],
            is_spoiler=True,
            page=1,
            per_page=10
        )
        spoiler_comments, spoiler_total = service.get_comments(filters)
        
        assert spoiler_total == 3  # Comments 0, 2, 4
        assert all(comment.is_spoiler for comment in spoiler_comments)

class TestCommentUpdates:
    """Test comment update functionality"""
    
    def test_update_comment_content(self, db_session, sample_data):
        """Test updating comment content"""
        service = CommentService(db_session)
        
        # Create comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Original content",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        
        # Update comment
        update_request = CommentUpdateRequest(
            content="Updated content",
            is_spoiler=True
        )
        updated_comment = service.update_comment(str(comment.id), update_request, sample_data['user_id'])
        
        assert updated_comment is not None
        assert updated_comment.content == "Updated content"
        assert updated_comment.is_spoiler is True
    
    def test_update_comment_unauthorized(self, db_session, sample_data):
        """Test updating comment by non-author"""
        service = CommentService(db_session)
        
        # Create comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Original content",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        
        # Try to update with different user
        update_request = CommentUpdateRequest(content="Hacked content")
        updated_comment = service.update_comment(str(comment.id), update_request, sample_data['user_id_2'])
        
        assert updated_comment is None

class TestCommentReactions:
    """Test comment reaction functionality"""
    
    def test_like_comment(self, db_session, sample_data):
        """Test liking a comment"""
        service = CommentService(db_session)
        
        # Create and approve comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Likeable comment",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        comment.status = CommentStatus.APPROVED
        db_session.commit()
        
        # Like the comment
        reaction_request = ReactionRequest(is_like=True)
        success = service.react_to_comment(str(comment.id), reaction_request, sample_data['user_id_2'])
        
        assert success is True
        
        # Check like count updated
        db_session.refresh(comment)
        assert comment.like_count == 1
        assert comment.dislike_count == 0
    
    def test_change_reaction(self, db_session, sample_data):
        """Test changing reaction from like to dislike"""
        service = CommentService(db_session)
        
        # Create and approve comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Controversial comment",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        comment.status = CommentStatus.APPROVED
        db_session.commit()
        
        # Like the comment first
        like_request = ReactionRequest(is_like=True)
        service.react_to_comment(str(comment.id), like_request, sample_data['user_id_2'])
        
        # Change to dislike
        dislike_request = ReactionRequest(is_like=False)
        success = service.react_to_comment(str(comment.id), dislike_request, sample_data['user_id_2'])
        
        assert success is True
        
        # Check counts updated
        db_session.refresh(comment)
        assert comment.like_count == 0
        assert comment.dislike_count == 1
    
    def test_remove_reaction(self, db_session, sample_data):
        """Test removing a reaction"""
        service = CommentService(db_session)
        
        # Create and approve comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Neutral comment",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        comment.status = CommentStatus.APPROVED
        db_session.commit()
        
        # Like the comment
        reaction_request = ReactionRequest(is_like=True)
        service.react_to_comment(str(comment.id), reaction_request, sample_data['user_id_2'])
        
        # Remove reaction
        success = service.remove_reaction(str(comment.id), sample_data['user_id_2'])
        
        assert success is True
        
        # Check counts updated
        db_session.refresh(comment)
        assert comment.like_count == 0
        assert comment.dislike_count == 0

class TestCommentReporting:
    """Test comment reporting functionality"""
    
    def test_report_comment(self, db_session, sample_data):
        """Test reporting a comment"""
        service = CommentService(db_session)
        
        # Create comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Inappropriate comment",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        
        # Report the comment
        report_request = ReportCreateRequest(
            reason=ReportReason.INAPPROPRIATE_CONTENT,
            description="This comment is offensive"
        )
        success = service.report_comment(str(comment.id), report_request, sample_data['user_id_2'])
        
        assert success is True
        
        # Check report count updated
        db_session.refresh(comment)
        assert comment.report_count == 1
        
        # Check report was created
        report = db_session.query(CommentReport).filter(
            CommentReport.comment_id == comment.id
        ).first()
        assert report is not None
        assert report.reason == ReportReason.INAPPROPRIATE_CONTENT
        assert report.description == "This comment is offensive"
    
    def test_duplicate_report_prevention(self, db_session, sample_data):
        """Test that users can't report the same comment twice"""
        service = CommentService(db_session)
        
        # Create comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Reported comment",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        
        # Report the comment
        report_request = ReportCreateRequest(
            reason=ReportReason.SPAM,
            description="This is spam"
        )
        first_report = service.report_comment(str(comment.id), report_request, sample_data['user_id_2'])
        second_report = service.report_comment(str(comment.id), report_request, sample_data['user_id_2'])
        
        assert first_report is True
        assert second_report is False  # Should fail due to duplicate

class TestCommentDeletion:
    """Test comment deletion functionality"""
    
    def test_delete_comment(self, db_session, sample_data):
        """Test deleting a comment"""
        service = CommentService(db_session)
        
        # Create comment
        request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Comment to delete",
            is_spoiler=False
        )
        comment = service.create_comment(request, sample_data['user_id'])
        comment_id = str(comment.id)
        
        # Delete comment
        success = service.delete_comment(comment_id, sample_data['user_id'])
        
        assert success is True
        
        # Verify comment is deleted
        deleted_comment = service.get_comment(comment_id)
        assert deleted_comment is None
    
    def test_delete_comment_with_replies(self, db_session, sample_data):
        """Test deleting a comment that has replies"""
        service = CommentService(db_session)
        
        # Create parent comment
        parent_request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Parent comment",
            is_spoiler=False
        )
        parent_comment = service.create_comment(parent_request, sample_data['user_id'])
        
        # Create reply
        reply_request = CommentCreateRequest(
            story_id=sample_data['story_id'],
            chapter_id=sample_data['chapter_id'],
            content="Reply comment",
            parent_comment_id=str(parent_comment.id),
            is_spoiler=False
        )
        reply_comment = service.create_comment(reply_request, sample_data['user_id_2'])
        
        # Delete reply
        success = service.delete_comment(str(reply_comment.id), sample_data['user_id_2'])
        
        assert success is True
        
        # Check parent reply count updated
        db_session.refresh(parent_comment)
        assert parent_comment.reply_count == 0

if __name__ == "__main__":
    pytest.main([__file__])