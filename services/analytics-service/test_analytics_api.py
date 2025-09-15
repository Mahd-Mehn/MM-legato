import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import json

from main import app
from models import AnalyticsEvent, ContentEngagementEvent, EventType, ABTestVariant

class TestAnalyticsAPI:
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_analytics_service(self):
        """Mock analytics service"""
        with patch('analytics_routes.get_analytics_service') as mock_get_service:
            mock_service = Mock()
            mock_get_service.return_value = mock_service
            yield mock_service
    
    def test_track_event(self, client, mock_analytics_service):
        """Test tracking a single event"""
        mock_analytics_service.track_event = AsyncMock(return_value=True)
        
        event_data = {
            "event_type": "chapter_read",
            "user_id": "user123",
            "properties": {"story_id": "story456", "read_duration": 300}
        }
        
        response = client.post("/analytics/events/track", json=event_data)
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_analytics_service.track_event.assert_called_once()
    
    def test_track_event_failure(self, client, mock_analytics_service):
        """Test tracking event failure"""
        mock_analytics_service.track_event = AsyncMock(return_value=False)
        
        event_data = {
            "event_type": "chapter_read",
            "user_id": "user123"
        }
        
        response = client.post("/analytics/events/track", json=event_data)
        
        assert response.status_code == 500
        assert "Failed to track event" in response.json()["detail"]
    
    def test_track_batch_events(self, client, mock_analytics_service):
        """Test tracking batch events"""
        mock_analytics_service.track_batch_events = AsyncMock(return_value=True)
        
        events_data = [
            {"event_type": "chapter_read", "user_id": "user1"},
            {"event_type": "story_view", "user_id": "user2"},
            {"event_type": "comment_posted", "user_id": "user3"}
        ]
        
        response = client.post("/analytics/events/track-batch", json=events_data)
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        assert "Tracked 3 events" in response.json()["message"]
        mock_analytics_service.track_batch_events.assert_called_once()
    
    def test_track_batch_events_too_large(self, client, mock_analytics_service):
        """Test tracking batch with too many events"""
        events_data = [{"event_type": "chapter_read", "user_id": f"user{i}"} for i in range(1001)]
        
        response = client.post("/analytics/events/track-batch", json=events_data)
        
        assert response.status_code == 400
        assert "Batch size cannot exceed 1000" in response.json()["detail"]
    
    def test_track_content_engagement(self, client, mock_analytics_service):
        """Test tracking content engagement"""
        mock_analytics_service.track_event = AsyncMock(return_value=True)
        
        engagement_data = {
            "event_type": "chapter_read",
            "user_id": "user123",
            "story_id": "story456",
            "chapter_id": "chapter789",
            "read_duration": 300,
            "completion_percentage": 85.5
        }
        
        response = client.post("/analytics/events/content-engagement", json=engagement_data)
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_analytics_service.track_event.assert_called_once()
    
    def test_get_realtime_metrics(self, client, mock_analytics_service):
        """Test getting real-time metrics"""
        from models import RealtimeMetrics
        
        mock_metrics = RealtimeMetrics(
            active_users=150,
            concurrent_readers=75,
            revenue_today=1250.50,
            new_registrations_today=25,
            top_stories=[{"story_id": "story1", "score": 100}]
        )
        mock_analytics_service.get_realtime_metrics = AsyncMock(return_value=mock_metrics)
        
        response = client.get("/analytics/realtime")
        
        assert response.status_code == 200
        data = response.json()
        assert data["active_users"] == 150
        assert data["concurrent_readers"] == 75
        assert data["revenue_today"] == 1250.50
        assert data["new_registrations_today"] == 25
        assert len(data["top_stories"]) == 1
    
    def test_get_content_performance(self, client, mock_analytics_service):
        """Test getting content performance metrics"""
        from models import ContentPerformanceMetrics
        
        mock_metrics = ContentPerformanceMetrics(
            content_id="story123",
            content_type="story",
            total_views=1000,
            unique_viewers=750,
            total_read_time=45000,
            average_read_time=60.0,
            completion_rate=0.85,
            engagement_score=125.5,
            comments_count=50,
            ratings_count=30,
            shares_count=15
        )
        mock_analytics_service.get_content_performance = AsyncMock(return_value=mock_metrics)
        
        response = client.get("/analytics/content/story123/performance?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["content_id"] == "story123"
        assert data["total_views"] == 1000
        assert data["unique_viewers"] == 750
        assert data["completion_rate"] == 0.85
        assert data["engagement_score"] == 125.5
    
    def test_get_user_engagement(self, client, mock_analytics_service):
        """Test getting user engagement metrics"""
        from models import UserEngagementMetrics
        
        mock_metrics = UserEngagementMetrics(
            user_id="user123",
            total_reading_time=7200,
            stories_read=15,
            chapters_read=45,
            comments_posted=12,
            ratings_given=8,
            stories_shared=3,
            engagement_score=89.5,
            retention_days=20
        )
        mock_analytics_service.get_user_engagement = AsyncMock(return_value=mock_metrics)
        
        response = client.get("/analytics/user/user123/engagement?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["user_id"] == "user123"
        assert data["total_reading_time"] == 7200
        assert data["stories_read"] == 15
        assert data["engagement_score"] == 89.5
    
    def test_get_top_performing_content(self, client, mock_analytics_service):
        """Test getting top performing content"""
        mock_analytics_service.content_metrics_collection.aggregate.return_value = [
            {
                "_id": "story1",
                "total_views": 5000,
                "unique_viewers": 3500,
                "engagement_score": 150.5,
                "revenue_generated": 500.0
            },
            {
                "_id": "story2",
                "total_views": 3000,
                "unique_viewers": 2200,
                "engagement_score": 120.3,
                "revenue_generated": 300.0
            }
        ]
        
        response = client.get("/analytics/content/top-performing?limit=10&days=7&metric=engagement_score")
        
        assert response.status_code == 200
        data = response.json()
        assert "top_content" in data
        assert data["metric"] == "engagement_score"
        assert data["period_days"] == 7
        assert len(data["top_content"]) == 2
    
    def test_create_ab_test(self, client, mock_analytics_service):
        """Test creating A/B test"""
        mock_analytics_service.create_ab_test = AsyncMock(return_value=True)
        
        variants_data = [
            {
                "test_id": "test123",
                "variant_id": "variant_a",
                "variant_name": "Control",
                "traffic_percentage": 50.0,
                "configuration": {"button_color": "blue"}
            },
            {
                "test_id": "test123",
                "variant_id": "variant_b",
                "variant_name": "Treatment",
                "traffic_percentage": 50.0,
                "configuration": {"button_color": "red"}
            }
        ]
        
        response = client.post("/analytics/ab-tests?test_id=test123", json=variants_data)
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_analytics_service.create_ab_test.assert_called_once()
    
    def test_get_ab_test_variant(self, client, mock_analytics_service):
        """Test getting A/B test variant"""
        mock_variant = ABTestVariant(
            test_id="test123",
            variant_id="variant_a",
            variant_name="Control",
            traffic_percentage=50.0,
            configuration={"button_color": "blue"}
        )
        mock_analytics_service.get_ab_test_variant = AsyncMock(return_value=mock_variant)
        
        response = client.get("/analytics/ab-tests/test123/variant?user_id=user456")
        
        assert response.status_code == 200
        data = response.json()
        assert "variant" in data
        assert data["variant"]["test_id"] == "test123"
        assert data["variant"]["variant_id"] == "variant_a"
    
    def test_get_ab_test_variant_not_found(self, client, mock_analytics_service):
        """Test getting A/B test variant when none exists"""
        mock_analytics_service.get_ab_test_variant = AsyncMock(return_value=None)
        
        response = client.get("/analytics/ab-tests/test123/variant?user_id=user456")
        
        assert response.status_code == 404
        assert "No active variant found" in response.json()["detail"]
    
    def test_track_ab_test_result(self, client, mock_analytics_service):
        """Test tracking A/B test result"""
        mock_analytics_service.track_ab_test_result = AsyncMock(return_value=True)
        
        result_data = {
            "test_id": "test123",
            "variant_id": "variant_a",
            "user_id": "user456",
            "event_type": "conversion",
            "conversion": True,
            "value": 25.0
        }
        
        response = client.post("/analytics/ab-tests/results", json=result_data)
        
        assert response.status_code == 200
        assert response.json()["status"] == "success"
        mock_analytics_service.track_ab_test_result.assert_called_once()
    
    def test_get_ab_test_results(self, client, mock_analytics_service):
        """Test getting A/B test results"""
        mock_results = [
            {
                "test_id": "test123",
                "variant_id": "variant_a",
                "user_id": "user1",
                "conversion": True,
                "value": 25.0
            },
            {
                "test_id": "test123",
                "variant_id": "variant_a",
                "user_id": "user2",
                "conversion": False,
                "value": None
            },
            {
                "test_id": "test123",
                "variant_id": "variant_b",
                "user_id": "user3",
                "conversion": True,
                "value": 30.0
            }
        ]
        mock_analytics_service.ab_results_collection.find.return_value = mock_results
        
        response = client.get("/analytics/ab-tests/test123/results")
        
        assert response.status_code == 200
        data = response.json()
        assert data["test_id"] == "test123"
        assert data["total_results"] == 3
        assert "variant_stats" in data
        assert "variant_a" in data["variant_stats"]
        assert "variant_b" in data["variant_stats"]
        
        # Check variant A stats
        variant_a_stats = data["variant_stats"]["variant_a"]
        assert variant_a_stats["total_users"] == 2
        assert variant_a_stats["conversions"] == 1
        assert variant_a_stats["conversion_rate"] == 0.5
    
    def test_trigger_daily_aggregation(self, client, mock_analytics_service):
        """Test triggering daily aggregation"""
        response = client.post("/analytics/aggregate/daily?date=2024-01-15")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "success"
        assert "2024-01-15" in data["message"]
    
    def test_trigger_daily_aggregation_invalid_date(self, client, mock_analytics_service):
        """Test triggering daily aggregation with invalid date"""
        response = client.post("/analytics/aggregate/daily?date=invalid-date")
        
        assert response.status_code == 400
        assert "Invalid date format" in response.json()["detail"]
    
    def test_health_check(self, client):
        """Test analytics health check endpoint"""
        response = client.get("/analytics/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "analytics"
        assert data["status"] == "healthy"
        assert "timestamp" in data

class TestAnalyticsValidation:
    def test_invalid_event_type(self, client):
        """Test tracking event with invalid event type"""
        event_data = {
            "event_type": "invalid_event_type",
            "user_id": "user123"
        }
        
        response = client.post("/analytics/events/track", json=event_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_missing_required_fields(self, client):
        """Test tracking event with missing required fields"""
        event_data = {
            "user_id": "user123"
            # Missing event_type
        }
        
        response = client.post("/analytics/events/track", json=event_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_invalid_query_parameters(self, client, mock_analytics_service):
        """Test API with invalid query parameters"""
        # Test negative days parameter
        response = client.get("/analytics/content/story123/performance?days=-1")
        assert response.status_code == 422
        
        # Test days parameter too large
        response = client.get("/analytics/content/story123/performance?days=400")
        assert response.status_code == 422

if __name__ == "__main__":
    pytest.main([__file__])