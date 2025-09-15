from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
from pymongo import MongoClient
import redis
import json
import asyncio
from collections import defaultdict, Counter
import logging

from models import (
    AnalyticsEvent, ContentEngagementEvent, UserBehaviorEvent, RevenueEvent,
    AggregatedMetrics, ContentPerformanceMetrics, UserEngagementMetrics,
    ABTestVariant, ABTestResult, RealtimeMetrics, EventType
)

logger = logging.getLogger(__name__)

class AnalyticsService:
    def __init__(self, mongo_client: MongoClient, redis_client: redis.Redis):
        self.mongo_client = mongo_client
        self.redis_client = redis_client
        self.db = mongo_client.get_default_database()
        
        # Collections
        self.events_collection = self.db.analytics_events
        self.metrics_collection = self.db.aggregated_metrics
        self.content_metrics_collection = self.db.content_metrics
        self.user_metrics_collection = self.db.user_metrics
        self.ab_tests_collection = self.db.ab_tests
        self.ab_results_collection = self.db.ab_test_results
        
        # Create indexes for better performance
        self._create_indexes()
    
    def _create_indexes(self):
        """Create database indexes for optimal query performance"""
        try:
            # Events collection indexes
            self.events_collection.create_index([("timestamp", -1)])
            self.events_collection.create_index([("event_type", 1), ("timestamp", -1)])
            self.events_collection.create_index([("user_id", 1), ("timestamp", -1)])
            self.events_collection.create_index([("properties.story_id", 1), ("timestamp", -1)])
            
            # Metrics collection indexes
            self.metrics_collection.create_index([("entity_id", 1), ("metric_type", 1), ("date", -1)])
            self.content_metrics_collection.create_index([("content_id", 1), ("date", -1)])
            self.user_metrics_collection.create_index([("user_id", 1), ("date", -1)])
            
            # A/B test indexes
            self.ab_tests_collection.create_index([("test_id", 1)])
            self.ab_results_collection.create_index([("test_id", 1), ("variant_id", 1)])
            
            logger.info("Database indexes created successfully")
        except Exception as e:
            logger.error(f"Error creating indexes: {e}")
    
    async def track_event(self, event: AnalyticsEvent) -> bool:
        """Track a single analytics event"""
        try:
            # Store event in MongoDB
            event_dict = event.dict()
            self.events_collection.insert_one(event_dict)
            
            # Store in Redis for real-time processing
            redis_key = f"events:{event.event_type}:{datetime.utcnow().strftime('%Y%m%d%H')}"
            self.redis_client.lpush(redis_key, json.dumps(event_dict, default=str))
            self.redis_client.expire(redis_key, 86400)  # Expire after 24 hours
            
            # Update real-time metrics
            await self._update_realtime_metrics(event)
            
            logger.info(f"Event tracked: {event.event_type} for user {event.user_id}")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking event: {e}")
            return False
    
    async def track_batch_events(self, events: List[AnalyticsEvent]) -> bool:
        """Track multiple events in batch for better performance"""
        try:
            if not events:
                return True
            
            # Batch insert to MongoDB
            event_dicts = [event.dict() for event in events]
            self.events_collection.insert_many(event_dicts)
            
            # Batch update Redis
            pipeline = self.redis_client.pipeline()
            for event in events:
                redis_key = f"events:{event.event_type}:{datetime.utcnow().strftime('%Y%m%d%H')}"
                pipeline.lpush(redis_key, json.dumps(event.dict(), default=str))
                pipeline.expire(redis_key, 86400)
            pipeline.execute()
            
            logger.info(f"Batch tracked {len(events)} events")
            return True
            
        except Exception as e:
            logger.error(f"Error tracking batch events: {e}")
            return False
    
    async def _update_realtime_metrics(self, event: AnalyticsEvent):
        """Update real-time metrics in Redis"""
        try:
            current_hour = datetime.utcnow().strftime('%Y%m%d%H')
            
            # Update active users
            if event.user_id:
                self.redis_client.sadd(f"active_users:{current_hour}", event.user_id)
                self.redis_client.expire(f"active_users:{current_hour}", 3600)
            
            # Update concurrent readers for reading events
            if event.event_type == EventType.CHAPTER_READ and event.user_id:
                self.redis_client.sadd("concurrent_readers", event.user_id)
                self.redis_client.expire("concurrent_readers", 300)  # 5 minutes
            
            # Update story popularity
            if hasattr(event, 'properties') and 'story_id' in event.properties:
                story_id = event.properties['story_id']
                self.redis_client.zincrby("popular_stories", 1, story_id)
            
            # Update revenue tracking
            if event.event_type == EventType.PAYMENT_MADE and hasattr(event, 'properties'):
                amount = event.properties.get('amount', 0)
                today = datetime.utcnow().strftime('%Y%m%d')
                self.redis_client.incrbyfloat(f"revenue:{today}", amount)
                self.redis_client.expire(f"revenue:{today}", 86400)
            
        except Exception as e:
            logger.error(f"Error updating real-time metrics: {e}")
    
    async def get_realtime_metrics(self) -> RealtimeMetrics:
        """Get current real-time metrics"""
        try:
            current_hour = datetime.utcnow().strftime('%Y%m%d%H')
            today = datetime.utcnow().strftime('%Y%m%d')
            
            # Get active users count
            active_users = self.redis_client.scard(f"active_users:{current_hour}")
            
            # Get concurrent readers
            concurrent_readers = self.redis_client.scard("concurrent_readers")
            
            # Get top stories
            top_stories_raw = self.redis_client.zrevrange("popular_stories", 0, 9, withscores=True)
            top_stories = [{"story_id": story.decode(), "score": int(score)} 
                          for story, score in top_stories_raw]
            
            # Get today's revenue
            revenue_today = float(self.redis_client.get(f"revenue:{today}") or 0)
            
            # Get new registrations today
            new_registrations = self._get_daily_registrations(today)
            
            return RealtimeMetrics(
                active_users=active_users,
                concurrent_readers=concurrent_readers,
                top_stories=top_stories,
                revenue_today=revenue_today,
                new_registrations_today=new_registrations
            )
            
        except Exception as e:
            logger.error(f"Error getting real-time metrics: {e}")
            return RealtimeMetrics()
    
    def _get_daily_registrations(self, date_str: str) -> int:
        """Get new user registrations for a specific date"""
        try:
            start_date = datetime.strptime(date_str, '%Y%m%d')
            end_date = start_date + timedelta(days=1)
            
            count = self.events_collection.count_documents({
                "event_type": EventType.USER_REGISTRATION,
                "timestamp": {"$gte": start_date, "$lt": end_date}
            })
            return count
        except Exception as e:
            logger.error(f"Error getting daily registrations: {e}")
            return 0
    
    async def get_content_performance(self, content_id: str, days: int = 30) -> ContentPerformanceMetrics:
        """Get performance metrics for specific content"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query events for this content
            events = list(self.events_collection.find({
                "$or": [
                    {"properties.story_id": content_id},
                    {"properties.chapter_id": content_id}
                ],
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }))
            
            # Calculate metrics
            total_views = len([e for e in events if e['event_type'] in [EventType.STORY_VIEW, EventType.CHAPTER_READ]])
            unique_viewers = len(set(e['user_id'] for e in events if e.get('user_id')))
            
            read_events = [e for e in events if e['event_type'] == EventType.CHAPTER_READ]
            total_read_time = sum(e.get('properties', {}).get('read_duration', 0) for e in read_events)
            avg_read_time = total_read_time / len(read_events) if read_events else 0
            
            completion_events = [e for e in read_events if e.get('properties', {}).get('completion_percentage', 0) >= 90]
            completion_rate = len(completion_events) / len(read_events) if read_events else 0
            
            comments_count = len([e for e in events if e['event_type'] == EventType.COMMENT_POSTED])
            ratings_count = len([e for e in events if e['event_type'] == EventType.STORY_RATED])
            shares_count = len([e for e in events if e['event_type'] == EventType.STORY_SHARED])
            bookmarks_count = len([e for e in events if e['event_type'] == EventType.BOOKMARK_ADDED])
            
            # Calculate engagement score (weighted combination of metrics)
            engagement_score = (
                (total_views * 1) +
                (comments_count * 5) +
                (ratings_count * 3) +
                (shares_count * 10) +
                (bookmarks_count * 7)
            ) / max(unique_viewers, 1)
            
            return ContentPerformanceMetrics(
                content_id=content_id,
                content_type="story",  # Could be determined from content_id
                total_views=total_views,
                unique_viewers=unique_viewers,
                total_read_time=total_read_time,
                average_read_time=avg_read_time,
                completion_rate=completion_rate,
                engagement_score=engagement_score,
                comments_count=comments_count,
                ratings_count=ratings_count,
                shares_count=shares_count,
                bookmarks_count=bookmarks_count
            )
            
        except Exception as e:
            logger.error(f"Error getting content performance: {e}")
            return ContentPerformanceMetrics(content_id=content_id, content_type="story")
    
    async def get_user_engagement(self, user_id: str, days: int = 30) -> UserEngagementMetrics:
        """Get engagement metrics for a specific user"""
        try:
            end_date = datetime.utcnow()
            start_date = end_date - timedelta(days=days)
            
            # Query user events
            events = list(self.events_collection.find({
                "user_id": user_id,
                "timestamp": {"$gte": start_date, "$lte": end_date}
            }))
            
            # Calculate metrics
            read_events = [e for e in events if e['event_type'] == EventType.CHAPTER_READ]
            total_reading_time = sum(e.get('properties', {}).get('read_duration', 0) for e in read_events)
            
            stories_read = len(set(e.get('properties', {}).get('story_id') for e in read_events if e.get('properties', {}).get('story_id')))
            chapters_read = len(read_events)
            
            comments_posted = len([e for e in events if e['event_type'] == EventType.COMMENT_POSTED])
            ratings_given = len([e for e in events if e['event_type'] == EventType.STORY_RATED])
            stories_shared = len([e for e in events if e['event_type'] == EventType.STORY_SHARED])
            
            # Calculate engagement score
            engagement_score = (
                (total_reading_time / 60) +  # Reading time in minutes
                (stories_read * 10) +
                (comments_posted * 5) +
                (ratings_given * 3) +
                (stories_shared * 10)
            )
            
            # Calculate retention (days active in period)
            active_dates = set(e['timestamp'].date() for e in events)
            retention_days = len(active_dates)
            
            last_active = max(e['timestamp'] for e in events) if events else None
            
            return UserEngagementMetrics(
                user_id=user_id,
                total_reading_time=total_reading_time,
                stories_read=stories_read,
                chapters_read=chapters_read,
                comments_posted=comments_posted,
                ratings_given=ratings_given,
                stories_shared=stories_shared,
                last_active=last_active,
                engagement_score=engagement_score,
                retention_days=retention_days
            )
            
        except Exception as e:
            logger.error(f"Error getting user engagement: {e}")
            return UserEngagementMetrics(user_id=user_id)
    
    async def create_ab_test(self, test_id: str, variants: List[ABTestVariant]) -> bool:
        """Create a new A/B test"""
        try:
            # Validate traffic percentages sum to 100
            total_traffic = sum(v.traffic_percentage for v in variants)
            if abs(total_traffic - 100.0) > 0.01:
                raise ValueError("Traffic percentages must sum to 100%")
            
            # Store variants
            variant_dicts = [v.dict() for v in variants]
            self.ab_tests_collection.insert_many(variant_dicts)
            
            logger.info(f"Created A/B test {test_id} with {len(variants)} variants")
            return True
            
        except Exception as e:
            logger.error(f"Error creating A/B test: {e}")
            return False
    
    async def get_ab_test_variant(self, test_id: str, user_id: str) -> Optional[ABTestVariant]:
        """Get A/B test variant for a user"""
        try:
            # Check if user already has a variant assigned
            cache_key = f"ab_test:{test_id}:{user_id}"
            cached_variant = self.redis_client.get(cache_key)
            
            if cached_variant:
                variant_data = json.loads(cached_variant)
                return ABTestVariant(**variant_data)
            
            # Get active variants for this test
            variants = list(self.ab_tests_collection.find({
                "test_id": test_id,
                "is_active": True
            }))
            
            if not variants:
                return None
            
            # Assign variant based on user_id hash
            user_hash = hash(user_id) % 100
            cumulative_percentage = 0
            
            for variant_data in variants:
                cumulative_percentage += variant_data['traffic_percentage']
                if user_hash < cumulative_percentage:
                    variant = ABTestVariant(**variant_data)
                    # Cache assignment
                    self.redis_client.setex(cache_key, 86400, json.dumps(variant.dict(), default=str))
                    return variant
            
            return None
            
        except Exception as e:
            logger.error(f"Error getting A/B test variant: {e}")
            return None
    
    async def track_ab_test_result(self, result: ABTestResult) -> bool:
        """Track A/B test result"""
        try:
            self.ab_results_collection.insert_one(result.dict())
            logger.info(f"Tracked A/B test result for test {result.test_id}")
            return True
        except Exception as e:
            logger.error(f"Error tracking A/B test result: {e}")
            return False
    
    async def aggregate_daily_metrics(self, date: datetime):
        """Aggregate daily metrics (run as background task)"""
        try:
            start_date = date.replace(hour=0, minute=0, second=0, microsecond=0)
            end_date = start_date + timedelta(days=1)
            
            # Aggregate content metrics
            await self._aggregate_content_metrics(start_date, end_date)
            
            # Aggregate user metrics
            await self._aggregate_user_metrics(start_date, end_date)
            
            logger.info(f"Completed daily aggregation for {date.date()}")
            
        except Exception as e:
            logger.error(f"Error in daily aggregation: {e}")
    
    async def _aggregate_content_metrics(self, start_date: datetime, end_date: datetime):
        """Aggregate content metrics for a date range"""
        # Get all unique content IDs from events
        pipeline = [
            {"$match": {"timestamp": {"$gte": start_date, "$lt": end_date}}},
            {"$group": {"_id": {"story_id": "$properties.story_id", "chapter_id": "$properties.chapter_id"}}},
            {"$project": {"content_id": {"$ifNull": ["$_id.story_id", "$_id.chapter_id"]}}}
        ]
        
        content_ids = [doc['content_id'] for doc in self.events_collection.aggregate(pipeline) if doc['content_id']]
        
        # Calculate metrics for each content
        for content_id in content_ids:
            metrics = await self.get_content_performance(content_id, 1)  # 1 day
            metrics.date = start_date
            self.content_metrics_collection.replace_one(
                {"content_id": content_id, "date": start_date},
                metrics.dict(),
                upsert=True
            )
    
    async def _aggregate_user_metrics(self, start_date: datetime, end_date: datetime):
        """Aggregate user metrics for a date range"""
        # Get all unique user IDs from events
        user_ids = self.events_collection.distinct("user_id", {
            "timestamp": {"$gte": start_date, "$lt": end_date},
            "user_id": {"$ne": None}
        })
        
        # Calculate metrics for each user
        for user_id in user_ids:
            metrics = await self.get_user_engagement(user_id, 1)  # 1 day
            metrics.date = start_date
            self.user_metrics_collection.replace_one(
                {"user_id": user_id, "date": start_date},
                metrics.dict(),
                upsert=True
            )