"""
Tests for fan engagement features
"""
import pytest
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import uuid

from models import Base, FanClub, FanClubMembership, ExclusiveContent, DirectMessage, ExclusiveEvent
from fan_engagement_service import FanEngagementService
from schemas import (
    FanClubCreateRequest, FanClubMembershipRequest, ExclusiveContentCreateRequest,
    DirectMessageCreateRequest, ExclusiveEventCreateRequest
)

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_fan_engagement.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
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
def fan_engagement_service(db_session):
    """Create fan engagement service with test database"""
    service = FanEngagementService()
    service.db = db_session
    return service

@pytest.fixture
def sample_writer_id():
    """Sample writer ID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_user_id():
    """Sample user ID for testing"""
    return str(uuid.uuid4())

@pytest.fixture
def sample_fan_club_request():
    """Sample fan club creation request"""
    return FanClubCreateRequest(
        name="Test Writer Fan Club",
        description="A test fan club for our amazing writer",
        tiers={
            "bronze": {"monthly_fee": 5.0, "benefits": ["Exclusive content access"]},
            "silver": {"monthly_fee": 10.0, "benefits": ["Exclusive content", "Early access"]},
            "gold": {"monthly_fee": 20.0, "benefits": ["All benefits", "Direct messaging"]}
        },
        auto_accept_members=True,
        welcome_message="Welcome to our fan club!"
    )

class TestFanClubManagement:
    """Test fan club creation and management"""
    
    def test_create_fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Test creating a new fan club"""
        fan_club = fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
        
        assert fan_club.writer_id == sample_writer_id
        assert fan_club.name == sample_fan_club_request.name
        assert fan_club.description == sample_fan_club_request.description
        assert fan_club.is_active == True
        assert fan_club.total_members == 0
    
    def test_create_duplicate_fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Test that writers can't create multiple fan clubs"""
        # Create first fan club
        fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
        
        # Try to create second fan club - should fail
        with pytest.raises(ValueError, match="Writer already has a fan club"):
            fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
    
    def test_get_fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Test retrieving fan club details"""
        created_club = fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
        
        retrieved_club = fan_engagement_service.get_fan_club(created_club.id)
        
        assert retrieved_club.id == created_club.id
        assert retrieved_club.name == sample_fan_club_request.name
    
    def test_get_writer_fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Test retrieving fan club by writer ID"""
        created_club = fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
        
        retrieved_club = fan_engagement_service.get_writer_fan_club(sample_writer_id)
        
        assert retrieved_club.id == created_club.id
        assert retrieved_club.writer_id == sample_writer_id

class TestFanClubMembership:
    """Test fan club membership functionality"""
    
    @pytest.fixture
    def fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Create a fan club for membership tests"""
        return fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
    
    def test_join_fan_club(self, fan_engagement_service, fan_club, sample_user_id):
        """Test joining a fan club"""
        membership_request = FanClubMembershipRequest(
            tier="bronze",
            auto_renew=True
        )
        
        membership = fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
        
        assert membership.fan_club_id == fan_club.id
        assert membership.user_id == sample_user_id
        assert membership.tier.value == "bronze"
        assert membership.status == "active"
        assert membership.monthly_fee == 5.0
    
    def test_join_invalid_tier(self, fan_engagement_service, fan_club, sample_user_id):
        """Test joining with invalid tier"""
        membership_request = FanClubMembershipRequest(
            tier="platinum",  # Not defined in sample fan club
            auto_renew=True
        )
        
        with pytest.raises(ValueError, match="Invalid membership tier"):
            fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
    
    def test_duplicate_membership(self, fan_engagement_service, fan_club, sample_user_id):
        """Test that users can't join the same fan club twice"""
        membership_request = FanClubMembershipRequest(tier="bronze", auto_renew=True)
        
        # Join first time
        fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
        
        # Try to join again - should fail
        with pytest.raises(ValueError, match="User is already a member"):
            fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
    
    def test_cancel_membership(self, fan_engagement_service, fan_club, sample_user_id):
        """Test cancelling fan club membership"""
        membership_request = FanClubMembershipRequest(tier="bronze", auto_renew=True)
        membership = fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
        
        cancelled_membership = fan_engagement_service.cancel_membership(membership.id, sample_user_id)
        
        assert cancelled_membership.status == "cancelled"
        assert cancelled_membership.cancelled_at is not None
        assert cancelled_membership.auto_renew == False
    
    def test_check_membership_access(self, fan_engagement_service, fan_club, sample_user_id):
        """Test checking membership access levels"""
        membership_request = FanClubMembershipRequest(tier="silver", auto_renew=True)
        fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
        
        # Should have access to bronze and silver content
        assert fan_engagement_service.check_membership_access(sample_user_id, fan_club.id, "bronze") == True
        assert fan_engagement_service.check_membership_access(sample_user_id, fan_club.id, "silver") == True
        
        # Should not have access to gold content
        assert fan_engagement_service.check_membership_access(sample_user_id, fan_club.id, "gold") == False

