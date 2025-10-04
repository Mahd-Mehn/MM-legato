from pydantic import BaseModel
from typing import Optional
from datetime import datetime
from uuid import UUID

class AddToLibraryRequest(BaseModel):
    book_id: UUID

class LibraryResponse(BaseModel):
    id: UUID
    book_id: UUID
    is_in_vault: bool
    created_at: datetime
    book_title: str
    book_description: Optional[str]
    book_cover_image_url: Optional[str]
    author_username: str
    genre: Optional[str]
    tags: Optional[str]
    
    class Config:
        from_attributes = True

class ReadingHistoryResponse(BaseModel):
    book_id: UUID
    book_title: str
    book_description: Optional[str]
    book_cover_image_url: Optional[str]
    author_username: str
    genre: Optional[str]
    last_accessed: datetime
    is_in_library: bool
    
    class Config:
        from_attributes = True