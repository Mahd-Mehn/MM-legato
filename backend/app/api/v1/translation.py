from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import Optional
from uuid import UUID
from deep_translator import GoogleTranslator

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.book import Chapter
from app.schemas.translation import TranslationRequest, TranslationResponse

router = APIRouter()

# Supported languages mapping
SUPPORTED_LANGUAGES = {
    'en': 'English',
    'es': 'Spanish',
    'fr': 'French',
    'de': 'German',
    'it': 'Italian',
    'pt': 'Portuguese',
    'ru': 'Russian',
    'ja': 'Japanese',
    'ko': 'Korean',
    'zh': 'Chinese (Simplified)',
    'ar': 'Arabic',
    'hi': 'Hindi',
    'nl': 'Dutch',
    'sv': 'Swedish',
    'no': 'Norwegian',
    'da': 'Danish',
    'fi': 'Finnish',
    'pl': 'Polish',
    'tr': 'Turkish',
    'th': 'Thai',
    'vi': 'Vietnamese'
}

@router.get("/languages")
async def get_supported_languages():
    """Get list of supported translation languages"""
    return {"languages": SUPPORTED_LANGUAGES}

@router.post("/translate/{chapter_id}", response_model=TranslationResponse)
async def translate_chapter(
    chapter_id: UUID,
    request: TranslationRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Translate chapter content to specified language"""
    
    # Get chapter and verify access
    chapter = db.query(Chapter).filter(Chapter.id == chapter_id).first()
    if not chapter:
        raise HTTPException(status_code=404, detail="Chapter not found")
    
    # Check if user has access to this chapter
    if not chapter.is_published:
        raise HTTPException(status_code=403, detail="Chapter not published")
    
    # Validate target language
    if request.target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported language: {request.target_language}"
        )
    
    try:
        # Translate the content
        # For long texts, we might need to split into chunks
        content = chapter.content
        
        # Split content into chunks if it's too long (Google Translate has limits)
        max_chunk_size = 4000  # Conservative limit
        chunks = []
        
        if len(content) <= max_chunk_size:
            chunks = [content]
        else:
            # Split by paragraphs first, then by sentences if needed
            paragraphs = content.split('\n\n')
            current_chunk = ""
            
            for paragraph in paragraphs:
                if len(current_chunk + paragraph) <= max_chunk_size:
                    current_chunk += paragraph + '\n\n'
                else:
                    if current_chunk:
                        chunks.append(current_chunk.strip())
                    current_chunk = paragraph + '\n\n'
            
            if current_chunk:
                chunks.append(current_chunk.strip())
        
        # Translate each chunk
        translated_chunks = []
        source_language = 'auto'
        
        for chunk in chunks:
            if chunk.strip():  # Skip empty chunks
                translator = GoogleTranslator(source='auto', target=request.target_language)
                translated_text = translator.translate(chunk)
                translated_chunks.append(translated_text)
        
        # Join translated chunks
        translated_content = '\n\n'.join(translated_chunks)
        
        return TranslationResponse(
            chapter_id=chapter_id,
            original_language=source_language,
            target_language=request.target_language,
            translated_content=translated_content,
            original_content=content
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Translation failed: {str(e)}"
        )

@router.post("/translate-text", response_model=dict)
async def translate_text(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Translate arbitrary text (for selected quotes)"""
    
    text = request.get('text', '')
    target_language = request.get('target_language', 'en')
    
    if not text:
        raise HTTPException(status_code=400, detail="Text is required")
    
    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(
            status_code=400, 
            detail=f"Unsupported language: {target_language}"
        )
    
    try:
        translator = GoogleTranslator(source='auto', target=target_language)
        translated_text = translator.translate(text)
        
        return {
            "original_text": text,
            "translated_text": translated_text,
            "source_language": "auto",
            "target_language": target_language
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Translation failed: {str(e)}"
        )