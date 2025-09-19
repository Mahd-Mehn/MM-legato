from sqlalchemy.orm import Session, joinedload
from sqlalchemy import and_, or_, func, desc, asc
from typing import List, Optional, Tuple
from uuid import UUID
import json
import hashlib
import secrets

from app.models.book import Book, Chapter
from app.models.user import User
from app.schemas.book import BookCreate, BookUpdate, BookFilters, ChapterCreate, ChapterUpdate

class BookService:
    def __init__(self, db: Session):
        self.db = db

    def generate_license_hash(self, book_title: str, author_id: str) -> str:
        """Generate a unique license hash for IP protection"""
        unique_string = f"{book_title}_{author_id}_{secrets.token_hex(16)}"
        return hashlib.sha256(unique_string.encode()).hexdigest()

    def create_book(self, book_data: BookCreate, author_id: UUID) -> Book:
        """Create a new book"""
        license_hash = self.generate_license_hash(book_data.title, str(author_id))
        
        # Convert tags list to JSON string for storage
        tags_json = json.dumps(book_data.tags) if book_data.tags else "[]"
        
        db_book = Book(
            **book_data.dict(exclude={"tags"}),
            author_id=author_id,
            license_hash=license_hash,
            tags=tags_json
        )
        
        self.db.add(db_book)
        self.db.commit()
        self.db.refresh(db_book)
        return db_book

    def get_book_by_id(self, book_id: UUID, include_chapters: bool = False) -> Optional[Book]:
        """Get a book by ID with optional chapter loading"""
        query = self.db.query(Book).filter(Book.id == book_id)
        
        if include_chapters:
            query = query.options(
                joinedload(Book.chapters),
                joinedload(Book.author)
            )
        else:
            query = query.options(joinedload(Book.author))
            
        return query.first()

    def get_books_with_filters(self, filters: BookFilters) -> Tuple[List[Book], int]:
        """Get books with filtering, pagination, and sorting"""
        query = self.db.query(Book).options(joinedload(Book.author))
        
        # Apply filters
        if filters.is_published is not None:
            query = query.filter(Book.is_published == filters.is_published)
            
        if filters.search:
            search_term = f"%{filters.search}%"
            query = query.join(User, Book.author_id == User.id).filter(
                or_(
                    Book.title.ilike(search_term),
                    Book.description.ilike(search_term),
                    User.username.ilike(search_term),
                    Book.genre.ilike(search_term)
                )
            )
            
        if filters.genre:
            query = query.filter(Book.genre.ilike(f"%{filters.genre}%"))
            
        if filters.pricing_model:
            query = query.filter(Book.pricing_model == filters.pricing_model)
            
        if filters.min_price is not None:
            query = query.filter(
                or_(
                    and_(Book.pricing_model == "fixed", Book.fixed_price >= filters.min_price),
                    and_(Book.pricing_model == "per_chapter", Book.per_chapter_price >= filters.min_price)
                )
            )
            
        if filters.max_price is not None:
            query = query.filter(
                or_(
                    and_(Book.pricing_model == "fixed", Book.fixed_price <= filters.max_price),
                    and_(Book.pricing_model == "per_chapter", Book.per_chapter_price <= filters.max_price),
                    Book.pricing_model == "free"
                )
            )
            
        if filters.author_id:
            query = query.filter(Book.author_id == filters.author_id)

        # Tag filtering (include and exclude)
        if filters.tags:
            for tag in filters.tags:
                query = query.filter(Book.tags.like(f'%"{tag}"%'))
                
        if filters.excluded_tags:
            for tag in filters.excluded_tags:
                query = query.filter(~Book.tags.like(f'%"{tag}"%'))

        # Get total count before pagination
        total = query.count()

        # Apply sorting
        if filters.sort_by == "title":
            order_func = asc if filters.sort_order == "asc" else desc
            query = query.order_by(order_func(Book.title))
        elif filters.sort_by == "created_at":
            order_func = asc if filters.sort_order == "asc" else desc
            query = query.order_by(order_func(Book.created_at))
        # Note: rating and price sorting would need additional joins/calculations
        
        # Apply pagination
        offset = (filters.page - 1) * filters.limit
        books = query.offset(offset).limit(filters.limit).all()
        
        return books, total

    def update_book(self, book_id: UUID, book_data: BookUpdate, author_id: UUID) -> Optional[Book]:
        """Update a book (only by author)"""
        book = self.db.query(Book).filter(
            Book.id == book_id,
            Book.author_id == author_id
        ).first()
        
        if not book:
            return None
            
        update_data = book_data.dict(exclude_unset=True, exclude={"tags"})
        
        # Handle tags separately
        if book_data.tags is not None:
            update_data["tags"] = json.dumps(book_data.tags)
            
        for field, value in update_data.items():
            setattr(book, field, value)
            
        self.db.commit()
        self.db.refresh(book)
        return book

    def delete_book(self, book_id: UUID, author_id: UUID) -> bool:
        """Delete a book (only by author)"""
        book = self.db.query(Book).filter(
            Book.id == book_id,
            Book.author_id == author_id
        ).first()
        
        if not book:
            return False
            
        self.db.delete(book)
        self.db.commit()
        return True

    def create_chapter(self, book_id: UUID, chapter_data: ChapterCreate, author_id: UUID) -> Optional[Chapter]:
        """Create a new chapter (only by book author)"""
        # Verify book ownership
        book = self.db.query(Book).filter(
            Book.id == book_id,
            Book.author_id == author_id
        ).first()
        
        if not book:
            return None
            
        # Check if chapter number already exists
        existing_chapter = self.db.query(Chapter).filter(
            Chapter.book_id == book_id,
            Chapter.chapter_number == chapter_data.chapter_number
        ).first()
        
        if existing_chapter:
            return None
            
        # Create chapter with book_id
        chapter_dict = chapter_data.dict()
        chapter_dict['book_id'] = book_id
        db_chapter = Chapter(**chapter_dict)
        
        # Calculate word count
        db_chapter.word_count = len(chapter_data.content.split())
        
        self.db.add(db_chapter)
        self.db.commit()
        self.db.refresh(db_chapter)
        return db_chapter

    def get_book_chapters(self, book_id: UUID) -> List[Chapter]:
        """Get all chapters for a book"""
        return self.db.query(Chapter).filter(
            Chapter.book_id == book_id
        ).order_by(Chapter.chapter_number).all()

    def get_chapter_by_id(self, chapter_id: UUID) -> Optional[Chapter]:
        """Get a chapter by ID"""
        return self.db.query(Chapter).filter(Chapter.id == chapter_id).first()

    def update_chapter(self, chapter_id: UUID, chapter_data: ChapterUpdate, author_id: UUID) -> Optional[Chapter]:
        """Update a chapter (only by book author)"""
        chapter = self.db.query(Chapter).join(Book).filter(
            Chapter.id == chapter_id,
            Book.author_id == author_id
        ).first()
        
        if not chapter:
            return None
            
        update_data = chapter_data.dict(exclude_unset=True)
        
        for field, value in update_data.items():
            setattr(chapter, field, value)
            
        # Recalculate word count if content changed
        if "content" in update_data:
            chapter.word_count = len(update_data["content"].split())
            
        self.db.commit()
        self.db.refresh(chapter)
        return chapter

    def delete_chapter(self, chapter_id: UUID, author_id: UUID) -> bool:
        """Delete a chapter (only by book author)"""
        chapter = self.db.query(Chapter).join(Book).filter(
            Chapter.id == chapter_id,
            Book.author_id == author_id
        ).first()
        
        if not chapter:
            return False
            
        self.db.delete(chapter)
        self.db.commit()
        return True

    def get_book_stats(self, book_id: UUID) -> dict:
        """Get book statistics (chapter count, word count)"""
        stats = self.db.query(
            func.count(Chapter.id).label("chapter_count"),
            func.sum(Chapter.word_count).label("total_word_count")
        ).filter(Chapter.book_id == book_id).first()
        
        return {
            "chapter_count": stats.chapter_count or 0,
            "total_word_count": stats.total_word_count or 0
        }