"""
Simple test runner for comment system without pytest dependency
"""
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, Comment, CommentReaction, CommentReport, CommentStatus, ReportReason
from comment_service import CommentService
from schemas import (
    CommentCreateRequest, CommentUpdateRequest, CommentFilterRequest,
    ReactionRequest, ReportCreateRequest
)

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_comments_simple.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def setup_database():
    """Setup test database"""
    Base.metadata.create_all(bind=engine)
    return TestingSessionLocal()

def cleanup_database():
    """Cleanup test database"""
    Base.metadata.drop_all(bind=engine)

def test_comment_creation():
    """Test basic comment creation"""
    print("Testing comment creation...")
    
    db = setup_database()
    try:
        service = CommentService(db)
        
        story_id = str(uuid.uuid4())
        chapter_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Test creating a comment
        request = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="This is a great chapter!",
            is_spoiler=False
        )
        
        comment = service.create_comment(request, user_id)
        
        assert comment is not None, "Comment should be created"
        assert comment.content == "This is a great chapter!", "Content should match"
        assert comment.story_id == uuid.UUID(story_id), "Story ID should match"
        assert comment.chapter_id == uuid.UUID(chapter_id), "Chapter ID should match"
        assert comment.user_id == uuid.UUID(user_id), "User ID should match"
        assert comment.status == CommentStatus.PENDING, "Comment should be pending by default"
        assert comment.reply_depth == 0, "Root comment should have depth 0"
        
        print("✅ Comment creation test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_comment_replies():
    """Test comment reply functionality"""
    print("Testing comment replies...")
    
    db = setup_database()
    try:
        service = CommentService(db)
        
        story_id = str(uuid.uuid4())
        chapter_id = str(uuid.uuid4())
        user1 = str(uuid.uuid4())
        user2 = str(uuid.uuid4())
        
        # Create parent comment
        parent_request = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="This is the parent comment"
        )
        
        parent_comment = service.create_comment(parent_request, user1)
        
        # Create reply
        reply_request = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="This is a reply",
            parent_comment_id=str(parent_comment.id)
        )
        
        reply_comment = service.create_comment(reply_request, user2)
        
        assert reply_comment is not None, "Reply should be created"
        assert reply_comment.parent_comment_id == parent_comment.id, "Parent ID should match"
        assert reply_comment.thread_root_id == parent_comment.id, "Thread root should be parent"
        assert reply_comment.reply_depth == 1, "Reply should have depth 1"
        
        # Check parent comment reply count updated
        updated_parent = service.get_comment(str(parent_comment.id))
        assert updated_parent.reply_count == 1, "Parent should have 1 reply"
        
        print("✅ Comment replies test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_comment_reactions():
    """Test comment like/dislike functionality"""
    print("Testing comment reactions...")
    
    db = setup_database()
    try:
        service = CommentService(db)
        
        story_id = str(uuid.uuid4())
        chapter_id = str(uuid.uuid4())
        comment_author = str(uuid.uuid4())
        reactor = str(uuid.uuid4())
        
        # Create comment
        request = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="This is a test comment"
        )
        
        comment = service.create_comment(request, comment_author)
        
        # Approve the comment first (since reactions only work on approved comments)
        from schemas import ModerationActionRequest
        from models import ModerationAction
        mod_request = ModerationActionRequest(
            action=ModerationAction.APPROVE,
            reason="Test approval"
        )
        service.moderate_comment(str(comment.id), mod_request, comment_author)
        
        # Like the comment
        like_request = ReactionRequest(is_like=True)
        success = service.react_to_comment(str(comment.id), like_request, reactor)
        
        assert success is True, "Like reaction should succeed"
        
        # Check comment counts updated
        updated_comment = service.get_comment(str(comment.id))
        assert updated_comment.like_count == 1, "Should have 1 like"
        assert updated_comment.dislike_count == 0, "Should have 0 dislikes"
        
        # Change to dislike
        dislike_request = ReactionRequest(is_like=False)
        success = service.react_to_comment(str(comment.id), dislike_request, reactor)
        
        assert success is True, "Dislike reaction should succeed"
        
        # Check counts updated
        updated_comment = service.get_comment(str(comment.id))
        assert updated_comment.like_count == 0, "Should have 0 likes"
        assert updated_comment.dislike_count == 1, "Should have 1 dislike"
        
        print("✅ Comment reactions test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_comment_filtering():
    """Test comment filtering"""
    print("Testing comment filtering...")
    
    db = setup_database()
    try:
        service = CommentService(db)
        
        story_id = str(uuid.uuid4())
        chapter_id = str(uuid.uuid4())
        user1 = str(uuid.uuid4())
        user2 = str(uuid.uuid4())
        
        # Create comments
        request1 = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="First comment"
        )
        
        request2 = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="Second comment",
            is_spoiler=True
        )
        
        service.create_comment(request1, user1)
        service.create_comment(request2, user2)
        
        # Create comment for different chapter
        other_chapter_id = str(uuid.uuid4())
        request3 = CommentCreateRequest(
            story_id=story_id,
            chapter_id=other_chapter_id,
            content="Different chapter comment"
        )
        service.create_comment(request3, user1)
        
        # Filter by chapter (include pending comments)
        filters = CommentFilterRequest(chapter_id=chapter_id, status=CommentStatus.PENDING)
        comments, total = service.get_comments(filters)
        
        assert total == 2, "Should have 2 comments for the chapter"
        assert len(comments) == 2, "Should return 2 comments"
        assert all(str(c.chapter_id) == chapter_id for c in comments), "All comments should be for the chapter"
        
        # Filter by spoiler flag
        filters = CommentFilterRequest(chapter_id=chapter_id, is_spoiler=True, status=CommentStatus.PENDING)
        comments, total = service.get_comments(filters)
        
        assert total == 1, "Should have 1 spoiler comment"
        assert comments[0].is_spoiler is True, "Comment should be marked as spoiler"
        
        print("✅ Comment filtering test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_comment_reporting():
    """Test comment reporting"""
    print("Testing comment reporting...")
    
    db = setup_database()
    try:
        service = CommentService(db)
        
        story_id = str(uuid.uuid4())
        chapter_id = str(uuid.uuid4())
        comment_author = str(uuid.uuid4())
        reporter = str(uuid.uuid4())
        
        # Create comment
        request = CommentCreateRequest(
            story_id=story_id,
            chapter_id=chapter_id,
            content="This is inappropriate content"
        )
        
        comment = service.create_comment(request, comment_author)
        
        # Report comment
        report_request = ReportCreateRequest(
            reason=ReportReason.INAPPROPRIATE_CONTENT,
            description="This comment contains offensive language"
        )
        
        success = service.report_comment(str(comment.id), report_request, reporter)
        
        assert success is True, "Comment report should succeed"
        
        # Try to report again (should fail)
        success2 = service.report_comment(str(comment.id), report_request, reporter)
        
        assert success2 is False, "Duplicate report should fail"
        
        print("✅ Comment reporting test passed")
        
    finally:
        db.close()
        cleanup_database()

def run_all_tests():
    """Run all tests"""
    print("🚀 Starting Comment System Tests\n")
    
    try:
        test_comment_creation()
        test_comment_replies()
        test_comment_reactions()
        test_comment_filtering()
        test_comment_reporting()
        
        print("\n🎉 All comment tests passed! Comment system is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    run_all_tests()