from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File, Form
from sqlalchemy.orm import Session
from pydantic import BaseModel
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.services.character_service import CharacterService
from app.services.media_service import media_service
import json
from datetime import datetime

router = APIRouter()

def format_character_response(character) -> dict:
    """Format character object for API response."""
    response_data = {
        'id': str(character.id),
        'name': character.name,
        'image_url': character.image_url,
        'description': character.description,
        'title': character.title,
        'gender': character.gender,
        'age': character.age,
        'author_id': str(character.author_id),
        'created_at': character.created_at.isoformat() if character.created_at else None,
        'updated_at': character.updated_at.isoformat() if character.updated_at else None,
        'relationships': json.loads(character.relationships) if character.relationships else None
    }
    return response_data

# Pydantic models for request/response
class CharacterCreate(BaseModel):
    name: str
    image_url: Optional[str] = None
    description: Optional[str] = None
    title: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    relationships: Optional[dict] = None

class CharacterUpdate(BaseModel):
    name: Optional[str] = None
    image_url: Optional[str] = None
    description: Optional[str] = None
    title: Optional[str] = None
    gender: Optional[str] = None
    age: Optional[int] = None
    relationships: Optional[dict] = None

class CharacterResponse(BaseModel):
    id: str
    name: str
    image_url: Optional[str]
    description: Optional[str]
    title: Optional[str]
    gender: Optional[str]
    age: Optional[int]
    relationships: Optional[dict]
    author_id: str
    created_at: str
    updated_at: str

    class Config:
        from_attributes = True

class CharacterBookAssociation(BaseModel):
    book_id: str

@router.post("/", response_model=CharacterResponse)
def create_character(
    character_data: CharacterCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Create a new character profile."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can create characters"
        )
    
    service = CharacterService(db)
    character = service.create_character(
        author_id=str(current_user.id),
        **character_data.dict()
    )
    
    return CharacterResponse(**format_character_response(character))

@router.get("/", response_model=List[CharacterResponse])
def get_my_characters(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all characters created by the current user."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can access characters"
        )
    
    service = CharacterService(db)
    characters = service.get_characters_by_author(str(current_user.id))
    
    return [CharacterResponse(**format_character_response(character)) for character in characters]

@router.get("/{character_id}", response_model=CharacterResponse)
def get_character(
    character_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get a specific character by ID."""
    service = CharacterService(db)
    character = service.get_character_by_id(character_id)
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    # Check if user has access (either the author or for public reading)
    if character.author_id != str(current_user.id):
        # For now, only allow authors to access their characters
        # Later we can add logic for readers to view characters in books they have access to
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Access denied"
        )
    
    return CharacterResponse(**format_character_response(character))

@router.put("/{character_id}", response_model=CharacterResponse)
def update_character(
    character_id: str,
    character_data: CharacterUpdate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Update a character profile."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can update characters"
        )
    
    service = CharacterService(db)
    character = service.update_character(
        character_id=character_id,
        author_id=str(current_user.id),
        **character_data.dict(exclude_unset=True)
    )
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found or access denied"
        )
    
    return CharacterResponse(**format_character_response(character))

@router.delete("/{character_id}")
def delete_character(
    character_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Delete a character profile."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can delete characters"
        )
    
    service = CharacterService(db)
    success = service.delete_character(character_id, str(current_user.id))
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found or access denied"
        )
    
    return {"message": "Character deleted successfully"}

@router.post("/{character_id}/books")
def associate_character_with_book(
    character_id: str,
    association: CharacterBookAssociation,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Associate a character with a book."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can manage character associations"
        )
    
    service = CharacterService(db)
    success = service.associate_character_with_book(
        character_id=character_id,
        book_id=association.book_id,
        author_id=str(current_user.id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character or book not found, or access denied"
        )
    
    return {"message": "Character associated with book successfully"}

@router.delete("/{character_id}/books/{book_id}")
def remove_character_from_book(
    character_id: str,
    book_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Remove a character association from a book."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can manage character associations"
        )
    
    service = CharacterService(db)
    success = service.remove_character_from_book(
        character_id=character_id,
        book_id=book_id,
        author_id=str(current_user.id)
    )
    
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character or book not found, or access denied"
        )
    
    return {"message": "Character removed from book successfully"}

@router.post("/{character_id}/upload-image")
async def upload_character_image(
    character_id: str,
    file: UploadFile = File(...),
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Upload character image."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only writers can upload character images"
        )
    
    # Verify character ownership
    service = CharacterService(db)
    character = service.get_character_by_id(character_id)
    
    if not character:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Character not found"
        )
    
    if character.author_id != str(current_user.id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You don't have permission to upload image for this character"
        )
    
    try:
        # Upload to Cloudinary
        upload_result = await media_service.upload_character_image(file, character_id)
        
        # Update character's image URL
        character = service.update_character(
            character_id=character_id,
            author_id=str(current_user.id),
            image_url=upload_result['url']
        )
        
        return {
            "message": "Character image uploaded successfully",
            "url": upload_result['url']
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to upload character image: {str(e)}")

@router.get("/book/{book_id}", response_model=List[CharacterResponse])
def get_characters_by_book(
    book_id: str,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """Get all characters associated with a specific book."""
    service = CharacterService(db)
    characters = service.get_characters_by_book(book_id)
    
    return [CharacterResponse(**format_character_response(character)) for character in characters]