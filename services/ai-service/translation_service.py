import os
import uuid
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Optional, Tuple
from googletrans import Translator
from langdetect import detect, detect_langs
import httpx
from models import (
    TranslationRequest, TranslationResponse, TranslationEdit,
    LanguageDetectionRequest, LanguageDetectionResponse,
    TranslationSyncRequest, TranslationStatus, QualityScore
)
from database import db_manager

class TranslationService:
    def __init__(self):
        self.translator = Translator()
        self.google_translate_api_key = os.getenv("GOOGLE_TRANSLATE_API_KEY")
        self.supported_languages = {
            'en': 'English', 'es': 'Spanish', 'fr': 'French', 'de': 'German',
            'it': 'Italian', 'pt': 'Portuguese', 'ru': 'Russian', 'ja': 'Japanese',
            'ko': 'Korean', 'zh': 'Chinese', 'ar': 'Arabic', 'hi': 'Hindi',
            'sw': 'Swahili', 'yo': 'Yoruba', 'ha': 'Hausa', 'ig': 'Igbo',
            'am': 'Amharic', 'om': 'Oromo', 'ti': 'Tigrinya'
        }

    async def detect_language(self, request: LanguageDetectionRequest) -> LanguageDetectionResponse:
        """Detect the language of given text"""
        try:
            # Use langdetect for primary detection
            detected_langs = detect_langs(request.text)
            primary_lang = detected_langs[0]
            
            # Format possible languages
            possible_languages = [
                {"language": lang.lang, "confidence": lang.prob}
                for lang in detected_langs[:5]  # Top 5 possibilities
            ]
            
            return LanguageDetectionResponse(
                detected_language=primary_lang.lang,
                confidence=primary_lang.prob,
                possible_languages=possible_languages
            )
        except Exception as e:
            # Fallback to English if detection fails
            return LanguageDetectionResponse(
                detected_language="en",
                confidence=0.5,
                possible_languages=[{"language": "en", "confidence": 0.5}]
            )

    async def translate_content(self, request: TranslationRequest) -> TranslationResponse:
        """Translate content using Google Translate API"""
        translation_id = str(uuid.uuid4())
        
        try:
            # Check cache first
            cache_key = f"translation:{hash(request.source_text)}:{request.source_language}:{request.target_language}"
            cached_result = await db_manager.cache_get(cache_key)
            
            if cached_result:
                cached_data = json.loads(cached_result)
                translated_text = cached_data["text"]
                confidence = cached_data["confidence"]
            else:
                # Perform translation
                if self.google_translate_api_key:
                    translated_text, confidence = await self._translate_with_api(
                        request.source_text, request.source_language, request.target_language
                    )
                else:
                    # Fallback to googletrans library
                    translated_text, confidence = await self._translate_with_library(
                        request.source_text, request.source_language, request.target_language
                    )
                
                # Cache the result
                cache_data = {"text": translated_text, "confidence": confidence}
                await db_manager.cache_set(cache_key, json.dumps(cache_data), expire=86400)  # 24 hours

            # Assess quality
            quality_score = self._assess_quality(confidence)
            
            # Create translation record
            translation_data = {
                "translation_id": translation_id,
                "content_id": request.content_id,
                "content_type": request.content_type,
                "source_text": request.source_text,
                "translated_text": translated_text,
                "source_language": request.source_language,
                "target_language": request.target_language,
                "user_id": request.user_id,
                "quality_score": quality_score.value,
                "confidence": confidence,
                "status": TranslationStatus.COMPLETED.value,
                "priority": request.priority,
                "created_at": datetime.utcnow(),
                "completed_at": datetime.utcnow(),
                "edits": []
            }
            
            # Store in database
            collection = await db_manager.get_translation_collection()
            await collection.insert_one(translation_data)
            
            return TranslationResponse(
                translation_id=translation_id,
                content_id=request.content_id,
                translated_text=translated_text,
                source_language=request.source_language,
                target_language=request.target_language,
                quality_score=quality_score,
                confidence=confidence,
                status=TranslationStatus.COMPLETED,
                created_at=translation_data["created_at"],
                completed_at=translation_data["completed_at"]
            )
            
        except Exception as e:
            # Handle translation failure
            error_data = {
                "translation_id": translation_id,
                "content_id": request.content_id,
                "error": str(e),
                "status": TranslationStatus.FAILED.value,
                "created_at": datetime.utcnow()
            }
            
            collection = await db_manager.get_translation_collection()
            await collection.insert_one(error_data)
            
            raise Exception(f"Translation failed: {str(e)}")

    async def _translate_with_api(self, text: str, source_lang: str, target_lang: str) -> Tuple[str, float]:
        """Translate using Google Translate API"""
        url = f"https://translation.googleapis.com/language/translate/v2"
        
        params = {
            'key': self.google_translate_api_key,
            'q': text,
            'source': source_lang,
            'target': target_lang,
            'format': 'text'
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(url, data=params)
            response.raise_for_status()
            
            result = response.json()
            translated_text = result['data']['translations'][0]['translatedText']
            
            # API doesn't provide confidence, estimate based on text length and complexity
            confidence = min(0.95, 0.7 + (len(text) / 1000) * 0.2)
            
            return translated_text, confidence

    async def _translate_with_library(self, text: str, source_lang: str, target_lang: str) -> Tuple[str, float]:
        """Translate using googletrans library as fallback"""
        try:
            result = self.translator.translate(text, src=source_lang, dest=target_lang)
            confidence = getattr(result, 'confidence', 0.8)  # Default confidence if not available
            return result.text, confidence
        except Exception as e:
            raise Exception(f"Library translation failed: {str(e)}")

    def _assess_quality(self, confidence: float) -> QualityScore:
        """Assess translation quality based on confidence score"""
        if confidence >= 0.9:
            return QualityScore.EXCELLENT
        elif confidence >= 0.7:
            return QualityScore.GOOD
        elif confidence >= 0.5:
            return QualityScore.FAIR
        else:
            return QualityScore.POOR

    async def edit_translation(self, edit_request: TranslationEdit) -> TranslationResponse:
        """Edit an existing translation"""
        collection = await db_manager.get_translation_collection()
        
        # Find the translation
        translation = await collection.find_one({"translation_id": edit_request.translation_id})
        if not translation:
            raise Exception("Translation not found")
        
        # Add edit to history
        edit_record = {
            "editor_id": edit_request.editor_id,
            "original_text": translation["translated_text"],
            "edited_text": edit_request.edited_text,
            "edit_notes": edit_request.edit_notes,
            "edited_at": datetime.utcnow()
        }
        
        # Update translation
        await collection.update_one(
            {"translation_id": edit_request.translation_id},
            {
                "$set": {
                    "translated_text": edit_request.edited_text,
                    "status": TranslationStatus.MANUAL_REVIEW.value,
                    "quality_score": QualityScore.EXCELLENT.value,  # Manual edits are considered excellent
                    "updated_at": datetime.utcnow()
                },
                "$push": {"edits": edit_record}
            }
        )
        
        # Return updated translation
        updated_translation = await collection.find_one({"translation_id": edit_request.translation_id})
        
        return TranslationResponse(
            translation_id=updated_translation["translation_id"],
            content_id=updated_translation["content_id"],
            translated_text=updated_translation["translated_text"],
            source_language=updated_translation["source_language"],
            target_language=updated_translation["target_language"],
            quality_score=QualityScore(updated_translation["quality_score"]),
            confidence=updated_translation["confidence"],
            status=TranslationStatus(updated_translation["status"]),
            created_at=updated_translation["created_at"],
            completed_at=updated_translation.get("completed_at")
        )

    async def get_translation(self, translation_id: str) -> Optional[TranslationResponse]:
        """Get a translation by ID"""
        collection = await db_manager.get_translation_collection()
        translation = await collection.find_one({"translation_id": translation_id})
        
        if not translation:
            return None
        
        return TranslationResponse(
            translation_id=translation["translation_id"],
            content_id=translation["content_id"],
            translated_text=translation["translated_text"],
            source_language=translation["source_language"],
            target_language=translation["target_language"],
            quality_score=QualityScore(translation["quality_score"]),
            confidence=translation["confidence"],
            status=TranslationStatus(translation["status"]),
            created_at=translation["created_at"],
            completed_at=translation.get("completed_at")
        )

    async def get_content_translations(self, content_id: str) -> List[TranslationResponse]:
        """Get all translations for a specific content"""
        collection = await db_manager.get_translation_collection()
        translations = await collection.find({"content_id": content_id}).to_list(None)
        
        return [
            TranslationResponse(
                translation_id=t["translation_id"],
                content_id=t["content_id"],
                translated_text=t["translated_text"],
                source_language=t["source_language"],
                target_language=t["target_language"],
                quality_score=QualityScore(t["quality_score"]),
                confidence=t["confidence"],
                status=TranslationStatus(t["status"]),
                created_at=t["created_at"],
                completed_at=t.get("completed_at")
            )
            for t in translations
        ]

    async def sync_translations(self, sync_request: TranslationSyncRequest) -> Dict[str, str]:
        """Synchronize translations when original content is updated"""
        collection = await db_manager.get_translation_collection()
        
        # Mark translations as needing sync
        result = await collection.update_many(
            {"translation_id": {"$in": sync_request.translation_ids}},
            {
                "$set": {
                    "status": TranslationStatus.PENDING.value,
                    "sync_requested_at": datetime.utcnow()
                }
            }
        )
        
        return {
            "status": "sync_initiated",
            "updated_count": result.modified_count,
            "sync_type": sync_request.sync_type
        }

    def get_supported_languages(self) -> Dict[str, str]:
        """Get list of supported languages"""
        return self.supported_languages