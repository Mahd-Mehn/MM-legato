"""
Test social engagement features: following, notifications, achievements, contests
"""
import pytest
import uuid
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, UserFollow, Notification, NotificationType, Achievement, AchievementType, UserStats, Contest, ContestStatus
from social_service import SocialService
from schemas import FollowUserRequest, ContestCreateRequest

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_social.db"
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

@pytest.fixture
def social_service(db_session):
    """Create social service instance"""
    return SocialService(db_session)

@pytest.fixture
def sample_users():
    """Sample user IDs for testing"""
    return {
        "user1": str(uuid.uuid4()),
        "user2": str(uuid.uuid4()),
        "user3": str(uuid.uuid4())
    }

def test_follow_user(social_service, sample_users):
    """Test user following functionality"""
    user1_id = sample_users["user1"]
    user2_id = sample_users["user2"]
    
    # Test following a user
    request = FollowUserRequest(following_id=user2_id, notification_enabled=True)
    follow_response = social_service.follow_user(user1_id, request)
    
    assert follow_response.follower_id == user1_id
    assert follow_response.following_id == user2_id
    assert follow_response.is_active == True
    assert follow_response.notification_enabled == True
    
    # Test getting follow stats
    stats = social_service.get_user_follow_stats(user2_id, user1_id)
    assert stats.followers_count == 1
    assert stats.following_count == 0
    assert stats.is_following == True
    assert stats.is_followed_by == False

def test_unfollow_user(social_service, sample_users):
    """Test user unfollowing functionality"""
    user1_id = sample_users["user1"]
    user2_id = sample_users["user2"]
    
    # First follow the user
    request = FollowUserRequest(following_id=user2_id)
    social_service.follow_user(user1_id, request)
    
    # Then unfollow
    success = social_service.unfollow_user(user1_id, user2_id)
    assert success == True
    
    # Check stats updated
    stats = social_service.get_user_follow_stats(user2_id, user1_id)
    assert stats.followers_count == 0
    assert stats.is_following == False

def test_notifications(social_service, sample_users):
    """Test notification system"""
    user_id = sample_users["user1"]
    
    # Create a notification
    notification = social_service.create_notification(
        user_id=user_id,
        type=NotificationType.NEW_FOLLOWER,
        title="Test Notification",
        message="This is a test notification"
    )
    
    assert notification.user_id == user_id
    assert notification.type == "new_follower"
    assert notification.is_read == False
    
    # Get notifications
    notifications_response = social_service.get_user_notifications(user_id)
    assert notifications_response.total == 1
    assert notifications_response.unread_count == 1
    assert len(notifications_response.notifications) == 1
    
    # Mark as read
    success = social_service.mark_notification_read(notification.id, user_id, True)
    assert success == True
    
    # Check read status
    notifications_response = social_service.get_user_notifications(user_id)
    assert notifications_response.unread_count == 0

def test_user_stats(social_service, sample_users):
    """Test user statistics"""
    user_id = sample_users["user1"]
    
    # Get initial stats
    stats = social_service.get_user_stats(user_id)
    assert stats.user_id == user_id
    assert stats.total_points == 0
    assert stats.stories_published == 0
    
    # Update stats
    updated_stats = social_service.update_user_stats(
        user_id,
        stories_published=5,
        chapters_published=25,
        total_words_written=50000
    )
    
    assert updated_stats.stories_published == 5
    assert updated_stats.chapters_published == 25
    assert updated_stats.total_words_written == 50000

def test_achievements(social_service, db_session, sample_users):
    """Test achievement system"""
    user_id = sample_users["user1"]
    
    # Create a test achievement
    achievement = Achievement(
        name="First Story",
        description="Publish your first story",
        type=AchievementType.WRITING,
        criteria={"stories_published": 1},
        points=100
    )
    db_session.add(achievement)
    db_session.commit()
    
    # Update user stats to trigger achievement
    social_service.update_user_stats(user_id, stories_published=1)
    
    # Check for achievements
    awarded = social_service.check_and_award_achievements(
        user_id, 
        "story_published", 
        {"story_id": str(uuid.uuid4())}
    )
    
    assert len(awarded) == 1
    assert awarded[0].achievement.name == "First Story"
    
    # Get user achievements
    user_achievements = social_service.get_user_achievements(user_id)
    assert len(user_achievements) == 1
    assert user_achievements[0].achievement.name == "First Story"