class TestExclusiveContent:
    """Test exclusive content functionality"""
    
    @pytest.fixture
    def fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Create a fan club for content tests"""
        return fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
    
    def test_create_exclusive_content(self, fan_engagement_service, fan_club, sample_writer_id):
        """Test creating exclusive content"""
        content_request = ExclusiveContentCreateRequest(
            title="Exclusive Behind the Scenes",
            description="Special content for our fans",
            content_type="behind_scenes",
            content_text="This is exclusive content only for fan club members!",
            required_tier="bronze"
        )
        
        content = fan_engagement_service.create_exclusive_content(fan_club.id, sample_writer_id, content_request)
        
        assert content.fan_club_id == fan_club.id
        assert content.title == content_request.title
        assert content.content_type.value == "behind_scenes"
        assert content.required_tier.value == "bronze"
    
    def test_publish_exclusive_content(self, fan_engagement_service, fan_club, sample_writer_id):
        """Test publishing exclusive content"""
        content_request = ExclusiveContentCreateRequest(
            title="Test Content",
            content_type="bonus_content",
            content_text="Test content",
            required_tier="bronze"
        )
        
        content = fan_engagement_service.create_exclusive_content(fan_club.id, sample_writer_id, content_request)
        published_content = fan_engagement_service.publish_exclusive_content(content.id, sample_writer_id)
        
        assert published_content.is_published == True
        assert published_content.published_at is not None
    
    def test_interact_with_content(self, fan_engagement_service, fan_club, sample_writer_id, sample_user_id):
        """Test user interactions with exclusive content"""
        content_request = ExclusiveContentCreateRequest(
            title="Test Content",
            content_type="bonus_content",
            content_text="Test content",
            required_tier="bronze"
        )
        
        content = fan_engagement_service.create_exclusive_content(fan_club.id, sample_writer_id, content_request)
        
        # Test view interaction
        interaction = fan_engagement_service.interact_with_content(content.id, sample_user_id, "view")
        assert interaction.has_viewed == True
        assert interaction.first_viewed_at is not None
        
        # Test like interaction
        like_interaction = fan_engagement_service.interact_with_content(content.id, sample_user_id, "like")
        assert like_interaction.has_liked == True
        assert like_interaction.liked_at is not None

class TestDirectMessaging:
    """Test direct messaging functionality"""
    
    @pytest.fixture
    def fan_club_with_member(self, fan_engagement_service, sample_writer_id, sample_user_id, sample_fan_club_request):
        """Create fan club with a member for messaging tests"""
        fan_club = fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
        membership_request = FanClubMembershipRequest(tier="gold", auto_renew=True)
        fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
        return fan_club, sample_writer_id, sample_user_id
    
    def test_send_direct_message(self, fan_engagement_service, fan_club_with_member):
        """Test sending direct messages"""
        fan_club, writer_id, user_id = fan_club_with_member
        
        message_request = DirectMessageCreateRequest(
            recipient_id=user_id,
            subject="Welcome to the fan club!",
            content="Thank you for joining our fan club. We're excited to have you!",
            is_fan_club_exclusive=True
        )
        
        message = fan_engagement_service.send_direct_message(writer_id, message_request)
        
        assert message.sender_id == writer_id
        assert message.recipient_id == user_id
        assert message.subject == message_request.subject
        assert message.content == message_request.content
        assert message.is_fan_club_exclusive == True
    
    def test_mark_message_read(self, fan_engagement_service, fan_club_with_member):
        """Test marking messages as read"""
        fan_club, writer_id, user_id = fan_club_with_member
        
        message_request = DirectMessageCreateRequest(
            recipient_id=user_id,
            content="Test message",
            is_fan_club_exclusive=True
        )
        
        message = fan_engagement_service.send_direct_message(writer_id, message_request)
        read_message = fan_engagement_service.mark_message_read(message.id, user_id)
        
        assert read_message.status.value == "read"
        assert read_message.read_at is not None

class TestExclusiveEvents:
    """Test exclusive events functionality"""
    
    @pytest.fixture
    def fan_club(self, fan_engagement_service, sample_writer_id, sample_fan_club_request):
        """Create a fan club for event tests"""
        return fan_engagement_service.create_fan_club(sample_writer_id, sample_fan_club_request)
    
    def test_create_exclusive_event(self, fan_engagement_service, fan_club, sample_writer_id):
        """Test creating exclusive events"""
        event_request = ExclusiveEventCreateRequest(
            title="Live Q&A Session",
            description="Join us for an exclusive Q&A session",
            event_type="q_and_a",
            required_tier="silver",
            max_participants=50,
            starts_at=datetime.utcnow() + timedelta(days=7),
            ends_at=datetime.utcnow() + timedelta(days=7, hours=2),
            location_type="online",
            access_url="https://meet.example.com/qa-session"
        )
        
        event = fan_engagement_service.create_exclusive_event(fan_club.id, sample_writer_id, event_request)
        
        assert event.fan_club_id == fan_club.id
        assert event.title == event_request.title
        assert event.event_type.value == "q_and_a"
        assert event.required_tier.value == "silver"
        assert event.max_participants == 50
    
    def test_register_for_event(self, fan_engagement_service, fan_club, sample_writer_id, sample_user_id):
        """Test registering for exclusive events"""
        # Create member with required tier
        membership_request = FanClubMembershipRequest(tier="silver", auto_renew=True)
        fan_engagement_service.join_fan_club(fan_club.id, sample_user_id, membership_request)
        
        # Create event
        event_request = ExclusiveEventCreateRequest(
            title="Test Event",
            description="Test event",
            event_type="live_chat",
            required_tier="silver",
            starts_at=datetime.utcnow() + timedelta(days=1),
            ends_at=datetime.utcnow() + timedelta(days=1, hours=1)
        )
        
        event = fan_engagement_service.create_exclusive_event(fan_club.id, sample_writer_id, event_request)
        
        # Register for event
        from schemas import EventRegistrationRequest
        registration_request = EventRegistrationRequest()
        registration = fan_engagement_service.register_for_event(event.id, sample_user_id, registration_request)
        
        assert registration.event_id == event.id
        assert registration.user_id == sample_user_id
        assert registration.status == "registered"

if __name__ == "__main__":
    pytest.main([__file__])