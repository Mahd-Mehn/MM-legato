import pytest
import asyncio
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from models import (
    TranslationRequest, LanguageDetectionRequest, TranslationEdit,
    TranslationStatus, QualityScore
)
from translation_service import TranslationService
from database import db_manager

@pytest.fixture
async def translation_service():
    """Create a translation service instance for testing"""
    service = TranslationService()
    return service

@pytest.fixture
async def mock_db():
    """Mock database for testing"""
    with patch.object(db_manager, 'get_translation_collection') as mock_collection:
        mock_collection.return_value = AsyncMock()
        yield mock_collection.return_value

class TestLanguageDetection:
    @pytest.mark.asyncio
    async def test_detect_language_english(self, translation_service):
        """Test language detection for English text"""
        request = LanguageDetectionRequest(text="Hello, this is a test message in English.")
        
        with patch('langdetect.detect_langs') as mock_detect:
            mock_lang = Mock()
            mock_lang.lang = 'en'
            mock_lang.prob = 0.95
            mock_detect.return_value = [mock_lang]
            
            result = await translation_service.detect_language(request)
            
            assert result.detected_language == 'en'
            assert result.confidence == 0.95
            assert len(result.possible_languages) == 1

    @pytest.mark.asyncio
    async def test_detect_language_fallback(self, translation_service):
        """Test language detection fallback when detection fails"""
        request = LanguageDetectionRequest(text="")
        
        with patch('langdetect.detect_langs', side_effect=Exception("Detection failed")):
            result = await translation_service.detect_language(request)
            
            assert result.detected_language == 'en'
            assert result.confidence == 0.5

class TestTranslation:
    @pytest.mark.asyncio
    async def test_translate_content_success(self, translation_service, mock_db):
        """Test successful content translation"""
        request = TranslationRequest(
            content_id="test-content-1",
            content_type="chapter",
            source_text="Hello world",
            source_language="en",
            target_language="es",
            user_id="user-123"
        )
        
        with patch.object(translation_service, '_translate_with_library') as mock_translate:
            mock_translate.return_value = ("Hola mundo", 0.85)
            
            with patch.object(db_manager, 'cache_get', return_value=None):
                with patch.object(db_manager, 'cache_set'):
                    result = await translation_service.translate_content(request)
                    
                    assert result.content_id == "test-content-1"
                    assert result.translated_text == "Hola mundo"
                    assert result.source_language == "en"
                    assert result.target_language == "es"
                    assert result.status == TranslationStatus.COMPLETED
                    assert result.quality_score == QualityScore.GOOD

    @pytest.mark.asyncio
    async def test_translate_content_cached(self, translation_service, mock_db):
        """Test translation with cached result"""
        request = TranslationRequest(
            content_id="test-content-2",
            content_type="chapter",
            source_text="Hello world",
            source_language="en",
            target_language="es",
            user_id="user-123"
        )
        
        cached_data = '{"text": "Hola mundo (cached)", "confidence": 0.9}'
        
        with patch.object(db_manager, 'cache_get', return_value=cached_data):
            result = await translation_service.translate_content(request)
            
            assert result.translated_text == "Hola mundo (cached)"
            assert result.confidence == 0.9

    @pytest.mark.asyncio
    async def test_translate_with_api(self, translation_service):
        """Test translation using Google Translate API"""
        with patch.dict('os.environ', {'GOOGLE_TRANSLATE_API_KEY': 'test-key'}):
            translation_service.google_translate_api_key = 'test-key'
            
            mock_response = Mock()
            mock_response.json.return_value = {
                'data': {
                    'translations': [{'translatedText': 'Hola mundo'}]
                }
            }
            mock_response.raise_for_status = Mock()
            
            with patch('httpx.AsyncClient') as mock_client:
                mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
                
                result = await translation_service._translate_with_api("Hello world", "en", "es")
                
                assert result[0] == "Hola mundo"
                assert isinstance(result[1], float)

    @pytest.mark.asyncio
    async def test_translate_with_library(self, translation_service):
        """Test translation using googletrans library"""
        mock_result = Mock()
        mock_result.text = "Hola mundo"
        mock_result.confidence = 0.8
        
        with patch.object(translation_service.translator, 'translate', return_value=mock_result):
            result = await translation_service._translate_with_library("Hello world", "en", "es")
            
            assert result[0] == "Hola mundo"
            assert result[1] == 0.8

    def test_assess_quality(self, translation_service):
        """Test quality assessment based on confidence"""
        assert translation_service._assess_quality(0.95) == QualityScore.EXCELLENT
        assert translation_service._assess_quality(0.8) == QualityScore.GOOD
        assert translation_service._assess_quality(0.6) == QualityScore.FAIR
        assert translation_service._assess_quality(0.4) == QualityScore.POOR

