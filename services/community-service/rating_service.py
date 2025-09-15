"""
Rating service for handling story ratings and reviews
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
import uuid
import logging

from models import (
    StoryRating, RatingHelpfulness, RatingReport, ModerationLog,
    UserModerationStatus, CommentStatus, ReportReason, 
    ReportStatus, ModerationAction
)
from schemas import (
    RatingCreateRequest, RatingUpdateRequest, RatingFilterRequest,
    HelpfulnessVoteRequest, ReportCreateRequest, ModerationActionRequest
)

logger = logging.getLogger(__name__)

class RatingService:
    """Service for rating and review operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_rating(self, request: RatingCreateRequest, user_id: str) -> StoryRating:
        """Create a new rating/review"""
        try:
            # Check if user already rated this story
            existing_rating = self.db.query(StoryRating).filter(
                StoryRating.story_id == uuid.UUID(request.story_id),
                StoryRating.user_id == uuid.UUID(user_id)
            ).first()
            
            if existing_rating:
                raise ValueError("User has already rated this story")
            
            # Create rating
            rating = StoryRating(
                story_id=uuid.UUID(request.story_id),
                user_id=uuid.UUID(user_id),
                rating=request.rating,
                review_title=request.review_title,
                review_content=request.review_content,
                status=CommentStatus.APPROVED,  # Ratings are auto-approved by default
                is_verified_reader=False  # TODO: Implement verification logic
            )
            
            self.db.add(rating)
            self.db.commit()
            self.db.refresh(rating)
            
            logger.info(f"Rating created: {rating.id} by user {user_id} for story {request.story_id}")
            return rating
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating rating: {e}")
            raise
    
    def get_rating(self, rating_id: str, user_id: Optional[str] = None) -> Optional[StoryRating]:
        """Get a rating by ID with user helpfulness vote if user_id provided"""
        try:
            query = self.db.query(StoryRating).filter(StoryRating.id == uuid.UUID(rating_id))
            
            if user_id:
                query = query.options(
                    joinedload(StoryRating.helpfulness_votes).filter(
                        RatingHelpfulness.user_id == uuid.UUID(user_id)
                    )
                )
            
            rating = query.first()
            return rating
            
        except Exception as e:
            logger.error(f"Error getting rating {rating_id}: {e}")
            return None
    
    def get_user_rating_for_story(self, story_id: str, user_id: str) -> Optional[StoryRating]:
        """Get user's rating for a specific story"""
        try:
            rating = self.db.query(StoryRating).filter(
                StoryRating.story_id == uuid.UUID(story_id),
                StoryRating.user_id == uuid.UUID(user_id)
            ).first()
            
            return rating
            
        except Exception as e:
            logger.error(f"Error getting user rating for story {story_id}: {e}")
            return None
    
    def update_rating(self, rating_id: str, request: RatingUpdateRequest, user_id: str) -> Optional[StoryRating]:
        """Update a rating (only by the author)"""
        try:
            rating = self.db.query(StoryRating).filter(
                StoryRating.id == uuid.UUID(rating_id),
                StoryRating.user_id == uuid.UUID(user_id)
            ).first()
            
            if not rating:
                return None
            
            # Only allow updates to approved ratings
            if rating.status != CommentStatus.APPROVED:
                raise ValueError("Cannot update rating with current status")
            
            # Update fields
            if request.rating is not None:
                rating.rating = request.rating
            
            if request.review_title is not None:
                rating.review_title = request.review_title
            
            if request.review_content is not None:
                rating.review_content = request.review_content
            
            rating.updated_at = datetime.utcnow()
            
            self.db.commit()
            self.db.refresh(rating)
            
            logger.info(f"Rating updated: {rating_id} by user {user_id}")
            return rating
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating rating {rating_id}: {e}")
            raise
    
    def delete_rating(self, rating_id: str, user_id: str) -> bool:
        """Delete a rating (only by the author)"""
        try:
            rating = self.db.query(StoryRating).filter(
                StoryRating.id == uuid.UUID(rating_id),
                StoryRating.user_id == uuid.UUID(user_id)
            ).first()
            
            if not rating:
                return False
            
            # Delete the rating (cascade will handle helpfulness votes and reports)
            self.db.delete(rating)
            self.db.commit()
            
            logger.info(f"Rating deleted: {rating_id} by user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting rating {rating_id}: {e}")
            return False
    
    def get_ratings(self, filters: RatingFilterRequest, user_id: Optional[str] = None) -> Tuple[List[StoryRating], int]:
        """Get ratings with filtering and pagination"""
        try:
            query = self.db.query(StoryRating)
            
            # Apply filters
            if filters.story_id:
                query = query.filter(StoryRating.story_id == uuid.UUID(filters.story_id))
            
            if filters.user_id:
                query = query.filter(StoryRating.user_id == uuid.UUID(filters.user_id))
            
            if filters.min_rating:
                query = query.filter(StoryRating.rating >= filters.min_rating)
            
            if filters.max_rating:
                query = query.filter(StoryRating.rating <= filters.max_rating)
            
            if filters.has_review is not None:
                if filters.has_review:
                    query = query.filter(StoryRating.review_content.isnot(None))
                else:
                    query = query.filter(StoryRating.review_content.is_(None))
            
            if filters.status:
                query = query.filter(StoryRating.status == filters.status)
            else:
                # Default to showing approved ratings only
                query = query.filter(StoryRating.status == CommentStatus.APPROVED)
            
            # Get total count
            total = query.count()
            
            # Apply sorting
            if filters.sort_by == "created_at":
                order_col = StoryRating.created_at
            elif filters.sort_by == "rating":
                order_col = StoryRating.rating
            elif filters.sort_by == "helpful_count":
                order_col = StoryRating.helpful_count
            else:
                order_col = StoryRating.created_at
            
            if filters.sort_order == "asc":
                query = query.order_by(asc(order_col))
            else:
                query = query.order_by(desc(order_col))
            
            # Apply pagination
            offset = (filters.page - 1) * filters.per_page
            ratings = query.offset(offset).limit(filters.per_page).all()
            
            return ratings, total
            
        except Exception as e:
            logger.error(f"Error getting ratings: {e}")
            return [], 0
    
    def get_story_rating_stats(self, story_id: str) -> Dict[str, Any]:
        """Get rating statistics for a story"""
        try:
            # Get basic stats
            stats_query = self.db.query(
                func.count(StoryRating.id).label('total_ratings'),
                func.avg(StoryRating.rating).label('average_rating'),
                func.count(StoryRating.review_content).label('total_reviews')
            ).filter(
                StoryRating.story_id == uuid.UUID(story_id),
                StoryRating.status == CommentStatus.APPROVED
            ).first()
            
            # Get rating distribution
            distribution_query = self.db.query(
                StoryRating.rating,
                func.count(StoryRating.id).label('count')
            ).filter(
                StoryRating.story_id == uuid.UUID(story_id),
                StoryRating.status == CommentStatus.APPROVED
            ).group_by(StoryRating.rating).all()
            
            # Build distribution dict
            rating_distribution = {i: 0 for i in range(1, 6)}
            for rating, count in distribution_query:
                rating_distribution[rating] = count
            
            return {
                'story_id': story_id,
                'total_ratings': stats_query.total_ratings or 0,
                'average_rating': float(stats_query.average_rating or 0),
                'total_reviews': stats_query.total_reviews or 0,
                'rating_distribution': rating_distribution
            }
            
        except Exception as e:
            logger.error(f"Error getting story rating stats for {story_id}: {e}")
            return {
                'story_id': story_id,
                'total_ratings': 0,
                'average_rating': 0.0,
                'total_reviews': 0,
                'rating_distribution': {i: 0 for i in range(1, 6)}
            }
    
    def vote_helpfulness(self, rating_id: str, request: HelpfulnessVoteRequest, user_id: str) -> bool:
        """Vote on rating helpfulness"""
        try:
            rating = self.db.query(StoryRating).filter(
                StoryRating.id == uuid.UUID(rating_id),
                StoryRating.status == CommentStatus.APPROVED
            ).first()
            
            if not rating:
                return False
            
            # Check for existing vote
            existing_vote = self.db.query(RatingHelpfulness).filter(
                RatingHelpfulness.rating_id == uuid.UUID(rating_id),
                RatingHelpfulness.user_id == uuid.UUID(user_id)
            ).first()
            
            if existing_vote:
                # Update existing vote
                old_is_helpful = existing_vote.is_helpful
                existing_vote.is_helpful = request.is_helpful
                
                # Update rating counts
                if old_is_helpful != request.is_helpful:
                    if old_is_helpful:
                        rating.helpful_count = max(0, rating.helpful_count - 1)
                        rating.not_helpful_count += 1
                    else:
                        rating.not_helpful_count = max(0, rating.not_helpful_count - 1)
                        rating.helpful_count += 1
            else:
                # Create new vote
                vote = RatingHelpfulness(
                    rating_id=uuid.UUID(rating_id),
                    user_id=uuid.UUID(user_id),
                    is_helpful=request.is_helpful
                )
                self.db.add(vote)
                
                # Update rating counts
                if request.is_helpful:
                    rating.helpful_count += 1
                else:
                    rating.not_helpful_count += 1
            
            self.db.commit()
            logger.info(f"Helpfulness vote added to rating {rating_id} by user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error voting on rating helpfulness {rating_id}: {e}")
            return False
    
    def remove_helpfulness_vote(self, rating_id: str, user_id: str) -> bool:
        """Remove a user's helpfulness vote from a rating"""
        try:
            vote = self.db.query(RatingHelpfulness).filter(
                RatingHelpfulness.rating_id == uuid.UUID(rating_id),
                RatingHelpfulness.user_id == uuid.UUID(user_id)
            ).first()
            
            if not vote:
                return False
            
            # Update rating counts
            rating = self.db.query(StoryRating).filter(StoryRating.id == uuid.UUID(rating_id)).first()
            if rating:
                if vote.is_helpful:
                    rating.helpful_count = max(0, rating.helpful_count - 1)
                else:
                    rating.not_helpful_count = max(0, rating.not_helpful_count - 1)
            
            self.db.delete(vote)
            self.db.commit()
            
            logger.info(f"Helpfulness vote removed from rating {rating_id} by user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing helpfulness vote from rating {rating_id}: {e}")
            return False
    
    def report_rating(self, rating_id: str, request: ReportCreateRequest, user_id: str) -> bool:
        """Report a rating for moderation"""
        try:
            rating = self.db.query(StoryRating).filter(StoryRating.id == uuid.UUID(rating_id)).first()
            if not rating:
                return False
            
            # Check if user already reported this rating
            existing_report = self.db.query(RatingReport).filter(
                RatingReport.rating_id == uuid.UUID(rating_id),
                RatingReport.reporter_user_id == uuid.UUID(user_id)
            ).first()
            
            if existing_report:
                return False  # Already reported
            
            # Create report
            report = RatingReport(
                rating_id=uuid.UUID(rating_id),
                reporter_user_id=uuid.UUID(user_id),
                reason=request.reason,
                description=request.description
            )
            
            self.db.add(report)
            self.db.commit()
            
            logger.info(f"Rating {rating_id} reported by user {user_id} for {request.reason.value}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error reporting rating {rating_id}: {e}")
            return False
    
    def moderate_rating(self, rating_id: str, request: ModerationActionRequest, moderator_id: str) -> bool:
        """Moderate a rating (admin/moderator only)"""
        try:
            rating = self.db.query(StoryRating).filter(StoryRating.id == uuid.UUID(rating_id)).first()
            if not rating:
                return False
            
            # Apply moderation action
            if request.action == ModerationAction.APPROVE:
                rating.status = CommentStatus.APPROVED
            elif request.action == ModerationAction.REJECT:
                rating.status = CommentStatus.REJECTED
            elif request.action == ModerationAction.HIDE:
                rating.status = CommentStatus.HIDDEN
            elif request.action == ModerationAction.DELETE:
                # Mark for deletion rather than actually deleting
                rating.status = CommentStatus.REJECTED
            
            # Log moderation action
            log_entry = ModerationLog(
                target_type="rating",
                target_id=rating.id,
                moderator_id=uuid.UUID(moderator_id),
                action=request.action,
                reason=request.reason,
                notes=request.notes
            )
            self.db.add(log_entry)
            
            # Update user moderation status if needed
            if request.action in [ModerationAction.REJECT, ModerationAction.HIDE]:
                self._update_user_moderation_status(rating.user_id, "rating_violation")
            
            self.db.commit()
            
            logger.info(f"Rating {rating_id} moderated by {moderator_id}: {request.action.value}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error moderating rating {rating_id}: {e}")
            return False
    
    def _update_user_moderation_status(self, user_id: uuid.UUID, violation_type: str):
        """Update user moderation status after violation"""
        try:
            status = self.db.query(UserModerationStatus).filter(
                UserModerationStatus.user_id == user_id
            ).first()
            
            if not status:
                status = UserModerationStatus(user_id=user_id)
                self.db.add(status)
            
            if violation_type == "comment_violation":
                status.comment_violations += 1
            elif violation_type == "rating_violation":
                status.rating_violations += 1
            
            # Auto-suspend users with too many violations
            from datetime import timedelta
            total_violations = status.comment_violations + status.rating_violations
            if total_violations >= 5 and not status.is_suspended:
                status.is_suspended = True
                status.suspension_expires_at = datetime.utcnow().replace(hour=23, minute=59, second=59) + timedelta(days=7)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error updating user moderation status: {e}")