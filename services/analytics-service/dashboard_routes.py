from fastapi import APIRouter, HTTPException, Depends, Query
from typing import Dict, Any, Optional
from datetime import datetime
import logging

from dashboard_service import DashboardService
from analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

def get_dashboard_service() -> DashboardService:
    """Dependency to get dashboard service instance"""
    from main import dashboard_service
    return dashboard_service

@router.get("/writer/{writer_id}")
async def get_writer_dashboard(
    writer_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get comprehensive dashboard data for a writer"""
    try:
        dashboard_data = await service.get_writer_dashboard(writer_id, days)
        
        if not dashboard_data:
            raise HTTPException(status_code=404, detail="No data found for writer")
        
        return dashboard_data
        
    except Exception as e:
        logger.error(f"Error getting writer dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/overview")
async def get_writer_overview(
    writer_id: str,
    days: int = Query(7, ge=1, le=90, description="Number of days for overview"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get quick overview metrics for a writer"""
    try:
        # Get basic metrics
        overall_metrics = await service._get_writer_overall_metrics(writer_id, days)
        revenue_data = await service._get_writer_revenue_data(writer_id, days)
        
        # Get real-time data
        realtime_metrics = await service.analytics_service.get_realtime_metrics()
        
        return {
            "writer_id": writer_id,
            "period_days": days,
            "quick_stats": {
                "total_views": overall_metrics.get("total_views", 0),
                "unique_readers": overall_metrics.get("unique_readers", 0),
                "engagement_rate": overall_metrics.get("engagement_rate", 0),
                "total_revenue": revenue_data.get("total_revenue", 0),
                "new_followers": overall_metrics.get("new_followers", 0)
            },
            "realtime": {
                "active_readers": realtime_metrics.active_users,
                "concurrent_readers": realtime_metrics.concurrent_readers
            },
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting writer overview: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/revenue")
async def get_writer_revenue_dashboard(
    writer_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get detailed revenue analytics for a writer"""
    try:
        revenue_data = await service._get_writer_revenue_data(writer_id, days)
        
        if not revenue_data:
            raise HTTPException(status_code=404, detail="No revenue data found for writer")
        
        return {
            "writer_id": writer_id,
            "period_days": days,
            "revenue_analytics": revenue_data,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting writer revenue dashboard: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/audience")
async def get_writer_audience_insights(
    writer_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get audience demographics and behavior insights"""
    try:
        audience_data = await service._get_audience_demographics(writer_id, days)
        engagement_trends = await service._get_engagement_trends(writer_id, days)
        
        return {
            "writer_id": writer_id,
            "period_days": days,
            "audience_demographics": audience_data,
            "engagement_trends": engagement_trends,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting writer audience insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/recommendations")
async def get_writer_recommendations(
    writer_id: str,
    days: int = Query(30, ge=1, le=90, description="Number of days to analyze"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get content optimization recommendations for a writer"""
    try:
        recommendations = await service._generate_content_recommendations(writer_id, days)
        
        return {
            "writer_id": writer_id,
            "period_days": days,
            "recommendations": recommendations,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting writer recommendations: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content/{content_id}/insights")
async def get_content_insights(
    content_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get detailed insights for specific content"""
    try:
        insights = await service.get_content_insights(content_id, days)
        
        if not insights:
            raise HTTPException(status_code=404, detail="No insights found for content")
        
        return insights
        
    except Exception as e:
        logger.error(f"Error getting content insights: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/content/{content_id}/performance-comparison")
async def get_content_performance_comparison(
    content_id: str,
    compare_with: Optional[str] = Query(None, description="Content ID to compare with"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Compare content performance with another piece of content or category average"""
    try:
        # Get performance for main content
        main_performance = await service.analytics_service.get_content_performance(content_id, days)
        
        comparison_data = {
            "main_content": {
                "content_id": content_id,
                "performance": main_performance
            }
        }
        
        if compare_with:
            # Compare with specific content
            compare_performance = await service.analytics_service.get_content_performance(compare_with, days)
            comparison_data["comparison_content"] = {
                "content_id": compare_with,
                "performance": compare_performance
            }
            
            # Calculate performance differences
            comparison_data["differences"] = {
                "views_difference": main_performance.total_views - compare_performance.total_views,
                "engagement_difference": main_performance.engagement_score - compare_performance.engagement_score,
                "completion_rate_difference": main_performance.completion_rate - compare_performance.completion_rate
            }
        else:
            # Compare with category average (placeholder)
            similar_content = await service._get_similar_content_performance(content_id, days)
            comparison_data["category_comparison"] = similar_content
        
        return comparison_data
        
    except Exception as e:
        logger.error(f"Error getting content performance comparison: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/stories/ranking")
async def get_writer_stories_ranking(
    writer_id: str,
    metric: str = Query("engagement_score", description="Metric to rank by"),
    days: int = Query(30, ge=1, le=365, description="Number of days to analyze"),
    limit: int = Query(10, ge=1, le=50, description="Number of stories to return"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get ranking of writer's stories by specified metric"""
    try:
        # Get writer's stories
        writer_stories = await service._get_writer_stories(writer_id)
        
        if not writer_stories:
            raise HTTPException(status_code=404, detail="No stories found for writer")
        
        # Get performance for each story
        story_performances = []
        for story_id in writer_stories[:limit]:  # Limit to avoid too many queries
            performance = await service.analytics_service.get_content_performance(story_id, days)
            story_performances.append({
                "story_id": story_id,
                "performance": performance
            })
        
        # Sort by specified metric
        valid_metrics = ["total_views", "unique_viewers", "engagement_score", "completion_rate", "revenue_generated"]
        if metric not in valid_metrics:
            raise HTTPException(status_code=400, detail=f"Invalid metric. Choose from: {valid_metrics}")
        
        story_performances.sort(
            key=lambda x: getattr(x["performance"], metric, 0),
            reverse=True
        )
        
        return {
            "writer_id": writer_id,
            "ranking_metric": metric,
            "period_days": days,
            "ranked_stories": story_performances,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting writer stories ranking: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/growth-metrics")
async def get_writer_growth_metrics(
    writer_id: str,
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Get growth metrics comparing different time periods"""
    try:
        # Get metrics for different periods
        current_week = await service._get_writer_overall_metrics(writer_id, 7)
        previous_week = await service._get_writer_overall_metrics(writer_id, 14)  # Last 14 days to get previous week
        current_month = await service._get_writer_overall_metrics(writer_id, 30)
        
        # Calculate growth rates
        def calculate_growth(current, previous, metric):
            current_val = current.get(metric, 0)
            # For previous period, we need to subtract current from total to get just the previous period
            # This is a simplified approach - in production, you'd query specific date ranges
            previous_val = max(previous.get(metric, 0) - current_val, 0)
            if previous_val == 0:
                return 0
            return ((current_val - previous_val) / previous_val) * 100
        
        growth_metrics = {
            "weekly_growth": {
                "views_growth": calculate_growth(current_week, previous_week, "total_views"),
                "readers_growth": calculate_growth(current_week, previous_week, "unique_readers"),
                "engagement_growth": calculate_growth(current_week, previous_week, "engagement_rate")
            },
            "current_period_metrics": {
                "week": current_week,
                "month": current_month
            }
        }
        
        return {
            "writer_id": writer_id,
            "growth_analysis": growth_metrics,
            "generated_at": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Error getting writer growth metrics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/writer/{writer_id}/export")
async def export_writer_analytics(
    writer_id: str,
    days: int = Query(30, ge=1, le=365, description="Number of days to export"),
    format: str = Query("json", description="Export format (json, csv)"),
    service: DashboardService = Depends(get_dashboard_service)
) -> Dict[str, Any]:
    """Export writer analytics data"""
    try:
        if format not in ["json", "csv"]:
            raise HTTPException(status_code=400, detail="Format must be 'json' or 'csv'")
        
        # Get comprehensive dashboard data
        dashboard_data = await service.get_writer_dashboard(writer_id, days)
        
        if format == "json":
            return {
                "export_format": "json",
                "data": dashboard_data,
                "exported_at": datetime.utcnow()
            }
        else:
            # For CSV, we'd need to flatten the data structure
            # This is a simplified version - in production, you'd create proper CSV formatting
            return {
                "export_format": "csv",
                "message": "CSV export would be implemented with proper data flattening",
                "data_summary": {
                    "total_records": len(str(dashboard_data)),
                    "export_date": datetime.utcnow()
                }
            }
        
    except Exception as e:
        logger.error(f"Error exporting writer analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/health")
async def dashboard_health_check():
    """Health check endpoint for dashboard service"""
    return {
        "service": "dashboard",
        "status": "healthy",
        "timestamp": datetime.utcnow()
    }