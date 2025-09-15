#!/usr/bin/env python3
"""
Simple test script for Analytics Service
Tests basic functionality without complex mocking
"""

import asyncio
import sys
import os
from datetime import datetime, timedelta

# Add the service directory to Python path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import (
    AnalyticsEvent, ContentEngagementEvent, UserBehaviorEvent, RevenueEvent,
    EventType, ABTestVariant, ABTestResult, ContentPerformanceMetrics,
    UserEngagementMetrics, RealtimeMetrics
)

def test_event_models():
    """Test analytics event models"""
    print("Testing Analytics Event Models...")
    
    # Test basic analytics event
    event = AnalyticsEvent(
        event_type=EventType.CHAPTER_READ,
        user_id="user123",
        properties={"story_id": "story456", "read_duration": 300}
    )
    
    assert event.event_type == EventType.CHAPTER_READ
    assert event.user_id == "user123"
    assert event.properties["story_id"] == "story456"
    assert event.event_id is not None
    assert isinstance(event.timestamp, datetime)
    print("✓ Basic AnalyticsEvent creation works")
    
    # Test content engagement event
    engagement_event = ContentEngagementEvent(
        event_type=EventType.CHAPTER_READ,
        user_id="user123",
        story_id="story456",
        chapter_id="chapter789",
        read_duration=300,
        completion_percentage=85.5,
        scroll_depth=0.9
    )
    
    assert engagement_event.story_id == "story456"
    assert engagement_event.chapter_id == "chapter789"
    assert engagement_event.read_duration == 300
    assert engagement_event.completion_percentage == 85.5
    assert engagement_event.scroll_depth == 0.9
    print("✓ ContentEngagementEvent creation works")
    
    # Test user behavior event
    behavior_event = UserBehaviorEvent(
        event_type=EventType.STORY_VIEW,
        user_id="user123",
        page_url="/stories/456",
        referrer="https://google.com",
        device_type="mobile",
        browser="Chrome",
        location="Lagos, Nigeria"
    )
    
    assert behavior_event.page_url == "/stories/456"
    assert behavior_event.device_type == "mobile"
    assert behavior_event.location == "Lagos, Nigeria"
    print("✓ UserBehaviorEvent creation works")
    
    # Test revenue event
    revenue_event = RevenueEvent(
        event_type=EventType.PAYMENT_MADE,
        user_id="user123",
        transaction_id="txn456",
        amount=25.99,
        currency="USD",
        payment_method="stripe",
        content_id="story456"
    )
    
    assert revenue_event.transaction_id == "txn456"
    assert revenue_event.amount == 25.99
    assert revenue_event.currency == "USD"
    assert revenue_event.content_id == "story456"
    print("✓ RevenueEvent creation works")

