from fastapi import APIRouter, Depends, HTTPException, Query, UploadFile, File
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
from uuid import UUID
import json
import math

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.book_service import BookService
from app.services.media_service import media_service
from app.schemas.book import (
    BookCreate, BookUpdate, BookResponse, BookListResponse, 
    BookFilters, BookListPaginatedResponse,
    ChapterCreate, ChapterUpdate, ChapterResponse
)

router = APIRouter()

@router.get("/recommended")
async def get_recommended_books(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get recommended books for the user"""
    try:
        # For now, return some published books - implement real recommendation logic later
        books = db.query(Book).join(User).filter(Book.is_published == True).limit(8).all()
        
        result = []
        for book in books:
            result.append({
                "id": str(book.id),
                "title": book.title,
                "author": book.author.username if book.author else "Unknown",
                "price": book.fixed_price if book.pricing_model == 'fixed' else book.per_chapter_price,
                "is_free": book.pricing_model == 'free',
                "cover_url": book.cover_image_url,
                "rating": 4.5  # Mock rating
            })
        
        return result
    except Exception as e:
        # Return empty list if there's an error
        return []

@router.get("/", response_model=BookListPaginatedResponse)
async def get_books(
    search: Optional[str] = Query(None, description="Search in title, description, author, genre"),
    genre: Optional[str] = Query(None, description="Filter by genre"),
    tags: Optional[str] = Query(None, description="Comma-separated list of tags to include"),
    excluded_tags: Optional[str] = Query(None, description="Comma-separated list of tags to exclude"),
    pricing_model: Optional[str] = Query(None, description="Filter by pricing model: free, fixed, per_chapter"),
    min_price: Optional[int] = Query(None, ge=0, description="Minimum price in coins"),
    max_price: Optional[int] = Query(None, ge=0, description="Maximum price in coins"),
    min_rating: Optional[float] = Query(None, ge=0, le=5, description="Minimum rating"),
    author_id: Optional[str] = Query(None, description="Filter by author ID or 'me' for current user"),
    is_published: Optional[bool] = Query(None, description="Filter by published status"),
    page: int = Query(1, ge=1, description="Page number"),
    limit: int = Query(20, ge=1, le=100, description="Items per page"),
    sort_by: Optional[str] = Query("created_at", pattern="^(created_at|title|rating|price)$"),
    sort_order: Optional[str] = Query("desc", pattern="^(asc|desc)$"),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get books with filtering, pagination, and sorting"""
    
    # Parse comma-separated tags
    tags_list = [tag.strip() for tag in tags.split(",")] if tags else []
    excluded_tags_list = [tag.strip() for tag in excluded_tags.split(",")] if excluded_tags else []
    
    # Handle "me" author_id case
    actual_author_id = None
    if author_id:
        if author_id.lower() == "me":
            actual_author_id = current_user.id
        else:
            try:
                actual_author_id = UUID(author_id)
            except ValueError:
                raise HTTPException(status_code=400, detail="Invalid author_id format")
    
    filters = BookFilters(
        search=search,
        genre=genre,
        tags=tags_list,
        excluded_tags=excluded_tags_list,
        pricing_model=pricing_model,
        min_price=min_price,
        max_price=max_price,
        min_rating=min_rating,
        author_id=actual_author_id,
        is_published=is_published,
        page=page,
        limit=limit,
        sort_by=sort_by,
        sort_order=sort_order
    )
    
    book_service = BookService(db)
    books, total = book_service.get_books_with_filters(filters)
    
    # Convert books to response format with stats
    book_responses = []
    for book in books:
        stats = book_service.get_book_stats(book.id)
        
        # Parse tags from JSON string
        try:
            tags_parsed = json.loads(book.tags) if book.tags else []
        except (json.JSONDecodeError, TypeError):
            tags_parsed = []
        
        book_dict = {
            "id": book.id,
            "title": book.title,
            "description": book.description,
            "cover_image_url": book.cover_image_url,
            "author_id": book.author_id,
            "pricing_model": book.pricing_model,
            "fixed_price": book.fixed_price,
            "per_chapter_price": book.per_chapter_price,
            "genre": book.genre,
            "tags": tags_parsed,
            "is_published": book.is_published,
            "created_at": book.created_at,
            "author": {
                "id": book.author.id,
                "username": book.author.username,
                "profile_picture_url": book.author.profile_picture_url
            } if book.author else None,
            "chapter_count": stats["chapter_count"],
            "total_word_count": stats["total_word_count"]
        }
        book_responses.append(BookListResponse(**book_dict))
    
    total_pages = math.ceil(total / limit)
    
    return BookListPaginatedResponse(
        books=book_responses,
        total=total,
        page=page,
        limit=limit,
        total_pages=total_pages,
        has_next=page < total_pages,
        has_prev=page > 1
    )

@router.get("/{book_id}", response_model=BookResponse)
async def get_book(
    book_id: UUID,
    include_chapters: bool = Query(False, description="Include chapters in response"),
    db: Session = Depends(get_db)
):
    """Get a specific book by ID"""
    book_service = BookService(db)
    book = book_service.get_book_by_id(book_id, include_chapters=include_chapters)
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    # Parse tags from JSON string
    try:
        tags_parsed = json.loads(book.tags) if book.tags else []
    except (json.JSONDecodeError, TypeError):
        tags_parsed = []
    
    # Get book stats
    stats = book_service.get_book_stats(book.id)
    
    book_dict = {
        "id": book.id,
        "title": book.title,
        "description": book.description,
        "cover_image_url": book.cover_image_url,
        "author_id": book.author_id,
        "pricing_model": book.pricing_model,
        "fixed_price": book.fixed_price,
        "per_chapter_price": book.per_chapter_price,
        "genre": book.genre,
        "tags": tags_parsed,
        "is_published": book.is_published,
        "license_hash": book.license_hash,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
        "author": {
            "id": book.author.id,
            "username": book.author.username,
            "profile_picture_url": book.author.profile_picture_url
        } if book.author else None,
        "chapters": [
            {
                "id": chapter.id,
                "book_id": chapter.book_id,
                "title": chapter.title,
                "content": chapter.content,
                "chapter_number": chapter.chapter_number,
                "word_count": chapter.word_count,
                "is_published": chapter.is_published,
                "audio_url": chapter.audio_url,
                "created_at": chapter.created_at,
                "updated_at": chapter.updated_at
            }
            for chapter in book.chapters
        ] if include_chapters and book.chapters else [],
        "chapter_count": stats["chapter_count"],
        "total_word_count": stats["total_word_count"]
    }
    
    return BookResponse(**book_dict)

@router.post("/", response_model=BookResponse)
async def create_book(
    book_data: BookCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new book (writers only)"""
    if not current_user.is_writer:
        raise HTTPException(status_code=403, detail="Only writers can create books")
    
    book_service = BookService(db)
    book = book_service.create_book(book_data, current_user.id)
    
    # Parse tags for response
    try:
        tags_parsed = json.loads(book.tags) if book.tags else []
    except (json.JSONDecodeError, TypeError):
        tags_parsed = []
    
    stats = book_service.get_book_stats(book.id)
    
    book_dict = {
        "id": book.id,
        "title": book.title,
        "description": book.description,
        "cover_image_url": book.cover_image_url,
        "author_id": book.author_id,
        "pricing_model": book.pricing_model,
        "fixed_price": book.fixed_price,
        "per_chapter_price": book.per_chapter_price,
        "genre": book.genre,
        "tags": tags_parsed,
        "is_published": book.is_published,
        "license_hash": book.license_hash,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
        "author": None,  # Will be loaded separately if needed
        "chapters": [],
        "chapter_count": stats["chapter_count"],
        "total_word_count": stats["total_word_count"]
    }
    
    return BookResponse(**book_dict)

@router.put("/{book_id}", response_model=BookResponse)
async def update_book(
    book_id: UUID,
    book_data: BookUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a book (author only)"""
    book_service = BookService(db)
    book = book_service.update_book(book_id, book_data, current_user.id)
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found or you don't have permission")
    
    # Parse tags for response
    try:
        tags_parsed = json.loads(book.tags) if book.tags else []
    except (json.JSONDecodeError, TypeError):
        tags_parsed = []
    
    stats = book_service.get_book_stats(book.id)
    
    book_dict = {
        "id": book.id,
        "title": book.title,
        "description": book.description,
        "cover_image_url": book.cover_image_url,
        "author_id": book.author_id,
        "pricing_model": book.pricing_model,
        "fixed_price": book.fixed_price,
        "per_chapter_price": book.per_chapter_price,
        "genre": book.genre,
        "tags": tags_parsed,
        "is_published": book.is_published,
        "license_hash": book.license_hash,
        "created_at": book.created_at,
        "updated_at": book.updated_at,
        "author": None,
        "chapters": [],
        "chapter_count": stats["chapter_count"],
        "total_word_count": stats["total_word_count"]
    }
    
    return BookResponse(**book_dict)

@router.delete("/{book_id}")
async def delete_book(
    book_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a book (author only)"""
    book_service = BookService(db)
    success = book_service.delete_book(book_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Book not found or you don't have permission")
    
    return {"message": "Book deleted successfully"}

@router.get("/{book_id}/chapters", response_model=List[ChapterResponse])
async def get_book_chapters(
    book_id: UUID,
    db: Session = Depends(get_db)
):
    """Get all chapters for a book"""
    book_service = BookService(db)
    
    # Verify book exists
    book = book_service.get_book_by_id(book_id)
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    chapters = book_service.get_book_chapters(book_id)
    return chapters

@router.post("/{book_id}/chapters", response_model=ChapterResponse)
async def create_chapter(
    book_id: UUID,
    chapter_data: ChapterCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Create a new chapter (book author only)"""
    book_service = BookService(db)
    chapter = book_service.create_chapter(book_id, chapter_data, current_user.id)
    
    if not chapter:
        raise HTTPException(
            status_code=404, 
            detail="Book not found, you don't have permission, or chapter number already exists"
        )
    
    return chapter

@router.get("/chapters/{chapter_id}", response_model=ChapterResponse)
async def get_chapter(
    chapter_id: UUID,
    db: Session = Depends(get_db)
):
    """Get a specific chapter by ID"""
    book_service = BookService(db)
    chapter = book_service.get_chapter_by_id(chapter_id)
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    return chapter

@router.put("/chapters/{chapter_id}", response_model=ChapterResponse)
async def update_chapter(
    chapter_id: UUID,
    chapter_data: ChapterUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update a chapter (book author only)"""
    book_service = BookService(db)
    chapter = book_service.update_chapter(chapter_id, chapter_data, current_user.id)
    
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found or you don't have permission")
    
    return chapter

@router.delete("/chapters/{chapter_id}")
async def delete_chapter(
    chapter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete a chapter (book author only)"""
    book_service = BookService(db)
    success = book_service.delete_chapter(chapter_id, current_user.id)
    
    if not success:
        raise HTTPException(status_code=404, detail="Chapter not found or you don't have permission")
    
    return {"message": "Chapter deleted successfully"}

@router.post("/{book_id}/upload-cover")
async def upload_book_cover(
    book_id: UUID,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Upload book cover image (book author only)"""
    
    # Verify book ownership
    book_service = BookService(db)
    book = book_service.get_book_by_id(book_id)
    
    if not book:
        raise HTTPException(status_code=404, detail="Book not found")
    
    if book.author_id != current_user.id:
        raise HTTPException(status_code=403, detail="You don't have permission to upload cover for this book")
    
    try:
        # Upload to Cloudinary
        upload_result = await media_service.upload_book_cover(file, str(book_id))
        
        # Update book's cover image URL
        book.cover_image_url = upload_result['url']
        db.commit()
        
        return {
            "message": "Book cover uploaded successfully",
            "url": upload_result['url']
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload book cover: {str(e)}")