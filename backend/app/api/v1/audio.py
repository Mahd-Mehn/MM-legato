from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
import cloudinary.uploader
from io import BytesIO
from elevenlabs.client import ElevenLabs

from app.core.database import get_db
from app.core.deps import get_current_user
from app.core.config import settings
from app.models.user import User
from app.models.book import Chapter
from app.schemas.audio import AudioGenerationRequest, AudioGenerationResponse

router = APIRouter()

@router.post("/generate/{chapter_id}", response_model=AudioGenerationResponse)
async def generate_chapter_audio(
    chapter_id: UUID,
    request: AudioGenerationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate audio for a chapter using ElevenLabs"""
    
    # Get chapter and verify access
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Check if user has access to this chapter (implement your access logic)
    # For now, assuming all published chapters are accessible
    if not chapter.is_published:
        raise HTTPException(status_code=403, detail="Chapter not published")
    
    try:
        # Initialize ElevenLabs client
        client = ElevenLabs(api_key=settings.ELEVENLABS_API_KEY)
        
        # Generate audio using ElevenLabs
        audio_generator = client.text_to_speech.convert(
            text=chapter.content,
            voice_id=request.voice_id or "JBFqnCBsd6RMkjVDRZzb",  # Default voice
            model_id="eleven_multilingual_v2",
            output_format="mp3_44100_128"
        )
        
        # Collect audio data
        audio_data = b"".join(audio_generator)
        
        # Upload to Cloudinary
        audio_buffer = BytesIO(audio_data)
        
        result = cloudinary.uploader.upload(
            audio_buffer,
            resource_type="video",  # Cloudinary uses "video" for audio files
            public_id=f"audio/chapters/{chapter_id}",
            format="mp3",
            folder="legato/audio"
        )
        
        # Update chapter with audio URL
        chapter.audio_url = result['secure_url']
        db.commit()
        
        return AudioGenerationResponse(
            chapter_id=chapter_id,
            audio_url=result['secure_url'],
            duration_seconds=None,  # ElevenLabs doesn't provide duration in response
            voice_id=request.voice_id or "JBFqnCBsd6RMkjVDRZzb",
            status="completed"
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate audio: {str(e)}"
        )

@router.get("/chapter/{chapter_id}", response_model=Optional[AudioGenerationResponse])
async def get_chapter_audio(
    chapter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get existing audio for a chapter"""
    
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    if not chapter.audio_url:
        return None
    
    return AudioGenerationResponse(
        chapter_id=chapter_id,
        audio_url=chapter.audio_url,
        duration_seconds=None,
        voice_id="JBFqnCBsd6RMkjVDRZzb",  # Default, we don't store this
        status="completed"
    )

@router.delete("/chapter/{chapter_id}")
async def delete_chapter_audio(
    chapter_id: UUID,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete audio for a chapter"""
    
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Clear audio URL
    chapter.audio_url = None
    db.commit()
    
    return {"message": "Audio deleted successfully"}

@router.get("/debug/auth")
async def debug_auth(current_user: User = Depends(get_current_user)):
    """Debug endpoint to test authentication"""
    return {
        "message": "Authentication successful",
        "user_id": str(current_user.id),
        "email": current_user.email,
        "username": current_user.username
    }