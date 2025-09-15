"""
Tests for Subscription and Membership System
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool
import uuid
from datetime import datetime, timezone, timedelta

from models import Base, UserProfile, UserSubscription, SubscriptionPlan, SubscriptionStatus
from user_service import UserSubscriptionService
from schemas import CreateSubscriptionRequest, UpdateSubscriptionRequest

# Test database setup
SQLALCHEMY_DATABASE_URL = "sqlite:///./test_subscription.db"
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

@pytest.fixture
def sample_user_id():
    return str(uuid.uuid4())

@pytest.fixture
def sample_profile(db_session, sample_user_id):
    """Create a sample user profile"""
    profile = UserProfile(
        user_id=sample_user_id,
        display_name="Test User"
    )
    db_session.add(profile)
    db_session.commit()
    return profile

class TestSubscriptionModel:
    """Test UserSubscription model functionality"""
    
    def test_subscription_creation(self, db_session, sample_user_id):
        """Test creating a subscription"""
        subscription = UserSubscription(
            user_id=sample_user_id,
            plan_type=SubscriptionPlan.PREMIUM,
            status=SubscriptionStatus.ACTIVE
        )
        
        db_session.add(subscription)
        db_session.commit()
        db_session.refresh(subscription)
        
        assert subscription.id is not None
        assert subscription.user_id == sample_user_id
        assert subscription.plan_type == SubscriptionPlan.PREMIUM
        assert subscription.status == SubscriptionStatus.ACTIVE
        assert subscription.is_active() is True
    
    def test_subscription_expiration(self, db_session, sample_user_id):
        """Test subscription expiration logic"""
        # Create expired subscription
        past_date = datetime.now(timezone.utc) - timedelta(days=1)
        subscription = UserSubscription(
            user_id=sample_user_id,
            plan_type=SubscriptionPlan.BASIC,
            status=SubscriptionStatus.ACTIVE,
            expires_at=past_date
        )
        
        db_session.add(subscription)
        db_session.commit()
        
        assert subscription.is_active() is False
    
    def test_subscription_benefits(self, db_session, sample_user_id):
        """Test subscription benefits"""
        subscription = UserSubscription(
            user_id=sample_user_id,
            plan_type=SubscriptionPlan.CREATOR
        )
        
        # Set benefits
        subscription.benefits = {
            "ad_free": True,
            "early_access": True,
            "exclusive_content": True,
            "priority_support": True,
            "advanced_analytics": True
        }
        
        db_session.add(subscription)
        db_session.commit()
        
        assert subscription.has_benefit("ad_free") is True
        assert subscription.has_benefit("advanced_analytics") is True
        assert subscription.has_benefit("nonexistent_benefit") is False
    
    def test_fan_club_membership(self, db_session, sample_user_id):
        """Test fan club membership functionality"""
        subscription = UserSubscription(
            user_id=sample_user_id,
            plan_type=SubscriptionPlan.PREMIUM
        )
        
        db_session.add(subscription)
        db_session.commit()
        
        creator_id = str(uuid.uuid4())
        
        # Add fan club membership
        subscription.add_fan_club_membership(creator_id)
        db_session.commit()
        
        assert creator_id in subscription.fan_club_memberships
        
        # Remove fan club membership
        subscription.remove_fan_club_membership(creator_id)
        db_session.commit()
        
        assert creator_id not in subscription.fan_club_memberships

class TestSubscriptionService:
    """Test UserSubscriptionService functionality"""
    
    def test_create_subscription(self, db_session, sample_profile, sample_user_id):
        """Test creating a subscription via service"""
        service = UserSubscriptionService(db_session)
        
        subscription_data = CreateSubscriptionRequest(
            plan_type=SubscriptionPlan.PREMIUM
        )
        
        subscription = service.create_subscription(sample_user_id, subscription_data)
        
        assert subscription is not None
        assert subscription.user_id == sample_user_id
        assert subscription.plan_type == SubscriptionPlan.PREMIUM
        assert subscription.status == SubscriptionStatus.PENDING
        assert subscription.has_benefit("ad_free") is True
        assert subscription.has_benefit("early_access") is True
    
    def test_get_subscription(self, db_session, sample_profile, sample_user_id):
        """Test getting user subscription"""
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
    
    def test_upgrade_subscription(self, db_session, sample_profile, sample_user_id):
        """Test upgrading subscription plan"""
        service = UserSubscriptionService(db_session)
        
        # Create basic subscription
        basic_data = CreateSubscriptionRequest(plan_type=SubscriptionPlan.BASIC)
        basic_subscription = service.create_subscription(sample_user_id, basic_data)
        
        # Upgrade to premium
        premium_data = CreateSubscriptionRequest(plan_type=SubscriptionPlan.PREMIUM)
        premium_subscription = service.create_subscription(sample_user_id, premium_data)
        
        # Check that old subscription is cancelled
        db_session.refresh(basic_subscription)
        assert basic_subscription.status == SubscriptionStatus.CANCELLED
        assert basic_subscription.cancelled_at is not None
        
        # Check new subscription
        assert premium_subscription.plan_type == SubscriptionPlan.PREMIUM
        assert premium_subscription.status == SubscriptionStatus.PENDING
    
    def test_subscription_benefits_by_plan(self, db_session, sample_profile, sample_user_id):
        """Test that different plans have correct benefits"""
        service = UserSubscriptionService(db_session)
        
        # Test FREE plan
        free_data = CreateSubscriptionRequest(plan_type=SubscriptionPlan.FREE)
        free_sub = service.create_subscription(sample_user_id, free_data)
        
        assert free_sub.has_benefit("ad_free") is False
        assert free_sub.has_benefit("early_access") is False
        assert free_sub.has_benefit("exclusive_content") is False
        assert free_sub.has_benefit("priority_support") is False
        assert free_sub.has_benefit("advanced_analytics") is False
        
        # Test BASIC plan
        basic_data = CreateSubscriptionRequest(plan_type=SubscriptionPlan.BASIC)
        basic_sub = service.create_subscription(sample_user_id, basic_data)
        
        assert basic_sub.has_benefit("ad_free") is True
        assert basic_sub.has_benefit("early_access") is False
        assert basic_sub.has_benefit("exclusive_content") is False
        assert basic_sub.has_benefit("priority_support") is False
        assert basic_sub.has_benefit("advanced_analytics") is False
        
        # Test PREMIUM plan
        premium_data = CreateSubscriptionRequest(plan_type=SubscriptionPlan.PREMIUM)
        premium_sub = service.create_subscription(sample_user_id, premium_data)
        
        assert premium_sub.has_benefit("ad_free") is True
        assert premium_sub.has_benefit("early_access") is True
        assert premium_sub.has_benefit("exclusive_content") is True
        assert premium_sub.has_benefit("priority_support") is True
        assert premium_sub.has_benefit("advanced_analytics") is False
        
        # Test CREATOR plan
        creator_data = CreateSubscriptionRequest(plan_type=SubscriptionPlan.CREATOR)
        creator_sub = service.create_subscription(sample_user_id, creator_data)
        
        assert creator_sub.has_benefit("ad_free") is True
        assert creator_sub.has_benefit("early_access") is True
        assert creator_sub.has_benefit("exclusive_content") is True
        assert creator_sub.has_benefit("priority_support") is True
        assert creator_sub.has_benefit("advanced_analytics") is True

class TestSubscriptionAPI:
    """Test subscription API endpoints"""
    
    def test_subscription_status_tracking(self, db_session, sample_user_id):
        """Test subscription status changes"""
        subscription = UserSubscription(
            user_id=sample_user_id,
            plan_type=SubscriptionPlan.PREMIUM,
            status=SubscriptionStatus.PENDING
        )
        
        db_session.add(subscription)
        db_session.commit()
        
        # Test status changes
        subscription.status = SubscriptionStatus.ACTIVE
        db_session.commit()
        assert subscription.status == SubscriptionStatus.ACTIVE
        
        subscription.status = SubscriptionStatus.CANCELLED
        subscription.cancelled_at = datetime.now(timezone.utc)
        db_session.commit()
        assert subscription.status == SubscriptionStatus.CANCELLED
        assert subscription.cancelled_at is not None
    
    def test_subscription_pricing_tiers(self, db_session, sample_user_id):
        """Test different subscription pricing tiers"""
        # This would typically integrate with payment processing
        # For now, we test the data structure
        
        subscriptions = []
        plans = [
            (SubscriptionPlan.FREE, "0.00", "USD"),
            (SubscriptionPlan.BASIC, "4.99", "USD"),
            (SubscriptionPlan.PREMIUM, "9.99", "USD"),
            (SubscriptionPlan.CREATOR, "19.99", "USD")
        ]
        
        for plan, price, currency in plans:
            subscription = UserSubscription(
                user_id=sample_user_id,
                plan_type=plan,
                price_paid=price,
                currency=currency
            )
            subscriptions.append(subscription)
            db_session.add(subscription)
        
        db_session.commit()
        
        # Verify pricing data
        for i, (plan, price, currency) in enumerate(plans):
            assert subscriptions[i].plan_type == plan
            assert subscriptions[i].price_paid == price
            assert subscriptions[i].currency == currency

if __name__ == "__main__":
    pytest.main([__file__])