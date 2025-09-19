from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from typing import Optional, Dict, Any, List
from uuid import UUID

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.reading_service import ReadingService
from app.schemas.reading import (
    ChapterReadingResponse, BookmarkCreate, BookmarkResponse,
    ReadingProgressCreate, ReadingProgressResponse, ContinueReadingBook
)

router = APIRouter()

@router.get("/chapters/{chapter_id}", response_model=ChapterReadingResponse)
async def get_chapter_for_reading(
    chapter_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get chapter content and metadata for reading interface"""
    reading_service = ReadingService(db)
    
    # Try to parse as UUID, if it fails, treat as string ID
    try:
        chapter_uuid = UUID(chapter_id)
        chapter_data = reading_service.get_chapter_for_reading(chapter_uuid, current_user.id)
    except ValueError:
        # Handle non-UUID chapter IDs
        chapter_data = reading_service.get_chapter_for_reading_by_slug(chapter_id, current_user.id)
    
    if not chapter_data:
        raise HTTPException(status_code=404, detail="Chapter not found or access denied")
    
    return chapter_data

@router.get("/books/{book_id}/navigation")
async def get_book_navigation(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get book navigation data (table of contents, next/previous chapters)"""
    reading_service = ReadingService(db)
    
    # Try to parse as UUID, if it fails, treat as string ID
    try:
        book_uuid = UUID(book_id)
        navigation_data = reading_service.get_book_navigation(book_uuid, current_user.id)
    except ValueError:
        # Handle non-UUID book IDs by looking up by title or slug
        navigation_data = reading_service.get_book_navigation_by_slug(book_id, current_user.id)
    
    if not navigation_data:
        raise HTTPException(status_code=404, detail="Book not found or access denied")
    
    return navigation_data

@router.post("/bookmarks", response_model=BookmarkResponse)
async def create_bookmark(
    bookmark_data: BookmarkCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create or update a bookmark for a chapter"""
    reading_service = ReadingService(db)
    
    bookmark = reading_service.create_or_update_bookmark(
        chapter_id=bookmark_data.chapter_id,
        user_id=current_user.id,
        position_percentage=bookmark_data.position_percentage
    )
    
    if not bookmark:
        raise HTTPException(status_code=404, detail="Chapter not found or access denied")
    
    return bookmark

@router.get("/bookmarks/chapter/{chapter_id}", response_model=Optional[BookmarkResponse])
async def get_chapter_bookmark(
    chapter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's bookmark for a specific chapter"""
    reading_service = ReadingService(db)
    
    bookmark = reading_service.get_user_bookmark(chapter_id, current_user.id)
    return bookmark

@router.delete("/bookmarks/chapter/{chapter_id}")
async def delete_bookmark(
    chapter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete user's bookmark for a chapter"""
    reading_service = ReadingService(db)
    
    success = reading_service.delete_bookmark(chapter_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Bookmark not found")
    
    return {"message": "Bookmark deleted successfully"}

@router.post("/progress", response_model=ReadingProgressResponse)
async def update_reading_progress(
    progress_data: ReadingProgressCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's reading progress for a book"""
    reading_service = ReadingService(db)
    
    progress = reading_service.update_reading_progress(current_user.id, progress_data)
    
    if not progress:
        raise HTTPException(status_code=404, detail="Chapter or book not found or access denied")
    
    return progress

@router.get("/continue-reading", response_model=List[ContinueReadingBook])
async def get_continue_reading(
    limit: int = Query(default=5, ge=1, le=20),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get books that user has reading progress on"""
    reading_service = ReadingService(db)
    
    continue_reading = reading_service.get_continue_reading_books(current_user.id, limit)
    
    return continue_reading

@router.get("/progress/book/{book_id}", response_model=Optional[ReadingProgressResponse])
async def get_reading_progress(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's reading progress for a specific book"""
    reading_service = ReadingService(db)
    
    progress = reading_service.get_user_reading_progress(current_user.id, book_id)
    
    return progress

# Reading preferences are now handled in localStorage on the frontend

@router.get("/debug/chapters")
async def debug_chapters(
    db: Session = Depends(get_db)
):
    """Debug endpoint to see available chapters"""
    from app.models.book import Chapter, Book
    from app.models.user import User
    
    chapters = db.query(Chapter).join(Book).join(User).all()
    
    result = []
    for chapter in chapters:
        result.append({
            "id": str(chapter.id),
            "title": chapter.title,
            "chapter_number": chapter.chapter_number,
            "is_published": chapter.is_published,
            "book_id": str(chapter.book_id),
            "book_title": chapter.book.title,
            "book_published": chapter.book.is_published,
            "author": chapter.book.author.username
        })
    
    return {"chapters": result, "total": len(result)}

@router.get("/debug/progress")
async def debug_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Debug endpoint to see reading progress"""
    from app.models.library import ReadingProgress
    from app.models.book import Book, Chapter
    
    progress_entries = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == str(current_user.id)
    ).all()
    
    result = []
    for progress in progress_entries:
        book = db.query(Book).filter(Book.id == progress.book_id).first()
        chapter = db.query(Chapter).filter(Chapter.id == progress.chapter_id).first()
        
        result.append({
            "id": str(progress.id),
            "user_id": progress.user_id,
            "book_id": progress.book_id,
            "book_title": book.title if book else "Unknown",
            "chapter_id": progress.chapter_id,
            "chapter_title": chapter.title if chapter else "Unknown",
            "position_percentage": float(progress.position_percentage),
            "last_read_at": progress.last_read_at.isoformat() if progress.last_read_at else None
        })
    
    return {"progress": result, "total": len(result)}

@router.get("/debug/simple-progress")
async def debug_simple_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Simple debug endpoint to check reading progress without joins"""
    from app.models.library import ReadingProgress
    
    print(f"DEBUG: Checking progress for user ID: {current_user.id}")
    
    # Just get raw progress entries
    progress_entries = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == str(current_user.id)
    ).all()
    
    print(f"DEBUG: Found {len(progress_entries)} progress entries")
    
    # Also check all progress entries in the database
    all_progress = db.query(ReadingProgress).all()
    print(f"DEBUG: Total progress entries in database: {len(all_progress)}")
    
    result = []
    for progress in progress_entries:
        result.append({
            "id": str(progress.id),
            "user_id": progress.user_id,
            "book_id": progress.book_id,
            "chapter_id": progress.chapter_id,
            "position_percentage": float(progress.position_percentage),
            "last_read_at": progress.last_read_at.isoformat() if progress.last_read_at else None
        })
    
    return {
        "progress": result, 
        "total": len(result),
        "user_id_searched": str(current_user.id),
        "total_in_db": len(all_progress)
    }

@router.get("/debug/books")
async def debug_books(
    db: Session = Depends(get_db)
):
    """Debug endpoint to see what books exist"""
    from app.models.book import Book
    
    books = db.query(Book).all()
    
    result = []
    for book in books:
        result.append({
            "id": str(book.id),
            "title": book.title,
            "is_published": book.is_published,
            "author_id": str(book.author_id)
        })
    
    return {"books": result, "total": len(result)}

@router.post("/debug/create-test-progress")
async def create_test_progress(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create test reading progress data"""
    from app.models.library import ReadingProgress
    from app.models.book import Book, Chapter
    
    # Find the first published book and chapter
    book = db.query(Book).filter(Book.is_published == True).first()
    if not book:
        raise HTTPException(status_code=404, detail="No published books found")
    
    chapter = db.query(Chapter).filter(
        Chapter.book_id == book.id,
        Chapter.is_published == True
    ).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="No published chapters found")
    
    # Check if progress already exists
    existing_progress = db.query(ReadingProgress).filter(
        ReadingProgress.user_id == str(current_user.id),
        ReadingProgress.book_id == str(book.id)
    ).first()
    
    if existing_progress:
        # Update existing
        existing_progress.chapter_id = str(chapter.id)
        existing_progress.position_percentage = 25.0
        db.commit()
        return {"message": "Updated existing progress", "progress_id": str(existing_progress.id)}
    else:
        # Create new
        progress = ReadingProgress(
            user_id=str(current_user.id),
            book_id=str(book.id),
            chapter_id=str(chapter.id),
            position_percentage=25.0
        )
        db.add(progress)
        db.commit()
        db.refresh(progress)
        return {"message": "Created new progress", "progress_id": str(progress.id)}