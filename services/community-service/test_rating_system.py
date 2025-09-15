"""
Tests for rating system functionality
"""
import pytest
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
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_ratings.db"
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
def rating_service(db_session):
    """Create rating service instance"""
    return RatingService(db_session)

@pytest.fixture
def sample_story_id():
    """Sample story ID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_user_id():
    """Sample user ID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_user_id_2():
    """Second sample user ID for testing"""
    return str(uuid.uuid4())

class TestRatingCreation:
    """Test rating creation functionality"""
    
    def test_create_rating_success(self, rating_service, sample_story_id, sample_user_id):
        """Test successful rating creation"""
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=5,
            review_title="Amazing story!",
            review_content="This is one of the best stories I've ever read."
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        assert rating is not None
        assert rating.story_id == uuid.UUID(sample_story_id)
        assert rating.user_id == uuid.UUID(sample_user_id)
        assert rating.rating == 5
        assert rating.review_title == "Amazing story!"
        assert rating.review_content == "This is one of the best stories I've ever read."
        assert rating.status == CommentStatus.APPROVED
        assert rating.helpful_count == 0
        assert rating.not_helpful_count == 0
    
    def test_create_rating_without_review(self, rating_service, sample_story_id, sample_user_id):
        """Test creating rating without review content"""
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=4
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        assert rating is not None
        assert rating.rating == 4
        assert rating.review_title is None
        assert rating.review_content is None
    
    def test_create_duplicate_rating_fails(self, rating_service, sample_story_id, sample_user_id):
        """Test that duplicate ratings from same user fail"""
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=5
        )
        
        # Create first rating
        rating_service.create_rating(request, sample_user_id)
        
        # Attempt to create duplicate rating
        with pytest.raises(ValueError, match="User has already rated this story"):
            rating_service.create_rating(request, sample_user_id)
    
    def test_create_rating_invalid_rating_value(self, rating_service, sample_story_id, sample_user_id):
        """Test rating creation with invalid rating values"""
        # Test rating too low
        with pytest.raises(ValueError):
            request = RatingCreateRequest(
                story_id=sample_story_id,
                rating=0
            )
        
        # Test rating too high
        with pytest.raises(ValueError):
            request = RatingCreateRequest(
                story_id=sample_story_id,
                rating=6
            )

class TestRatingRetrieval:
    """Test rating retrieval functionality"""
    
    def test_get_rating_by_id(self, rating_service, sample_story_id, sample_user_id):
        """Test retrieving rating by ID"""
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=4,
            review_title="Good story"
        )
        
        created_rating = rating_service.create_rating(request, sample_user_id)
        retrieved_rating = rating_service.get_rating(str(created_rating.id))
        
        assert retrieved_rating is not None
        assert retrieved_rating.id == created_rating.id
        assert retrieved_rating.rating == 4
        assert retrieved_rating.review_title == "Good story"
    
    def test_get_nonexistent_rating(self, rating_service):
        """Test retrieving non-existent rating"""
        fake_id = str(uuid.uuid4())
        rating = rating_service.get_rating(fake_id)
        
        assert rating is None
    
    def test_get_user_rating_for_story(self, rating_service, sample_story_id, sample_user_id):
        """Test retrieving user's rating for specific story"""
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=3
        )
        
        created_rating = rating_service.create_rating(request, sample_user_id)
        user_rating = rating_service.get_user_rating_for_story(sample_story_id, sample_user_id)
        
        assert user_rating is not None
        assert user_rating.id == created_rating.id
        assert user_rating.rating == 3
    
    def test_get_user_rating_for_story_none(self, rating_service, sample_story_id, sample_user_id):
        """Test retrieving user rating when none exists"""
        user_rating = rating_service.get_user_rating_for_story(sample_story_id, sample_user_id)
        assert user_rating is None

