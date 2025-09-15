import pytest
import asyncio
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock, patch
import json

from dashboard_service import DashboardService
from analytics_service import AnalyticsService
from models import EventType, ContentPerformanceMetrics, UserEngagementMetrics

class TestDashboardService:
    @pytest.fixture
    def mock_analytics_service(self):
        """Mock analytics service"""
        mock_service = Mock(spec=AnalyticsService)
        mock_service.mongo_client = Mock()
        mock_service.redis_client = Mock()
        mock_service.db = Mock()
        
        # Mock collections
        mock_service.db.analytics_events = Mock()
        mock_service.db.content_metrics = Mock()
        mock_service.db.user_metrics = Mock()
        
        return mock_service
    
    @pytest.fixture
    def dashboard_service(self, mock_analytics_service):
        """Create dashboard service with mocked analytics service"""
        return DashboardService(mock_analytics_service)
    
    @pytest.mark.asyncio
    async def test_get_writer_stories(self, dashboard_service):
        """Test getting writer's stories"""
        writer_id = "writer123"
        
        # Mock aggregation result
        mock_results = [
            {"_id": "story1"},
            {"_id": "story2"},
            {"_id": "story3"}
        ]
        dashboard_service.events_collection.aggregate.return_value = mock_results
        
        stories = await dashboard_service._get_writer_stories(writer_id)
        
        assert stories == ["story1", "story2", "story3"]
        dashboard_service.events_collection.aggregate.assert_called_once()
    
    @pytest.mark.asyncio
    async def test_get_writer_overall_metrics(self, dashboard_service):
        """Test getting writer's overall metrics"""
        writer_id = "writer123"
        
        # Mock events data
        mock_events = [
            {
                "event_type": EventType.CHAPTER_READ,
                "user_id": "user1",
                "properties": {"read_duration": 300, "author_id": writer_id},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.STORY_VIEW,
                "user_id": "user2",
                "properties": {"author_id": writer_id},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.COMMENT_POSTED,
                "user_id": "user1",
                "properties": {"author_id": writer_id},
                "timestamp": datetime.utcnow()
            }
        ]
        
        dashboard_service.events_collection.find.return_value = mock_events
        
        metrics = await dashboard_service._get_writer_overall_metrics(writer_id, 30)
        
        assert metrics["total_views"] == 2  # CHAPTER_READ + STORY_VIEW
        assert metrics["unique_readers"] == 2  # user1 and user2
        assert metrics["total_comments"] == 1
        assert metrics["total_read_time_hours"] == 300 / 3600  # 300 seconds to hours
        assert "engagement_rate" in metrics
    
    @pytest.mark.asyncio
    async def test_get_writer_revenue_data(self, dashboard_service):
        """Test getting writer's revenue data"""
        writer_id = "writer123"
        
        # Mock revenue events
        mock_events = [
            {
                "event_type": EventType.PAYMENT_MADE,
                "properties": {"author_id": writer_id, "amount": 25.0, "content_id": "story1"},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.PAYMENT_MADE,
                "properties": {"author_id": writer_id, "amount": 15.0, "content_id": "story2"},
                "timestamp": datetime.utcnow()
            }
        ]
        
        dashboard_service.events_collection.find.return_value = mock_events
        
        revenue_data = await dashboard_service._get_writer_revenue_data(writer_id, 30)
        
        assert revenue_data["total_revenue"] == 40.0
        assert revenue_data["transaction_count"] == 2
        assert revenue_data["average_transaction"] == 20.0
        assert "daily_revenue" in revenue_data
        assert "content_revenue" in revenue_data
        assert "forecast" in revenue_data
    
    @pytest.mark.asyncio
    async def test_calculate_revenue_forecast(self, dashboard_service):
        """Test revenue forecasting calculation"""
        # Test with insufficient data
        daily_revenue = {"2024-01-01": 10.0, "2024-01-02": 15.0}
        forecast = await dashboard_service._calculate_revenue_forecast(daily_revenue, 30)
        
        assert forecast["forecast_available"] is False
        assert forecast["reason"] == "Insufficient data"
        
        # Test with sufficient data
        daily_revenue = {
            f"2024-01-{i:02d}": 10.0 + i for i in range(1, 15)
        }
        forecast = await dashboard_service._calculate_revenue_forecast(daily_revenue, 30)
        
        assert forecast["forecast_available"] is True
        assert "next_30_days" in forecast
        assert "daily_average" in forecast
        assert "growth_rate" in forecast
    
    @pytest.mark.asyncio
    async def test_get_audience_demographics(self, dashboard_service):
        """Test getting audience demographics"""
        writer_id = "writer123"
        
        # Mock events with different user behaviors
        mock_events = [
            # User1: Casual reader (2 reads)
            {"event_type": EventType.CHAPTER_READ, "user_id": "user1", "properties": {"author_id": writer_id, "read_duration": 300}, "timestamp": datetime.utcnow()},
            {"event_type": EventType.CHAPTER_READ, "user_id": "user1", "properties": {"author_id": writer_id, "read_duration": 250}, "timestamp": datetime.utcnow()},
            
            # User2: Regular reader (5 reads + engagement)
            {"event_type": EventType.CHAPTER_READ, "user_id": "user2", "properties": {"author_id": writer_id, "read_duration": 400}, "timestamp": datetime.utcnow()},
            {"event_type": EventType.CHAPTER_READ, "user_id": "user2", "properties": {"author_id": writer_id, "read_duration": 350}, "timestamp": datetime.utcnow()},
            {"event_type": EventType.CHAPTER_READ, "user_id": "user2", "properties": {"author_id": writer_id, "read_duration": 300}, "timestamp": datetime.utcnow()},
            {"event_type": EventType.CHAPTER_READ, "user_id": "user2", "properties": {"author_id": writer_id, "read_duration": 280}, "timestamp": datetime.utcnow()},
            {"event_type": EventType.CHAPTER_READ, "user_id": "user2", "properties": {"author_id": writer_id, "read_duration": 320}, "timestamp": datetime.utcnow()},
            {"event_type": EventType.COMMENT_POSTED, "user_id": "user2", "properties": {"author_id": writer_id}, "timestamp": datetime.utcnow()},
            
            # User3: Loyal reader (12 reads)
            *[{"event_type": EventType.CHAPTER_READ, "user_id": "user3", "properties": {"author_id": writer_id, "read_duration": 300}, "timestamp": datetime.utcnow()} for _ in range(12)]
        ]
        
        dashboard_service.events_collection.find.return_value = mock_events
        
        demographics = await dashboard_service._get_audience_demographics(writer_id, 30)
        
        assert demographics["total_readers"] == 3
        assert demographics["reader_segments"]["casual"] == 1  # user1
        assert demographics["reader_segments"]["regular"] == 1  # user2
        assert demographics["reader_segments"]["loyal"] == 1   # user3
        assert demographics["engagement_stats"]["engaged_readers"] == 1  # user2 has comment
        assert "reading_behavior" in demographics
    
    @pytest.mark.asyncio
    async def test_get_engagement_trends(self, dashboard_service):
        """Test getting engagement trends"""
        writer_id = "writer123"
        
        # Mock engagement events over time
        base_date = datetime.utcnow() - timedelta(days=10)
        mock_events = []
        
        for i in range(10):
            event_date = base_date + timedelta(days=i)
            # Add varying engagement per day
            for j in range(i + 1):  # Increasing engagement over time
                mock_events.append({
                    "event_type": EventType.CHAPTER_READ,
                    "properties": {"author_id": writer_id},
                    "timestamp": event_date
                })
        
        dashboard_service.events_collection.find.return_value = mock_events
        
        trends = await dashboard_service._get_engagement_trends(writer_id, 30)
        
        assert "daily_engagement" in trends
        assert "trend_percentage" in trends
        assert "average_daily_engagement" in trends
        assert trends["trend_percentage"] > 0  # Should show positive trend
    
    @pytest.mark.asyncio
    async def test_generate_content_recommendations(self, dashboard_service):
        """Test generating content recommendations"""
        writer_id = "writer123"
        
        # Mock low engagement metrics
        dashboard_service._get_writer_overall_metrics = AsyncMock(return_value={
            "engagement_rate": 3.0,  # Low engagement rate
            "total_views": 100,
            "unique_readers": 80
        })
        
        dashboard_service._get_engagement_trends = AsyncMock(return_value={
            "daily_engagement": {"2024-01-01": {"reads": 5}},  # Sparse activity
            "trend_percentage": -5.0
        })
        
        recommendations = await dashboard_service._generate_content_recommendations(writer_id, 30)
        
        assert len(recommendations) > 0
        assert any(rec["type"] == "engagement" for rec in recommendations)
        assert any(rec["type"] == "consistency" for rec in recommendations)
        assert any(rec["type"] == "retention" for rec in recommendations)
        
        # Check recommendation structure
        for rec in recommendations:
            assert "type" in rec
            assert "priority" in rec
            assert "title" in rec
            assert "description" in rec
            assert "suggested_actions" in rec
    
    @pytest.mark.asyncio
    async def test_get_writer_dashboard(self, dashboard_service):
        """Test getting complete writer dashboard"""
        writer_id = "writer123"
        
        # Mock all the sub-methods
        dashboard_service._get_writer_stories = AsyncMock(return_value=["story1", "story2"])
        dashboard_service._get_writer_overall_metrics = AsyncMock(return_value={"total_views": 1000})
        dashboard_service._get_writer_revenue_data = AsyncMock(return_value={"total_revenue": 500.0})
        dashboard_service._get_audience_demographics = AsyncMock(return_value={"total_readers": 100})
        dashboard_service._get_engagement_trends = AsyncMock(return_value={"trend_percentage": 10.0})
        dashboard_service._generate_content_recommendations = AsyncMock(return_value=[{"type": "test"}])
        
        # Mock analytics service method
        dashboard_service.analytics_service.get_content_performance = AsyncMock(
            return_value=ContentPerformanceMetrics(content_id="story1", content_type="story")
        )
        
        dashboard_data = await dashboard_service.get_writer_dashboard(writer_id, 30)
        
        assert dashboard_data["writer_id"] == writer_id
        assert dashboard_data["period_days"] == 30
        assert "overall_metrics" in dashboard_data
        assert "story_performance" in dashboard_data
        assert "revenue_data" in dashboard_data
        assert "audience_demographics" in dashboard_data
        assert "engagement_trends" in dashboard_data
        assert "recommendations" in dashboard_data
        assert "generated_at" in dashboard_data
    
    @pytest.mark.asyncio
    async def test_get_content_insights(self, dashboard_service):
        """Test getting content insights"""
        content_id = "story123"
        
        # Mock analytics service method
        dashboard_service.analytics_service.get_content_performance = AsyncMock(
            return_value=ContentPerformanceMetrics(content_id=content_id, content_type="story")
        )
        
        # Mock other methods
        dashboard_service._analyze_reader_journey = AsyncMock(return_value={"completion_rates": {}})
        dashboard_service._analyze_posting_patterns = AsyncMock(return_value={"optimal_time": "18:00"})
        dashboard_service._get_similar_content_performance = AsyncMock(return_value={"category_average": 100})
        
        insights = await dashboard_service.get_content_insights(content_id, 30)
        
        assert insights["content_id"] == content_id
        assert "performance_metrics" in insights
        assert "reader_journey" in insights
        assert "posting_insights" in insights
        assert "similar_content_comparison" in insights
        assert "generated_at" in insights
    
    @pytest.mark.asyncio
    async def test_analyze_reader_journey(self, dashboard_service):
        """Test analyzing reader journey"""
        content_id = "story123"
        
        # Mock events with chapter completion data
        mock_events = [
            {
                "event_type": EventType.CHAPTER_READ,
                "properties": {"chapter_id": "ch1", "completion_percentage": 95},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.CHAPTER_READ,
                "properties": {"chapter_id": "ch1", "completion_percentage": 85},
                "timestamp": datetime.utcnow()
            },
            {
                "event_type": EventType.CHAPTER_READ,
                "properties": {"chapter_id": "ch2", "completion_percentage": 70},
                "timestamp": datetime.utcnow()
            }
        ]
        
        dashboard_service.events_collection.find.return_value = mock_events
        
        journey = await dashboard_service._analyze_reader_journey(content_id, 30)
        
        assert "chapter_completion_rates" in journey
        assert "average_completion_rate" in journey
        assert "ch1" in journey["chapter_completion_rates"]
        assert journey["chapter_completion_rates"]["ch1"] == 50.0  # 1 out of 2 completed (>=90%)

if __name__ == "__main__":
    pytest.main([__file__])