def test_contests(social_service, sample_users):
    """Test contest functionality"""
    organizer_id = sample_users["user1"]
    participant_id = sample_users["user2"]
    
    # Create a contest
    now = datetime.utcnow()
    contest_request = ContestCreateRequest(
        title="Test Writing Contest",
        description="A test contest for writers",
        rules="Write a short story under 1000 words",
        registration_starts_at=now - timedelta(days=1),
        registration_ends_at=now + timedelta(days=7),
        contest_starts_at=now + timedelta(days=1),
        contest_ends_at=now + timedelta(days=14),
        max_participants=100,
        entry_fee=0,
        prize_pool=500
    )
    
    contest = social_service.create_contest(organizer_id, contest_request)
    assert contest.title == "Test Writing Contest"
    assert contest.organizer_id == organizer_id
    assert contest.status == "draft"
    
    # Get contests
    contests_response = social_service.get_contests()
    assert contests_response.total == 1
    assert len(contests_response.contests) == 1
    
    # Update contest status to active (this would normally be done by admin)
    db_contest = social_service.db.query(Contest).filter(Contest.id == uuid.UUID(contest.id)).first()
    db_contest.status = ContestStatus.ACTIVE
    social_service.db.commit()
    
    # Join contest
    success = social_service.join_contest(participant_id, contest.id)
    assert success == True
    
    # Submit to contest
    story_id = str(uuid.uuid4())
    success = social_service.submit_to_contest(
        participant_id, 
        contest.id, 
        story_id, 
        "My Contest Entry",
        "This is my submission"
    )
    assert success == True

def test_social_sharing(social_service, sample_users):
    """Test social sharing functionality"""
    user_id = sample_users["user1"]
    story_id = str(uuid.uuid4())
    
    from schemas import SocialShareRequest
    
    # Create a share
    share_request = SocialShareRequest(
        content_type="story",
        content_id=story_id,
        platform="twitter",
        share_text="Check out my amazing story!"
    )
    
    share_response = social_service.create_social_share(user_id, share_request)
    assert share_response.platform == "twitter"
    assert share_response.share_text == "Check out my amazing story!"
    assert story_id in share_response.share_url
    
    # Track click
    success = social_service.track_share_click(share_response.id)
    assert success == True

def test_leaderboard(social_service, sample_users):
    """Test leaderboard functionality"""
    user_id = sample_users["user1"]
    
    # Update user stats to have some points
    social_service.update_user_stats(user_id, total_points=1000)
    
    # Get leaderboard (this would normally be populated by a background job)
    leaderboard = social_service.get_leaderboard("writers", "all_time", user_id=user_id)
    assert leaderboard.category == "writers"
    assert leaderboard.period == "all_time"

if __name__ == "__main__":
    # Run a simple test
    print("Running social engagement tests...")
    
    # Create test database
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    
    try:
        service = SocialService(db)
        users = {
            "user1": str(uuid.uuid4()),
            "user2": str(uuid.uuid4())
        }
        
        # Test basic following
        request = FollowUserRequest(following_id=users["user2"])
        follow = service.follow_user(users["user1"], request)
        print(f"✓ Follow test passed: {follow.follower_id} -> {follow.following_id}")
        
        # Test notification
        notification = service.create_notification(
            users["user1"],
            NotificationType.NEW_FOLLOWER,
            "Test",
            "Test message"
        )
        print(f"✓ Notification test passed: {notification.title}")
        
        # Test stats
        stats = service.get_user_stats(users["user1"])
        print(f"✓ Stats test passed: {stats.user_id}")
        
        print("All basic tests passed! ✅")
        
    except Exception as e:
        print(f"Test failed: {e}")
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)