class TestTranslationEditing:
    @pytest.mark.asyncio
    async def test_edit_translation(self, translation_service, mock_db):
        """Test editing an existing translation"""
        # Mock existing translation
        existing_translation = {
            "translation_id": "trans-123",
            "content_id": "content-1",
            "translated_text": "Original translation",
            "source_language": "en",
            "target_language": "es",
            "quality_score": "good",
            "confidence": 0.8,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        
        mock_db.find_one.return_value = existing_translation
        mock_db.update_one.return_value = Mock()
        
        # After update
        updated_translation = existing_translation.copy()
        updated_translation["translated_text"] = "Edited translation"
        updated_translation["status"] = "manual_review"
        mock_db.find_one.side_effect = [existing_translation, updated_translation]
        
        edit_request = TranslationEdit(
            translation_id="trans-123",
            edited_text="Edited translation",
            editor_id="editor-456",
            edit_notes="Improved accuracy"
        )
        
        result = await translation_service.edit_translation(edit_request)
        
        assert result.translated_text == "Edited translation"
        assert result.status == TranslationStatus.MANUAL_REVIEW
        assert result.quality_score == QualityScore.EXCELLENT

    @pytest.mark.asyncio
    async def test_edit_nonexistent_translation(self, translation_service, mock_db):
        """Test editing a non-existent translation"""
        mock_db.find_one.return_value = None
        
        edit_request = TranslationEdit(
            translation_id="nonexistent",
            edited_text="Some text",
            editor_id="editor-456"
        )
        
        with pytest.raises(Exception, match="Translation not found"):
            await translation_service.edit_translation(edit_request)

class TestTranslationRetrieval:
    @pytest.mark.asyncio
    async def test_get_translation(self, translation_service, mock_db):
        """Test retrieving a translation by ID"""
        translation_data = {
            "translation_id": "trans-123",
            "content_id": "content-1",
            "translated_text": "Hola mundo",
            "source_language": "en",
            "target_language": "es",
            "quality_score": "good",
            "confidence": 0.8,
            "status": "completed",
            "created_at": datetime.utcnow()
        }
        
        mock_db.find_one.return_value = translation_data
        
        result = await translation_service.get_translation("trans-123")
        
        assert result is not None
        assert result.translation_id == "trans-123"
        assert result.translated_text == "Hola mundo"

    @pytest.mark.asyncio
    async def test_get_nonexistent_translation(self, translation_service, mock_db):
        """Test retrieving a non-existent translation"""
        mock_db.find_one.return_value = None
        
        result = await translation_service.get_translation("nonexistent")
        
        assert result is None

    @pytest.mark.asyncio
    async def test_get_content_translations(self, translation_service, mock_db):
        """Test retrieving all translations for content"""
        translations_data = [
            {
                "translation_id": "trans-1",
                "content_id": "content-1",
                "translated_text": "Hola mundo",
                "source_language": "en",
                "target_language": "es",
                "quality_score": "good",
                "confidence": 0.8,
                "status": "completed",
                "created_at": datetime.utcnow()
            },
            {
                "translation_id": "trans-2",
                "content_id": "content-1",
                "translated_text": "Bonjour le monde",
                "source_language": "en",
                "target_language": "fr",
                "quality_score": "excellent",
                "confidence": 0.9,
                "status": "completed",
                "created_at": datetime.utcnow()
            }
        ]
        
        mock_db.find.return_value.to_list.return_value = translations_data
        
        result = await translation_service.get_content_translations("content-1")
        
        assert len(result) == 2
        assert result[0].target_language == "es"
        assert result[1].target_language == "fr"

class TestTranslationSync:
    @pytest.mark.asyncio
    async def test_sync_translations(self, translation_service, mock_db):
        """Test synchronizing translations"""
        from .models import TranslationSyncRequest
        
        sync_request = TranslationSyncRequest(
            original_content_id="content-1",
            translation_ids=["trans-1", "trans-2"],
            sync_type="update"
        )
        
        mock_result = Mock()
        mock_result.modified_count = 2
        mock_db.update_many.return_value = mock_result
        
        result = await translation_service.sync_translations(sync_request)
        
        assert result["status"] == "sync_initiated"
        assert result["updated_count"] == 2
        assert result["sync_type"] == "update"

class TestSupportedLanguages:
    def test_get_supported_languages(self, translation_service):
        """Test getting supported languages"""
        languages = translation_service.get_supported_languages()
        
        assert isinstance(languages, dict)
        assert 'en' in languages
        assert 'es' in languages
        assert languages['en'] == 'English'
        assert languages['es'] == 'Spanish'

if __name__ == "__main__":
    pytest.main([__file__])