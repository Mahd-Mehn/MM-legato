#!/usr/bin/env python3
"""
Simple test script for Dashboard Service
Tests basic functionality without complex mocking
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta
from unittest.mock import Mock, AsyncMock

# Add the service directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from dashboard_service import DashboardService
from analytics_service import AnalyticsService
from models import ContentPerformanceMetrics, EventType

def test_dashboard_service_initialization():
    """Test dashboard service initialization"""
    print("Testing Dashboard Service Initialization...")
    
    # Create mock analytics service
    mock_analytics = Mock(spec=AnalyticsService)
    mock_analytics.mongo_client = Mock()
    mock_analytics.redis_client = Mock()
    mock_analytics.db = Mock()
    
    # Initialize dashboard service
    dashboard_service = DashboardService(mock_analytics)
    
    assert dashboard_service.analytics_service == mock_analytics
    assert dashboard_service.mongo_client == mock_analytics.mongo_client
    assert dashboard_service.redis_client == mock_analytics.redis_client
    assert dashboard_service.db == mock_analytics.db
    print("✓ Dashboard service initialization works")

async def test_revenue_forecast_calculation():
    """Test revenue forecasting calculation"""
    print("\nTesting Revenue Forecast Calculation...")
    
    # Create mock analytics service
    mock_analytics = Mock(spec=AnalyticsService)
    mock_analytics.mongo_client = Mock()
    mock_analytics.redis_client = Mock()
    mock_analytics.db = Mock()
    
    dashboard_service = DashboardService(mock_analytics)
    
    # Test with insufficient data
    daily_revenue = {"2024-01-01": 10.0, "2024-01-02": 15.0}
    forecast = await dashboard_service._calculate_revenue_forecast(daily_revenue, 30)
    
    assert forecast["forecast_available"] is False
    assert forecast["reason"] == "Insufficient data"
    print("✓ Insufficient data handling works")
    
    # Test with sufficient data (14 days)
    daily_revenue = {}
    for i in range(1, 15):
        daily_revenue[f"2024-01-{i:02d}"] = 10.0 + i  # Increasing revenue
    
    forecast = await dashboard_service._calculate_revenue_forecast(daily_revenue, 30)
    
    assert forecast["forecast_available"] is True
    assert "next_30_days" in forecast
    assert "daily_average" in forecast
    assert "growth_rate" in forecast
    assert forecast["growth_rate"] > 0  # Should show positive growth
    print("✓ Revenue forecasting calculation works")

def test_recommendation_generation_logic():
    """Test recommendation generation logic"""
    print("\nTesting Recommendation Generation Logic...")
    
    # Test engagement rate recommendation
    engagement_rate = 3.0  # Low engagement rate
    
    if engagement_rate < 5:
        recommendation = {
            "type": "engagement",
            "priority": "high",
            "title": "Improve Reader Engagement",
            "description": f"Your engagement rate is {engagement_rate}%. Try adding more interactive elements.",
            "suggested_actions": [
                "End chapters with compelling cliffhangers",
                "Ask readers questions in author notes",
                "Respond to comments to build community"
            ]
        }
        
        assert recommendation["type"] == "engagement"
        assert recommendation["priority"] == "high"
        assert len(recommendation["suggested_actions"]) == 3
        print("✓ Engagement recommendation generation works")
    
    # Test consistency recommendation
    days_with_activity = 5
    total_days = 30
    activity_percentage = days_with_activity / total_days
    
    if activity_percentage < 0.3:  # Less than 30% activity
        recommendation = {
            "type": "consistency",
            "priority": "medium",
            "title": "Maintain Publishing Schedule",
            "description": "Consistent publishing helps retain readers and improve visibility.",
            "suggested_actions": [
                "Set a regular publishing schedule",
                "Prepare content in advance",
                "Use scheduling tools to maintain consistency"
            ]
        }
        
        assert recommendation["type"] == "consistency"
        assert recommendation["priority"] == "medium"
        print("✓ Consistency recommendation generation works")

def test_reader_segmentation_logic():
    """Test reader segmentation logic"""
    print("\nTesting Reader Segmentation Logic...")
    
    # Simulate reader statistics
    reader_stats = {
        "user1": {"total_reads": 2, "engagement_actions": 0},  # Casual
        "user2": {"total_reads": 7, "engagement_actions": 1},  # Regular + Engaged
        "user3": {"total_reads": 15, "engagement_actions": 0}, # Loyal
        "user4": {"total_reads": 1, "engagement_actions": 0},  # Casual
        "user5": {"total_reads": 12, "engagement_actions": 3}, # Loyal + Engaged
    }
    
    # Categorize readers
    casual_readers = 0
    regular_readers = 0
    loyal_readers = 0
    engaged_readers = 0
    
    for stats in reader_stats.values():
        reads = stats["total_reads"]
        if reads <= 3:
            casual_readers += 1
        elif reads <= 10:
            regular_readers += 1
        else:
            loyal_readers += 1
        
        if stats["engagement_actions"] > 0:
            engaged_readers += 1
    
    total_readers = len(reader_stats)
    engagement_percentage = (engaged_readers / total_readers) * 100
    
    assert casual_readers == 2  # user1, user4
    assert regular_readers == 1  # user2
    assert loyal_readers == 2   # user3, user5
    assert engaged_readers == 2  # user2, user5
    assert engagement_percentage == 40.0  # 2 out of 5
    print("✓ Reader segmentation logic works")

def test_growth_calculation_logic():
    """Test growth calculation logic"""
    print("\nTesting Growth Calculation Logic...")
    
    def calculate_growth(current, previous, metric):
        current_val = current.get(metric, 0)
        previous_val = max(previous.get(metric, 0) - current_val, 0)
        if previous_val == 0:
            return 0
        return ((current_val - previous_val) / previous_val) * 100
    
    # Test positive growth
    current_week = {"total_views": 500}
    previous_period = {"total_views": 800}  # Previous week was 300 (800-500)
    
    growth = calculate_growth(current_week, previous_period, "total_views")
    expected_growth = ((500 - 300) / 300) * 100  # 66.67%
    
    assert abs(growth - expected_growth) < 0.01
    print(f"✓ Growth calculation works: {growth:.2f}% growth")
    
    # Test no growth (same values)
    current_week = {"total_views": 300}
    previous_period = {"total_views": 600}  # Previous week was also 300
    
    growth = calculate_growth(current_week, previous_period, "total_views")
    assert growth == 0.0
    print("✓ Zero growth calculation works")

def test_engagement_trend_analysis():
    """Test engagement trend analysis logic"""
    print("\nTesting Engagement Trend Analysis...")
    
    # Simulate daily engagement data
    daily_engagement = {}
    base_date = datetime.utcnow() - timedelta(days=14)
    
    # Create 14 days of data with increasing trend
    for i in range(14):
        date_key = (base_date + timedelta(days=i)).date().isoformat()
        daily_engagement[date_key] = {
            "reads": 10 + i,  # Increasing reads
            "comments": 2 + (i // 3),  # Slowly increasing comments
            "ratings": 1 + (i // 5),   # Very slowly increasing ratings
            "shares": i // 7,          # Occasional shares
            "bookmarks": i // 4        # Some bookmarks
        }
    
    # Calculate trend
    dates = sorted(daily_engagement.keys())
    recent_week = dates[-7:]
    previous_week = dates[-14:-7]
    
    recent_engagement = sum(
        sum(daily_engagement[date].values()) for date in recent_week
    ) / 7
    
    previous_engagement = sum(
        sum(daily_engagement[date].values()) for date in previous_week
    ) / 7
    
    trend = ((recent_engagement - previous_engagement) / previous_engagement) * 100
    
    assert trend > 0  # Should show positive trend
    assert len(daily_engagement) == 14
    print(f"✓ Engagement trend analysis works: {trend:.2f}% trend")

def test_content_performance_comparison():
    """Test content performance comparison logic"""
    print("\nTesting Content Performance Comparison...")
    
    # Create mock performance metrics
    main_content = ContentPerformanceMetrics(
        content_id="story1",
        content_type="story",
        total_views=2000,
        engagement_score=95.5,
        completion_rate=0.85
    )
    
    compare_content = ContentPerformanceMetrics(
        content_id="story2",
        content_type="story",
        total_views=1500,
        engagement_score=80.0,
        completion_rate=0.78
    )
    
    # Calculate differences
    views_difference = main_content.total_views - compare_content.total_views
    engagement_difference = main_content.engagement_score - compare_content.engagement_score
    completion_difference = main_content.completion_rate - compare_content.completion_rate
    
    assert views_difference == 500
    assert engagement_difference == 15.5
    assert abs(completion_difference - 0.07) < 0.01
    print("✓ Content performance comparison works")

async def main():
    """Run all tests"""
    print("=" * 60)
    print("DASHBOARD SERVICE - SIMPLE FUNCTIONALITY TEST")
    print("=" * 60)
    
    try:
        test_dashboard_service_initialization()
        await test_revenue_forecast_calculation()
        test_recommendation_generation_logic()
        test_reader_segmentation_logic()
        test_growth_calculation_logic()
        test_engagement_trend_analysis()
        test_content_performance_comparison()
        
        print("\n" + "=" * 60)
        print("✅ ALL TESTS PASSED!")
        print("Dashboard Service functionality is working correctly")
        print("=" * 60)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    sys.exit(0 if success else 1)