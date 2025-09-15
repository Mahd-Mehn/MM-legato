from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pymongo import MongoClient
import redis
import logging
from collections import defaultdict

from models import (
    ContentPerformanceMetrics, UserEngagementMetrics, RealtimeMetrics,
    EventType
)
from analytics_service import AnalyticsService

logger = logging.getLogger(__name__)

class DashboardService:
    def __init__(self, analytics_service: AnalyticsService):
        self.analytics_service = analytics_service
        self.mongo_client = analytics_service.mongo_client
        self.redis_client = analytics_service.redis_client
        self.db = analytics_service.db
        
        # Collections
        self.events_collection = self.db.analytics_events
        self.content_metrics_collection = self.db.content_metrics
        self.user_metrics_collection = self.db.user_metrics
    
    async def get_writer_dashboard(self, writer_id: str, days: int = 30) -> Dict[str, Any]:
        """Get comprehensive dashboard data for a writer"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get writer's stories
            writer_stories = await self._get_writer_stories(writer_id)
            
            # Get overall performance metrics
            overall_metrics = await self._get_writer_overall_metrics(writer_id, days)
            
            # Get story-specific performance
            story_performance = []
            for story_id in writer_stories:
                metrics = await self.analytics_service.get_content_performance(story_id, days)
                story_performance.append(metrics)
            
            # Get revenue tracking
            revenue_data = await self._get_writer_revenue_data(writer_id, days)
            
            # Get audience demographics
            audience_demographics = await self._get_audience_demographics(writer_id, days)
            
            # Get engagement trends
            engagement_trends = await self._get_engagement_trends(writer_id, days)
            
            # Get content optimization recommendations
            recommendations = await self._generate_content_recommendations(writer_id, days)
            
            return {
                "writer_id": writer_id,
                "period_days": days,
                "overall_metrics": overall_metrics,
                "story_performance": story_performance,
                "revenue_data": revenue_data,
                "audience_demographics": audience_demographics,
                "engagement_trends": engagement_trends,
                "recommendations": recommendations,
                "generated_at": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Error generating writer dashboard: {e}")
            return {}
    
    async def _get_writer_stories(self, writer_id: str) -> List[str]:
        """Get list of story IDs for a writer"""
        try:
            # Query events to find stories associated with this writer
            pipeline = [
                {"$match": {"properties.author_id": writer_id}},
                {"$group": {"_id": "$properties.story_id"}},
                {"$match": {"_id": {"$ne": None}}}
            ]
            
            results = list(self.events_collection.aggregate(pipeline))
            return [result["_id"] for result in results]
            
        except Exception as e:
            logger.error(f"Error getting writer stories: {e}")
            return []
    
    async def _get_writer_overall_metrics(self, writer_id: str, days: int) -> Dict[str, Any]:
        """Get overall performance metrics for a writer"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query all events for this writer's content
            events = list(self.events_collection.find({
                "properties.author_id": writer_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }))
            
            # Calculate metrics
            total_views = len([e for e in events if e['event_type'] in [EventType.STORY_VIEW, EventType.CHAPTER_READ]])
            unique_readers = len(set(e['user_id'] for e in events if e.get('user_id')))
            
            read_events = [e for e in events if e['event_type'] == EventType.CHAPTER_READ]
            total_read_time = sum(e.get('properties', {}).get('read_duration', 0) for e in read_events)
            
            comments = len([e for e in events if e['event_type'] == EventType.COMMENT_POSTED])
            ratings = len([e for e in events if e['event_type'] == EventType.STORY_RATED])
            shares = len([e for e in events if e['event_type'] == EventType.STORY_SHARED])
            bookmarks = len([e for e in events if e['event_type'] == EventType.BOOKMARK_ADDED])
            
            # Calculate engagement rate
            engagement_actions = comments + ratings + shares + bookmarks
            engagement_rate = (engagement_actions / max(total_views, 1)) * 100
            
            # Get follower growth (simplified - would need user service integration)
            follower_events = [e for e in events if e['event_type'] == EventType.FOLLOW_ACTION]
            new_followers = len(follower_events)
            
            return {
                "total_views": total_views,
                "unique_readers": unique_readers,
                "total_read_time_hours": round(total_read_time / 3600, 2),
                "engagement_rate": round(engagement_rate, 2),
                "total_comments": comments,
                "total_ratings": ratings,
                "total_shares": shares,
                "total_bookmarks": bookmarks,
                "new_followers": new_followers
            }
            
        except Exception as e:
            logger.error(f"Error getting writer overall metrics: {e}")
            return {}
    
    async def _get_writer_revenue_data(self, writer_id: str, days: int) -> Dict[str, Any]:
        """Get revenue data and forecasting for a writer"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query revenue events
            revenue_events = list(self.events_collection.find({
                "event_type": EventType.PAYMENT_MADE,
                "properties.author_id": writer_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }))
            
            # Calculate revenue metrics
            total_revenue = sum(e.get('properties', {}).get('amount', 0) for e in revenue_events)
            transaction_count = len(revenue_events)
            avg_transaction = total_revenue / max(transaction_count, 1)
            
            # Daily revenue breakdown
            daily_revenue = defaultdict(float)
            for event in revenue_events:
                date_key = event['timestamp'].date().isoformat()
                daily_revenue[date_key] += event.get('properties', {}).get('amount', 0)
            
            # Revenue by content
            content_revenue = defaultdict(float)
            for event in revenue_events:
                content_id = event.get('properties', {}).get('content_id')
                if content_id:
                    content_revenue[content_id] += event.get('properties', {}).get('amount', 0)
            
            # Simple forecasting (linear trend)
            revenue_forecast = await self._calculate_revenue_forecast(daily_revenue, days)
            
            return {
                "total_revenue": round(total_revenue, 2),
                "transaction_count": transaction_count,
                "average_transaction": round(avg_transaction, 2),
                "daily_revenue": dict(daily_revenue),
                "content_revenue": dict(content_revenue),
                "forecast": revenue_forecast
            }
            
        except Exception as e:
            logger.error(f"Error getting writer revenue data: {e}")
            return {}
    
    async def _calculate_revenue_forecast(self, daily_revenue: Dict[str, float], days: int) -> Dict[str, Any]:
        """Calculate simple revenue forecast based on trends"""
        try:
            if len(daily_revenue) < 7:  # Need at least a week of data
                return {"forecast_available": False, "reason": "Insufficient data"}
            
            # Calculate trend (simple linear regression)
            values = list(daily_revenue.values())
            n = len(values)
            
            # Calculate average daily revenue for last 7 days vs previous period
            recent_avg = sum(values[-7:]) / 7 if len(values) >= 7 else sum(values) / len(values)
            
            if len(values) >= 14:
                previous_avg = sum(values[-14:-7]) / 7
                growth_rate = (recent_avg - previous_avg) / max(previous_avg, 1)
            else:
                growth_rate = 0
            
            # Forecast next 30 days
            next_30_days = recent_avg * 30 * (1 + growth_rate)
            
            return {
                "forecast_available": True,
                "next_30_days": round(next_30_days, 2),
                "daily_average": round(recent_avg, 2),
                "growth_rate": round(growth_rate * 100, 2)
            }
            
        except Exception as e:
            logger.error(f"Error calculating revenue forecast: {e}")
            return {"forecast_available": False, "reason": "Calculation error"}
    
    async def _get_audience_demographics(self, writer_id: str, days: int) -> Dict[str, Any]:
        """Get audience demographics and preferences"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query reader events
            events = list(self.events_collection.find({
                "properties.author_id": writer_id,
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "user_id": {"$ne": None}
            }))
            
            # Analyze reader behavior patterns
            reader_stats = defaultdict(lambda: {
                "total_reads": 0,
                "total_time": 0,
                "engagement_actions": 0,
                "last_active": None
            })
            
            for event in events:
                user_id = event['user_id']
                reader_stats[user_id]["last_active"] = max(
                    reader_stats[user_id]["last_active"] or event['timestamp'],
                    event['timestamp']
                )
                
                if event['event_type'] == EventType.CHAPTER_READ:
                    reader_stats[user_id]["total_reads"] += 1
                    reader_stats[user_id]["total_time"] += event.get('properties', {}).get('read_duration', 0)
                
                if event['event_type'] in [EventType.COMMENT_POSTED, EventType.STORY_RATED, 
                                         EventType.STORY_SHARED, EventType.BOOKMARK_ADDED]:
                    reader_stats[user_id]["engagement_actions"] += 1
            
            # Categorize readers
            casual_readers = 0  # 1-3 reads
            regular_readers = 0  # 4-10 reads
            loyal_readers = 0   # 11+ reads
            
            total_readers = len(reader_stats)
            engaged_readers = 0  # Readers with engagement actions
            
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
            
            # Reading time analysis
            avg_session_time = sum(s["total_time"] for s in reader_stats.values()) / max(total_readers, 1)
            
            return {
                "total_readers": total_readers,
                "reader_segments": {
                    "casual": casual_readers,
                    "regular": regular_readers,
                    "loyal": loyal_readers
                },
                "engagement_stats": {
                    "engaged_readers": engaged_readers,
                    "engagement_percentage": round((engaged_readers / max(total_readers, 1)) * 100, 2)
                },
                "reading_behavior": {
                    "average_session_time_minutes": round(avg_session_time / 60, 2)
                }
            }
            
        except Exception as e:
            logger.error(f"Error getting audience demographics: {e}")
            return {}
    
    async def _get_engagement_trends(self, writer_id: str, days: int) -> Dict[str, Any]:
        """Get engagement trends over time"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query engagement events
            events = list(self.events_collection.find({
                "properties.author_id": writer_id,
                "timestamp": {"$gte": start_date, "$lte": end_date},
                "event_type": {"$in": [
                    EventType.CHAPTER_READ, EventType.COMMENT_POSTED,
                    EventType.STORY_RATED, EventType.STORY_SHARED,
                    EventType.BOOKMARK_ADDED
                ]}
            }))
            
            # Group by day
            daily_engagement = defaultdict(lambda: {
                "reads": 0,
                "comments": 0,
                "ratings": 0,
                "shares": 0,
                "bookmarks": 0
            })
            
            for event in events:
                date_key = event['timestamp'].date().isoformat()
                event_type = event['event_type']
                
                if event_type == EventType.CHAPTER_READ:
                    daily_engagement[date_key]["reads"] += 1
                elif event_type == EventType.COMMENT_POSTED:
                    daily_engagement[date_key]["comments"] += 1
                elif event_type == EventType.STORY_RATED:
                    daily_engagement[date_key]["ratings"] += 1
                elif event_type == EventType.STORY_SHARED:
                    daily_engagement[date_key]["shares"] += 1
                elif event_type == EventType.BOOKMARK_ADDED:
                    daily_engagement[date_key]["bookmarks"] += 1
            
            # Calculate trends
            dates = sorted(daily_engagement.keys())
            if len(dates) >= 7:
                recent_week = dates[-7:]
                recent_engagement = sum(
                    sum(daily_engagement[date].values()) for date in recent_week
                ) / 7
                
                if len(dates) >= 14:
                    previous_week = dates[-14:-7]
                    previous_engagement = sum(
                        sum(daily_engagement[date].values()) for date in previous_week
                    ) / 7
                    trend = ((recent_engagement - previous_engagement) / max(previous_engagement, 1)) * 100
                else:
                    trend = 0
            else:
                trend = 0
                recent_engagement = 0
            
            return {
                "daily_engagement": dict(daily_engagement),
                "trend_percentage": round(trend, 2),
                "average_daily_engagement": round(recent_engagement, 2)
            }
            
        except Exception as e:
            logger.error(f"Error getting engagement trends: {e}")
            return {}
    
    async def _generate_content_recommendations(self, writer_id: str, days: int) -> List[Dict[str, Any]]:
        """Generate content optimization recommendations"""
        try:
            recommendations = []
            
            # Get writer's performance data
            overall_metrics = await self._get_writer_overall_metrics(writer_id, days)
            engagement_trends = await self._get_engagement_trends(writer_id, days)
            
            # Recommendation 1: Engagement rate
            engagement_rate = overall_metrics.get("engagement_rate", 0)
            if engagement_rate < 5:
                recommendations.append({
                    "type": "engagement",
                    "priority": "high",
                    "title": "Improve Reader Engagement",
                    "description": f"Your engagement rate is {engagement_rate}%. Try adding more interactive elements like cliffhangers, questions, or calls-to-action.",
                    "suggested_actions": [
                        "End chapters with compelling cliffhangers",
                        "Ask readers questions in author notes",
                        "Respond to comments to build community"
                    ]
                })
            
            # Recommendation 2: Publishing consistency
            daily_engagement = engagement_trends.get("daily_engagement", {})
            if len(daily_engagement) < days * 0.3:  # Less than 30% of days have activity
                recommendations.append({
                    "type": "consistency",
                    "priority": "medium",
                    "title": "Maintain Publishing Schedule",
                    "description": "Consistent publishing helps retain readers and improve visibility.",
                    "suggested_actions": [
                        "Set a regular publishing schedule",
                        "Prepare content in advance",
                        "Use scheduling tools to maintain consistency"
                    ]
                })
            
            # Recommendation 3: Reader retention
            total_views = overall_metrics.get("total_views", 0)
            unique_readers = overall_metrics.get("unique_readers", 0)
            if unique_readers > 0 and (total_views / unique_readers) < 2:
                recommendations.append({
                    "type": "retention",
                    "priority": "high",
                    "title": "Improve Reader Retention",
                    "description": "Readers aren't returning frequently. Focus on creating compelling series and character development.",
                    "suggested_actions": [
                        "Develop multi-chapter story arcs",
                        "Create memorable characters",
                        "Build suspense across chapters"
                    ]
                })
            
            # Recommendation 4: Monetization
            # This would require revenue data integration
            recommendations.append({
                "type": "monetization",
                "priority": "low",
                "title": "Explore Monetization Options",
                "description": "Consider different ways to monetize your content based on your audience engagement.",
                "suggested_actions": [
                    "Experiment with premium chapters",
                    "Offer exclusive content for supporters",
                    "Consider merchandise or spin-offs"
                ]
            })
            
            return recommendations[:5]  # Return top 5 recommendations
            
        except Exception as e:
            logger.error(f"Error generating recommendations: {e}")
            return []
    
    async def get_content_insights(self, content_id: str, days: int = 30) -> Dict[str, Any]:
        """Get detailed insights for specific content"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get basic performance metrics
            performance = await self.analytics_service.get_content_performance(content_id, days)
            
            # Get reader journey analysis
            reader_journey = await self._analyze_reader_journey(content_id, days)
            
            # Get optimal posting times
            posting_insights = await self._analyze_posting_patterns(content_id, days)
            
            # Get content comparison
            similar_content = await self._get_similar_content_performance(content_id, days)
            
            return {
                "content_id": content_id,
                "performance_metrics": performance,
                "reader_journey": reader_journey,
                "posting_insights": posting_insights,
                "similar_content_comparison": similar_content,
                "generated_at": datetime.utcnow()
            }
            
        except Exception as e:
            logger.error(f"Error getting content insights: {e}")
            return {}
    
    async def _analyze_reader_journey(self, content_id: str, days: int) -> Dict[str, Any]:
        """Analyze how readers interact with content"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Get all events for this content
            events = list(self.events_collection.find({
                "$or": [
                    {"properties.story_id": content_id},
                    {"properties.chapter_id": content_id}
                ],
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }))
            
            # Analyze drop-off points
            chapter_completion = defaultdict(int)
            chapter_starts = defaultdict(int)
            
            for event in events:
                if event['event_type'] == EventType.CHAPTER_READ:
                    chapter_id = event.get('properties', {}).get('chapter_id', 'unknown')
                    completion = event.get('properties', {}).get('completion_percentage', 0)
                    
                    chapter_starts[chapter_id] += 1
                    if completion >= 90:
                        chapter_completion[chapter_id] += 1
            
            # Calculate completion rates by chapter
            completion_rates = {}
            for chapter_id in chapter_starts:
                if chapter_starts[chapter_id] > 0:
                    completion_rates[chapter_id] = (chapter_completion[chapter_id] / chapter_starts[chapter_id]) * 100
            
            return {
                "chapter_completion_rates": completion_rates,
                "average_completion_rate": sum(completion_rates.values()) / max(len(completion_rates), 1)
            }
            
        except Exception as e:
            logger.error(f"Error analyzing reader journey: {e}")
            return {}
    
    async def _analyze_posting_patterns(self, content_id: str, days: int) -> Dict[str, Any]:
        """Analyze optimal posting times and patterns"""
        try:
            # This would analyze when content gets the most engagement
            # For now, return basic insights
            return {
                "optimal_posting_time": "18:00-20:00 UTC",
                "best_days": ["Tuesday", "Wednesday", "Thursday"],
                "engagement_peak_hours": [18, 19, 20, 21]
            }
            
        except Exception as e:
            logger.error(f"Error analyzing posting patterns: {e}")
            return {}
    
    async def _get_similar_content_performance(self, content_id: str, days: int) -> Dict[str, Any]:
        """Compare performance with similar content"""
        try:
            # This would require content categorization and similarity matching
            # For now, return placeholder data
            return {
                "category_average_views": 1500,
                "category_average_engagement": 8.5,
                "performance_percentile": 75
            }
            
        except Exception as e:
            logger.error(f"Error getting similar content performance: {e}")
            return {}