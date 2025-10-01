from sqlalchemy.orm import Session
from sqlalchemy import desc, func
from typing import List, Optional
import json
from app.models.notification import Notification, NotificationType
from app.schemas.notification import NotificationCreate, NotificationUpdate, NotificationResponse, NotificationListResponse

class NotificationService:
    def __init__(self, db: Session):
        self.db = db
    
    def create_notification(self, notification_data: NotificationCreate) -> Notification:
        """Create a new notification"""
        db_notification = Notification(**notification_data.model_dump())
        self.db.add(db_notification)
        self.db.commit()
        self.db.refresh(db_notification)
        return db_notification
    
    def get_user_notifications(
        self, 
        user_id: str, 
        skip: int = 0, 
        limit: int = 50,
        unread_only: bool = False
    ) -> NotificationListResponse:
        """Get notifications for a user with pagination"""
        query = self.db.query(Notification).filter(Notification.user_id == user_id)
        
        if unread_only:
            query = query.filter(Notification.is_read == False)
        
        # Get total count
        total = query.count()
        
        # Get unread count
        unread_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
        
        # Get paginated results
        notifications = query.order_by(desc(Notification.created_at)).offset(skip).limit(limit).all()
        
        return NotificationListResponse(
            notifications=[NotificationResponse.model_validate(n) for n in notifications],
            total=total,
            unread_count=unread_count
        )
    
    def mark_as_read(self, notification_id: str, user_id: str) -> Optional[Notification]:
        """Mark a notification as read"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            notification.is_read = True
            self.db.commit()
            self.db.refresh(notification)
        
        return notification
    
    def mark_all_as_read(self, user_id: str) -> int:
        """Mark all notifications as read for a user"""
        updated_count = self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).update({"is_read": True})
        
        self.db.commit()
        return updated_count
    
    def get_unread_count(self, user_id: str) -> int:
        """Get count of unread notifications for a user"""
        return self.db.query(Notification).filter(
            Notification.user_id == user_id,
            Notification.is_read == False
        ).count()
    
    def delete_notification(self, notification_id: str, user_id: str) -> bool:
        """Delete a notification"""
        notification = self.db.query(Notification).filter(
            Notification.id == notification_id,
            Notification.user_id == user_id
        ).first()
        
        if notification:
            self.db.delete(notification)
            self.db.commit()
            return True
        
        return False
    
    # Helper methods for creating specific notification types
    def create_like_notification(self, user_id: str, liker_name: str, comment_id: str, book_title: str, comment_content: str = None, chapter_id: str = None):
        """Create a notification for when someone likes a comment"""
        # Truncate comment if too long
        truncated_comment = None
        if comment_content:
            truncated_comment = comment_content[:100] + "..." if len(comment_content) > 100 else comment_content
        
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.LIKE,
            title="Comment Liked",
            message=f"{liker_name} liked your comment on '{book_title}'",
            comment_id=comment_id,
            chapter_id=chapter_id,
            data=json.dumps({
                "liker_name": liker_name, 
                "book_title": book_title,
                "comment_content": truncated_comment,
                "chapter_id": chapter_id
            })
        )
        return self.create_notification(notification_data)
    
    def create_reply_notification(self, user_id: str, replier_name: str, comment_id: str, book_title: str, original_comment_content: str = None, chapter_id: str = None):
        """Create a notification for when someone replies to a comment"""
        # Truncate original comment if too long
        truncated_comment = None
        if original_comment_content:
            truncated_comment = original_comment_content[:100] + "..." if len(original_comment_content) > 100 else original_comment_content
        
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.REPLY,
            title="New Reply",
            message=f"{replier_name} replied to your comment on '{book_title}'",
            comment_id=comment_id,
            chapter_id=chapter_id,
            data=json.dumps({
                "replier_name": replier_name, 
                "book_title": book_title,
                "original_comment": truncated_comment,
                "chapter_id": chapter_id
            })
        )
        return self.create_notification(notification_data)
    
    def create_purchase_notification(self, user_id: str, book_title: str, book_id: str, amount: int):
        """Create a notification for when someone purchases a book"""
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.PURCHASE,
            title="Book Purchased",
            message=f"You successfully purchased '{book_title}' for {amount} coins",
            book_id=book_id,
            data=json.dumps({"book_title": book_title, "amount": amount})
        )
        return self.create_notification(notification_data)
    
    def create_new_chapter_notification(self, user_id: str, author_name: str, book_title: str, chapter_title: str, book_id: str, chapter_id: str):
        """Create a notification for when a followed author publishes a new chapter"""
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.NEW_CHAPTER,
            title="New Chapter Published",
            message=f"{author_name} published a new chapter '{chapter_title}' in '{book_title}'",
            book_id=book_id,
            chapter_id=chapter_id,
            data=json.dumps({"author_name": author_name, "book_title": book_title, "chapter_title": chapter_title})
        )
        return self.create_notification(notification_data)
    
    def create_review_notification(self, user_id: str, reviewer_name: str, book_title: str, book_id: str, review_id: str, rating: int):
        """Create a notification for when someone reviews a book"""
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.REVIEW,
            title="New Book Review",
            message=f"{reviewer_name} left a {rating}-star review on your book '{book_title}'",
            book_id=book_id,
            review_id=review_id,
            data=json.dumps({"reviewer_name": reviewer_name, "book_title": book_title, "rating": rating})
        )
        return self.create_notification(notification_data)
    
    def create_review_like_notification(self, user_id: str, liker_name: str, book_title: str, review_id: str):
        """Create a notification for when someone likes a review"""
        notification_data = NotificationCreate(
            user_id=user_id,
            type=NotificationType.REVIEW_LIKE,
            title="Review Liked",
            message=f"{liker_name} liked your review of '{book_title}'",
            review_id=review_id,
            data=json.dumps({"liker_name": liker_name, "book_title": book_title})
        )
        return self.create_notification(notification_data)