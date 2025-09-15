"""
Social engagement service for user following, notifications, achievements, and contests
"""
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional, Dict, Any, Tuple
from datetime import datetime, timedelta
import uuid
import logging

from models import (
    UserFollow, Notification, NotificationType, Achievement, AchievementType,
    UserAchievement, UserStats, Contest, ContestStatus, ContestParticipant,
    ContestSubmission, SocialShare, Leaderboard
)
from schemas import (
    FollowUserRequest, FollowResponse, UserFollowStats, NotificationResponse,
    NotificationListResponse, AchievementResponse, UserAchievementResponse,
    UserStatsResponse, ContestCreateRequest, ContestResponse, ContestListResponse,
    SocialShareRequest, SocialShareResponse, LeaderboardResponse
)

logger = logging.getLogger(__name__)

class SocialService:
    """Service for handling social engagement features"""
    
    def __init__(self, db: Session):
        self.db = db    

    # User Following Methods
    
    def follow_user(self, follower_id: str, request: FollowUserRequest) -> FollowResponse:
        """Follow a user"""
        try:
            # Check if already following
            existing_follow = self.db.query(UserFollow).filter(
                and_(
                    UserFollow.follower_id == uuid.UUID(follower_id),
                    UserFollow.following_id == uuid.UUID(request.following_id)
                )
            ).first()
            
            if existing_follow:
                if existing_follow.is_active:
                    raise ValueError("Already following this user")
                else:
                    # Reactivate follow
                    existing_follow.is_active = True
                    existing_follow.notification_enabled = request.notification_enabled
                    existing_follow.updated_at = datetime.utcnow()
                    self.db.commit()
                    return FollowResponse(
                        id=str(existing_follow.id),
                        follower_id=str(existing_follow.follower_id),
                        following_id=str(existing_follow.following_id),
                        is_active=existing_follow.is_active,
                        notification_enabled=existing_follow.notification_enabled,
                        created_at=existing_follow.created_at
                    )
            
            # Create new follow relationship
            follow = UserFollow(
                follower_id=uuid.UUID(follower_id),
                following_id=uuid.UUID(request.following_id),
                notification_enabled=request.notification_enabled
            )
            
            self.db.add(follow)
            self.db.commit()
            self.db.refresh(follow)
            
            # Update follower counts
            self._update_follow_counts(follower_id, request.following_id)
            
            # Create notification for followed user
            self._create_notification(
                user_id=request.following_id,
                type=NotificationType.NEW_FOLLOWER,
                title="New Follower",
                message="You have a new follower!",
                related_user_id=follower_id
            )
            
            return FollowResponse(
                id=str(follow.id),
                follower_id=str(follow.follower_id),
                following_id=str(follow.following_id),
                is_active=follow.is_active,
                notification_enabled=follow.notification_enabled,
                created_at=follow.created_at
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error following user: {e}")
            raise
    
    def unfollow_user(self, follower_id: str, following_id: str) -> bool:
        """Unfollow a user"""
        try:
            follow = self.db.query(UserFollow).filter(
                and_(
                    UserFollow.follower_id == uuid.UUID(follower_id),
                    UserFollow.following_id == uuid.UUID(following_id),
                    UserFollow.is_active == True
                )
            ).first()
            
            if not follow:
                raise ValueError("Not following this user")
            
            follow.is_active = False
            follow.updated_at = datetime.utcnow()
            
            self.db.commit()
            
            # Update follower counts
            self._update_follow_counts(follower_id, following_id)
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error unfollowing user: {e}")
            raise
    
    def get_user_follow_stats(self, user_id: str, current_user_id: Optional[str] = None) -> UserFollowStats:
        """Get user follow statistics"""
        try:
            # Count followers
            followers_count = self.db.query(UserFollow).filter(
                and_(
                    UserFollow.following_id == uuid.UUID(user_id),
                    UserFollow.is_active == True
                )
            ).count()
            
            # Count following
            following_count = self.db.query(UserFollow).filter(
                and_(
                    UserFollow.follower_id == uuid.UUID(user_id),
                    UserFollow.is_active == True
                )
            ).count()
            
            # Check relationship with current user
            is_following = None
            is_followed_by = None
            
            if current_user_id and current_user_id != user_id:
                is_following = self.db.query(UserFollow).filter(
                    and_(
                        UserFollow.follower_id == uuid.UUID(current_user_id),
                        UserFollow.following_id == uuid.UUID(user_id),
                        UserFollow.is_active == True
                    )
                ).first() is not None
                
                is_followed_by = self.db.query(UserFollow).filter(
                    and_(
                        UserFollow.follower_id == uuid.UUID(user_id),
                        UserFollow.following_id == uuid.UUID(current_user_id),
                        UserFollow.is_active == True
                    )
                ).first() is not None
            
            return UserFollowStats(
                user_id=user_id,
                followers_count=followers_count,
                following_count=following_count,
                is_following=is_following,
                is_followed_by=is_followed_by
            )
            
        except Exception as e:
            logger.error(f"Error getting follow stats: {e}")
            raise    
 
   # Notification Methods
    
    def create_notification(self, user_id: str, type: NotificationType, title: str, 
                          message: str, **kwargs) -> NotificationResponse:
        """Create a notification for a user"""
        return self._create_notification(user_id, type, title, message, **kwargs)
    
    def _create_notification(self, user_id: str, type: NotificationType, title: str,
                           message: str, related_user_id: Optional[str] = None,
                           related_story_id: Optional[str] = None,
                           related_chapter_id: Optional[str] = None,
                           related_comment_id: Optional[str] = None,
                           data: Optional[Dict[str, Any]] = None,
                           action_url: Optional[str] = None) -> NotificationResponse:
        """Internal method to create notifications"""
        try:
            notification = Notification(
                user_id=uuid.UUID(user_id),
                type=type,
                title=title,
                message=message,
                related_user_id=uuid.UUID(related_user_id) if related_user_id else None,
                related_story_id=uuid.UUID(related_story_id) if related_story_id else None,
                related_chapter_id=uuid.UUID(related_chapter_id) if related_chapter_id else None,
                related_comment_id=uuid.UUID(related_comment_id) if related_comment_id else None,
                data=data,
                action_url=action_url
            )
            
            self.db.add(notification)
            self.db.commit()
            self.db.refresh(notification)
            
            # Convert to response with string IDs
            return NotificationResponse(
                id=str(notification.id),
                user_id=str(notification.user_id),
                type=notification.type.value,
                title=notification.title,
                message=notification.message,
                related_user_id=str(notification.related_user_id) if notification.related_user_id else None,
                related_story_id=str(notification.related_story_id) if notification.related_story_id else None,
                related_chapter_id=str(notification.related_chapter_id) if notification.related_chapter_id else None,
                related_comment_id=str(notification.related_comment_id) if notification.related_comment_id else None,
                data=notification.data,
                action_url=notification.action_url,
                is_read=notification.is_read,
                is_dismissed=notification.is_dismissed,
                created_at=notification.created_at,
                read_at=notification.read_at
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating notification: {e}")
            raise
    
    def get_user_notifications(self, user_id: str, page: int = 1, per_page: int = 20,
                             type_filter: Optional[str] = None,
                             is_read: Optional[bool] = None) -> NotificationListResponse:
        """Get user notifications with pagination"""
        try:
            query = self.db.query(Notification).filter(
                Notification.user_id == uuid.UUID(user_id)
            )
            
            if type_filter:
                query = query.filter(Notification.type == NotificationType(type_filter))
            
            if is_read is not None:
                query = query.filter(Notification.is_read == is_read)
            
            # Get total count
            total = query.count()
            
            # Get unread count
            unread_count = self.db.query(Notification).filter(
                and_(
                    Notification.user_id == uuid.UUID(user_id),
                    Notification.is_read == False,
                    Notification.is_dismissed == False
                )
            ).count()
            
            # Apply pagination and ordering
            notifications = query.order_by(desc(Notification.created_at))\
                                .offset((page - 1) * per_page)\
                                .limit(per_page)\
                                .all()
            
            total_pages = (total + per_page - 1) // per_page
            
            return NotificationListResponse(
                notifications=[self._notification_to_response(n) for n in notifications],
                total=total,
                unread_count=unread_count,
                page=page,
                per_page=per_page,
                total_pages=total_pages
            )
            
        except Exception as e:
            logger.error(f"Error getting notifications: {e}")
            raise
    
    def mark_notification_read(self, notification_id: str, user_id: str, is_read: bool = True) -> bool:
        """Mark notification as read/unread"""
        try:
            notification = self.db.query(Notification).filter(
                and_(
                    Notification.id == uuid.UUID(notification_id),
                    Notification.user_id == uuid.UUID(user_id)
                )
            ).first()
            
            if not notification:
                raise ValueError("Notification not found")
            
            notification.is_read = is_read
            notification.read_at = datetime.utcnow() if is_read else None
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking notification: {e}")
            raise
    
    def mark_all_notifications_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        try:
            count = self.db.query(Notification).filter(
                and_(
                    Notification.user_id == uuid.UUID(user_id),
                    Notification.is_read == False
                )
            ).update({
                'is_read': True,
                'read_at': datetime.utcnow()
            })
            
            self.db.commit()
            return count
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error marking all notifications read: {e}")
            raise    
 
   # Achievement Methods
    
    def get_user_achievements(self, user_id: str) -> List[UserAchievementResponse]:
        """Get user's earned achievements"""
        try:
            user_achievements = self.db.query(UserAchievement)\
                .join(Achievement)\
                .filter(
                    and_(
                        UserAchievement.user_id == uuid.UUID(user_id),
                        UserAchievement.earned_at.isnot(None)
                    )
                )\
                .order_by(desc(UserAchievement.earned_at))\
                .all()
            
            return [UserAchievementResponse.from_orm(ua) for ua in user_achievements]
            
        except Exception as e:
            logger.error(f"Error getting user achievements: {e}")
            raise
    
    def check_and_award_achievements(self, user_id: str, event_type: str, event_data: Dict[str, Any]) -> List[UserAchievementResponse]:
        """Check if user qualifies for new achievements and award them"""
        try:
            awarded_achievements = []
            
            # Get user stats
            user_stats = self.get_user_stats(user_id)
            
            # Get all active achievements user hasn't earned yet
            earned_achievement_ids = self.db.query(UserAchievement.achievement_id)\
                .filter(
                    and_(
                        UserAchievement.user_id == uuid.UUID(user_id),
                        UserAchievement.earned_at.isnot(None)
                    )
                ).subquery()
            
            available_achievements = self.db.query(Achievement)\
                .filter(
                    and_(
                        Achievement.is_active == True,
                        Achievement.id.notin_(earned_achievement_ids)
                    )
                ).all()
            
            # Check each achievement
            for achievement in available_achievements:
                if self._check_achievement_criteria(achievement, user_stats, event_type, event_data):
                    # Award achievement
                    user_achievement = self._award_achievement(user_id, achievement.id)
                    awarded_achievements.append(UserAchievementResponse.from_orm(user_achievement))
                    
                    # Create notification
                    self._create_notification(
                        user_id=user_id,
                        type=NotificationType.ACHIEVEMENT_EARNED,
                        title="Achievement Unlocked!",
                        message=f"You earned the '{achievement.name}' achievement!",
                        data={"achievement_id": str(achievement.id), "points": achievement.points}
                    )
            
            return awarded_achievements
            
        except Exception as e:
            logger.error(f"Error checking achievements: {e}")
            raise
    
    def _check_achievement_criteria(self, achievement: Achievement, user_stats: UserStatsResponse,
                                  event_type: str, event_data: Dict[str, Any]) -> bool:
        """Check if achievement criteria are met"""
        criteria = achievement.criteria
        
        # Example criteria checking logic
        if achievement.type == AchievementType.WRITING:
            if criteria.get("stories_published") and user_stats.stories_published >= criteria["stories_published"]:
                return True
            if criteria.get("chapters_published") and user_stats.chapters_published >= criteria["chapters_published"]:
                return True
            if criteria.get("words_written") and user_stats.total_words_written >= criteria["words_written"]:
                return True
        
        elif achievement.type == AchievementType.COMMUNITY:
            if criteria.get("comments_posted") and user_stats.comments_posted >= criteria["comments_posted"]:
                return True
            if criteria.get("likes_received") and user_stats.likes_received >= criteria["likes_received"]:
                return True
            if criteria.get("followers") and user_stats.followers_count >= criteria["followers"]:
                return True
        
        elif achievement.type == AchievementType.ENGAGEMENT:
            if criteria.get("login_streak") and user_stats.daily_login_streak >= criteria["login_streak"]:
                return True
            if criteria.get("reading_streak") and user_stats.reading_streak >= criteria["reading_streak"]:
                return True
        
        return False
    
    def _award_achievement(self, user_id: str, achievement_id: uuid.UUID) -> UserAchievement:
        """Award achievement to user"""
        try:
            # Check if user already has this achievement
            existing = self.db.query(UserAchievement).filter(
                and_(
                    UserAchievement.user_id == uuid.UUID(user_id),
                    UserAchievement.achievement_id == achievement_id
                )
            ).first()
            
            if existing:
                if existing.earned_at is None:
                    existing.earned_at = datetime.utcnow()
                    self.db.commit()
                    return existing
                else:
                    return existing
            
            # Create new user achievement
            user_achievement = UserAchievement(
                user_id=uuid.UUID(user_id),
                achievement_id=achievement_id,
                earned_at=datetime.utcnow()
            )
            
            self.db.add(user_achievement)
            
            # Update user stats
            achievement = self.db.query(Achievement).filter(Achievement.id == achievement_id).first()
            if achievement:
                self._update_user_points(user_id, achievement.points)
            
            self.db.commit()
            self.db.refresh(user_achievement)
            
            return user_achievement
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error awarding achievement: {e}")
            raise  
  
    # User Statistics Methods
    
    def get_user_stats(self, user_id: str) -> UserStatsResponse:
        """Get user statistics"""
        try:
            stats = self.db.query(UserStats).filter(
                UserStats.user_id == uuid.UUID(user_id)
            ).first()
            
            if not stats:
                # Create initial stats
                stats = UserStats(user_id=uuid.UUID(user_id))
                self.db.add(stats)
                self.db.commit()
                self.db.refresh(stats)
            
            return UserStatsResponse(
                user_id=str(stats.user_id),
                stories_published=stats.stories_published,
                chapters_published=stats.chapters_published,
                total_words_written=stats.total_words_written,
                stories_read=stats.stories_read,
                chapters_read=stats.chapters_read,
                total_reading_time=stats.total_reading_time,
                comments_posted=stats.comments_posted,
                ratings_given=stats.ratings_given,
                likes_received=stats.likes_received,
                followers_count=stats.followers_count,
                following_count=stats.following_count,
                total_points=stats.total_points,
                achievements_earned=stats.achievements_earned,
                contests_participated=stats.contests_participated,
                contests_won=stats.contests_won,
                daily_login_streak=stats.daily_login_streak,
                writing_streak=stats.writing_streak,
                reading_streak=stats.reading_streak,
                last_login_at=stats.last_login_at,
                last_story_published_at=stats.last_story_published_at,
                last_chapter_read_at=stats.last_chapter_read_at
            )
            
        except Exception as e:
            logger.error(f"Error getting user stats: {e}")
            raise
    
    def update_user_stats(self, user_id: str, **kwargs) -> UserStatsResponse:
        """Update user statistics"""
        try:
            stats = self.db.query(UserStats).filter(
                UserStats.user_id == uuid.UUID(user_id)
            ).first()
            
            if not stats:
                stats = UserStats(user_id=uuid.UUID(user_id))
                self.db.add(stats)
            
            # Update provided fields
            for field, value in kwargs.items():
                if hasattr(stats, field):
                    setattr(stats, field, value)
            
            stats.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(stats)
            
            return UserStatsResponse.from_orm(stats)
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user stats: {e}")
            raise
    
    def _update_user_points(self, user_id: str, points: int):
        """Update user's total points"""
        try:
            stats = self.db.query(UserStats).filter(
                UserStats.user_id == uuid.UUID(user_id)
            ).first()
            
            if not stats:
                stats = UserStats(user_id=uuid.UUID(user_id))
                self.db.add(stats)
            
            stats.total_points += points
            stats.updated_at = datetime.utcnow()
            
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating user points: {e}")
            raise
    
    def _update_follow_counts(self, follower_id: str, following_id: str):
        """Update follower counts for both users"""
        try:
            # Update follower's following count
            follower_stats = self.db.query(UserStats).filter(
                UserStats.user_id == uuid.UUID(follower_id)
            ).first()
            
            if follower_stats:
                follower_stats.following_count = self.db.query(UserFollow).filter(
                    and_(
                        UserFollow.follower_id == uuid.UUID(follower_id),
                        UserFollow.is_active == True
                    )
                ).count()
            
            # Update following user's followers count
            following_stats = self.db.query(UserStats).filter(
                UserStats.user_id == uuid.UUID(following_id)
            ).first()
            
            if following_stats:
                following_stats.followers_count = self.db.query(UserFollow).filter(
                    and_(
                        UserFollow.following_id == uuid.UUID(following_id),
                        UserFollow.is_active == True
                    )
                ).count()
            
            self.db.commit()
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating follow counts: {e}")
            raise
    
    # Leaderboard Methods
    
    def get_leaderboard(self, category: str, period: str = "all_time", 
                       limit: int = 50, user_id: Optional[str] = None) -> LeaderboardResponse:
        """Get leaderboard for a category and period"""
        try:
            # Calculate period boundaries
            period_start, period_end = self._get_period_boundaries(period)
            
            # Get leaderboard entries
            query = self.db.query(Leaderboard).filter(
                and_(
                    Leaderboard.category == category,
                    Leaderboard.period == period,
                    Leaderboard.period_start == period_start
                )
            ).order_by(Leaderboard.rank).limit(limit)
            
            entries = query.all()
            
            # Get current user's rank if provided
            current_user_rank = None
            if user_id:
                user_entry = self.db.query(Leaderboard).filter(
                    and_(
                        Leaderboard.category == category,
                        Leaderboard.period == period,
                        Leaderboard.period_start == period_start,
                        Leaderboard.user_id == uuid.UUID(user_id)
                    )
                ).first()
                
                if user_entry:
                    current_user_rank = user_entry.rank
            
            # Get total entries count
            total_entries = self.db.query(Leaderboard).filter(
                and_(
                    Leaderboard.category == category,
                    Leaderboard.period == period,
                    Leaderboard.period_start == period_start
                )
            ).count()
            
            return LeaderboardResponse(
                category=category,
                period=period,
                entries=[self._leaderboard_entry_to_dict(entry) for entry in entries],
                total_entries=total_entries,
                current_user_rank=current_user_rank,
                period_start=period_start,
                period_end=period_end,
                last_updated=datetime.utcnow()
            )
            
        except Exception as e:
            logger.error(f"Error getting leaderboard: {e}")
            raise
    
    def _get_period_boundaries(self, period: str) -> Tuple[datetime, datetime]:
        """Get period start and end dates"""
        now = datetime.utcnow()
        
        if period == "daily":
            start = now.replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=1)
        elif period == "weekly":
            days_since_monday = now.weekday()
            start = (now - timedelta(days=days_since_monday)).replace(hour=0, minute=0, second=0, microsecond=0)
            end = start + timedelta(days=7)
        elif period == "monthly":
            start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
            if start.month == 12:
                end = start.replace(year=start.year + 1, month=1)
            else:
                end = start.replace(month=start.month + 1)
        else:  # all_time
            start = datetime(2020, 1, 1)  # Platform start date
            end = datetime(2099, 12, 31)
        
        return start, end
    
    def _leaderboard_entry_to_dict(self, entry: Leaderboard) -> Dict[str, Any]:
        """Convert leaderboard entry to dictionary"""
        return {
            "user_id": str(entry.user_id),
            "rank": entry.rank,
            "score": float(entry.score),
            "data": entry.data
        }   
 
    # Contest Methods
    
    def create_contest(self, organizer_id: str, request: ContestCreateRequest) -> ContestResponse:
        """Create a new contest"""
        try:
            contest = Contest(
                title=request.title,
                description=request.description,
                rules=request.rules,
                theme=request.theme,
                genre_restrictions=request.genre_restrictions,
                word_limit_min=request.word_limit_min,
                word_limit_max=request.word_limit_max,
                registration_starts_at=request.registration_starts_at,
                registration_ends_at=request.registration_ends_at,
                contest_starts_at=request.contest_starts_at,
                contest_ends_at=request.contest_ends_at,
                judging_ends_at=request.judging_ends_at,
                max_participants=request.max_participants,
                entry_fee=request.entry_fee or 0,
                prize_pool=request.prize_pool or 0,
                prize_distribution=request.prize_distribution,
                organizer_id=uuid.UUID(organizer_id),
                judges=request.judges,
                banner_url=request.banner_url,
                status=ContestStatus.DRAFT
            )
            
            self.db.add(contest)
            self.db.commit()
            self.db.refresh(contest)
            
            return self._contest_to_response(contest)
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating contest: {e}")
            raise
    
    def get_contests(self, page: int = 1, per_page: int = 20, 
                    status_filter: Optional[str] = None,
                    is_featured: Optional[bool] = None) -> ContestListResponse:
        """Get contests with pagination and filtering"""
        try:
            query = self.db.query(Contest)
            
            if status_filter:
                query = query.filter(Contest.status == ContestStatus(status_filter))
            
            if is_featured is not None:
                query = query.filter(Contest.is_featured == is_featured)
            
            # Get total count
            total = query.count()
            
            # Apply pagination and ordering
            contests = query.order_by(desc(Contest.created_at))\
                           .offset((page - 1) * per_page)\
                           .limit(per_page)\
                           .all()
            
            total_pages = (total + per_page - 1) // per_page
            
            return ContestListResponse(
                contests=[self._contest_to_response(c) for c in contests],
                total=total,
                page=page,
                per_page=per_page,
                total_pages=total_pages
            )
            
        except Exception as e:
            logger.error(f"Error getting contests: {e}")
            raise
    
    def join_contest(self, user_id: str, contest_id: str) -> bool:
        """Join a contest"""
        try:
            contest = self.db.query(Contest).filter(Contest.id == uuid.UUID(contest_id)).first()
            if not contest:
                raise ValueError("Contest not found")
            
            # Check if registration is open
            now = datetime.utcnow()
            if now < contest.registration_starts_at or now > contest.registration_ends_at:
                raise ValueError("Registration is not open")
            
            # Check if already joined
            existing = self.db.query(ContestParticipant).filter(
                and_(
                    ContestParticipant.contest_id == uuid.UUID(contest_id),
                    ContestParticipant.user_id == uuid.UUID(user_id),
                    ContestParticipant.is_active == True
                )
            ).first()
            
            if existing:
                raise ValueError("Already joined this contest")
            
            # Check participant limit
            if contest.max_participants:
                current_count = self.db.query(ContestParticipant).filter(
                    and_(
                        ContestParticipant.contest_id == uuid.UUID(contest_id),
                        ContestParticipant.is_active == True
                    )
                ).count()
                
                if current_count >= contest.max_participants:
                    raise ValueError("Contest is full")
            
            # Create participant record
            participant = ContestParticipant(
                contest_id=uuid.UUID(contest_id),
                user_id=uuid.UUID(user_id),
                payment_status="paid" if contest.entry_fee == 0 else "pending"
            )
            
            self.db.add(participant)
            self.db.commit()
            
            # Create notification
            self._create_notification(
                user_id=user_id,
                type=NotificationType.CONTEST_UPDATE,
                title="Contest Joined",
                message=f"You've successfully joined '{contest.title}'!",
                data={"contest_id": contest_id}
            )
            
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error joining contest: {e}")
            raise
    
    def submit_to_contest(self, user_id: str, contest_id: str, story_id: str, 
                         title: str, description: Optional[str] = None) -> bool:
        """Submit a story to a contest"""
        try:
            # Check if user is participant
            participant = self.db.query(ContestParticipant).filter(
                and_(
                    ContestParticipant.contest_id == uuid.UUID(contest_id),
                    ContestParticipant.user_id == uuid.UUID(user_id),
                    ContestParticipant.is_active == True
                )
            ).first()
            
            if not participant:
                raise ValueError("Not a participant in this contest")
            
            # Check if contest is active
            contest = self.db.query(Contest).filter(Contest.id == uuid.UUID(contest_id)).first()
            if not contest or contest.status != ContestStatus.ACTIVE:
                raise ValueError("Contest is not accepting submissions")
            
            # Check submission deadline
            now = datetime.utcnow()
            if now > contest.contest_ends_at:
                raise ValueError("Submission deadline has passed")
            
            # Create or update submission
            existing_submission = self.db.query(ContestSubmission).filter(
                and_(
                    ContestSubmission.contest_id == uuid.UUID(contest_id),
                    ContestSubmission.participant_id == participant.id
                )
            ).first()
            
            if existing_submission:
                existing_submission.story_id = uuid.UUID(story_id)
                existing_submission.title = title
                existing_submission.description = description
                existing_submission.submitted_at = datetime.utcnow()
                existing_submission.is_final = False
            else:
                submission = ContestSubmission(
                    contest_id=uuid.UUID(contest_id),
                    participant_id=participant.id,
                    story_id=uuid.UUID(story_id),
                    title=title,
                    description=description,
                    word_count=0  # This would be calculated from the story
                )
                self.db.add(submission)
            
            self.db.commit()
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error submitting to contest: {e}")
            raise
    
    def _contest_to_response(self, contest: Contest, user_id: Optional[str] = None) -> ContestResponse:
        """Convert contest model to response"""
        # Get current participant count
        current_participants = self.db.query(ContestParticipant).filter(
            and_(
                ContestParticipant.contest_id == contest.id,
                ContestParticipant.is_active == True
            )
        ).count()
        
        # Check user participation if user_id provided
        user_participation = None
        if user_id:
            participant = self.db.query(ContestParticipant).filter(
                and_(
                    ContestParticipant.contest_id == contest.id,
                    ContestParticipant.user_id == uuid.UUID(user_id),
                    ContestParticipant.is_active == True
                )
            ).first()
            
            if participant:
                user_participation = {
                    "is_participant": True,
                    "payment_status": participant.payment_status,
                    "registered_at": participant.registered_at.isoformat()
                }
        
        return ContestResponse(
            id=str(contest.id),
            title=contest.title,
            description=contest.description,
            rules=contest.rules,
            theme=contest.theme,
            genre_restrictions=contest.genre_restrictions,
            word_limit_min=contest.word_limit_min,
            word_limit_max=contest.word_limit_max,
            registration_starts_at=contest.registration_starts_at,
            registration_ends_at=contest.registration_ends_at,
            contest_starts_at=contest.contest_starts_at,
            contest_ends_at=contest.contest_ends_at,
            judging_ends_at=contest.judging_ends_at,
            status=contest.status.value,
            max_participants=contest.max_participants,
            current_participants=current_participants,
            entry_fee=float(contest.entry_fee),
            prize_pool=float(contest.prize_pool),
            prize_distribution=contest.prize_distribution,
            organizer_id=str(contest.organizer_id),
            judges=contest.judges,
            banner_url=contest.banner_url,
            is_featured=contest.is_featured,
            user_participation=user_participation,
            created_at=contest.created_at
        ) 
   
    # Social Sharing Methods
    
    def create_social_share(self, user_id: str, request: SocialShareRequest) -> SocialShareResponse:
        """Create a social share link"""
        try:
            # Generate share URL and text
            share_url = self._generate_share_url(request.content_type, request.content_id, user_id)
            share_text = request.share_text or self._generate_share_text(request.content_type, request.content_id)
            
            # Create share record
            share = SocialShare(
                user_id=uuid.UUID(user_id),
                content_type=request.content_type,
                content_id=uuid.UUID(request.content_id),
                platform=request.platform,
                share_url=share_url,
                share_text=share_text
            )
            
            self.db.add(share)
            self.db.commit()
            self.db.refresh(share)
            
            return SocialShareResponse(
                id=str(share.id),
                share_url=share_url,
                share_text=share_text,
                platform=request.platform
            )
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating social share: {e}")
            raise
    
    def _generate_share_url(self, content_type: str, content_id: str, user_id: str) -> str:
        """Generate shareable URL with tracking"""
        base_url = "https://legato.app"  # This would come from config
        
        if content_type == "story":
            return f"{base_url}/story/{content_id}?ref={user_id}"
        elif content_type == "chapter":
            return f"{base_url}/chapter/{content_id}?ref={user_id}"
        elif content_type == "contest":
            return f"{base_url}/contest/{content_id}?ref={user_id}"
        else:
            return f"{base_url}?ref={user_id}"
    
    def _generate_share_text(self, content_type: str, content_id: str) -> str:
        """Generate default share text"""
        if content_type == "story":
            return f"Check out this amazing story on Legato! 📚✨"
        elif content_type == "chapter":
            return f"Just read an incredible chapter! Join me on Legato 📖"
        elif content_type == "contest":
            return f"Exciting writing contest on Legato! Join the creative community 🏆"
        elif content_type == "achievement":
            return f"Just unlocked a new achievement on Legato! 🎉"
        else:
            return f"Discover amazing stories on Legato! 📚"
    
    def track_share_click(self, share_id: str) -> bool:
        """Track a click on a shared link"""
        try:
            share = self.db.query(SocialShare).filter(SocialShare.id == uuid.UUID(share_id)).first()
            if share:
                share.clicks += 1
                self.db.commit()
                return True
            return False
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error tracking share click: {e}")
            return False
    
    def _notification_to_response(self, notification: Notification) -> NotificationResponse:
        """Convert notification model to response"""
        return NotificationResponse(
            id=str(notification.id),
            user_id=str(notification.user_id),
            type=notification.type.value,
            title=notification.title,
            message=notification.message,
            related_user_id=str(notification.related_user_id) if notification.related_user_id else None,
            related_story_id=str(notification.related_story_id) if notification.related_story_id else None,
            related_chapter_id=str(notification.related_chapter_id) if notification.related_chapter_id else None,
            related_comment_id=str(notification.related_comment_id) if notification.related_comment_id else None,
            data=notification.data,
            action_url=notification.action_url,
            is_read=notification.is_read,
            is_dismissed=notification.is_dismissed,
            created_at=notification.created_at,
            read_at=notification.read_at
        )