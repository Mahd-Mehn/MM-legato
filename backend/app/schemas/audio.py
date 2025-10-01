from pydantic import BaseModel
from typing import Optional
from uuid import UUID

class AudioGenerationRequest(BaseModel):
    voice_id: Optional[str] = "JBFqnCBsd6RMkjVDRZzb"  # Default ElevenLabs voice
    
class AudioGenerationResponse(BaseModel):
    chapter_id: UUID
    audio_url: str
    duration_seconds: Optional[float]
    voice_id: str
    status: str  # "generating", "completed", "failed"
    
    class Config:
        from_attributes = True