"""
Simple test runner for rating system without pytest dependency
"""
import uuid
from datetime import datetime
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from models import Base, StoryRating, RatingHelpfulness, RatingReport, CommentStatus, ReportReason
from rating_service import RatingService
from schemas import (
    RatingCreateRequest, RatingUpdateRequest, RatingFilterRequest,
    HelpfulnessVoteRequest, ReportCreateRequest
)

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ratings_simple.db"
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

def test_rating_creation():
    """Test basic rating creation"""
    print("Testing rating creation...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Test creating a rating
        request = RatingCreateRequest(
            story_id=story_id,
            rating=5,
            review_title="Amazing story!",
            review_content="This is one of the best stories I've ever read."
        )
        
        rating = service.create_rating(request, user_id)
        
        assert rating is not None, "Rating should be created"
        assert rating.rating == 5, "Rating value should be 5"
        assert rating.review_title == "Amazing story!", "Review title should match"
        assert rating.status == CommentStatus.APPROVED, "Rating should be approved"
        
        print("✅ Rating creation test passed")
        
        # Test duplicate rating prevention
        try:
            service.create_rating(request, user_id)
            assert False, "Should not allow duplicate ratings"
        except ValueError as e:
            assert "already rated" in str(e), "Should prevent duplicate ratings"
            print("✅ Duplicate rating prevention test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_rating_retrieval():
    """Test rating retrieval"""
    print("Testing rating retrieval...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create a rating
        request = RatingCreateRequest(
            story_id=story_id,
            rating=4,
            review_title="Good story"
        )
        
        created_rating = service.create_rating(request, user_id)
        
        # Test get by ID
        retrieved_rating = service.get_rating(str(created_rating.id))
        assert retrieved_rating is not None, "Should retrieve rating by ID"
        assert retrieved_rating.id == created_rating.id, "IDs should match"
        
        # Test get user rating for story
        user_rating = service.get_user_rating_for_story(story_id, user_id)
        assert user_rating is not None, "Should retrieve user's rating for story"
        assert user_rating.id == created_rating.id, "Should be same rating"
        
        print("✅ Rating retrieval test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_rating_update():
    """Test rating updates"""
    print("Testing rating updates...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        user_id = str(uuid.uuid4())
        
        # Create initial rating
        create_request = RatingCreateRequest(
            story_id=story_id,
            rating=3,
            review_title="Okay story"
        )
        
        rating = service.create_rating(create_request, user_id)
        
        # Update rating
        update_request = RatingUpdateRequest(
            rating=5,
            review_title="Actually amazing!",
            review_content="Changed my mind after reading more."
        )
        
        updated_rating = service.update_rating(str(rating.id), update_request, user_id)
        
        assert updated_rating is not None, "Rating should be updated"
        assert updated_rating.rating == 5, "Rating should be updated to 5"
        assert updated_rating.review_title == "Actually amazing!", "Title should be updated"
        assert updated_rating.review_content == "Changed my mind after reading more.", "Content should be updated"
        
        print("✅ Rating update test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_rating_statistics():
    """Test rating statistics"""
    print("Testing rating statistics...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        users = [str(uuid.uuid4()) for _ in range(4)]
        ratings = [5, 4, 3, 5]
        
        # Create multiple ratings
        for user_id, rating_value in zip(users, ratings):
            request = RatingCreateRequest(
                story_id=story_id,
                rating=rating_value,
                review_content="Test review" if rating_value >= 4 else None
            )
            service.create_rating(request, user_id)
        
        # Get statistics
        stats = service.get_story_rating_stats(story_id)
        
        assert stats['story_id'] == story_id, "Story ID should match"
        assert stats['total_ratings'] == 4, "Should have 4 ratings"
        assert stats['average_rating'] == 4.25, f"Average should be 4.25, got {stats['average_rating']}"
        assert stats['total_reviews'] == 3, "Should have 3 reviews"
        assert stats['rating_distribution'][5] == 2, "Should have 2 five-star ratings"
        assert stats['rating_distribution'][4] == 1, "Should have 1 four-star rating"
        assert stats['rating_distribution'][3] == 1, "Should have 1 three-star rating"
        
        print("✅ Rating statistics test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_helpfulness_voting():
    """Test helpfulness voting"""
    print("Testing helpfulness voting...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        rating_author = str(uuid.uuid4())
        voter = str(uuid.uuid4())
        
        # Create rating
        request = RatingCreateRequest(
            story_id=story_id,
            rating=5,
            review_content="Great story!"
        )
        
        rating = service.create_rating(request, rating_author)
        
        # Vote helpful
        vote_request = HelpfulnessVoteRequest(is_helpful=True)
        success = service.vote_helpfulness(str(rating.id), vote_request, voter)
        
        assert success is True, "Helpfulness vote should succeed"
        
        # Check rating counts updated
        updated_rating = service.get_rating(str(rating.id))
        assert updated_rating.helpful_count == 1, "Should have 1 helpful vote"
        assert updated_rating.not_helpful_count == 0, "Should have 0 not helpful votes"
        
        # Change vote to not helpful
        vote_request = HelpfulnessVoteRequest(is_helpful=False)
        success = service.vote_helpfulness(str(rating.id), vote_request, voter)
        
        assert success is True, "Vote change should succeed"
        
        # Check counts updated
        updated_rating = service.get_rating(str(rating.id))
        assert updated_rating.helpful_count == 0, "Should have 0 helpful votes"
        assert updated_rating.not_helpful_count == 1, "Should have 1 not helpful vote"
        
        print("✅ Helpfulness voting test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_rating_filtering():
    """Test rating filtering"""
    print("Testing rating filtering...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        user1 = str(uuid.uuid4())
        user2 = str(uuid.uuid4())
        
        # Create ratings
        request1 = RatingCreateRequest(story_id=story_id, rating=5)
        request2 = RatingCreateRequest(story_id=story_id, rating=3)
        
        service.create_rating(request1, user1)
        service.create_rating(request2, user2)
        
        # Create rating for different story
        other_story_id = str(uuid.uuid4())
        request3 = RatingCreateRequest(story_id=other_story_id, rating=4)
        service.create_rating(request3, user1)
        
        # Filter by story
        filters = RatingFilterRequest(story_id=story_id)
        ratings, total = service.get_ratings(filters)
        
        assert total == 2, "Should have 2 ratings for the story"
        assert len(ratings) == 2, "Should return 2 ratings"
        assert all(str(r.story_id) == story_id for r in ratings), "All ratings should be for the story"
        
        # Filter by rating range
        filters = RatingFilterRequest(min_rating=4, max_rating=5)
        ratings, total = service.get_ratings(filters)
        
        assert total == 2, "Should have 2 ratings in range 4-5"
        assert all(r.rating >= 4 and r.rating <= 5 for r in ratings), "All ratings should be in range"
        
        print("✅ Rating filtering test passed")
        
    finally:
        db.close()
        cleanup_database()

def test_rating_reporting():
    """Test rating reporting"""
    print("Testing rating reporting...")
    
    db = setup_database()
    try:
        service = RatingService(db)
        
        story_id = str(uuid.uuid4())
        rating_author = str(uuid.uuid4())
        reporter = str(uuid.uuid4())
        
        # Create rating
        request = RatingCreateRequest(
            story_id=story_id,
            rating=1,
            review_content="This story is terrible!"
        )
        
        rating = service.create_rating(request, rating_author)
        
        # Report rating
        report_request = ReportCreateRequest(
            reason=ReportReason.INAPPROPRIATE_CONTENT,
            description="Contains offensive language"
        )
        
        success = service.report_rating(str(rating.id), report_request, reporter)
        
        assert success is True, "Rating report should succeed"
        
        # Try to report again (should fail)
        success2 = service.report_rating(str(rating.id), report_request, reporter)
        
        assert success2 is False, "Duplicate report should fail"
        
        print("✅ Rating reporting test passed")
        
    finally:
        db.close()
        cleanup_database()

def run_all_tests():
    """Run all tests"""
    print("🚀 Starting Rating System Tests\n")
    
    try:
        test_rating_creation()
        test_rating_retrieval()
        test_rating_update()
        test_rating_statistics()
        test_helpfulness_voting()
        test_rating_filtering()
        test_rating_reporting()
        
        print("\n🎉 All tests passed! Rating system is working correctly.")
        
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False
    
    return True

if __name__ == "__main__":
    run_all_tests()