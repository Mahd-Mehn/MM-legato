from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_
from typing import List
from uuid import UUID
from datetime import datetime
from app.models.library import UserLibrary, Bookmark
from app.models.book import Book, Chapter
from app.models.user import User
from app.schemas.library import LibraryResponse, ReadingHistoryResponse

class LibraryService:
    def __init__(self, db: Session):
        self.db = db
    
    def get_user_library(self, user_id: UUID) -> List[LibraryResponse]:
        """Get all books in user's library (excluding soft-deleted)"""
        library_entries = (
            self.db.query(UserLibrary)
            .options(
                joinedload(UserLibrary.book).joinedload(Book.author)
            )
            .filter(
                UserLibrary.user_id == user_id,
                UserLibrary.is_deleted == False
            )
            .order_by(UserLibrary.created_at.desc())
            .all()
        )
        
        return [
            LibraryResponse(
                id=entry.id,
                book_id=entry.book_id,
                is_in_vault=entry.is_in_vault,
                created_at=entry.created_at,
                book_title=entry.book.title,
                book_description=entry.book.description,
                book_cover_image_url=entry.book.cover_image_url,
                author_username=entry.book.author.username,
                genre=entry.book.genre,
                tags=entry.book.tags
            )
            for entry in library_entries
        ]
    
    def add_book_to_library(self, user_id: UUID, book_id: UUID) -> dict:
        """Add a book to user's library"""
        library_entry = UserLibrary(
            user_id=user_id,
            book_id=book_id,
            is_in_vault=False
        )
        
        self.db.add(library_entry)
        self.db.commit()
        self.db.refresh(library_entry)
        
        return {"message": "Book added to library successfully", "id": library_entry.id}
    
    def remove_book_from_library(self, user_id: UUID, book_id: UUID) -> dict:
        """Remove a book from user's library (soft delete)"""
        library_entry = (
            self.db.query(UserLibrary)
            .filter(
                UserLibrary.user_id == user_id,
                UserLibrary.book_id == book_id
            )
            .first()
        )
        
        if library_entry:
            # Soft delete by marking as deleted
            library_entry.is_deleted = True
            library_entry.updated_at = datetime.utcnow()
            self.db.commit()
        
        return {"message": "Book removed from library successfully"}
    
    def toggle_vault_status(self, user_id: UUID, book_id: UUID) -> dict:
        """Toggle vault status for a book in user's library"""
        library_entry = (
            self.db.query(UserLibrary)
            .filter(
                UserLibrary.user_id == user_id,
                UserLibrary.book_id == book_id
            )
            .first()
        )
        
        if library_entry:
            library_entry.is_in_vault = not library_entry.is_in_vault
            library_entry.updated_at = datetime.utcnow()
            self.db.commit()
            
            status = "moved to vault" if library_entry.is_in_vault else "removed from vault"
            return {"message": f"Book {status} successfully"}
        
        return {"message": "Book not found in library"}
    
    def get_reading_history(self, user_id: UUID) -> List[ReadingHistoryResponse]:
        """Get user's reading history based on bookmarks and library"""
        # Get all books that user has bookmarks for (indicating they've read them)
        bookmarked_books_query = (
            self.db.query(Book)
            .join(Chapter, Chapter.book_id == Book.id)
            .join(Bookmark, Bookmark.chapter_id == Chapter.id)
            .options(joinedload(Book.author))
            .filter(Bookmark.user_id == user_id)
            .distinct()
        )
        
        bookmarked_books = bookmarked_books_query.all()
        
        # Get user's current library for checking if books are still in library
        current_library = (
            self.db.query(UserLibrary.book_id)
            .filter(
                UserLibrary.user_id == user_id,
                UserLibrary.is_deleted == False
            )
            .all()
        )
        current_library_ids = {entry.book_id for entry in current_library}
        
        # Get latest bookmark for each book to determine last access time
        history = []
        for book in bookmarked_books:
            latest_bookmark = (
                self.db.query(Bookmark)
                .join(Chapter, Chapter.id == Bookmark.chapter_id)
                .filter(
                    Bookmark.user_id == user_id,
                    Chapter.book_id == book.id
                )
                .order_by(Bookmark.updated_at.desc())
                .first()
            )
            
            history.append(
                ReadingHistoryResponse(
                    book_id=book.id,
                    book_title=book.title,
                    book_description=book.description,
                    book_cover_image_url=book.cover_image_url,
                    author_username=book.author.username,
                    genre=book.genre,
                    last_accessed=latest_bookmark.updated_at if latest_bookmark else book.created_at,
                    is_in_library=book.id in current_library_ids
                )
            )
        
        # Sort by last accessed time (most recent first)
        history.sort(key=lambda x: x.last_accessed, reverse=True)
        
        return history