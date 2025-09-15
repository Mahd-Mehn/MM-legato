import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import json

from main import app
from models import ContentPerformanceMetrics

class TestDashboardAPI:
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def mock_dashboard_service(self):
        """Mock dashboard service"""
        with patch('dashboard_routes.get_dashboard_service') as mock_get_service:
            mock_service = Mock()
            mock_get_service.return_value = mock_service
            yield mock_service
    
    def test_get_writer_dashboard(self, client, mock_dashboard_service):
        """Test getting writer dashboard"""
        writer_id = "writer123"
        
        mock_dashboard_data = {
            "writer_id": writer_id,
            "period_days": 30,
            "overall_metrics": {"total_views": 1000, "engagement_rate": 8.5},
            "story_performance": [],
            "revenue_data": {"total_revenue": 500.0},
            "audience_demographics": {"total_readers": 100},
            "engagement_trends": {"trend_percentage": 10.0},
            "recommendations": [{"type": "engagement", "title": "Improve engagement"}],
            "generated_at": datetime.utcnow()
        }
        
        mock_dashboard_service.get_writer_dashboard = AsyncMock(return_value=mock_dashboard_data)
        
        response = client.get(f"/dashboard/writer/{writer_id}?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["writer_id"] == writer_id
        assert data["period_days"] == 30
        assert "overall_metrics" in data
        assert "revenue_data" in data
        mock_dashboard_service.get_writer_dashboard.assert_called_once_with(writer_id, 30)
    
    def test_get_writer_dashboard_not_found(self, client, mock_dashboard_service):
        """Test getting writer dashboard when no data found"""
        writer_id = "nonexistent"
        
        mock_dashboard_service.get_writer_dashboard = AsyncMock(return_value={})
        
        response = client.get(f"/dashboard/writer/{writer_id}")
        
        assert response.status_code == 404
        assert "No data found for writer" in response.json()["detail"]
    
    def test_get_writer_overview(self, client, mock_dashboard_service):
        """Test getting writer overview"""
        writer_id = "writer123"
        
        mock_dashboard_service._get_writer_overall_metrics = AsyncMock(return_value={
            "total_views": 500,
            "unique_readers": 300,
            "engagement_rate": 7.5,
            "new_followers": 25
        })
        
        mock_dashboard_service._get_writer_revenue_data = AsyncMock(return_value={
            "total_revenue": 250.0
        })
        
        # Mock analytics service for realtime metrics
        from models import RealtimeMetrics
        mock_realtime = RealtimeMetrics(active_users=50, concurrent_readers=25)
        mock_dashboard_service.analytics_service.get_realtime_metrics = AsyncMock(return_value=mock_realtime)
        
        response = client.get(f"/dashboard/writer/{writer_id}/overview?days=7")
        
        assert response.status_code == 200
        data = response.json()
        assert data["writer_id"] == writer_id
        assert data["period_days"] == 7
        assert "quick_stats" in data
        assert "realtime" in data
        assert data["quick_stats"]["total_views"] == 500
        assert data["realtime"]["active_readers"] == 50
    
    def test_get_writer_revenue_dashboard(self, client, mock_dashboard_service):
        """Test getting writer revenue dashboard"""
        writer_id = "writer123"
        
        mock_revenue_data = {
            "total_revenue": 1250.50,
            "transaction_count": 45,
            "average_transaction": 27.79,
            "daily_revenue": {"2024-01-01": 50.0, "2024-01-02": 75.0},
            "content_revenue": {"story1": 300.0, "story2": 200.0},
            "forecast": {"next_30_days": 1500.0, "growth_rate": 15.5}
        }
        
        mock_dashboard_service._get_writer_revenue_data = AsyncMock(return_value=mock_revenue_data)
        
        response = client.get(f"/dashboard/writer/{writer_id}/revenue?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["writer_id"] == writer_id
        assert data["revenue_analytics"]["total_revenue"] == 1250.50
        assert data["revenue_analytics"]["forecast"]["growth_rate"] == 15.5
    
    def test_get_writer_audience_insights(self, client, mock_dashboard_service):
        """Test getting writer audience insights"""
        writer_id = "writer123"
        
        mock_audience_data = {
            "total_readers": 150,
            "reader_segments": {"casual": 80, "regular": 50, "loyal": 20},
            "engagement_stats": {"engaged_readers": 45, "engagement_percentage": 30.0},
            "reading_behavior": {"average_session_time_minutes": 12.5}
        }
        
        mock_engagement_trends = {
            "daily_engagement": {"2024-01-01": {"reads": 25, "comments": 5}},
            "trend_percentage": 8.5,
            "average_daily_engagement": 30.0
        }
        
        mock_dashboard_service._get_audience_demographics = AsyncMock(return_value=mock_audience_data)
        mock_dashboard_service._get_engagement_trends = AsyncMock(return_value=mock_engagement_trends)
        
        response = client.get(f"/dashboard/writer/{writer_id}/audience?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["audience_demographics"]["total_readers"] == 150
        assert data["engagement_trends"]["trend_percentage"] == 8.5
    
    def test_get_writer_recommendations(self, client, mock_dashboard_service):
        """Test getting writer recommendations"""
        writer_id = "writer123"
        
        mock_recommendations = [
            {
                "type": "engagement",
                "priority": "high",
                "title": "Improve Reader Engagement",
                "description": "Your engagement rate is low. Try adding more interactive elements.",
                "suggested_actions": ["Add cliffhangers", "Ask questions", "Respond to comments"]
            },
            {
                "type": "consistency",
                "priority": "medium",
                "title": "Maintain Publishing Schedule",
                "description": "Consistent publishing helps retain readers.",
                "suggested_actions": ["Set regular schedule", "Prepare content in advance"]
            }
        ]
        
        mock_dashboard_service._generate_content_recommendations = AsyncMock(return_value=mock_recommendations)
        
        response = client.get(f"/dashboard/writer/{writer_id}/recommendations?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert len(data["recommendations"]) == 2
        assert data["recommendations"][0]["type"] == "engagement"
        assert data["recommendations"][0]["priority"] == "high"
    
    def test_get_content_insights(self, client, mock_dashboard_service):
        """Test getting content insights"""
        content_id = "story123"
        
        mock_insights = {
            "content_id": content_id,
            "performance_metrics": ContentPerformanceMetrics(
                content_id=content_id,
                content_type="story",
                total_views=2000,
                engagement_score=95.5
            ),
            "reader_journey": {"chapter_completion_rates": {"ch1": 85.0, "ch2": 78.0}},
            "posting_insights": {"optimal_posting_time": "18:00-20:00 UTC"},
            "similar_content_comparison": {"category_average_views": 1500},
            "generated_at": datetime.utcnow()
        }
        
        mock_dashboard_service.get_content_insights = AsyncMock(return_value=mock_insights)
        
        response = client.get(f"/dashboard/content/{content_id}/insights?days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["content_id"] == content_id
        assert "performance_metrics" in data
        assert "reader_journey" in data
    
    def test_get_content_performance_comparison(self, client, mock_dashboard_service):
        """Test getting content performance comparison"""
        content_id = "story123"
        compare_id = "story456"
        
        main_performance = ContentPerformanceMetrics(
            content_id=content_id,
            content_type="story",
            total_views=2000,
            engagement_score=95.5,
            completion_rate=0.85
        )
        
        compare_performance = ContentPerformanceMetrics(
            content_id=compare_id,
            content_type="story",
            total_views=1500,
            engagement_score=80.0,
            completion_rate=0.78
        )
        
        mock_dashboard_service.analytics_service.get_content_performance = AsyncMock()
        mock_dashboard_service.analytics_service.get_content_performance.side_effect = [
            main_performance, compare_performance
        ]
        
        response = client.get(f"/dashboard/content/{content_id}/performance-comparison?compare_with={compare_id}&days=30")
        
        assert response.status_code == 200
        data = response.json()
        assert data["main_content"]["content_id"] == content_id
        assert data["comparison_content"]["content_id"] == compare_id
        assert "differences" in data
        assert data["differences"]["views_difference"] == 500  # 2000 - 1500
    
    def test_get_writer_stories_ranking(self, client, mock_dashboard_service):
        """Test getting writer stories ranking"""
        writer_id = "writer123"
        
        mock_stories = ["story1", "story2", "story3"]
        mock_dashboard_service._get_writer_stories = AsyncMock(return_value=mock_stories)
        
        # Mock performance for each story
        performances = [
            ContentPerformanceMetrics(content_id="story1", content_type="story", engagement_score=95.0),
            ContentPerformanceMetrics(content_id="story2", content_type="story", engagement_score=87.5),
            ContentPerformanceMetrics(content_id="story3", content_type="story", engagement_score=92.0)
        ]
        
        mock_dashboard_service.analytics_service.get_content_performance = AsyncMock()
        mock_dashboard_service.analytics_service.get_content_performance.side_effect = performances
        
        response = client.get(f"/dashboard/writer/{writer_id}/stories/ranking?metric=engagement_score&days=30&limit=10")
        
        assert response.status_code == 200
        data = response.json()
        assert data["writer_id"] == writer_id
        assert data["ranking_metric"] == "engagement_score"
        assert len(data["ranked_stories"]) == 3
        # Should be sorted by engagement_score descending
        assert data["ranked_stories"][0]["story_id"] == "story1"  # Highest score (95.0)
        assert data["ranked_stories"][1]["story_id"] == "story3"  # Second highest (92.0)
        assert data["ranked_stories"][2]["story_id"] == "story2"  # Lowest (87.5)
    
    def test_get_writer_stories_ranking_invalid_metric(self, client, mock_dashboard_service):
        """Test getting writer stories ranking with invalid metric"""
        writer_id = "writer123"
        
        response = client.get(f"/dashboard/writer/{writer_id}/stories/ranking?metric=invalid_metric")
        
        assert response.status_code == 400
        assert "Invalid metric" in response.json()["detail"]
    
    def test_get_writer_stories_ranking_no_stories(self, client, mock_dashboard_service):
        """Test getting writer stories ranking when no stories found"""
        writer_id = "writer123"
        
        mock_dashboard_service._get_writer_stories = AsyncMock(return_value=[])
        
        response = client.get(f"/dashboard/writer/{writer_id}/stories/ranking")
        
        assert response.status_code == 404
        assert "No stories found for writer" in response.json()["detail"]
    
    def test_get_writer_growth_metrics(self, client, mock_dashboard_service):
        """Test getting writer growth metrics"""
        writer_id = "writer123"
        
        # Mock metrics for different periods
        current_week_metrics = {
            "total_views": 500,
            "unique_readers": 300,
            "engagement_rate": 8.5
        }
        
        previous_period_metrics = {
            "total_views": 800,  # This includes current week, so previous week was 300
            "unique_readers": 500,  # Previous week was 200
            "engagement_rate": 7.0
        }
        
        current_month_metrics = {
            "total_views": 2000,
            "unique_readers": 1200,
            "engagement_rate": 7.8
        }
        
        mock_dashboard_service._get_writer_overall_metrics = AsyncMock()
        mock_dashboard_service._get_writer_overall_metrics.side_effect = [
            current_week_metrics,
            previous_period_metrics,
            current_month_metrics
        ]
        
        response = client.get(f"/dashboard/writer/{writer_id}/growth-metrics")
        
        assert response.status_code == 200
        data = response.json()
        assert data["writer_id"] == writer_id
        assert "growth_analysis" in data
        assert "weekly_growth" in data["growth_analysis"]
        assert "current_period_metrics" in data["growth_analysis"]
    
    def test_export_writer_analytics_json(self, client, mock_dashboard_service):
        """Test exporting writer analytics as JSON"""
        writer_id = "writer123"
        
        mock_dashboard_data = {
            "writer_id": writer_id,
            "overall_metrics": {"total_views": 1000},
            "revenue_data": {"total_revenue": 500.0}
        }
        
        mock_dashboard_service.get_writer_dashboard = AsyncMock(return_value=mock_dashboard_data)
        
        response = client.get(f"/dashboard/writer/{writer_id}/export?days=30&format=json")
        
        assert response.status_code == 200
        data = response.json()
        assert data["export_format"] == "json"
        assert data["data"]["writer_id"] == writer_id
        assert "exported_at" in data
    
    def test_export_writer_analytics_csv(self, client, mock_dashboard_service):
        """Test exporting writer analytics as CSV"""
        writer_id = "writer123"
        
        mock_dashboard_data = {"writer_id": writer_id}
        mock_dashboard_service.get_writer_dashboard = AsyncMock(return_value=mock_dashboard_data)
        
        response = client.get(f"/dashboard/writer/{writer_id}/export?format=csv")
        
        assert response.status_code == 200
        data = response.json()
        assert data["export_format"] == "csv"
        assert "data_summary" in data
    
    def test_export_writer_analytics_invalid_format(self, client, mock_dashboard_service):
        """Test exporting writer analytics with invalid format"""
        writer_id = "writer123"
        
        response = client.get(f"/dashboard/writer/{writer_id}/export?format=xml")
        
        assert response.status_code == 400
        assert "Format must be 'json' or 'csv'" in response.json()["detail"]
    
    def test_dashboard_health_check(self, client):
        """Test dashboard health check endpoint"""
        response = client.get("/dashboard/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["service"] == "dashboard"
        assert data["status"] == "healthy"
        assert "timestamp" in data

class TestDashboardValidation:
    def test_invalid_days_parameter(self, client):
        """Test API with invalid days parameter"""
        writer_id = "writer123"
        
        # Test negative days
        response = client.get(f"/dashboard/writer/{writer_id}?days=-1")
        assert response.status_code == 422
        
        # Test days too large
        response = client.get(f"/dashboard/writer/{writer_id}?days=400")
        assert response.status_code == 422
    
    def test_invalid_limit_parameter(self, client):
        """Test API with invalid limit parameter"""
        writer_id = "writer123"
        
        # Test negative limit
        response = client.get(f"/dashboard/writer/{writer_id}/stories/ranking?limit=-1")
        assert response.status_code == 422
        
        # Test limit too large
        response = client.get(f"/dashboard/writer/{writer_id}/stories/ranking?limit=100")
        assert response.status_code == 422

if __name__ == "__main__":
    pytest.main([__file__])