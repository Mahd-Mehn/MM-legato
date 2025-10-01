from datetime import datetime, date, timedelta
from typing import List, Dict, Any, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, desc
from app.models.analytics import BookView, ChapterView, WriterEarnings
from app.models.book import Book, Chapter
from app.models.payment import Transaction
from app.models.user import User

class AnalyticsService:
    def __init__(self, db: Session):
        self.db = db
    
    def track_book_view(self, book_id: str, user_id: Optional[str] = None):
        """Track a book view"""
        view = BookView(
            book_id=book_id,
            user_id=user_id
        )
        self.db.add(view)
        self.db.commit()
        return view
    
    def track_chapter_view(self, chapter_id: str, book_id: str, user_id: Optional[str] = None):
        """Track a chapter view"""
        view = ChapterView(
            chapter_id=chapter_id,
            book_id=book_id,
            user_id=user_id
        )
        self.db.add(view)
        self.db.commit()
        return view
    
    def record_earning(self, writer_id: str, book_id: str, transaction_id: str, 
                      amount: int, chapter_id: Optional[str] = None):
        """Record writer earnings from a purchase"""
        earning = WriterEarnings(
            writer_id=writer_id,
            book_id=book_id,
            chapter_id=chapter_id,
            transaction_id=transaction_id,
            amount=amount
        )
        self.db.add(earning)
        self.db.commit()
        return earning
    
    @staticmethod
    def record_purchase_earning(db: Session, transaction_id: str):
        """
        Static method to record earnings when a purchase transaction is completed.
        This should be called from payment webhooks or purchase completion endpoints.
        """
        # Get transaction details
        transaction = db.query(Transaction).filter(Transaction.id == transaction_id).first()
        if not transaction or transaction.transaction_type != 'purchase':
            return None
        
        # Get book details to find the author
        book = db.query(Book).filter(Book.id == transaction.book_id).first()
        if not book:
            return None
        
        # Create analytics service and record earning
        analytics_service = AnalyticsService(db)
        return analytics_service.record_earning(
            writer_id=book.author_id,
            book_id=transaction.book_id,
            chapter_id=transaction.chapter_id,
            transaction_id=transaction.id,
            amount=transaction.amount
        )
    
    def get_writer_analytics(self, writer_id: str, start_date: Optional[date] = None, 
                           end_date: Optional[date] = None) -> Dict[str, Any]:
        """Get comprehensive analytics for a writer"""
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Get writer's books
        books = self.db.query(Book).filter(Book.author_id == writer_id).all()
        book_ids = [book.id for book in books]
        
        if not book_ids:
            return self._empty_analytics()
        
        # Book views
        book_views = self.db.query(
            BookView.book_id,
            func.count(BookView.id).label('view_count'),
            func.count(func.distinct(BookView.user_id)).label('unique_viewers')
        ).filter(
            and_(
                BookView.book_id.in_(book_ids),
                BookView.view_date >= start_date,
                BookView.view_date <= end_date
            )
        ).group_by(BookView.book_id).all()
        
        # Chapter views
        chapter_views = self.db.query(
            ChapterView.book_id,
            ChapterView.chapter_id,
            func.count(ChapterView.id).label('view_count')
        ).filter(
            and_(
                ChapterView.book_id.in_(book_ids),
                ChapterView.view_date >= start_date,
                ChapterView.view_date <= end_date
            )
        ).group_by(ChapterView.book_id, ChapterView.chapter_id).all()
        
        # Earnings
        earnings = self.db.query(
            WriterEarnings.book_id,
            func.sum(WriterEarnings.amount).label('total_earnings'),
            func.count(WriterEarnings.id).label('purchase_count')
        ).filter(
            and_(
                WriterEarnings.writer_id == writer_id,
                WriterEarnings.earning_date >= start_date,
                WriterEarnings.earning_date <= end_date
            )
        ).group_by(WriterEarnings.book_id).all()
        
        # Daily earnings for chart
        daily_earnings = self.db.query(
            WriterEarnings.earning_date,
            func.sum(WriterEarnings.amount).label('daily_total')
        ).filter(
            and_(
                WriterEarnings.writer_id == writer_id,
                WriterEarnings.earning_date >= start_date,
                WriterEarnings.earning_date <= end_date
            )
        ).group_by(WriterEarnings.earning_date).order_by(WriterEarnings.earning_date).all()
        
        # Process data for response
        book_analytics = {}
        for book in books:
            book_analytics[book.id] = {
                'book_id': book.id,
                'title': book.title,
                'views': 0,
                'unique_viewers': 0,
                'chapter_views': {},
                'earnings': 0,
                'purchases': 0
            }
        
        # Add view data
        for view in book_views:
            if view.book_id in book_analytics:
                book_analytics[view.book_id]['views'] = view.view_count
                book_analytics[view.book_id]['unique_viewers'] = view.unique_viewers
        
        # Add chapter view data
        for view in chapter_views:
            if view.book_id in book_analytics:
                book_analytics[view.book_id]['chapter_views'][view.chapter_id] = view.view_count
        
        # Add earnings data
        for earning in earnings:
            if earning.book_id in book_analytics:
                book_analytics[earning.book_id]['earnings'] = earning.total_earnings or 0
                book_analytics[earning.book_id]['purchases'] = earning.purchase_count or 0
        
        # Calculate totals
        total_views = sum(book['views'] for book in book_analytics.values())
        total_earnings = sum(book['earnings'] for book in book_analytics.values())
        total_purchases = sum(book['purchases'] for book in book_analytics.values())
        
        return {
            'summary': {
                'total_views': total_views,
                'total_earnings': total_earnings,
                'total_purchases': total_purchases,
                'total_books': len(books),
                'date_range': {
                    'start_date': start_date.isoformat(),
                    'end_date': end_date.isoformat()
                }
            },
            'books': list(book_analytics.values()),
            'daily_earnings': [
                {
                    'date': earning.earning_date.isoformat(),
                    'amount': earning.daily_total
                }
                for earning in daily_earnings
            ]
        }
    
    def get_book_analytics(self, book_id: str, start_date: Optional[date] = None, 
                          end_date: Optional[date] = None) -> Dict[str, Any]:
        """Get detailed analytics for a specific book"""
        if not start_date:
            start_date = date.today() - timedelta(days=30)
        if not end_date:
            end_date = date.today()
        
        # Get book details
        book = self.db.query(Book).filter(Book.id == book_id).first()
        if not book:
            return {}
        
        # Get chapters
        chapters = self.db.query(Chapter).filter(Chapter.book_id == book_id).all()
        
        # Book views over time
        daily_views = self.db.query(
            BookView.view_date,
            func.count(BookView.id).label('view_count'),
            func.count(func.distinct(BookView.user_id)).label('unique_viewers')
        ).filter(
            and_(
                BookView.book_id == book_id,
                BookView.view_date >= start_date,
                BookView.view_date <= end_date
            )
        ).group_by(BookView.view_date).order_by(BookView.view_date).all()
        
        # Chapter analytics
        chapter_analytics = self.db.query(
            Chapter.id,
            Chapter.title,
            Chapter.chapter_number,
            func.count(ChapterView.id).label('view_count')
        ).outerjoin(
            ChapterView,
            and_(
                ChapterView.chapter_id == Chapter.id,
                ChapterView.view_date >= start_date,
                ChapterView.view_date <= end_date
            )
        ).filter(Chapter.book_id == book_id).group_by(
            Chapter.id, Chapter.title, Chapter.chapter_number
        ).order_by(Chapter.chapter_number).all()
        
        # Earnings for this book
        earnings = self.db.query(
            func.sum(WriterEarnings.amount).label('total_earnings'),
            func.count(WriterEarnings.id).label('purchase_count')
        ).filter(
            and_(
                WriterEarnings.book_id == book_id,
                WriterEarnings.earning_date >= start_date,
                WriterEarnings.earning_date <= end_date
            )
        ).first()
        
        return {
            'book': {
                'id': book.id,
                'title': book.title,
                'description': book.description,
                'pricing_model': book.pricing_model,
                'fixed_price': book.fixed_price,
                'per_chapter_price': book.per_chapter_price
            },
            'summary': {
                'total_earnings': earnings.total_earnings or 0 if earnings else 0,
                'total_purchases': earnings.purchase_count or 0 if earnings else 0,
                'total_chapters': len(chapters)
            },
            'daily_views': [
                {
                    'date': view.view_date.isoformat(),
                    'views': view.view_count,
                    'unique_viewers': view.unique_viewers
                }
                for view in daily_views
            ],
            'chapters': [
                {
                    'id': chapter.id,
                    'title': chapter.title,
                    'chapter_number': chapter.chapter_number,
                    'views': chapter.view_count or 0
                }
                for chapter in chapter_analytics
            ]
        }
    
    def _empty_analytics(self) -> Dict[str, Any]:
        """Return empty analytics structure"""
        return {
            'summary': {
                'total_views': 0,
                'total_earnings': 0,
                'total_purchases': 0,
                'total_books': 0,
                'date_range': {
                    'start_date': date.today().isoformat(),
                    'end_date': date.today().isoformat()
                }
            },
            'books': [],
            'daily_earnings': []
        }