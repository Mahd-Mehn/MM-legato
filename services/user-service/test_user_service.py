"""
Tests for User Management Service
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid
from datetime import datetime, timezone

from main import app
from database import get_database
from models import Base, UserProfile, UserRelationship, UserSubscription, RelationshipType, SubscriptionPlan
from user_service import UserProfileService, UserRelationshipService, UserSubscriptionService
from schemas import UserProfileUpdateRequest, UserPreferencesUpdateRequest, CreateSubscriptionRequest

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_user_service.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_database():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

app.dependency_overrides[get_database] = override_get_database

@pytest.fixture
def client():
    Base.metadata.create_all(bind=engine)
    with TestClient(app) as c:
        yield c
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture
def sample_user_id():
    return str(uuid.uuid4())

@pytest.fixture
def sample_profile_data():
    return {
        "display_name": "Test User",
        "bio": "This is a test user profile",
        "avatar_url": "https://example.com/avatar.jpg",
        "language_preference": "en",
        "timezone": "UTC"
    }

class TestUserProfileService:
    """Test UserProfileService"""
    
    def test_create_profile(self, db_session, sample_user_id, sample_profile_data):
        """Test creating a user profile"""
        service = UserProfileService(db_session)
        profile = service.create_profile(sample_user_id, sample_profile_data)
        
        assert profile is not None
        assert profile.user_id == sample_user_id
        assert profile.display_name == sample_profile_data["display_name"]
        assert profile.bio == sample_profile_data["bio"]
        assert profile.language_preference == sample_profile_data["language_preference"]
    
    def test_get_profile_by_user_id(self, db_session, sample_user_id, sample_profile_data):
        """Test getting a profile by user ID"""
        service = UserProfileService(db_session)
        
        # Create profile first
        created_profile = service.create_profile(sample_user_id, sample_profile_data)
        
        # Get profile
        retrieved_profile = service.get_profile_by_user_id(sample_user_id)
        
        assert retrieved_profile is not None
        assert retrieved_profile.id == created_profile.id
        assert retrieved_profile.user_id == sample_user_id
    
    def test_update_profile(self, db_session, sample_user_id, sample_profile_data):
        """Test updating a user profile"""
        service = UserProfileService(db_session)
        
        # Create profile first
        service.create_profile(sample_user_id, sample_profile_data)
        
        # Update profile
        update_data = UserProfileUpdateRequest(
            display_name="Updated Name",
            bio="Updated bio"
        )
        updated_profile = service.update_profile(sample_user_id, update_data)
        
        assert updated_profile is not None
        assert updated_profile.display_name == "Updated Name"
        assert updated_profile.bio == "Updated bio"
    
    def test_update_preferences(self, db_session, sample_user_id, sample_profile_data):
        """Test updating user preferences"""
        service = UserProfileService(db_session)
        
        # Create profile first
        service.create_profile(sample_user_id, sample_profile_data)
        
        # Update preferences
        preferences_data = UserPreferencesUpdateRequest(
            notification_preferences={"email_notifications": False},
            preferred_genres=["fantasy", "sci-fi"],
            content_rating_preference="mature"
        )
        success = service.update_preferences(sample_user_id, preferences_data)
        
        assert success is True
        
        # Verify preferences were updated
        profile = service.get_profile_by_user_id(sample_user_id)
        assert profile.notification_preferences["email_notifications"] is False
        assert profile.preferred_genres == ["fantasy", "sci-fi"]
        assert profile.content_rating_preference == "mature"
    
    def test_search_profiles(self, db_session):
        """Test searching user profiles"""
        service = UserProfileService(db_session)
        
        # Create test profiles
        user_id_1 = str(uuid.uuid4())
        user_id_2 = str(uuid.uuid4())
        
        service.create_profile(user_id_1, {
            "display_name": "John Doe",
            "bio": "Fantasy writer"
        })
        service.create_profile(user_id_2, {
            "display_name": "Jane Smith",
            "bio": "Science fiction author"
        })
        
        # Search for "fantasy"
        profiles, total = service.search_profiles("fantasy")
        assert total == 1
        assert profiles[0].display_name == "John Doe"
        
        # Search for "author"
        profiles, total = service.search_profiles("author")
        assert total == 1
        assert profiles[0].display_name == "Jane Smith"

class TestUserRelationshipService:
    """Test UserRelationshipService"""
    
    def test_follow_user(self, db_session):
        """Test following a user"""
        service = UserRelationshipService(db_session)
        profile_service = UserProfileService(db_session)
        
        # Create test users
        follower_id = str(uuid.uuid4())
        following_id = str(uuid.uuid4())
        
        profile_service.create_profile(follower_id, {"display_name": "Follower"})
        profile_service.create_profile(following_id, {"display_name": "Following"})
        
        # Follow user
        success = service.follow_user(follower_id, following_id)
        assert success is True
        
        # Verify relationship exists
        relationship = db_session.query(UserRelationship).filter(
            UserRelationship.follower_id == follower_id,
            UserRelationship.following_id == following_id
        ).first()
        assert relationship is not None
        assert relationship.relationship_type == RelationshipType.FOLLOWING
    
    def test_unfollow_user(self, db_session):
        """Test unfollowing a user"""
        service = UserRelationshipService(db_session)
        profile_service = UserProfileService(db_session)
        
        # Create test users
        follower_id = str(uuid.uuid4())
        following_id = str(uuid.uuid4())
        
        profile_service.create_profile(follower_id, {"display_name": "Follower"})
        profile_service.create_profile(following_id, {"display_name": "Following"})
        
        # Follow then unfollow
        service.follow_user(follower_id, following_id)
        success = service.unfollow_user(follower_id, following_id)
        assert success is True
        
        # Verify relationship is removed
        relationship = db_session.query(UserRelationship).filter(
            UserRelationship.follower_id == follower_id,
            UserRelationship.following_id == following_id
        ).first()
        assert relationship is None
    
    def test_block_user(self, db_session):
        """Test blocking a user"""
        service = UserRelationshipService(db_session)
        profile_service = UserProfileService(db_session)
        
        # Create test users
        blocker_id = str(uuid.uuid4())
        blocked_id = str(uuid.uuid4())
        
        profile_service.create_profile(blocker_id, {"display_name": "Blocker"})
        profile_service.create_profile(blocked_id, {"display_name": "Blocked"})
        
        # Block user
        success = service.block_user(blocker_id, blocked_id)
        assert success is True
        
        # Verify block relationship exists
        relationship = db_session.query(UserRelationship).filter(
            UserRelationship.follower_id == blocker_id,
            UserRelationship.following_id == blocked_id
        ).first()
        assert relationship is not None
        assert relationship.relationship_type == RelationshipType.BLOCKED
    
    def test_get_followers(self, db_session):
        """Test getting user followers"""
        service = UserRelationshipService(db_session)
        profile_service = UserProfileService(db_session)
        
        # Create test users
        user_id = str(uuid.uuid4())
        follower_id_1 = str(uuid.uuid4())
        follower_id_2 = str(uuid.uuid4())
        
        profile_service.create_profile(user_id, {"display_name": "User"})
        profile_service.create_profile(follower_id_1, {"display_name": "Follower 1"})
        profile_service.create_profile(follower_id_2, {"display_name": "Follower 2"})
        
        # Create follow relationships
        service.follow_user(follower_id_1, user_id)
        service.follow_user(follower_id_2, user_id)
        
        # Get followers
        followers, total = service.get_followers(user_id)
        assert total == 2
        assert len(followers) == 2
    
    def test_get_following(self, db_session):
        """Test getting users that a user is following"""
        service = UserRelationshipService(db_session)
        profile_service = UserProfileService(db_session)
        
        # Create test users
        user_id = str(uuid.uuid4())
        following_id_1 = str(uuid.uuid4())
        following_id_2 = str(uuid.uuid4())
        
        profile_service.create_profile(user_id, {"display_name": "User"})
        profile_service.create_profile(following_id_1, {"display_name": "Following 1"})
        profile_service.create_profile(following_id_2, {"display_name": "Following 2"})
        
        # Create follow relationships
        service.follow_user(user_id, following_id_1)
        service.follow_user(user_id, following_id_2)
        
        # Get following
        following, total = service.get_following(user_id)
        assert total == 2
        assert len(following) == 2

class TestUserSubscriptionService:
    """Test UserSubscriptionService"""
    
    def test_create_subscription(self, db_session, sample_user_id):
        """Test creating a subscription"""
        service = UserSubscriptionService(db_session)
        
        subscription_data = CreateSubscriptionRequest(
            plan_type=SubscriptionPlan.PREMIUM
        )
        subscription = service.create_subscription(sample_user_id, subscription_data)
        
        assert subscription is not None
        assert subscription.user_id == sample_user_id
        assert subscription.plan_type == SubscriptionPlan.PREMIUM
        assert subscription.benefits["ad_free"] is True
        assert subscription.benefits["early_access"] is True
    
    def test_get_subscription(self, db_session, sample_user_id):
        """Test getting a user's subscription"""
        service = UserSubscriptionService(db_session)
        
        # Create subscription first
        subscription_data = CreateSubscriptionRequest(
            plan_type=SubscriptionPlan.BASIC
        )
        created_subscription = service.create_subscription(sample_user_id, subscription_data)
        
        # Get subscription
        retrieved_subscription = service.get_subscription(sample_user_id)
        
        assert retrieved_subscription is not None
        assert retrieved_subscription.id == created_subscription.id
        assert retrieved_subscription.plan_type == SubscriptionPlan.BASIC

