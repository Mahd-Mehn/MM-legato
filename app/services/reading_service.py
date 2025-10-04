from sqlalchemy.orm import Session
from sqlalchemy import and_, text
from typing import Optional, Dict, Any, List
from uuid import UUID
from decimal import Decimal
import math

from app.models.book import Book, Chapter
from app.models.library import Bookmark, UserLibrary, ReadingProgress
from app.models.reading import ReadingPreferences
from app.models.user import User
from app.schemas.reading import (
    ChapterReadingResponse, BookmarkResponse, BookNavigationResponse,
    ChapterNavigationInfo, ReadingPreferences as ReadingPreferencesSchema,
    ReadingPreferencesUpdate, ReadingProgressResponse, ReadingProgressCreate,
    ReadingProgressUpdate, ContinueReadingBook
)

class ReadingService:
    def __init__(self, db: Session):
        self.db = db

    def get_chapter_for_reading(self, chapter_id: UUID, user_id: UUID) -> Optional[ChapterReadingResponse]:
        """Get chapter content and metadata for reading interface"""
        
        # Convert UUID to string for database comparison
        chapter_id_str = str(chapter_id)
        user_id_str = str(user_id)
        
        print(f"DEBUG: Looking for chapter_id: {chapter_id_str}")
        
        # Get chapter with book and author info - use string comparison
        chapter = self.db.query(Chapter)\
            .join(Book, Chapter.book_id == Book.id)\
            .join(User, Book.author_id == User.id)\
            .filter(
                Chapter.id == chapter_id_str,
                Chapter.is_published == True,
                Book.is_published == True
            ).first()
        
        if not chapter:
            # Debug: try to find the chapter without filters
            debug_chapter = self.db.query(Chapter).filter(Chapter.id == chapter_id_str).first()
            if debug_chapter:
                print(f"DEBUG: Chapter {chapter_id_str} exists but is_published={debug_chapter.is_published}")
                book = self.db.query(Book).filter(Book.id == debug_chapter.book_id).first()
                if book:
                    print(f"DEBUG: Book is_published={book.is_published}")
                else:
                    print(f"DEBUG: Book not found")
            else:
                print(f"DEBUG: Chapter {chapter_id_str} not found in database")
            return None
        
        # Check if user has access to this chapter
        # For now, assume all published chapters are accessible
        # TODO: Add payment/access control logic here
        
        # Get user's bookmark for this chapter
        try:
            bookmark = self.db.query(Bookmark).filter(
                and_(Bookmark.user_id == user_id_str, Bookmark.chapter_id == chapter_id_str)
            ).first()
        except Exception as e:
            print(f"DEBUG: Bookmark query error: {e}")
            bookmark = None
        
        # Get navigation info (previous/next chapters)
        previous_chapter = self.db.query(Chapter).filter(
            and_(
                Chapter.book_id == chapter.book_id,
                Chapter.chapter_number < chapter.chapter_number,
                Chapter.is_published == True
            )
        ).order_by(Chapter.chapter_number.desc()).first()
        
        next_chapter = self.db.query(Chapter).filter(
            and_(
                Chapter.book_id == chapter.book_id,
                Chapter.chapter_number > chapter.chapter_number,
                Chapter.is_published == True
            )
        ).order_by(Chapter.chapter_number.asc()).first()
        
        # Calculate reading time (assuming 200 words per minute)
        reading_time = None
        if chapter.word_count:
            reading_time = math.ceil(chapter.word_count / 200)
        
        # Convert to response format
        response_data = {
            "id": chapter.id,
            "book_id": chapter.book_id,
            "title": chapter.title,
            "content": chapter.content,
            "chapter_number": chapter.chapter_number,
            "word_count": chapter.word_count,
            "audio_url": chapter.audio_url,
            "created_at": chapter.created_at,
            "updated_at": chapter.updated_at,
            "book_title": chapter.book.title,
            "book_author": chapter.book.author.username,
            "book_cover_url": chapter.book.cover_image_url,
            "reading_time_minutes": reading_time,
            "previous_chapter": ChapterNavigationInfo(
                id=previous_chapter.id,
                title=previous_chapter.title,
                chapter_number=previous_chapter.chapter_number,
                is_published=previous_chapter.is_published
            ) if previous_chapter else None,
            "next_chapter": ChapterNavigationInfo(
                id=next_chapter.id,
                title=next_chapter.title,
                chapter_number=next_chapter.chapter_number,
                is_published=next_chapter.is_published
            ) if next_chapter else None,
            "bookmark": BookmarkResponse(
                id=bookmark.id,
                user_id=bookmark.user_id,
                chapter_id=bookmark.chapter_id,
                position_percentage=bookmark.position_percentage,
                created_at=bookmark.created_at,
                updated_at=bookmark.updated_at
            ) if bookmark else None
        }
        
        return ChapterReadingResponse(**response_data)

    def get_chapter_for_reading_by_slug(self, chapter_slug: str, user_id: UUID) -> Optional[ChapterReadingResponse]:
        """Get chapter content by slug/title for reading interface"""
        
        # Find chapter by title (treating slug as title for now)
        chapter = self.db.query(Chapter)\
            .join(Book, Chapter.book_id == Book.id)\
            .join(User, Book.author_id == User.id)\
            .filter(
                and_(
                    Chapter.title.ilike(f"%{chapter_slug}%"),
                    Chapter.is_published == True,
                    Book.is_published == True
                )
            ).first()
        
        if not chapter:
            return None
            
        return self.get_chapter_for_reading(chapter.id, user_id)

    def get_book_navigation(self, book_id: UUID, user_id: UUID) -> Optional[BookNavigationResponse]:
        """Get book navigation data (table of contents)"""
        return self._get_book_navigation_internal(book_id, user_id)
    
    def get_book_navigation_by_slug(self, book_slug: str, user_id: UUID) -> Optional[BookNavigationResponse]:
        """Get book navigation data by slug/title"""
        # Find book by title (treating slug as title for now)
        book = self.db.query(Book).filter(
            and_(Book.title.ilike(f"%{book_slug}%"), Book.is_published == True)
        ).first()
        
        if not book:
            return None
            
        return self._get_book_navigation_internal(book.id, user_id)
    
    def _get_book_navigation_internal(self, book_id: UUID, user_id: UUID) -> Optional[BookNavigationResponse]:
        """Internal method to get book navigation data"""
        
        # Convert UUID to string for database comparison
        book_id_str = str(book_id)
        
        # Get book with chapters
        book = self.db.query(Book).filter(
            and_(Book.id == book_id_str, Book.is_published == True)
        ).first()
        
        if not book:
            return None
        
        # Get all published chapters for this book
        chapters = self.db.query(Chapter).filter(
            and_(
                Chapter.book_id == book_id_str,
                Chapter.is_published == True
            )
        ).order_by(Chapter.chapter_number).all()
        
        chapter_info = [
            ChapterNavigationInfo(
                id=chapter.id,
                title=chapter.title,
                chapter_number=chapter.chapter_number,
                is_published=chapter.is_published
            )
            for chapter in chapters
        ]
        
        return BookNavigationResponse(
            book_id=book.id,
            book_title=book.title,
            chapters=chapter_info
        )

    def create_or_update_bookmark(self, chapter_id: UUID, user_id: UUID, position_percentage: Decimal) -> Optional[BookmarkResponse]:
        """Create or update a bookmark for a chapter"""
        
        # Convert UUIDs to strings for database comparison
        chapter_id_str = str(chapter_id)
        user_id_str = str(user_id)
        
        # Verify chapter exists and is accessible
        chapter = self.db.query(Chapter).join(Book, Chapter.book_id == Book.id).filter(
            Chapter.id == chapter_id_str,
            Chapter.is_published == True,
            Book.is_published == True
        ).first()
        
        if not chapter:
            return None
        
        # Check if bookmark already exists
        bookmark = self.db.query(Bookmark).filter(
            and_(Bookmark.user_id == user_id_str, Bookmark.chapter_id == chapter_id_str)
        ).first()
        
        if bookmark:
            # Update existing bookmark
            bookmark.position_percentage = position_percentage
        else:
            # Create new bookmark
            bookmark = Bookmark(
                user_id=user_id_str,
                chapter_id=chapter_id_str,
                position_percentage=position_percentage
            )
            self.db.add(bookmark)
        
        self.db.commit()
        self.db.refresh(bookmark)
        
        return BookmarkResponse(
            id=bookmark.id,
            user_id=bookmark.user_id,
            chapter_id=bookmark.chapter_id,
            position_percentage=bookmark.position_percentage,
            created_at=bookmark.created_at,
            updated_at=bookmark.updated_at
        )

    def get_user_bookmark(self, chapter_id: UUID, user_id: UUID) -> Optional[BookmarkResponse]:
        """Get user's bookmark for a specific chapter"""
        
        # Convert UUIDs to strings for database comparison
        chapter_id_str = str(chapter_id)
        user_id_str = str(user_id)
        
        bookmark = self.db.query(Bookmark).filter(
            and_(Bookmark.user_id == user_id_str, Bookmark.chapter_id == chapter_id_str)
        ).first()
        
        if not bookmark:
            return None
        
        return BookmarkResponse(
            id=bookmark.id,
            user_id=bookmark.user_id,
            chapter_id=bookmark.chapter_id,
            position_percentage=bookmark.position_percentage,
            created_at=bookmark.created_at,
            updated_at=bookmark.updated_at
        )

    def delete_bookmark(self, chapter_id: UUID, user_id: UUID) -> bool:
        """Delete user's bookmark for a chapter"""
        
        # Convert UUIDs to strings for database comparison
        chapter_id_str = str(chapter_id)
        user_id_str = str(user_id)
        
        bookmark = self.db.query(Bookmark).filter(
            and_(Bookmark.user_id == user_id_str, Bookmark.chapter_id == chapter_id_str)
        ).first()
        
        if not bookmark:
            return False
        
        self.db.delete(bookmark)
        self.db.commit()
        return True

    def update_reading_progress(self, user_id: UUID, progress_data: ReadingProgressCreate) -> Optional[ReadingProgressResponse]:
        """Update or create reading progress for a user"""
        
        # Convert UUIDs to strings for database comparison
        user_id_str = str(user_id)
        chapter_id_str = str(progress_data.chapter_id)
        book_id_str = str(progress_data.book_id)
        
        # Verify chapter and book exist and are accessible
        chapter = self.db.query(Chapter).join(Book, Chapter.book_id == Book.id).filter(
            Chapter.id == chapter_id_str,
            Book.id == book_id_str,
            Chapter.is_published == True,
            Book.is_published == True
        ).first()
        
        if not chapter:
            return None
        
        # Check if progress already exists for this book
        progress = self.db.query(ReadingProgress).filter(
            and_(
                ReadingProgress.user_id == user_id_str,
                ReadingProgress.book_id == book_id_str
            )
        ).first()
        
        if progress:
            # Update existing progress
            progress.chapter_id = chapter_id_str
            progress.position_percentage = progress_data.position_percentage
        else:
            # Create new progress
            progress = ReadingProgress(
                user_id=user_id_str,
                book_id=book_id_str,
                chapter_id=chapter_id_str,
                position_percentage=progress_data.position_percentage
            )
            self.db.add(progress)
        
        try:
            self.db.commit()
            self.db.refresh(progress)
        except Exception as e:
            self.db.rollback()
            return None
        
        return ReadingProgressResponse(
            id=progress.id,
            user_id=progress.user_id,
            book_id=progress.book_id,
            chapter_id=progress.chapter_id,
            position_percentage=progress.position_percentage,
            last_read_at=progress.last_read_at,
            created_at=progress.created_at,
            updated_at=progress.updated_at
        )

    def get_continue_reading_books(self, user_id: UUID, limit: int = 5) -> List[ContinueReadingBook]:
        """Get books that user has reading progress on, ordered by last read"""
        
        try:
            # Get progress entries for the user
            progress_entries = self.db.query(ReadingProgress)\
                .filter(ReadingProgress.user_id == str(user_id))\
                .order_by(ReadingProgress.last_read_at.desc())\
                .limit(limit)\
                .all()
            
            continue_reading = []
            for progress in progress_entries:
                # Use raw SQL with UUID normalization to handle format differences
                book_query = text("""
                    SELECT b.*, u.username as author_name 
                    FROM books b 
                    JOIN users u ON REPLACE(b.author_id, '-', '') = REPLACE(u.id, '-', '')
                    WHERE REPLACE(b.id, '-', '') = REPLACE(:book_id, '-', '') 
                    AND b.is_published = 1
                """)
                
                book_result = self.db.execute(book_query, {"book_id": progress.book_id}).fetchone()
                
                if not book_result:
                    continue
                
                chapter_query = text("""
                    SELECT * FROM chapters 
                    WHERE REPLACE(id, '-', '') = REPLACE(:chapter_id, '-', '') 
                    AND is_published = 1
                """)
                
                chapter_result = self.db.execute(chapter_query, {"chapter_id": progress.chapter_id}).fetchone()
                
                if not chapter_result:
                    continue
                
                continue_reading.append(ContinueReadingBook(
                    id=progress.id,
                    book_id=progress.book_id,
                    title=book_result.title,
                    author=book_result.author_name,
                    cover_url=book_result.cover_image_url,
                    current_chapter_id=progress.chapter_id,
                    current_chapter_title=chapter_result.title,
                    current_chapter_number=chapter_result.chapter_number,
                    progress=progress.position_percentage,
                    last_read_at=progress.last_read_at
                ))
            
            return continue_reading
            
        except Exception as e:
            print(f"Error in get_continue_reading_books: {e}")
            return []

    def get_user_reading_progress(self, user_id: UUID, book_id: UUID) -> Optional[ReadingProgressResponse]:
        """Get user's reading progress for a specific book"""
        
        # Convert UUIDs to strings for database comparison
        user_id_str = str(user_id)
        book_id_str = str(book_id)
        
        progress = self.db.query(ReadingProgress).filter(
            and_(
                ReadingProgress.user_id == user_id_str,
                ReadingProgress.book_id == book_id_str
            )
        ).first()
        
        if not progress:
            return None
        
        return ReadingProgressResponse(
            id=progress.id,
            user_id=progress.user_id,
            book_id=progress.book_id,
            chapter_id=progress.chapter_id,
            position_percentage=progress.position_percentage,
            last_read_at=progress.last_read_at,
            created_at=progress.created_at,
            updated_at=progress.updated_at
        )

    # Reading preferences are now handled in localStorage on the frontend