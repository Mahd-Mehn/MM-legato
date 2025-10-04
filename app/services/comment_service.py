from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func
from fastapi import HTTPException, status

from app.models.community import Comment, CommentLike
from app.models.user import User
from app.models.book import Chapter, Book
from app.schemas.comment import CommentCreate, CommentUpdate, CommentResponse, CommentAuthor

class CommentService:
    def __init__(self, db: Session):
        self.db = db

    def create_comment(self, comment_data: CommentCreate, user_id: UUID) -> CommentResponse:
        """Create a new comment"""
        # Convert UUIDs to strings for database comparison
        chapter_id_str = str(comment_data.chapter_id)
        user_id_str = str(user_id)
        parent_id_str = str(comment_data.parent_id) if comment_data.parent_id else None
        
        # Verify chapter exists
        chapter = self.db.query(Chapter).options(joinedload(Chapter.book)).filter(Chapter.id == chapter_id_str).first()
        if not chapter:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Chapter not found"
            )

        # Get current user info
        current_user = self.db.query(User).filter(User.id == user_id_str).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Verify parent comment exists if provided
        parent_comment = None
        if comment_data.parent_id:
            parent_comment = self.db.query(Comment).options(joinedload(Comment.user)).filter(
                and_(
                    Comment.id == parent_id_str,
                    Comment.chapter_id == chapter_id_str,
                    Comment.is_deleted == False
                )
            ).first()
            if not parent_comment:
                raise HTTPException(
                    status_code=status.HTTP_404_NOT_FOUND,
                    detail="Parent comment not found"
                )

        # Create comment
        comment = Comment(
            chapter_id=chapter_id_str,
            user_id=user_id_str,
            parent_id=parent_id_str,
            content=comment_data.content
        )
        
        self.db.add(comment)
        self.db.commit()
        self.db.refresh(comment)

        # Create notification for reply
        if parent_comment and parent_comment.user_id != user_id_str:
            from app.services.notification_service import NotificationService
            notification_service = NotificationService(self.db)
            notification_service.create_reply_notification(
                user_id=parent_comment.user_id,
                replier_name=current_user.username,
                comment_id=comment.id,
                book_title=chapter.book.title,
                original_comment_content=parent_comment.content,
                chapter_id=str(chapter.id)
            )

        return self._build_comment_response(comment, user_id)

    def get_chapter_comments(
        self, 
        chapter_id: UUID, 
        user_id: Optional[UUID] = None,
        page: int = 1,
        page_size: int = 50
    ) -> List[CommentResponse]:
        """Get comments for a chapter with threading"""
        # Convert UUIDs to strings for database comparison
        chapter_id_str = str(chapter_id)
        user_id_str = str(user_id) if user_id else None
        
        # Get top-level comments (no parent)
        offset = (page - 1) * page_size
        
        top_level_comments = self.db.query(Comment).options(
            joinedload(Comment.user),
            joinedload(Comment.likes)
        ).filter(
            and_(
                Comment.chapter_id == chapter_id_str,
                Comment.parent_id.is_(None),
                Comment.is_deleted == False
            )
        ).order_by(desc(Comment.created_at)).offset(offset).limit(page_size).all()

        # Build response with nested replies
        comment_responses = []
        for comment in top_level_comments:
            comment_response = self._build_comment_response(comment, user_id_str)
            comment_response.replies = self._get_comment_replies(comment.id, user_id_str)
            comment_responses.append(comment_response)

        return comment_responses

    def _get_comment_replies(self, parent_id, user_id: Optional[str] = None) -> List[CommentResponse]:
        """Get replies for a comment recursively"""
        # parent_id is already a string from the database
        replies = self.db.query(Comment).options(
            joinedload(Comment.user),
            joinedload(Comment.likes)
        ).filter(
            and_(
                Comment.parent_id == parent_id,
                Comment.is_deleted == False
            )
        ).order_by(Comment.created_at).all()

        reply_responses = []
        for reply in replies:
            reply_response = self._build_comment_response(reply, user_id)
            reply_response.replies = self._get_comment_replies(reply.id, user_id)
            reply_responses.append(reply_response)

        return reply_responses

    def _build_comment_response(self, comment: Comment, user_id: Optional[str] = None) -> CommentResponse:
        """Build comment response with user interaction flags"""
        # Get the book author to check if commenter is the book author
        chapter = self.db.query(Chapter).options(joinedload(Chapter.book)).filter(
            Chapter.id == comment.chapter_id
        ).first()
        
        is_book_author = False
        if chapter and chapter.book:
            is_book_author = comment.user_id == chapter.book.author_id
        
        # Get author info
        author = CommentAuthor(
            id=comment.user.id,
            username=comment.user.username,
            profile_picture_url=comment.user.profile_picture_url,
            is_writer=comment.user.is_writer,
            is_book_author=is_book_author
        )

        # Check if user liked this comment
        is_liked_by_user = False
        if user_id:
            like = self.db.query(CommentLike).filter(
                and_(
                    CommentLike.comment_id == comment.id,
                    CommentLike.user_id == user_id
                )
            ).first()
            is_liked_by_user = like is not None

        # Check if author of the book liked this comment
        is_liked_by_author = False
        if comment.likes and chapter and chapter.book:
            author_like = self.db.query(CommentLike).filter(
                and_(
                    CommentLike.comment_id == comment.id,
                    CommentLike.user_id == chapter.book.author_id
                )
            ).first()
            is_liked_by_author = author_like is not None

        # Check if user can delete this comment
        can_delete = False
        if user_id:
            # User can delete their own comments
            if comment.user_id == user_id:
                can_delete = True
            else:
                # Or if they're the author of the book
                if chapter and chapter.book and chapter.book.author_id == user_id:
                    can_delete = True

        return CommentResponse(
            id=comment.id,
            chapter_id=comment.chapter_id,
            user_id=comment.user_id,
            parent_id=comment.parent_id,
            content=comment.content,
            like_count=comment.like_count,
            is_reported=comment.is_reported,
            is_deleted=comment.is_deleted,
            created_at=comment.created_at,
            updated_at=comment.updated_at,
            author=author,
            replies=[],  # Will be populated by caller
            is_liked_by_user=is_liked_by_user,
            is_liked_by_author=is_liked_by_author,
            can_delete=can_delete
        )

    def update_comment(self, comment_id: UUID, comment_data: CommentUpdate, user_id: UUID) -> CommentResponse:
        """Update a comment (only by the author)"""
        # Convert UUIDs to strings for database comparison
        comment_id_str = str(comment_id)
        user_id_str = str(user_id)
        
        comment = self.db.query(Comment).filter(
            and_(
                Comment.id == comment_id_str,
                Comment.is_deleted == False
            )
        ).first()
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )

        if comment.user_id != user_id_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only edit your own comments"
            )

        comment.content = comment_data.content
        self.db.commit()
        self.db.refresh(comment)

        return self._build_comment_response(comment, user_id_str)

    def delete_comment(self, comment_id: UUID, user_id: UUID) -> bool:
        """Soft delete a comment"""
        # Convert UUIDs to strings for database comparison
        comment_id_str = str(comment_id)
        user_id_str = str(user_id)
        
        comment = self.db.query(Comment).filter(
            and_(
                Comment.id == comment_id_str,
                Comment.is_deleted == False
            )
        ).first()
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )

        # Check permissions
        can_delete = comment.user_id == user_id_str
        
        # Or if they're the author of the book
        if not can_delete:
            chapter = self.db.query(Chapter).options(joinedload(Chapter.book)).filter(
                Chapter.id == comment.chapter_id
            ).first()
            if chapter and chapter.book and chapter.book.author_id == user_id_str:
                can_delete = True

        if not can_delete:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only delete your own comments or comments on your books"
            )

        comment.is_deleted = True
        self.db.commit()
        return True

    def like_comment(self, comment_id: UUID, user_id: UUID) -> dict:
        """Toggle like on a comment"""
        # Convert UUIDs to strings for database comparison
        comment_id_str = str(comment_id)
        user_id_str = str(user_id)
        
        comment = self.db.query(Comment).options(joinedload(Comment.user)).filter(
            and_(
                Comment.id == comment_id_str,
                Comment.is_deleted == False
            )
        ).first()
        
        if not comment:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Comment not found"
            )

        # Get current user info
        current_user = self.db.query(User).filter(User.id == user_id_str).first()
        if not current_user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        # Get chapter and book info for notification
        chapter = self.db.query(Chapter).options(joinedload(Chapter.book)).filter(
            Chapter.id == comment.chapter_id
        ).first()

        # Check if already liked
        existing_like = self.db.query(CommentLike).filter(
            and_(
                CommentLike.comment_id == comment_id_str,
                CommentLike.user_id == user_id_str
            )
        ).first()

        if existing_like:
            # Unlike
            self.db.delete(existing_like)
            comment.like_count = max(0, comment.like_count - 1)
            is_liked = False
        else:
            # Like
            like = CommentLike(comment_id=comment_id_str, user_id=user_id_str)
            self.db.add(like)
            comment.like_count += 1
            is_liked = True
            
            # Create notification for like (only if liking, not unliking, and not liking own comment)
            if comment.user_id != user_id_str and chapter and chapter.book:
                from app.services.notification_service import NotificationService
                notification_service = NotificationService(self.db)
                notification_service.create_like_notification(
                    user_id=comment.user_id,
                    liker_name=current_user.username,
                    comment_id=comment_id_str,
                    book_title=chapter.book.title,
                    comment_content=comment.content,
                    chapter_id=str(chapter.id)
                )

        self.db.commit()
        
        return {
            "comment_id": comment_id_str,
            "is_liked": is_liked,
            "like_count": comment.like_count
        }

    def report_comment(self, comment_id: UUID, reason: str, user_id: UUID, description: str = None) -> bool:
        """Report a comment for moderation - now delegates to ModerationService"""
        from app.services.moderation_service import ModerationService
        
        moderation_service = ModerationService(self.db)
        try:
            moderation_service.report_comment(comment_id, user_id, reason, description)
            return True
        except HTTPException:
            raise

    def get_comment_count(self, chapter_id: UUID) -> int:
        """Get total comment count for a chapter"""
        # Convert UUID to string for database comparison
        chapter_id_str = str(chapter_id)
        
        return self.db.query(func.count(Comment.id)).filter(
            and_(
                Comment.chapter_id == chapter_id_str,
                Comment.is_deleted == False
            )
        ).scalar() or 0