class TestRatingUpdate:
    """Test rating update functionality"""
    
    def test_update_rating_success(self, rating_service, sample_story_id, sample_user_id):
        """Test successful rating update"""
        # Create initial rating
        create_request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=3,
            review_title="Okay story"
        )
        
        rating = rating_service.create_rating(create_request, sample_user_id)
        
        # Update rating
        update_request = RatingUpdateRequest(
            rating=5,
            review_title="Actually amazing!",
            review_content="Changed my mind after reading more."
        )
        
        updated_rating = rating_service.update_rating(str(rating.id), update_request, sample_user_id)
        
        assert updated_rating is not None
        assert updated_rating.rating == 5
        assert updated_rating.review_title == "Actually amazing!"
        assert updated_rating.review_content == "Changed my mind after reading more."
    
    def test_update_rating_unauthorized(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test updating rating by different user fails"""
        # Create rating with user 1
        create_request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=3
        )
        
        rating = rating_service.create_rating(create_request, sample_user_id)
        
        # Try to update with user 2
        update_request = RatingUpdateRequest(rating=5)
        updated_rating = rating_service.update_rating(str(rating.id), update_request, sample_user_id_2)
        
        assert updated_rating is None
    
    def test_update_nonexistent_rating(self, rating_service, sample_user_id):
        """Test updating non-existent rating"""
        fake_id = str(uuid.uuid4())
        update_request = RatingUpdateRequest(rating=5)
        
        updated_rating = rating_service.update_rating(fake_id, update_request, sample_user_id)
        assert updated_rating is None

class TestRatingDeletion:
    """Test rating deletion functionality"""
    
    def test_delete_rating_success(self, rating_service, sample_story_id, sample_user_id):
        """Test successful rating deletion"""
        # Create rating
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=4
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        # Delete rating
        success = rating_service.delete_rating(str(rating.id), sample_user_id)
        
        assert success is True
        
        # Verify rating is deleted
        deleted_rating = rating_service.get_rating(str(rating.id))
        assert deleted_rating is None
    
    def test_delete_rating_unauthorized(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test deleting rating by different user fails"""
        # Create rating with user 1
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=4
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        # Try to delete with user 2
        success = rating_service.delete_rating(str(rating.id), sample_user_id_2)
        
        assert success is False
        
        # Verify rating still exists
        existing_rating = rating_service.get_rating(str(rating.id))
        assert existing_rating is not None
    
    def test_delete_nonexistent_rating(self, rating_service, sample_user_id):
        """Test deleting non-existent rating"""
        fake_id = str(uuid.uuid4())
        success = rating_service.delete_rating(fake_id, sample_user_id)
        
        assert success is False

class TestRatingFiltering:
    """Test rating filtering and pagination"""
    
    def test_get_ratings_by_story(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test filtering ratings by story"""
        # Create ratings for the story
        request1 = RatingCreateRequest(story_id=sample_story_id, rating=5)
        request2 = RatingCreateRequest(story_id=sample_story_id, rating=3)
        
        rating_service.create_rating(request1, sample_user_id)
        rating_service.create_rating(request2, sample_user_id_2)
        
        # Create rating for different story
        other_story_id = str(uuid.uuid4())
        request3 = RatingCreateRequest(story_id=other_story_id, rating=4)
        rating_service.create_rating(request3, sample_user_id)
        
        # Filter by story
        filters = RatingFilterRequest(story_id=sample_story_id)
        ratings, total = rating_service.get_ratings(filters)
        
        assert total == 2
        assert len(ratings) == 2
        assert all(str(r.story_id) == sample_story_id for r in ratings)
    
    def test_get_ratings_by_user(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test filtering ratings by user"""
        story_id_2 = str(uuid.uuid4())
        
        # Create ratings by user 1
        request1 = RatingCreateRequest(story_id=sample_story_id, rating=5)
        request2 = RatingCreateRequest(story_id=story_id_2, rating=3)
        rating_service.create_rating(request1, sample_user_id)
        rating_service.create_rating(request2, sample_user_id)
        
        # Create rating by user 2
        request3 = RatingCreateRequest(story_id=sample_story_id, rating=4)
        rating_service.create_rating(request3, sample_user_id_2)
        
        # Filter by user
        filters = RatingFilterRequest(user_id=sample_user_id)
        ratings, total = rating_service.get_ratings(filters)
        
        assert total == 2
        assert len(ratings) == 2
        assert all(str(r.user_id) == sample_user_id for r in ratings)
    
    def test_get_ratings_by_rating_range(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test filtering ratings by rating range"""
        # Create ratings with different values
        requests = [
            RatingCreateRequest(story_id=str(uuid.uuid4()), rating=1),
            RatingCreateRequest(story_id=str(uuid.uuid4()), rating=3),
            RatingCreateRequest(story_id=str(uuid.uuid4()), rating=5)
        ]
        
        for i, request in enumerate(requests):
            user_id = sample_user_id if i < 2 else sample_user_id_2
            rating_service.create_rating(request, user_id)
        
        # Filter by rating range (3-5)
        filters = RatingFilterRequest(min_rating=3, max_rating=5)
        ratings, total = rating_service.get_ratings(filters)
        
        assert total == 2
        assert all(r.rating >= 3 and r.rating <= 5 for r in ratings)
    
    def test_get_ratings_pagination(self, rating_service, sample_story_id, sample_user_id):
        """Test rating pagination"""
        # Create multiple ratings for different stories
        for i in range(5):
            story_id = str(uuid.uuid4())
            request = RatingCreateRequest(story_id=story_id, rating=5)
            rating_service.create_rating(request, sample_user_id)
        
        # Test pagination
        filters = RatingFilterRequest(page=1, per_page=2)
        ratings, total = rating_service.get_ratings(filters)
        
        assert total == 5
        assert len(ratings) == 2
        
        # Test second page
        filters = RatingFilterRequest(page=2, per_page=2)
        ratings, total = rating_service.get_ratings(filters)
        
        assert total == 5
        assert len(ratings) == 2

class TestRatingStatistics:
    """Test rating statistics functionality"""
    
    def test_get_story_rating_stats(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test getting story rating statistics"""
        # Create ratings with different values
        users = [sample_user_id, sample_user_id_2, str(uuid.uuid4()), str(uuid.uuid4())]
        ratings = [5, 4, 3, 5]
        
        for user_id, rating_value in zip(users, ratings):
            request = RatingCreateRequest(
                story_id=sample_story_id,
                rating=rating_value,
                review_content="Test review" if rating_value >= 4 else None
            )
            rating_service.create_rating(request, user_id)
        
        stats = rating_service.get_story_rating_stats(sample_story_id)
        
        assert stats['story_id'] == sample_story_id
        assert stats['total_ratings'] == 4
        assert stats['average_rating'] == 4.25  # (5+4+3+5)/4
        assert stats['total_reviews'] == 3  # Only ratings >= 4 have review content
        assert stats['rating_distribution'][5] == 2
        assert stats['rating_distribution'][4] == 1
        assert stats['rating_distribution'][3] == 1
        assert stats['rating_distribution'][2] == 0
        assert stats['rating_distribution'][1] == 0
    
    def test_get_story_rating_stats_no_ratings(self, rating_service, sample_story_id):
        """Test getting stats for story with no ratings"""
        stats = rating_service.get_story_rating_stats(sample_story_id)
        
        assert stats['story_id'] == sample_story_id
        assert stats['total_ratings'] == 0
        assert stats['average_rating'] == 0.0
        assert stats['total_reviews'] == 0
        assert all(count == 0 for count in stats['rating_distribution'].values())

class TestHelpfulnessVoting:
    """Test rating helpfulness voting functionality"""
    
    def test_vote_helpfulness_success(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test successful helpfulness voting"""
        # Create rating
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=5,
            review_content="Great story!"
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        # Vote helpful
        vote_request = HelpfulnessVoteRequest(is_helpful=True)
        success = rating_service.vote_helpfulness(str(rating.id), vote_request, sample_user_id_2)
        
        assert success is True
        
        # Check rating counts updated
        updated_rating = rating_service.get_rating(str(rating.id))
        assert updated_rating.helpful_count == 1
        assert updated_rating.not_helpful_count == 0
    
    def test_vote_helpfulness_update_existing(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test updating existing helpfulness vote"""
        # Create rating
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=5,
            review_content="Great story!"
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        # Vote helpful
        vote_request = HelpfulnessVoteRequest(is_helpful=True)
        rating_service.vote_helpfulness(str(rating.id), vote_request, sample_user_id_2)
        
        # Change vote to not helpful
        vote_request = HelpfulnessVoteRequest(is_helpful=False)
        success = rating_service.vote_helpfulness(str(rating.id), vote_request, sample_user_id_2)
        
        assert success is True
        
        # Check counts updated
        updated_rating = rating_service.get_rating(str(rating.id))
        assert updated_rating.helpful_count == 0
        assert updated_rating.not_helpful_count == 1
    
    def test_remove_helpfulness_vote(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test removing helpfulness vote"""
        # Create rating and vote
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=5,
            review_content="Great story!"
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        vote_request = HelpfulnessVoteRequest(is_helpful=True)
        rating_service.vote_helpfulness(str(rating.id), vote_request, sample_user_id_2)
        
        # Remove vote
        success = rating_service.remove_helpfulness_vote(str(rating.id), sample_user_id_2)
        
        assert success is True
        
        # Check counts updated
        updated_rating = rating_service.get_rating(str(rating.id))
        assert updated_rating.helpful_count == 0
        assert updated_rating.not_helpful_count == 0

class TestRatingReporting:
    """Test rating reporting functionality"""
    
    def test_report_rating_success(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test successful rating reporting"""
        # Create rating
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=1,
            review_content="This story is terrible!"
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        # Report rating
        report_request = ReportCreateRequest(
            reason=ReportReason.INAPPROPRIATE_CONTENT,
            description="Contains offensive language"
        )
        
        success = rating_service.report_rating(str(rating.id), report_request, sample_user_id_2)
        
        assert success is True
    
    def test_report_rating_duplicate(self, rating_service, sample_story_id, sample_user_id, sample_user_id_2):
        """Test duplicate rating reporting fails"""
        # Create rating
        request = RatingCreateRequest(
            story_id=sample_story_id,
            rating=1,
            review_content="Bad story"
        )
        
        rating = rating_service.create_rating(request, sample_user_id)
        
        # Report rating
        report_request = ReportCreateRequest(
            reason=ReportReason.SPAM,
            description="This is spam"
        )
        
        # First report should succeed
        success1 = rating_service.report_rating(str(rating.id), report_request, sample_user_id_2)
        assert success1 is True
        
        # Second report from same user should fail
        success2 = rating_service.report_rating(str(rating.id), report_request, sample_user_id_2)
        assert success2 is False
    
    def test_report_nonexistent_rating(self, rating_service, sample_user_id):
        """Test reporting non-existent rating"""
        fake_id = str(uuid.uuid4())
        report_request = ReportCreateRequest(
            reason=ReportReason.SPAM,
            description="Test report"
        )
        
        success = rating_service.report_rating(fake_id, report_request, sample_user_id)
        assert success is False

if __name__ == "__main__":
    pytest.main([__file__])