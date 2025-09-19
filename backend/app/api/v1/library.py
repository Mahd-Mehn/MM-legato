from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.library import UserLibrary
from app.models.book import Book
from app.schemas.library import LibraryResponse, AddToLibraryRequest, ReadingHistoryResponse
from app.services.library_service import LibraryService

router = APIRouter()

@router.get("/", response_model=List[LibraryResponse])
async def get_user_library(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's library books"""
    library_service = LibraryService(db)
    return library_service.get_user_library(current_user.id)

@router.post("/add")
async def add_book_to_library(
    request: AddToLibraryRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Add a book to user's library"""
    library_service = LibraryService(db)
    
    # Check if book exists
    book = db.query(Book).filter(Book.id == request.book_id).first()
    if not book:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found"
        )
    
    # Check if book is already in library
    existing_entry = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == request.book_id
    ).first()
    
    if existing_entry:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Book already in library"
        )
    
    return library_service.add_book_to_library(current_user.id, request.book_id)

@router.delete("/{book_id}")
async def remove_book_from_library(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a book from user's library (soft delete)"""
    library_service = LibraryService(db)
    
    # Check if book is in user's library
    library_entry = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == book_id
    ).first()
    
    if not library_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in library"
        )
    
    return library_service.remove_book_from_library(current_user.id, book_id)

@router.get("/history", response_model=List[ReadingHistoryResponse])
async def get_reading_history(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get user's reading history (all previously accessed books)"""
    library_service = LibraryService(db)
    return library_service.get_reading_history(current_user.id)

@router.post("/vault/{book_id}")
async def move_book_to_vault(
    book_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move a book to/from vault"""
    library_service = LibraryService(db)
    
    # Check if book is in user's library
    library_entry = db.query(UserLibrary).filter(
        UserLibrary.user_id == current_user.id,
        UserLibrary.book_id == book_id
    ).first()
    
    if not library_entry:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Book not found in library"
        )
    
    return library_service.toggle_vault_status(current_user.id, book_id)

@router.get("/continue-reading")
async def get_continue_reading(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get books user is currently reading with progress"""
    # For now, return empty list - implement real logic later
    return {
        "books": [],
        "message": "No books in progress"
    }