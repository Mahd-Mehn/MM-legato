from fastapi import APIRouter, HTTPException, Depends, Query, BackgroundTasks
from typing import List, Optional, Dict, Any
from datetime import datetime, timedelta
import logging

from models import (
    AnalyticsEvent, ContentEngagementEvent, UserBehaviorEvent, RevenueEvent,
    ContentPerformanceMetrics, UserEngagementMetrics, RealtimeMetrics,
    ABTestVariant, ABTestResult, EventType
)
from analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/analytics", tags=["analytics"])

def get_analytics_service() -> AnalyticsService:
    """Dependency to get analytics service instance"""
    # This will be injected by the main app
    from main import analytics_service
    return analytics_service

@router.post("/events/track")
async def track_event(
    event: AnalyticsEvent,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Track a single analytics event"""
    try:
        success = await service.track_event(event)
        if success:
            return {"status": "success", "message": "Event tracked successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to track event")
    except Exception as e:
        logger.error(f"Error tracking event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/track-batch")
async def track_batch_events(
    events: List[AnalyticsEvent],
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Track multiple analytics events in batch"""
    try:
        if len(events) > 1000:
            raise HTTPException(status_code=400, detail="Batch size cannot exceed 1000 events")
        
        success = await service.track_batch_events(events)
        if success:
            return {"status": "success", "message": f"Tracked {len(events)} events successfully"}
        else:
            raise HTTPException(status_code=500, detail="Failed to track batch events")
    except Exception as e:
        logger.error(f"Error tracking batch events: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/content-engagement")
async def track_content_engagement(
    event: ContentEngagementEvent,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Track content engagement event with specific properties"""
    try:
        success = await service.track_event(event)
        if success:
            return {"status": "success", "message": "Content engagement tracked"}
        else:
            raise HTTPException(status_code=500, detail="Failed to track engagement")
    except Exception as e:
        logger.error(f"Error tracking content engagement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/user-behavior")
async def track_user_behavior(
    event: UserBehaviorEvent,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Track user behavior event"""
    try:
        success = await service.track_event(event)
        if success:
            return {"status": "success", "message": "User behavior tracked"}
        else:
            raise HTTPException(status_code=500, detail="Failed to track behavior")
    except Exception as e:
        logger.error(f"Error tracking user behavior: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/events/revenue")
async def track_revenue_event(
    event: RevenueEvent,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Track revenue-related event"""
    try:
        success = await service.track_event(event)
        if success:
            return {"status": "success", "message": "Revenue event tracked"}
        else:
            raise HTTPException(status_code=500, detail="Failed to track revenue")
    except Exception as e:
        logger.error(f"Error tracking revenue event: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/realtime", response_model=RealtimeMetrics)
async def get_realtime_metrics(
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get real-time platform metrics"""
    try:
        metrics = await service.get_realtime_metrics()
        return metrics
    except Exception as e:
        logger.error(f"Error getting real-time metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content/{content_id}/performance", response_model=ContentPerformanceMetrics)
async def get_content_performance(
    content_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get performance metrics for specific content"""
    try:
        metrics = await service.get_content_performance(content_id, days)
        return metrics
    except Exception as e:
        logger.error(f"Error getting content performance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/user/{user_id}/engagement", response_model=UserEngagementMetrics)
async def get_user_engagement(
    user_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get engagement metrics for specific user"""
    try:
        metrics = await service.get_user_engagement(user_id, days)
        return metrics
    except Exception as e:
        logger.error(f"Error getting user engagement: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content/top-performing")
async def get_top_performing_content(
    limit: int = Query(10, ge=1, le=100),
    days: int = Query(7, ge=1, le=365),
    metric: str = Query("engagement_score", description="Metric to sort by"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get top performing content based on specified metric"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        # Query aggregated content metrics
        pipeline = [
            {"$match": {"date": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {
                "_id": "$content_id",
                "total_views": {"$sum": "$total_views"},
                "unique_viewers": {"$sum": "$unique_viewers"},
                "engagement_score": {"$avg": "$engagement_score"},
                "revenue_generated": {"$sum": "$revenue_generated"},
                "completion_rate": {"$avg": "$completion_rate"}
            }},
            {"$sort": {metric: -1}},
            {"$limit": limit}
        ]
        
        results = list(service.content_metrics_collection.aggregate(pipeline))
        return {"top_content": results, "metric": metric, "period_days": days}
        
    except Exception as e:
        logger.error(f"Error getting top performing content: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/users/most-engaged")
async def get_most_engaged_users(
    limit: int = Query(10, ge=1, le=100),
    days: int = Query(7, ge=1, le=365),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get most engaged users"""
    try:
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=days)
        
        pipeline = [
            {"$match": {"date": {"$gte": start_date, "$lte": end_date}}},
            {"$group": {
                "_id": "$user_id",
                "total_reading_time": {"$sum": "$total_reading_time"},
                "stories_read": {"$sum": "$stories_read"},
                "engagement_score": {"$avg": "$engagement_score"},
                "retention_days": {"$avg": "$retention_days"}
            }},
            {"$sort": {"engagement_score": -1}},
            {"$limit": limit}
        ]
        
        results = list(service.user_metrics_collection.aggregate(pipeline))
        return {"most_engaged_users": results, "period_days": days}
        
    except Exception as e:
        logger.error(f"Error getting most engaged users: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ab-tests")
async def create_ab_test(
    test_id: str,
    variants: List[ABTestVariant],
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Create a new A/B test"""
    try:
        success = await service.create_ab_test(test_id, variants)
        if success:
            return {"status": "success", "message": f"A/B test {test_id} created"}
        else:
            raise HTTPException(status_code=500, detail="Failed to create A/B test")
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error creating A/B test: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ab-tests/{test_id}/variant")
async def get_ab_test_variant(
    test_id: str,
    user_id: str,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get A/B test variant for a user"""
    try:
        variant = await service.get_ab_test_variant(test_id, user_id)
        if variant:
            return {"variant": variant}
        else:
            raise HTTPException(status_code=404, detail="No active variant found for test")
    except Exception as e:
        logger.error(f"Error getting A/B test variant: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/ab-tests/results")
async def track_ab_test_result(
    result: ABTestResult,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Track A/B test result"""
    try:
        success = await service.track_ab_test_result(result)
        if success:
            return {"status": "success", "message": "A/B test result tracked"}
        else:
            raise HTTPException(status_code=500, detail="Failed to track result")
    except Exception as e:
        logger.error(f"Error tracking A/B test result: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/ab-tests/{test_id}/results")
async def get_ab_test_results(
    test_id: str,
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Get A/B test results and analysis"""
    try:
        # Get results from database
        results = list(service.ab_results_collection.find({"test_id": test_id}))
        
        if not results:
            raise HTTPException(status_code=404, detail="No results found for test")
        
        # Analyze results by variant
        variant_stats = {}
        for result in results:
            variant_id = result['variant_id']
            if variant_id not in variant_stats:
                variant_stats[variant_id] = {
                    "total_users": 0,
                    "conversions": 0,
                    "conversion_rate": 0.0,
                    "total_value": 0.0
                }
            
            variant_stats[variant_id]["total_users"] += 1
            if result.get('conversion', False):
                variant_stats[variant_id]["conversions"] += 1
            if result.get('value'):
                variant_stats[variant_id]["total_value"] += result['value']
        
        # Calculate conversion rates
        for variant_id, stats in variant_stats.items():
            if stats["total_users"] > 0:
                stats["conversion_rate"] = stats["conversions"] / stats["total_users"]
        
        return {
            "test_id": test_id,
            "total_results": len(results),
            "variant_stats": variant_stats
        }
        
    except Exception as e:
        logger.error(f"Error getting A/B test results: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/aggregate/daily")
async def trigger_daily_aggregation(
    background_tasks: BackgroundTasks,
    date: Optional[str] = Query(None, description="Date in YYYY-MM-DD format, defaults to yesterday"),
    service: AnalyticsService = Depends(get_analytics_service)
):
    """Trigger daily metrics aggregation (admin endpoint)"""
    try:
        if date:
            target_date = datetime.strptime(date, "%Y-%m-%d")
        else:
            target_date = datetime.utcnow() - timedelta(days=1)
        
        background_tasks.add_task(service.aggregate_daily_metrics, target_date)
        
        return {
            "status": "success",
            "message": f"Daily aggregation scheduled for {target_date.date()}"
        }
        
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid date format. Use YYYY-MM-DD")
    except Exception as e:
        logger.error(f"Error triggering daily aggregation: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def health_check():
    """Health check endpoint for analytics service"""
    return {"service": "analytics", "status": "healthy", "timestamp": datetime.utcnow()}