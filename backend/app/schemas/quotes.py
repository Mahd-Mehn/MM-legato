from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class QuoteImageRequest(BaseModel):
    quote_text: str
    chapter_id: Optional[UUID] = None
    background_color: Optional[str] = None  # Hex color like "#1e293b"
    text_color: Optional[str] = "#ffffff"
    font_size: Optional[int] = 32
    width: Optional[int] = 800
    height: Optional[int] = 600
    
class QuoteImageResponse(BaseModel):
    image_url: str
    quote_text: str
    book_title: Optional[str]
    author_name: Optional[str]
    chapter_title: Optional[str]
    
    class Config:
        from_attributes = True