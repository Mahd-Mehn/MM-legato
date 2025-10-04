from datetime import date, datetime
from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user, get_current_user_optional
from app.models.user import User
from app.services.analytics_service import AnalyticsService
import csv
import io

router = APIRouter()

@router.get("/writer/overview")
async def get_writer_analytics_overview(
    start_date: Optional[date] = Query(None, description="Start date for analytics (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for analytics (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get writer analytics overview with summary and book-level data"""
    if not current_user.is_writer:
        raise HTTPException(status_code=403, detail="Only writers can access analytics")
    
    analytics_service = AnalyticsService(db)
    analytics = analytics_service.get_writer_analytics(
        writer_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    
    return analytics

@router.get("/book/{book_id}")
async def get_book_analytics(
    book_id: str,
    start_date: Optional[date] = Query(None, description="Start date for analytics (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for analytics (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get detailed analytics for a specific book"""
    if not current_user.is_writer:
        raise HTTPException(status_code=403, detail="Only writers can access analytics")
    
    # Verify book ownership
    from app.models.book import Book
    book = db.query(Book).filter(Book.id == book_id, Book.author_id == current_user.id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found or not owned by user")
    
    analytics_service = AnalyticsService(db)
    analytics = analytics_service.get_book_analytics(
        book_id=book_id,
        start_date=start_date,
        end_date=end_date
    )
    
    return analytics

@router.post("/track/book-view/{book_id}")
async def track_book_view(
    book_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Track a book view (can be called by anonymous users)"""
    # Verify book exists
    from app.models.book import Book
    book = db.query(Book).filter(Book.id == book_id).first()
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    analytics_service = AnalyticsService(db)
    user_id = current_user.id if current_user else None
    view = analytics_service.track_book_view(book_id=book_id, user_id=user_id)
    
    return {"message": "View tracked successfully", "view_id": view.id}

@router.post("/track/chapter-view/{chapter_id}")
async def track_chapter_view(
    chapter_id: str,
    current_user: Optional[User] = Depends(get_current_user_optional),
    db: Session = Depends(get_db)
):
    """Track a chapter view (can be called by anonymous users)"""
    # Verify chapter exists and get book_id
    from app.models.book import Chapter
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    analytics_service = AnalyticsService(db)
    user_id = current_user.id if current_user else None
    view = analytics_service.track_chapter_view(
        chapter_id=chapter_id, 
        book_id=chapter.book_id, 
        user_id=user_id
    )
    
    return {"message": "View tracked successfully", "view_id": view.id}

@router.get("/export/earnings")
async def export_earnings_report(
    start_date: Optional[date] = Query(None, description="Start date for report (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for report (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export earnings report as CSV"""
    if not current_user.is_writer:
        raise HTTPException(status_code=403, detail="Only writers can export earnings")
    
    analytics_service = AnalyticsService(db)
    analytics = analytics_service.get_writer_analytics(
        writer_id=current_user.id,
        start_date=start_date,
        end_date=end_date
    )
    
    # Create CSV content
    output = io.StringIO()
    writer = csv.writer(output)
    
    # Write headers
    writer.writerow([
        'Date Range', 
        f"{analytics['summary']['date_range']['start_date']} to {analytics['summary']['date_range']['end_date']}"
    ])
    writer.writerow([])  # Empty row
    writer.writerow(['Book Title', 'Views', 'Unique Viewers', 'Purchases', 'Earnings (Coins)'])
    
    # Write book data
    for book in analytics['books']:
        writer.writerow([
            book['title'],
            book['views'],
            book['unique_viewers'],
            book['purchases'],
            book['earnings']
        ])
    
    # Write summary
    writer.writerow([])  # Empty row
    writer.writerow(['TOTALS'])
    writer.writerow([
        'Total Books',
        'Total Views', 
        'Total Purchases',
        'Total Earnings'
    ])
    writer.writerow([
        analytics['summary']['total_books'],
        analytics['summary']['total_views'],
        analytics['summary']['total_purchases'],
        analytics['summary']['total_earnings']
    ])
    
    # Create response
    output.seek(0)
    
    def iter_csv():
        yield output.getvalue().encode('utf-8')
    
    filename = f"earnings_report_{start_date or 'all'}_{end_date or 'all'}.csv"
    
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )

@router.get("/export/analytics")
async def export_analytics_report(
    book_id: Optional[str] = Query(None, description="Specific book ID for detailed report"),
    start_date: Optional[date] = Query(None, description="Start date for report (YYYY-MM-DD)"),
    end_date: Optional[date] = Query(None, description="End date for report (YYYY-MM-DD)"),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Export comprehensive analytics report as CSV"""
    if not current_user.is_writer:
        raise HTTPException(status_code=403, detail="Only writers can export analytics")
    
    analytics_service = AnalyticsService(db)
    
    if book_id:
        # Verify book ownership
        from app.models.book import Book
        book = db.query(Book).filter(Book.id == book_id, Book.author_id == current_user.id).first()
        if not book:
            raise HTTPException(status_code=404, detail="Book not found or not owned by user")
        
        analytics = analytics_service.get_book_analytics(
            book_id=book_id,
            start_date=start_date,
            end_date=end_date
        )
        
        # Create CSV for single book
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Book Analytics Report'])
        writer.writerow(['Book Title', analytics['book']['title']])
        writer.writerow(['Date Range', f"{start_date or 'All time'} to {end_date or 'Present'}"])
        writer.writerow([])
        
        writer.writerow(['Chapter', 'Chapter Number', 'Views'])
        for chapter in analytics['chapters']:
            writer.writerow([
                chapter['title'],
                chapter['chapter_number'],
                chapter['views']
            ])
        
        writer.writerow([])
        writer.writerow(['Summary'])
        writer.writerow(['Total Earnings', analytics['summary']['total_earnings']])
        writer.writerow(['Total Purchases', analytics['summary']['total_purchases']])
        writer.writerow(['Total Chapters', analytics['summary']['total_chapters']])
        
        filename = f"book_analytics_{book_id}_{start_date or 'all'}_{end_date or 'all'}.csv"
    else:
        # Full writer analytics
        analytics = analytics_service.get_writer_analytics(
            writer_id=current_user.id,
            start_date=start_date,
            end_date=end_date
        )
        
        output = io.StringIO()
        writer = csv.writer(output)
        
        writer.writerow(['Writer Analytics Report'])
        writer.writerow(['Date Range', f"{analytics['summary']['date_range']['start_date']} to {analytics['summary']['date_range']['end_date']}"])
        writer.writerow([])
        
        writer.writerow(['Book Title', 'Views', 'Unique Viewers', 'Purchases', 'Earnings'])
        for book in analytics['books']:
            writer.writerow([
                book['title'],
                book['views'],
                book['unique_viewers'],
                book['purchases'],
                book['earnings']
            ])
        
        filename = f"writer_analytics_{start_date or 'all'}_{end_date or 'all'}.csv"
    
    output.seek(0)
    
    def iter_csv():
        yield output.getvalue().encode('utf-8')
    
    return StreamingResponse(
        iter_csv(),
        media_type="text/csv",
        headers={"Content-Disposition": f"attachment; filename={filename}"}
    )