def test_metrics_models():
    """Test metrics models"""
    print("\nTesting Metrics Models...")
    
    # Test content performance metrics
    content_metrics = ContentPerformanceMetrics(
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
        average_rating=4.2,
        shares_count=15,
        bookmarks_count=25
    )
    
    assert content_metrics.content_id == "story123"
    assert content_metrics.total_views == 1000
    assert content_metrics.completion_rate == 0.85
    assert content_metrics.engagement_score == 125.5
    print("✓ ContentPerformanceMetrics creation works")
    
    # Test user engagement metrics
    user_metrics = UserEngagementMetrics(
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
    
    assert user_metrics.user_id == "user123"
    assert user_metrics.total_reading_time == 7200
    assert user_metrics.stories_read == 15
    assert user_metrics.engagement_score == 89.5
    print("✓ UserEngagementMetrics creation works")
    
    # Test real-time metrics
    realtime_metrics = RealtimeMetrics(
        active_users=150,
        concurrent_readers=75,
        stories_being_read=["story1", "story2", "story3"],
        revenue_today=1250.50,
        new_registrations_today=25,
        top_stories=[
            {"story_id": "story1", "score": 100},
            {"story_id": "story2", "score": 85}
        ]
    )
    
    assert realtime_metrics.active_users == 150
    assert realtime_metrics.concurrent_readers == 75
    assert len(realtime_metrics.stories_being_read) == 3
    assert realtime_metrics.revenue_today == 1250.50
    assert len(realtime_metrics.top_stories) == 2
    print("✓ RealtimeMetrics creation works")

def test_ab_test_models():
    """Test A/B test models"""
    print("\nTesting A/B Test Models...")
    
    # Test A/B test variant
    variant = ABTestVariant(
        test_id="test123",
        variant_id="variant_a",
        variant_name="Control",
        traffic_percentage=50.0,
        configuration={"button_color": "blue", "layout": "grid"},
        is_active=True
    )
    
    assert variant.test_id == "test123"
    assert variant.variant_id == "variant_a"
    assert variant.traffic_percentage == 50.0
    assert variant.configuration["button_color"] == "blue"
    assert variant.is_active is True
    print("✓ ABTestVariant creation works")
    
    # Test A/B test result
    result = ABTestResult(
        test_id="test123",
        variant_id="variant_a",
        user_id="user456",
        event_type="conversion",
        conversion=True,
        value=25.0,
        metadata={"source": "mobile_app", "campaign": "summer_promo"}
    )
    
    assert result.test_id == "test123"
    assert result.variant_id == "variant_a"
    assert result.conversion is True
    assert result.value == 25.0
    assert result.metadata["source"] == "mobile_app"
    print("✓ ABTestResult creation works")

def test_event_types():
    """Test event type enumeration"""
    print("\nTesting Event Types...")
    
    # Test all event types are accessible
    event_types = [
        EventType.CHAPTER_READ,
        EventType.STORY_VIEW,
        EventType.USER_REGISTRATION,
        EventType.PAYMENT_MADE,
        EventType.COMMENT_POSTED,
        EventType.STORY_RATED,
        EventType.STORY_SHARED,
        EventType.SEARCH_PERFORMED,
        EventType.PROFILE_VIEWED,
        EventType.FOLLOW_ACTION,
        EventType.BOOKMARK_ADDED,
        EventType.AUDIO_PLAYED,
        EventType.TRANSLATION_USED
    ]
    
    assert len(event_types) == 13
    assert EventType.CHAPTER_READ == "chapter_read"
    assert EventType.PAYMENT_MADE == "payment_made"
    assert EventType.TRANSLATION_USED == "translation_used"
    print("✓ All EventType values are accessible")

def test_model_serialization():
    """Test model serialization to dict"""
    print("\nTesting Model Serialization...")
    
    event = ContentEngagementEvent(
        event_type=EventType.CHAPTER_READ,
        user_id="user123",
        story_id="story456",
        read_duration=300,
        completion_percentage=85.5
    )
    
    event_dict = event.dict()
    
    assert isinstance(event_dict, dict)
    assert event_dict["event_type"] == "chapter_read"
    assert event_dict["user_id"] == "user123"
    assert event_dict["story_id"] == "story456"
    assert event_dict["read_duration"] == 300
    assert "event_id" in event_dict
    assert "timestamp" in event_dict
    print("✓ Model serialization to dict works")
    
    # Test JSON serialization
    import json
    json_str = json.dumps(event_dict, default=str)
    assert isinstance(json_str, str)
    assert "chapter_read" in json_str
    print("✓ JSON serialization works")

def test_model_validation():
    """Test model validation"""
    print("\nTesting Model Validation...")
    
    # Test valid model
    try:
        event = AnalyticsEvent(
            event_type=EventType.CHAPTER_READ,
            user_id="user123"
        )
        assert event.event_type == EventType.CHAPTER_READ
        print("✓ Valid model creation works")
    except Exception as e:
        print(f"✗ Valid model creation failed: {e}")
        return False
    
    # Test model with invalid event type should work with enum
    try:
        event = AnalyticsEvent(
            event_type="invalid_type",  # This should fail validation
            user_id="user123"
        )
        print("✗ Invalid event type should have failed validation")
        return False
    except Exception:
        print("✓ Invalid event type properly rejected")
    
    return True

def main():
    """Run all tests"""
    print("=" * 50)
    print("ANALYTICS SERVICE - SIMPLE FUNCTIONALITY TEST")
    print("=" * 50)
    
    try:
        test_event_models()
        test_metrics_models()
        test_ab_test_models()
        test_event_types()
        test_model_serialization()
        
        if not test_model_validation():
            print("\n❌ Some validation tests failed")
            return False
        
        print("\n" + "=" * 50)
        print("✅ ALL TESTS PASSED!")
        print("Analytics Service models are working correctly")
        print("=" * 50)
        return True
        
    except Exception as e:
        print(f"\n❌ TEST FAILED: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)