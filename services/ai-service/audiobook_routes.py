from fastapi import APIRouter, HTTPException, BackgroundTasks, Query
from typing import List, Optional
import logging

from models import (
    AudiobookRequest, 
    AudiobookResponse
)
from audiobook_service import audiobook_service

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

router = APIRouter(prefix="/audiobook", tags=["audiobook"])

@router.post("/generate", response_model=AudiobookResponse)
async def generate_audiobook(request: AudiobookRequest, background_tasks: BackgroundTasks):
    """
    Generate audiobook from text content with voice selection and synchronization markers
    """
    try:
        logger.info(f"Generating audiobook for content_id: {request.content_id}")
        
        # Validate request
        if not request.text.strip():
            raise HTTPException(status_code=400, detail="Text content cannot be empty")
        
        if len(request.text) > 50000:  # Limit text length
            raise HTTPException(status_code=400, detail="Text content too long (max 50,000 characters)")
        
        # Generate audiobook
        result = await audiobook_service.generate_audiobook(request)
        
        logger.info(f"Audiobook generated successfully: {result.audiobook_id}")
        return result
        
    except Exception as e:
        logger.error(f"Audiobook generation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Audiobook generation failed: {str(e)}")

@router.get("/{audiobook_id}", response_model=dict)
async def get_audiobook(audiobook_id: str):
    """
    Retrieve audiobook details by ID
    """
    try:
        audiobook = await audiobook_service.get_audiobook(audiobook_id)
        
        if not audiobook:
            raise HTTPException(status_code=404, detail="Audiobook not found")
        
        # Convert MongoDB ObjectId to string for JSON serialization
        if '_id' in audiobook:
            audiobook['_id'] = str(audiobook['_id'])
        
        return audiobook
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve audiobook {audiobook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audiobook")

@router.get("/content/{content_id}", response_model=List[dict])
async def get_audiobooks_by_content(content_id: str):
    """
    Get all audiobooks for a specific content piece
    """
    try:
        audiobooks = await audiobook_service.get_audiobooks_by_content(content_id)
        
        # Convert MongoDB ObjectIds to strings
        for audiobook in audiobooks:
            if '_id' in audiobook:
                audiobook['_id'] = str(audiobook['_id'])
        
        return audiobooks
        
    except Exception as e:
        logger.error(f"Failed to retrieve audiobooks for content {content_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve audiobooks")

@router.delete("/{audiobook_id}")
async def delete_audiobook(audiobook_id: str):
    """
    Delete audiobook and associated files
    """
    try:
        success = await audiobook_service.delete_audiobook(audiobook_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Audiobook not found")
        
        return {"message": "Audiobook deleted successfully"}
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to delete audiobook {audiobook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to delete audiobook")

@router.post("/{audiobook_id}/optimize-mobile")
async def optimize_audiobook_for_mobile(audiobook_id: str):
    """
    Optimize audiobook for mobile streaming with adaptive quality
    """
    try:
        result = await audiobook_service.optimize_for_mobile(audiobook_id)
        return result
        
    except Exception as e:
        logger.error(f"Mobile optimization failed for {audiobook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Mobile optimization failed: {str(e)}")

@router.get("/{audiobook_id}/sync-markers")
async def get_sync_markers(audiobook_id: str):
    """
    Get audio-text synchronization markers for an audiobook
    """
    try:
        audiobook = await audiobook_service.get_audiobook(audiobook_id)
        
        if not audiobook:
            raise HTTPException(status_code=404, detail="Audiobook not found")
        
        sync_markers = audiobook.get("sync_markers", [])
        
        return {
            "audiobook_id": audiobook_id,
            "sync_markers": sync_markers,
            "total_markers": len(sync_markers),
            "duration": audiobook.get("duration", 0)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to retrieve sync markers for {audiobook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve sync markers")

@router.get("/voices/available")
async def get_available_voices(language: Optional[str] = Query(None, description="Language code to filter voices")):
    """
    Get available voices for text-to-speech generation
    """
    try:
        # This would typically query the TTS service for available voices
        # For now, returning predefined voice configurations
        
        all_voices = {
            "en": {
                "voices": [
                    {"id": "en-US-AriaNeural", "name": "Aria", "gender": "female", "description": "Natural female voice"},
                    {"id": "en-US-DavisNeural", "name": "Davis", "gender": "male", "description": "Natural male voice"},
                    {"id": "en-US-GuyNeural", "name": "Guy", "gender": "male", "description": "Narrator voice"},
                    {"id": "en-US-JennyNeural", "name": "Jenny", "gender": "female", "description": "Conversational female voice"}
                ]
            },
            "es": {
                "voices": [
                    {"id": "es-ES-ElviraNeural", "name": "Elvira", "gender": "female", "description": "Spanish female voice"},
                    {"id": "es-ES-AlvaroNeural", "name": "Alvaro", "gender": "male", "description": "Spanish male voice"}
                ]
            },
            "fr": {
                "voices": [
                    {"id": "fr-FR-DeniseNeural", "name": "Denise", "gender": "female", "description": "French female voice"},
                    {"id": "fr-FR-HenriNeural", "name": "Henri", "gender": "male", "description": "French male voice"}
                ]
            },
            "de": {
                "voices": [
                    {"id": "de-DE-KatjaNeural", "name": "Katja", "gender": "female", "description": "German female voice"},
                    {"id": "de-DE-ConradNeural", "name": "Conrad", "gender": "male", "description": "German male voice"}
                ]
            }
        }
        
        if language:
            lang_code = language[:2].lower()
            if lang_code in all_voices:
                return {
                    "language": language,
                    "voices": all_voices[lang_code]["voices"]
                }
            else:
                return {
                    "language": language,
                    "voices": [],
                    "message": f"No voices available for language: {language}"
                }
        
        return {
            "all_languages": all_voices
        }
        
    except Exception as e:
        logger.error(f"Failed to retrieve available voices: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to retrieve available voices")

@router.get("/{audiobook_id}/status")
async def get_audiobook_status(audiobook_id: str):
    """
    Get the current status of audiobook generation
    """
    try:
        audiobook = await audiobook_service.get_audiobook(audiobook_id)
        
        if not audiobook:
            raise HTTPException(status_code=404, detail="Audiobook not found")
        
        return {
            "audiobook_id": audiobook_id,
            "status": audiobook.get("status", "unknown"),
            "created_at": audiobook.get("created_at"),
            "completed_at": audiobook.get("completed_at"),
            "duration": audiobook.get("duration"),
            "error": audiobook.get("error")
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to get status for audiobook {audiobook_id}: {str(e)}")
        raise HTTPException(status_code=500, detail="Failed to get audiobook status")