from fastapi import APIRouter, HTTPException, Depends, BackgroundTasks
from typing import List, Dict
from models import (
    TranslationRequest, TranslationResponse, TranslationEdit,
    LanguageDetectionRequest, LanguageDetectionResponse,
    TranslationSyncRequest
)
from translation_service import TranslationService

router = APIRouter(prefix="/translation", tags=["translation"])

# Dependency to get translation service
def get_translation_service() -> TranslationService:
    return TranslationService()

@router.post("/detect-language", response_model=LanguageDetectionResponse)
async def detect_language(
    request: LanguageDetectionRequest,
    service: TranslationService = Depends(get_translation_service)
):
    """Detect the language of given text"""
    try:
        return await service.detect_language(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Language detection failed: {str(e)}")

@router.post("/translate", response_model=TranslationResponse)
async def translate_content(
    request: TranslationRequest,
    background_tasks: BackgroundTasks,
    service: TranslationService = Depends(get_translation_service)
):
    """Translate content to target language"""
    try:
        # For high priority translations, process immediately
        if request.priority >= 4:
            return await service.translate_content(request)
        else:
            # For lower priority, add to background tasks
            background_tasks.add_task(service.translate_content, request)
            return {
                "message": "Translation queued for processing",
                "content_id": request.content_id,
                "status": "queued"
            }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@router.get("/translation/{translation_id}", response_model=TranslationResponse)
async def get_translation(
    translation_id: str,
    service: TranslationService = Depends(get_translation_service)
):
    """Get a specific translation by ID"""
    try:
        translation = await service.get_translation(translation_id)
        if not translation:
            raise HTTPException(status_code=404, detail="Translation not found")
        return translation
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve translation: {str(e)}")

@router.get("/content/{content_id}/translations", response_model=List[TranslationResponse])
async def get_content_translations(
    content_id: str,
    service: TranslationService = Depends(get_translation_service)
):
    """Get all translations for a specific content"""
    try:
        return await service.get_content_translations(content_id)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve translations: {str(e)}")

@router.put("/translation/{translation_id}/edit", response_model=TranslationResponse)
async def edit_translation(
    translation_id: str,
    edit_request: TranslationEdit,
    service: TranslationService = Depends(get_translation_service)
):
    """Edit an existing translation"""
    try:
        # Ensure the translation_id matches
        edit_request.translation_id = translation_id
        return await service.edit_translation(edit_request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to edit translation: {str(e)}")

@router.post("/sync")
async def sync_translations(
    sync_request: TranslationSyncRequest,
    background_tasks: BackgroundTasks,
    service: TranslationService = Depends(get_translation_service)
):
    """Synchronize translations when original content is updated"""
    try:
        result = await service.sync_translations(sync_request)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Translation sync failed: {str(e)}")

@router.get("/languages", response_model=Dict[str, str])
async def get_supported_languages(
    service: TranslationService = Depends(get_translation_service)
):
    """Get list of supported languages"""
    return service.get_supported_languages()

@router.get("/content/{content_id}/translation-status")
async def get_translation_status(
    content_id: str,
    service: TranslationService = Depends(get_translation_service)
):
    """Get translation status summary for content"""
    try:
        translations = await service.get_content_translations(content_id)
        
        status_summary = {
            "content_id": content_id,
            "total_translations": len(translations),
            "by_status": {},
            "by_language": {},
            "by_quality": {}
        }
        
        for translation in translations:
            # Count by status
            status = translation.status.value
            status_summary["by_status"][status] = status_summary["by_status"].get(status, 0) + 1
            
            # Count by language
            lang = translation.target_language
            status_summary["by_language"][lang] = status_summary["by_language"].get(lang, 0) + 1
            
            # Count by quality
            quality = translation.quality_score.value
            status_summary["by_quality"][quality] = status_summary["by_quality"].get(quality, 0) + 1
        
        return status_summary
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get translation status: {str(e)}")