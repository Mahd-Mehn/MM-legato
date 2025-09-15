import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock
import json

from analytics_service import AnalyticsService
from models import (
    AnalyticsEvent, ContentEngagementEvent, UserBehaviorEvent, RevenueEvent,
    EventType, ABTestVariant, ABTestResult
)

class TestAnalyticsService:
    @pytest.fixture
    def mock_mongo_client(self):
        """Mock MongoDB client"""
        mock_client = Mock()
        mock_db = Mock()
        mock_client.get_default_database.return_value = mock_db
        
        # Mock collections
        mock_db.analytics_events = Mock()
        mock_db.aggregated_metrics = Mock()
        mock_db.content_metrics = Mock()
        mock_db.user_metrics = Mock()
        mock_db.ab_tests = Mock()
        mock_db.ab_test_results = Mock()
        
        return mock_client
    
    @pytest.fixture
    def mock_redis_client(self):
        """Mock Redis client"""
        mock_redis = Mock()
        mock_redis.ping.return_value = True
        mock_redis.lpush.return_value = 1
        mock_redis.expire.return_value = True
        mock_redis.sadd.return_value = 1
        mock_redis.scard.return_value = 10
        mock_redis.zincrby.return_value = 1
        mock_redis.incrbyfloat.return_value = 100.0
        mock_redis.get.return_value = b"50.0"
        mock_redis.setex.return_value = True
        mock_redis.zrevrange.return_value = [(b"story1", 100), (b"story2", 80)]
        return mock_redis
    
    @pytest.fixture
    def analytics_service(self, mock_mongo_client, mock_redis_client):
        """Create analytics service with mocked dependencies"""
        return AnalyticsService(mock_mongo_client, mock_redis_client)
    
    @pytest.mark.asyncio
    async def test_track_event(self, analytics_service, mock_mongo_client, mock_redis_client):
        """Test tracking a single event"""
        event = AnalyticsEvent(
            event_type=EventType.CHAPTER_READ,
            user_id="user123",
            properties={"story_id": "story456", "read_duration": 300}
        )
        
        # Mock successful insertion
        mock_mongo_client.get_default_database().analytics_events.insert_one.return_value = Mock()
        
        result = await analytics_service.track_event(event)
        
        assert result is True
        mock_mongo_client.get_default_database().analytics_events.insert_one.assert_called_once()
        mock_redis_client.lpush.assert_called()
        mock_redis_client.expire.assert_called()
    
    @pytest.mark.asyncio
    async def test_track_batch_events(self, analytics_service, mock_mongo_client, mock_redis_client):
        """Test tracking multiple events in batch"""
        events = [
            AnalyticsEvent(event_type=EventType.CHAPTER_READ, user_id="user1"),
            AnalyticsEvent(event_type=EventType.STORY_VIEW, user_id="user2"),
            AnalyticsEvent(event_type=EventType.COMMENT_POSTED, user_id="user3")
        ]
        
        # Mock successful batch insertion
        mock_mongo_client.get_default_database().analytics_events.insert_many.return_value = Mock()
        mock_redis_client.pipeline.return_value.execute.return_value = [1, True] * len(events)
        
        result = await analytics_service.track_batch_events(events)
        
        assert result is True
        mock_mongo_client.get_default_database().analytics_events.insert_many.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_realtime_metrics(self, analytics_service, mock_redis_client):
        """Test getting real-time metrics"""
        # Mock Redis responses
        mock_redis_client.scard.side_effect = [25, 15]  # active_users, concurrent_readers
        mock_redis_client.zrevrange.return_value = [(b"story1", 100), (b"story2", 80)]
        mock_redis_client.get.return_value = b"150.50"
        
        # Mock daily registrations
        analytics_service._get_daily_registrations = Mock(return_value=5)
        
        metrics = await analytics_service.get_realtime_metrics()
        
        assert metrics.active_users == 25
        assert metrics.concurrent_readers == 15
        assert metrics.revenue_today == 150.50
        assert len(metrics.top_stories) == 2
        assert metrics.top_stories[0]["story_id"] == "story1"
        assert metrics.top_stories[0]["score"] == 100
    
    @pytest.mark.asyncio
    async def test_get_content_performance(self, analytics_service, mock_mongo_client):
        """Test getting content performance metrics"""
        content_id = "story123"
        
        # Mock events data
        mock_events = [
            {
                "event_type": EventType.CHAPTER_READ,
                "user_id": "user1",
                "properties": {"read_duration": 300, "completion_percentage": 95},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.STORY_VIEW,
                "user_id": "user2",
                "properties": {},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.COMMENT_POSTED,
                "user_id": "user1",
                "properties": {},
                "timestamp": datetime.utcnow()
            }
        ]
        
        mock_mongo_client.get_default_database().analytics_events.find.return_value = mock_events
        
        metrics = await analytics_service.get_content_performance(content_id, 30)
        
        assert metrics.content_id == content_id
        assert metrics.total_views == 2  # CHAPTER_READ + STORY_VIEW
        assert metrics.unique_viewers == 2  # user1 and user2
        assert metrics.comments_count == 1
        assert metrics.completion_rate == 1.0  # 1 completion out of 1 read event
    
    @pytest.mark.asyncio
    async def test_get_user_engagement(self, analytics_service, mock_mongo_client):
        """Test getting user engagement metrics"""
        user_id = "user123"
        
        # Mock events data
        mock_events = [
            {
                "event_type": EventType.CHAPTER_READ,
                "user_id": user_id,
                "properties": {"read_duration": 300, "story_id": "story1"},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.CHAPTER_READ,
                "user_id": user_id,
                "properties": {"read_duration": 250, "story_id": "story2"},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.COMMENT_POSTED,
                "user_id": user_id,
                "properties": {},
                "timestamp": datetime.utcnow()
            }
        ]
        
        mock_mongo_client.get_default_database().analytics_events.find.return_value = mock_events
        
        metrics = await analytics_service.get_user_engagement(user_id, 30)
        
        assert metrics.user_id == user_id
        assert metrics.total_reading_time == 550  # 300 + 250
        assert metrics.stories_read == 2  # story1 and story2
        assert metrics.chapters_read == 2
        assert metrics.comments_posted == 1
    
    @pytest.mark.asyncio
    async def test_create_ab_test(self, analytics_service, mock_mongo_client):
        """Test creating A/B test"""
        test_id = "test123"
        variants = [
            ABTestVariant(
                test_id=test_id,
                variant_id="variant_a",
                variant_name="Control",
                traffic_percentage=50.0,
                configuration={"button_color": "blue"}
            ),
            ABTestVariant(
                test_id=test_id,
                variant_id="variant_b",
                variant_name="Treatment",
                traffic_percentage=50.0,
                configuration={"button_color": "red"}
            )
        ]
        
        mock_mongo_client.get_default_database().ab_tests.insert_many.return_value = Mock()
        
        result = await analytics_service.create_ab_test(test_id, variants)
        
        assert result is True
        mock_mongo_client.get_default_database().ab_tests.insert_many.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_create_ab_test_invalid_traffic(self, analytics_service):
        """Test creating A/B test with invalid traffic percentages"""
        test_id = "test123"
        variants = [
            ABTestVariant(
                test_id=test_id,
                variant_id="variant_a",
                variant_name="Control",
                traffic_percentage=60.0,
                configuration={}
            ),
            ABTestVariant(
                test_id=test_id,
                variant_id="variant_b",
                variant_name="Treatment",
                traffic_percentage=50.0,  # Total = 110%, should fail
                configuration={}
            )
        ]
        
        result = await analytics_service.create_ab_test(test_id, variants)
        
        assert result is False
    
    @pytest.mark.asyncio
    async def test_get_ab_test_variant(self, analytics_service, mock_mongo_client, mock_redis_client):
        """Test getting A/B test variant for user"""
        test_id = "test123"
        user_id = "user456"
        
        # Mock no cached variant
        mock_redis_client.get.return_value = None
        
        # Mock active variants
        mock_variants = [
            {
                "test_id": test_id,
                "variant_id": "variant_a",
                "variant_name": "Control",
                "traffic_percentage": 50.0,
                "configuration": {"button_color": "blue"},
                "is_active": True
            }
        ]
        mock_mongo_client.get_default_database().ab_tests.find.return_value = mock_variants
        
        variant = await analytics_service.get_ab_test_variant(test_id, user_id)
        
        assert variant is not None
        assert variant.test_id == test_id
        mock_redis_client.setex.assert_called()  # Should cache the result
    
    @pytest.mark.asyncio
    async def test_track_ab_test_result(self, analytics_service, mock_mongo_client):
        """Test tracking A/B test result"""
        result = ABTestResult(
            test_id="test123",
            variant_id="variant_a",
            user_id="user456",
            event_type="conversion",
            conversion=True,
            value=25.0
        )
        
        mock_mongo_client.get_default_database().ab_test_results.insert_one.return_value = Mock()
        
        success = await analytics_service.track_ab_test_result(result)
        
        assert success is True
        mock_mongo_client.get_default_database().ab_test_results.insert_one.assert_called_once()

