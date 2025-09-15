from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any, Union
from datetime import datetime
from enum import Enum

class TranslationStatus(str, Enum):
    PENDING = "pending"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    FAILED = "failed"
    MANUAL_REVIEW = "manual_review"

class QualityScore(str, Enum):
    EXCELLENT = "excellent"  # 90-100%
    GOOD = "good"           # 70-89%
    FAIR = "fair"           # 50-69%
    POOR = "poor"           # Below 50%

class TranslationRequest(BaseModel):
    content_id: str = Field(..., description="Unique identifier for the content")
    content_type: str = Field(..., description="Type of content (story, chapter)")
    source_text: str = Field(..., description="Text to be translated")
    source_language: str = Field(..., description="Source language code (e.g., 'en')")
    target_language: str = Field(..., description="Target language code (e.g., 'es')")
    user_id: str = Field(..., description="ID of the user requesting translation")
    priority: int = Field(default=1, description="Translation priority (1-5)")

class TranslationResponse(BaseModel):
    translation_id: str
    content_id: str
    translated_text: str
    source_language: str
    target_language: str
    quality_score: QualityScore
    confidence: float = Field(..., ge=0.0, le=1.0)
    status: TranslationStatus
    created_at: datetime
    completed_at: Optional[datetime] = None

class TranslationEdit(BaseModel):
    translation_id: str
    edited_text: str
    editor_id: str
    edit_notes: Optional[str] = None

class LanguageDetectionRequest(BaseModel):
    text: str = Field(..., description="Text to detect language for")

class LanguageDetectionResponse(BaseModel):
    detected_language: str
    confidence: float = Field(..., ge=0.0, le=1.0)
    possible_languages: List[Dict[str, Union[str, float]]]

class TranslationSyncRequest(BaseModel):
    original_content_id: str
    translation_ids: List[str]
    sync_type: str = Field(default="update", description="Type of sync operation")

class AudiobookRequest(BaseModel):
    content_id: str = Field(..., description="Unique identifier for the content")
    text: str = Field(..., description="Text to convert to audio")
    language: str = Field(..., description="Language code for TTS")
    voice_id: Optional[str] = Field(None, description="Specific voice to use")
    speed: float = Field(default=1.0, ge=0.5, le=2.0, description="Speech speed")
    user_id: str = Field(..., description="ID of the user requesting audiobook")

class AudiobookResponse(BaseModel):
    audiobook_id: str
    content_id: str
    audio_url: str
    duration: float  # in seconds
    language: str
    voice_id: str
    status: str
    created_at: datetime

class ContentAdaptationRequest(BaseModel):
    content_id: str
    source_text: str
    adaptation_type: str = Field(..., description="Type of adaptation (script, comic, game)")
    target_format: str = Field(..., description="Target format specifications")
    user_id: str

class ContentAdaptationResponse(BaseModel):
    adaptation_id: str
    content_id: str
    adapted_content: str
    adaptation_type: str
    status: str
    created_at: datetime