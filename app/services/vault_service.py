from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_
from typing import List, Optional
from uuid import UUID
from datetime import datetime, timedelta
from app.models.library import UserLibrary
from app.models.book import Book
from app.models.user import User
from app.core.security import verify_password
from app.schemas.library import LibraryResponse

class VaultService:
    def __init__(self, db: Session):
        self.db = db
    
    def verify_vault_password(self, user: User, password: str) -> bool:
        """Verify vault password for user"""
        if not user.vault_password_hash:
            return False
        return verify_password(password, user.vault_password_hash)
    
    def get_vault_books(self, user_id: UUID) -> List[LibraryResponse]:
        """Get all books in user's vault"""
        vault_entries = (
            self.db.query(UserLibrary)
            .options(
                joinedload(UserLibrary.book).joinedload(Book.author)
            )
            .filter(
                UserLibrary.user_id == str(user_id),
                UserLibrary.is_in_vault == True,
                UserLibrary.is_deleted == False
            )
            .order_by(UserLibrary.updated_at.desc())
            .all()
        )
        
        return [
            LibraryResponse(
                id=entry.id,
                book_id=entry.book_id,
                is_in_vault=entry.is_in_vault,
                created_at=entry.created_at,
                book_title=entry.book.title if entry.book else "Unknown Book",
                book_description=entry.book.description if entry.book else None,
                book_cover_image_url=entry.book.cover_image_url if entry.book else None,
                author_username=entry.book.author.username if entry.book and entry.book.author else "Unknown Author",
                genre=entry.book.genre if entry.book else None,
                tags=entry.book.tags if entry.book else None
            )
            for entry in vault_entries
            if entry.book  # Only include entries where the book still exists
        ]
    
    def move_book_to_vault(self, user_id: UUID, book_id: UUID) -> dict:
        """Move a book to vault"""
        library_entry = (
            self.db.query(UserLibrary)
            .filter(
                UserLibrary.user_id == str(user_id),
                UserLibrary.book_id == str(book_id),
                UserLibrary.is_deleted == False
            )
            .first()
        )
        
        if not library_entry:
            return {"success": False, "message": "Book not found in library"}
        
        if library_entry.is_in_vault:
            return {"success": False, "message": "Book is already in vault"}
        
        library_entry.is_in_vault = True
        library_entry.updated_at = datetime.utcnow()
        self.db.commit()
        
        return {"success": True, "message": "Book moved to vault successfully"}
    
    def remove_book_from_vault(self, user_id: UUID, book_id: UUID) -> dict:
        """Remove a book from vault"""
        library_entry = (
            self.db.query(UserLibrary)
            .filter(
                UserLibrary.user_id == str(user_id),
                UserLibrary.book_id == str(book_id),
                UserLibrary.is_in_vault == True,
                UserLibrary.is_deleted == False
            )
            .first()
        )
        
        if not library_entry:
            return {"success": False, "message": "Book not found in vault"}
        
        library_entry.is_in_vault = False
        library_entry.updated_at = datetime.utcnow()
        self.db.commit()
        
        return {"success": True, "message": "Book removed from vault successfully"}
    
    def has_vault_password(self, user: User) -> bool:
        """Check if user has set a vault password"""
        return user.vault_password_hash is not None