class TestContentEngagementEvent:
    def test_content_engagement_event_creation(self):
        """Test creating content engagement event"""
        event = ContentEngagementEvent(
            event_type=EventType.CHAPTER_READ,
            user_id="user123",
            story_id="story456",
            chapter_id="chapter789",
            read_duration=300,
            completion_percentage=85.5
        )
        
        assert event.event_type == EventType.CHAPTER_READ
        assert event.user_id == "user123"
        assert event.story_id == "story456"
        assert event.chapter_id == "chapter789"
        assert event.read_duration == 300
        assert event.completion_percentage == 85.5
        assert event.event_id is not None
        assert isinstance(event.timestamp, datetime)

class TestUserBehaviorEvent:
    def test_user_behavior_event_creation(self):
        """Test creating user behavior event"""
        event = UserBehaviorEvent(
            event_type=EventType.STORY_VIEW,
            user_id="user123",
            page_url="/stories/456",
            referrer="https://google.com",
            device_type="mobile",
            browser="Chrome"
        )
        
        assert event.event_type == EventType.STORY_VIEW
        assert event.user_id == "user123"
        assert event.page_url == "/stories/456"
        assert event.referrer == "https://google.com"
        assert event.device_type == "mobile"
        assert event.browser == "Chrome"

class TestRevenueEvent:
    def test_revenue_event_creation(self):
        """Test creating revenue event"""
        event = RevenueEvent(
            event_type=EventType.PAYMENT_MADE,
            user_id="user123",
            transaction_id="txn456",
            amount=25.99,
            currency="USD",
            payment_method="stripe"
        )
        
        assert event.event_type == EventType.PAYMENT_MADE
        assert event.user_id == "user123"
        assert event.transaction_id == "txn456"
        assert event.amount == 25.99
        assert event.currency == "USD"
        assert event.payment_method == "stripe"

if __name__ == "__main__":
    pytest.main([__file__])