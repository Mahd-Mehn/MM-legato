from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, desc, func, or_
from fastapi import HTTPException, status
from datetime import datetime
import json

from app.models.community import (
    Comment, CommentReport, ModerationLog, 
    ReportReason, ReportStatus, ModerationAction
)
from app.models.user import User
from app.models.book import Chapter, Book
from app.schemas.comment import (
    CommentReportResponse, ModerationLogResponse, 
    ModerationDashboardResponse, CommentResponse, CommentAuthor
)

class ModerationService:
    def __init__(self, db: Session):
        self.db = db

    def report_comment(
        self, 
        comment_id: UUID, 
        reporter_id: UUID, 
        reason: str, 
        description: Optional[str] = None
    ) -> CommentReportResponse:
        """Report a comment for moderation"""
        # Convert UUIDs to strings for database comparison
        comment_id_str = str(comment_id)
        reporter_id_str = str(reporter_id)
        
        # Verify comment exists and is not deleted
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

        # Check if user already reported this comment
        existing_report = self.db.query(CommentReport).filter(
            and_(
                CommentReport.comment_id == comment_id_str,
                CommentReport.reporter_id == reporter_id_str
            )
        ).first()
        
        if existing_report:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You have already reported this comment"
            )

        # Validate reason
        try:
            report_reason = ReportReason(reason.lower())
        except ValueError:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid report reason. Must be one of: {[r.value for r in ReportReason]}"
            )

        # Create report
        report = CommentReport(
            comment_id=comment_id_str,
            reporter_id=reporter_id_str,
            reason=report_reason,
            description=description,
            status=ReportStatus.PENDING
        )
        
        self.db.add(report)
        
        # Mark comment as reported
        comment.is_reported = True
        
        self.db.commit()
        self.db.refresh(report)

        return self._build_report_response(report)

    def get_pending_reports(
        self, 
        moderator_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> List[CommentReportResponse]:
        """Get pending reports for moderation (only for book authors)"""
        moderator_id_str = str(moderator_id)
        
        # Get books authored by the moderator
        authored_books = self.db.query(Book.id).filter(
            Book.author_id == moderator_id_str
        ).subquery()
        
        # Get chapters from those books
        authored_chapters = self.db.query(Chapter.id).filter(
            Chapter.book_id.in_(self.db.query(authored_books.c.id))
        ).subquery()
        
        # Get reports for comments on those chapters
        offset = (page - 1) * page_size
        
        reports = self.db.query(CommentReport).options(
            joinedload(CommentReport.comment).joinedload(Comment.user),
            joinedload(CommentReport.reporter)
        ).join(Comment).filter(
            and_(
                CommentReport.status == ReportStatus.PENDING,
                Comment.chapter_id.in_(self.db.query(authored_chapters.c.id))
            )
        ).order_by(desc(CommentReport.created_at)).offset(offset).limit(page_size).all()

        return [self._build_report_response(report) for report in reports]

    def get_moderation_dashboard(self, moderator_id: UUID) -> ModerationDashboardResponse:
        """Get moderation dashboard data for a book author"""
        moderator_id_str = str(moderator_id)
        
        # Get books authored by the moderator
        authored_books = self.db.query(Book.id).filter(
            Book.author_id == moderator_id_str
        ).subquery()
        
        # Get chapters from those books
        authored_chapters = self.db.query(Chapter.id).filter(
            Chapter.book_id.in_(self.db.query(authored_books.c.id))
        ).subquery()
        
        # Get pending reports count
        total_pending = self.db.query(func.count(CommentReport.id)).join(Comment).filter(
            and_(
                CommentReport.status == ReportStatus.PENDING,
                Comment.chapter_id.in_(self.db.query(authored_chapters.c.id))
            )
        ).scalar() or 0
        
        # Get recent pending reports (last 5)
        pending_reports = self.db.query(CommentReport).options(
            joinedload(CommentReport.comment).joinedload(Comment.user),
            joinedload(CommentReport.reporter)
        ).join(Comment).filter(
            and_(
                CommentReport.status == ReportStatus.PENDING,
                Comment.chapter_id.in_(self.db.query(authored_chapters.c.id))
            )
        ).order_by(desc(CommentReport.created_at)).limit(5).all()
        
        # Get recent moderation actions (last 5)
        recent_actions = self.db.query(ModerationLog).options(
            joinedload(ModerationLog.moderator)
        ).filter(
            ModerationLog.moderator_id == moderator_id_str
        ).order_by(desc(ModerationLog.created_at)).limit(5).all()
        
        # Get resolved reports count for today
        today = datetime.now().date()
        total_resolved_today = self.db.query(func.count(CommentReport.id)).filter(
            and_(
                CommentReport.reviewed_by == moderator_id_str,
                CommentReport.status.in_([ReportStatus.RESOLVED, ReportStatus.DISMISSED]),
                func.date(CommentReport.updated_at) == today
            )
        ).scalar() or 0

        return ModerationDashboardResponse(
            pending_reports=[self._build_report_response(report) for report in pending_reports],
            recent_actions=[self._build_log_response(log) for log in recent_actions],
            total_pending=total_pending,
            total_resolved_today=total_resolved_today
        )

    def resolve_report(
        self, 
        report_id: UUID, 
        moderator_id: UUID, 
        action: str,
        resolution_notes: Optional[str] = None
    ) -> CommentReportResponse:
        """Resolve a comment report"""
        report_id_str = str(report_id)
        moderator_id_str = str(moderator_id)
        
        # Get the report with related data
        report = self.db.query(CommentReport).options(
            joinedload(CommentReport.comment).joinedload(Comment.chapter).joinedload(Chapter.book)
        ).filter(CommentReport.id == report_id_str).first()
        
        if not report:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Report not found"
            )

        # Verify moderator is the book author
        if report.comment.chapter.book.author_id != moderator_id_str:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only moderate reports on your own books"
            )

        # Validate action
        if action not in ['delete_comment', 'dismiss_report']:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid action. Must be 'delete_comment' or 'dismiss_report'"
            )

        # Update report status
        report.status = ReportStatus.RESOLVED if action == 'delete_comment' else ReportStatus.DISMISSED
        report.reviewed_by = moderator_id_str
        report.reviewed_at = datetime.now().isoformat()
        report.resolution_notes = resolution_notes

        # Perform the action
        if action == 'delete_comment':
            report.comment.is_deleted = True
            moderation_action = ModerationAction.DELETE_COMMENT
        else:
            moderation_action = ModerationAction.DISMISS_REPORT

        # Create moderation log
        log_entry = ModerationLog(
            moderator_id=moderator_id_str,
            action=moderation_action,
            target_type='comment' if action == 'delete_comment' else 'report',
            target_id=str(report.comment.id) if action == 'delete_comment' else report_id_str,
            reason=resolution_notes,
            details=json.dumps({
                'report_id': report_id_str,
                'comment_id': str(report.comment.id),
                'original_reason': report.reason.value,
                'reporter_id': str(report.reporter_id)
            })
        )
        
        self.db.add(log_entry)
        self.db.commit()
        self.db.refresh(report)

        return self._build_report_response(report)

    def get_moderation_logs(
        self, 
        moderator_id: UUID,
        page: int = 1,
        page_size: int = 20
    ) -> List[ModerationLogResponse]:
        """Get moderation logs for a moderator"""
        moderator_id_str = str(moderator_id)
        offset = (page - 1) * page_size
        
        logs = self.db.query(ModerationLog).options(
            joinedload(ModerationLog.moderator)
        ).filter(
            ModerationLog.moderator_id == moderator_id_str
        ).order_by(desc(ModerationLog.created_at)).offset(offset).limit(page_size).all()

        return [self._build_log_response(log) for log in logs]

    def _build_report_response(self, report: CommentReport) -> CommentReportResponse:
        """Build report response with related data"""
        # Build comment response if needed
        comment_response = None
        if report.comment:
            # Get the book author to check if commenter is the book author
            chapter = self.db.query(Chapter).options(joinedload(Chapter.book)).filter(
                Chapter.id == report.comment.chapter_id
            ).first()
            
            is_book_author = False
            if chapter and chapter.book:
                is_book_author = report.comment.user_id == chapter.book.author_id
            
            author = CommentAuthor(
                id=report.comment.user.id,
                username=report.comment.user.username,
                profile_picture_url=report.comment.user.profile_picture_url,
                is_writer=report.comment.user.is_writer,
                is_book_author=is_book_author
            )

            comment_response = CommentResponse(
                id=report.comment.id,
                chapter_id=report.comment.chapter_id,
                user_id=report.comment.user_id,
                parent_id=report.comment.parent_id,
                content=report.comment.content,
                like_count=report.comment.like_count,
                is_reported=report.comment.is_reported,
                is_deleted=report.comment.is_deleted,
                created_at=report.comment.created_at,
                updated_at=report.comment.updated_at,
                author=author,
                replies=[],
                is_liked_by_user=False,
                is_liked_by_author=False,
                can_delete=False
            )

        return CommentReportResponse(
            id=report.id,
            comment_id=report.comment_id,
            reporter_id=report.reporter_id,
            reason=report.reason.value,
            description=report.description,
            status=report.status.value,
            reviewed_by=report.reviewed_by,
            reviewed_at=report.reviewed_at,
            resolution_notes=report.resolution_notes,
            created_at=report.created_at,
            updated_at=report.updated_at,
            comment=comment_response,
            reporter_username=report.reporter.username if report.reporter else None,
            reviewer_username=report.reviewer.username if report.reviewer else None
        )

    def _build_log_response(self, log: ModerationLog) -> ModerationLogResponse:
        """Build moderation log response"""
        return ModerationLogResponse(
            id=log.id,
            moderator_id=log.moderator_id,
            action=log.action.value,
            target_type=log.target_type,
            target_id=log.target_id,
            reason=log.reason,
            details=log.details,
            created_at=log.created_at,
            moderator_username=log.moderator.username if log.moderator else None
        )