from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class TranslationRequest(BaseModel):
    target_language: str  # Language code like 'es', 'fr', 'de'
    
class TranslationResponse(BaseModel):
    chapter_id: UUID
    original_language: str
    target_language: str
    translated_content: str
    original_content: str
    
    class Config:
        from_attributes = True