class TestUserAPI:
    """Test User API endpoints"""
    
    def test_create_user_profile_endpoint(self, client, sample_user_id):
        """Test creating user profile via API"""
        profile_data = {
            "display_name": "Test User",
            "bio": "Test bio",
            "language_preference": "en"
        }
        
        response = client.post(f"/api/v1/users/{sample_user_id}/profile", json=profile_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == sample_user_id
        assert data["display_name"] == "Test User"
    
    def test_get_user_profile_endpoint(self, client, sample_user_id):
        """Test getting user profile via API"""
        # Create profile first
        profile_data = {
            "display_name": "Test User",
            "bio": "Test bio"
        }
        client.post(f"/api/v1/users/{sample_user_id}/profile", json=profile_data)
        
        # Get profile
        response = client.get(f"/api/v1/users/{sample_user_id}/profile")
        assert response.status_code == 200
        
        data = response.json()
        assert data["user_id"] == sample_user_id
        assert data["display_name"] == "Test User"
    
    def test_update_user_profile_endpoint(self, client, sample_user_id):
        """Test updating user profile via API"""
        # Create profile first
        profile_data = {
            "display_name": "Test User",
            "bio": "Test bio"
        }
        client.post(f"/api/v1/users/{sample_user_id}/profile", json=profile_data)
        
        # Update profile
        update_data = {
            "display_name": "Updated User",
            "bio": "Updated bio"
        }
        response = client.put(f"/api/v1/users/{sample_user_id}/profile", json=update_data)
        assert response.status_code == 200
        
        data = response.json()
        assert data["display_name"] == "Updated User"
        assert data["bio"] == "Updated bio"
    
    def test_follow_user_endpoint(self, client):
        """Test following user via API"""
        # Create two users
        user_id_1 = str(uuid.uuid4())
        user_id_2 = str(uuid.uuid4())
        
        client.post(f"/api/v1/users/{user_id_1}/profile", json={"display_name": "User 1"})
        client.post(f"/api/v1/users/{user_id_2}/profile", json={"display_name": "User 2"})
        
        # Follow user
        response = client.post(f"/api/v1/users/{user_id_1}/follow", json={"user_id": user_id_2})
        assert response.status_code == 200
        
        data = response.json()
        assert data["success"] is True
        assert "followed successfully" in data["message"]
    
    def test_search_users_endpoint(self, client):
        """Test searching users via API"""
        # Create test users
        user_id_1 = str(uuid.uuid4())
        user_id_2 = str(uuid.uuid4())
        
        client.post(f"/api/v1/users/{user_id_1}/profile", json={
            "display_name": "John Writer",
            "bio": "Fantasy author"
        })
        client.post(f"/api/v1/users/{user_id_2}/profile", json={
            "display_name": "Jane Author",
            "bio": "Science fiction writer"
        })
        
        # Search for "fantasy"
        response = client.get("/api/v1/users/search?query=fantasy")
        assert response.status_code == 200
        
        data = response.json()
        assert data["total"] == 1
        assert data["users"][0]["display_name"] == "John Writer"

if __name__ == "__main__":
    pytest.main([__file__])