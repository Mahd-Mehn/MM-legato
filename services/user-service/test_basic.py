"""
Basic tests for User Management Service models
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid

from models import Base, UserProfile, UserRelationship, UserSubscription, RelationshipType, SubscriptionPlan

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_basic.db"
engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

def test_create_user_profile(db_session):
    """Test creating a basic user profile"""
    user_id = str(uuid.uuid4())
    
    profile = UserProfile(
        user_id=user_id,
        display_name="Test User",
        bio="This is a test user"
    )
    
    db_session.add(profile)
    db_session.commit()
    db_session.refresh(profile)
    
    assert profile.id is not None
    assert profile.user_id == user_id
    assert profile.display_name == "Test User"
    assert profile.bio == "This is a test user"

def test_create_user_relationship(db_session):
    """Test creating a user relationship"""
    follower_id = str(uuid.uuid4())
    following_id = str(uuid.uuid4())
    
    # Create profiles first
    follower_profile = UserProfile(user_id=follower_id, display_name="Follower")
    following_profile = UserProfile(user_id=following_id, display_name="Following")
    
    db_session.add(follower_profile)
    db_session.add(following_profile)
    db_session.commit()
    
    # Create relationship
    relationship = UserRelationship(
        follower_id=follower_id,
        following_id=following_id,
        relationship_type=RelationshipType.FOLLOWING
    )
    
    db_session.add(relationship)
    db_session.commit()
    db_session.refresh(relationship)
    
    assert relationship.id is not None
    assert relationship.follower_id == follower_id
    assert relationship.following_id == following_id
    assert relationship.relationship_type == RelationshipType.FOLLOWING

def test_create_user_subscription(db_session):
    """Test creating a user subscription"""
    user_id = str(uuid.uuid4())
    
    # Create profile first
    profile = UserProfile(user_id=user_id, display_name="Test User")
    db_session.add(profile)
    db_session.commit()
    
    # Create subscription
    subscription = UserSubscription(
        user_id=user_id,
        plan_type=SubscriptionPlan.PREMIUM
    )
    
    db_session.add(subscription)
    db_session.commit()
    db_session.refresh(subscription)
    
    assert subscription.id is not None
    assert subscription.user_id == user_id
    assert subscription.plan_type == SubscriptionPlan.PREMIUM
    assert subscription.is_active() is True

if __name__ == "__main__":
    pytest.main([__file__])