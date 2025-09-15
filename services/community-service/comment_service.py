"""
Comment service for handling comment operations
"""
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, desc, asc, func
from typing import List, Optional, Tuple, Dict, Any
from datetime import datetime
import uuid
import logging

from models import (
    Comment, CommentReaction, CommentReport, ModerationLog, 
    UserModerationStatus, CommentStatus, ReportReason, 
    ReportStatus, ModerationAction
)
from schemas import (
    CommentCreateRequest, CommentUpdateRequest, CommentFilterRequest,
    ReactionRequest, ReportCreateRequest, ModerationActionRequest
)

logger = logging.getLogger(__name__)

class CommentService:
    """Service for comment operations"""
    
    def __init__(self, db: Session):
        self.db = db
    
    def create_comment(self, request: CommentCreateRequest, user_id: str) -> Comment:
        """Create a new comment"""
        try:
            # Validate parent comment if provided
            parent_comment = None
            thread_root_id = None
            reply_depth = 0
            
            if request.parent_comment_id:
                parent_comment = self.db.query(Comment).filter(
                    Comment.id == uuid.UUID(request.parent_comment_id),
                    Comment.status.in_([CommentStatus.APPROVED, CommentStatus.PENDING])
                ).first()
                
                if not parent_comment:
                    raise ValueError("Parent comment not found or not accessible")
                
                # Check if parent belongs to same chapter
                if str(parent_comment.chapter_id) != request.chapter_id:
                    raise ValueError("Parent comment must be from the same chapter")
                
                # Set threading information
                thread_root_id = parent_comment.thread_root_id or parent_comment.id
                reply_depth = parent_comment.reply_depth + 1
                
                # Limit reply depth to prevent excessive nesting
                if reply_depth > 5:
                    raise ValueError("Maximum reply depth exceeded")
            
            # Create comment
            comment = Comment(
                story_id=uuid.UUID(request.story_id),
                chapter_id=uuid.UUID(request.chapter_id),
                user_id=uuid.UUID(user_id),
                parent_comment_id=uuid.UUID(request.parent_comment_id) if request.parent_comment_id else None,
                thread_root_id=thread_root_id,
                reply_depth=reply_depth,
                content=request.content,
                is_spoiler=request.is_spoiler,
                status=CommentStatus.PENDING  # All comments start as pending
            )
            
            self.db.add(comment)
            self.db.commit()
            self.db.refresh(comment)
            
            # Update parent comment reply count
            if parent_comment:
                parent_comment.reply_count += 1
                self.db.commit()
            
            logger.info(f"Comment created: {comment.id} by user {user_id}")
            return comment
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error creating comment: {e}")
            raise
    
    def get_comment(self, comment_id: str, user_id: Optional[str] = None) -> Optional[Comment]:
        """Get a comment by ID with user reaction if user_id provided"""
        try:
            query = self.db.query(Comment).filter(Comment.id == uuid.UUID(comment_id))
            
            if user_id:
                query = query.options(
                    joinedload(Comment.reactions).filter(
                        CommentReaction.user_id == uuid.UUID(user_id)
                    )
                )
            
            comment = query.first()
            return comment
            
        except Exception as e:
            logger.error(f"Error getting comment {comment_id}: {e}")
            return None
    
    def update_comment(self, comment_id: str, request: CommentUpdateRequest, user_id: str) -> Optional[Comment]:
        """Update a comment (only by the author)"""
        try:
            comment = self.db.query(Comment).filter(
                Comment.id == uuid.UUID(comment_id),
                Comment.user_id == uuid.UUID(user_id)
            ).first()
            
            if not comment:
                return None
            
            # Only allow updates to pending or approved comments
            if comment.status not in [CommentStatus.PENDING, CommentStatus.APPROVED]:
                raise ValueError("Cannot update comment with current status")
            
            # Update fields
            if request.content is not None:
                comment.content = request.content
                comment.updated_at = datetime.utcnow()
            
            if request.is_spoiler is not None:
                comment.is_spoiler = request.is_spoiler
            
            self.db.commit()
            self.db.refresh(comment)
            
            logger.info(f"Comment updated: {comment_id} by user {user_id}")
            return comment
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error updating comment {comment_id}: {e}")
            raise
    
    def delete_comment(self, comment_id: str, user_id: str) -> bool:
        """Delete a comment (only by the author)"""
        try:
            comment = self.db.query(Comment).filter(
                Comment.id == uuid.UUID(comment_id),
                Comment.user_id == uuid.UUID(user_id)
            ).first()
            
            if not comment:
                return False
            
            # Update parent reply count if this is a reply
            if comment.parent_comment_id:
                parent = self.db.query(Comment).filter(
                    Comment.id == comment.parent_comment_id
                ).first()
                if parent and parent.reply_count > 0:
                    parent.reply_count -= 1
            
            # Delete the comment (cascade will handle reactions and reports)
            self.db.delete(comment)
            self.db.commit()
            
            logger.info(f"Comment deleted: {comment_id} by user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error deleting comment {comment_id}: {e}")
            return False
    
    def get_comments(self, filters: CommentFilterRequest, user_id: Optional[str] = None) -> Tuple[List[Comment], int]:
        """Get comments with filtering and pagination"""
        try:
            query = self.db.query(Comment)
            
            # Apply filters
            if filters.story_id:
                query = query.filter(Comment.story_id == uuid.UUID(filters.story_id))
            
            if filters.chapter_id:
                query = query.filter(Comment.chapter_id == uuid.UUID(filters.chapter_id))
            
            if filters.user_id:
                query = query.filter(Comment.user_id == uuid.UUID(filters.user_id))
            
            if filters.status:
                query = query.filter(Comment.status == filters.status)
            else:
                # Default to showing approved comments only
                query = query.filter(Comment.status == CommentStatus.APPROVED)
            
            if filters.is_spoiler is not None:
                query = query.filter(Comment.is_spoiler == filters.is_spoiler)
            
            if filters.parent_comment_id:
                query = query.filter(Comment.parent_comment_id == uuid.UUID(filters.parent_comment_id))
            elif filters.parent_comment_id is None and filters.chapter_id:
                # Show only root comments if no parent specified and chapter is specified
                query = query.filter(Comment.parent_comment_id.is_(None))
            
            # Get total count
            total = query.count()
            
            # Apply sorting
            if filters.sort_by == "created_at":
                order_col = Comment.created_at
            elif filters.sort_by == "like_count":
                order_col = Comment.like_count
            elif filters.sort_by == "reply_count":
                order_col = Comment.reply_count
            else:
                order_col = Comment.created_at
            
            if filters.sort_order == "asc":
                query = query.order_by(asc(order_col))
            else:
                query = query.order_by(desc(order_col))
            
            # Apply pagination
            offset = (filters.page - 1) * filters.per_page
            comments = query.offset(offset).limit(filters.per_page).all()
            
            return comments, total
            
        except Exception as e:
            logger.error(f"Error getting comments: {e}")
            return [], 0
    
    def get_comment_thread(self, root_comment_id: str, user_id: Optional[str] = None) -> Optional[Comment]:
        """Get a comment thread with nested replies"""
        try:
            # Get root comment
            root_comment = self.db.query(Comment).filter(
                Comment.id == uuid.UUID(root_comment_id),
                Comment.status == CommentStatus.APPROVED
            ).first()
            
            if not root_comment:
                return None
            
            # Get all replies in the thread
            thread_id = root_comment.thread_root_id or root_comment.id
            replies = self.db.query(Comment).filter(
                Comment.thread_root_id == thread_id,
                Comment.status == CommentStatus.APPROVED
            ).order_by(Comment.created_at).all()
            
            # Build nested structure (simplified - in production, you'd want proper tree building)
            return root_comment
            
        except Exception as e:
            logger.error(f"Error getting comment thread {root_comment_id}: {e}")
            return None
    
    def react_to_comment(self, comment_id: str, request: ReactionRequest, user_id: str) -> bool:
        """Add or update a reaction to a comment"""
        try:
            comment = self.db.query(Comment).filter(
                Comment.id == uuid.UUID(comment_id),
                Comment.status == CommentStatus.APPROVED
            ).first()
            
            if not comment:
                return False
            
            # Check for existing reaction
            existing_reaction = self.db.query(CommentReaction).filter(
                CommentReaction.comment_id == uuid.UUID(comment_id),
                CommentReaction.user_id == uuid.UUID(user_id)
            ).first()
            
            if existing_reaction:
                # Update existing reaction
                old_is_like = existing_reaction.is_like
                existing_reaction.is_like = request.is_like
                existing_reaction.updated_at = datetime.utcnow()
                
                # Update comment counts
                if old_is_like != request.is_like:
                    if old_is_like:
                        comment.like_count = max(0, comment.like_count - 1)
                        comment.dislike_count += 1
                    else:
                        comment.dislike_count = max(0, comment.dislike_count - 1)
                        comment.like_count += 1
            else:
                # Create new reaction
                reaction = CommentReaction(
                    comment_id=uuid.UUID(comment_id),
                    user_id=uuid.UUID(user_id),
                    is_like=request.is_like
                )
                self.db.add(reaction)
                
                # Update comment counts
                if request.is_like:
                    comment.like_count += 1
                else:
                    comment.dislike_count += 1
            
            self.db.commit()
            logger.info(f"Reaction added to comment {comment_id} by user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error reacting to comment {comment_id}: {e}")
            return False
    
    def remove_reaction(self, comment_id: str, user_id: str) -> bool:
        """Remove a user's reaction from a comment"""
        try:
            reaction = self.db.query(CommentReaction).filter(
                CommentReaction.comment_id == uuid.UUID(comment_id),
                CommentReaction.user_id == uuid.UUID(user_id)
            ).first()
            
            if not reaction:
                return False
            
            # Update comment counts
            comment = self.db.query(Comment).filter(Comment.id == uuid.UUID(comment_id)).first()
            if comment:
                if reaction.is_like:
                    comment.like_count = max(0, comment.like_count - 1)
                else:
                    comment.dislike_count = max(0, comment.dislike_count - 1)
            
            self.db.delete(reaction)
            self.db.commit()
            
            logger.info(f"Reaction removed from comment {comment_id} by user {user_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error removing reaction from comment {comment_id}: {e}")
            return False
    
    def report_comment(self, comment_id: str, request: ReportCreateRequest, user_id: str) -> bool:
        """Report a comment for moderation"""
        try:
            comment = self.db.query(Comment).filter(Comment.id == uuid.UUID(comment_id)).first()
            if not comment:
                return False
            
            # Check if user already reported this comment
            existing_report = self.db.query(CommentReport).filter(
                CommentReport.comment_id == uuid.UUID(comment_id),
                CommentReport.reporter_user_id == uuid.UUID(user_id)
            ).first()
            
            if existing_report:
                return False  # Already reported
            
            # Create report
            report = CommentReport(
                comment_id=uuid.UUID(comment_id),
                reporter_user_id=uuid.UUID(user_id),
                reason=request.reason,
                description=request.description
            )
            
            self.db.add(report)
            
            # Update comment report count
            comment.report_count += 1
            
            # Auto-flag comment if it has too many reports
            if comment.report_count >= 5 and comment.status == CommentStatus.APPROVED:
                comment.status = CommentStatus.FLAGGED
            
            self.db.commit()
            
            logger.info(f"Comment {comment_id} reported by user {user_id} for {request.reason.value}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error reporting comment {comment_id}: {e}")
            return False
    
    def moderate_comment(self, comment_id: str, request: ModerationActionRequest, moderator_id: str) -> bool:
        """Moderate a comment (admin/moderator only)"""
        try:
            comment = self.db.query(Comment).filter(Comment.id == uuid.UUID(comment_id)).first()
            if not comment:
                return False
            
            # Apply moderation action
            if request.action == ModerationAction.APPROVE:
                comment.status = CommentStatus.APPROVED
            elif request.action == ModerationAction.REJECT:
                comment.status = CommentStatus.REJECTED
            elif request.action == ModerationAction.HIDE:
                comment.status = CommentStatus.HIDDEN
            elif request.action == ModerationAction.DELETE:
                # Mark for deletion rather than actually deleting
                comment.status = CommentStatus.REJECTED
            
            comment.moderated_by = uuid.UUID(moderator_id)
            comment.moderated_at = datetime.utcnow()
            comment.moderation_reason = request.reason
            
            # Log moderation action
            log_entry = ModerationLog(
                target_type="comment",
                target_id=comment.id,
                moderator_id=uuid.UUID(moderator_id),
                action=request.action,
                reason=request.reason,
                notes=request.notes
            )
            self.db.add(log_entry)
            
            # Update user moderation status if needed
            if request.action in [ModerationAction.REJECT, ModerationAction.HIDE]:
                self._update_user_moderation_status(comment.user_id, "comment_violation")
            
            self.db.commit()
            
            logger.info(f"Comment {comment_id} moderated by {moderator_id}: {request.action.value}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error moderating comment {comment_id}: {e}")
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
            total_violations = status.comment_violations + status.rating_violations
            if total_violations >= 5 and not status.is_suspended:
                status.is_suspended = True
                status.suspension_expires_at = datetime.utcnow().replace(hour=23, minute=59, second=59) + timedelta(days=7)
            
            self.db.commit()
            
        except Exception as e:
            logger.error(f"Error updating user moderation status: {e}")
    
    def pin_comment(self, comment_id: str, story_id: str, author_id: str) -> bool:
        """Pin a comment (story author only)"""
        try:
            comment = self.db.query(Comment).filter(
                Comment.id == uuid.UUID(comment_id),
                Comment.story_id == uuid.UUID(story_id),
                Comment.status == CommentStatus.APPROVED
            ).first()
            
            if not comment:
                return False
            
            # Toggle pin status
            comment.is_pinned = not comment.is_pinned
            self.db.commit()
            
            logger.info(f"Comment {comment_id} pin status changed by author {author_id}")
            return True
            
        except Exception as e:
            self.db.rollback()
            logger.error(f"Error pinning comment {comment_id}: {e}")
            return False