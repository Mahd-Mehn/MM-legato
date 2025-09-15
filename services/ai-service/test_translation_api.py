import pytest
from fastapi.testclient import TestClient
from unittest.mock import Mock, patch, AsyncMock
from datetime import datetime
import sys
import os

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from main import app
from models import TranslationStatus, QualityScore

client = TestClient(app)

class TestTranslationAPI:
    def test_detect_language_endpoint(self):
        """Test language detection endpoint"""
        with patch('services.ai_service.translation_service.TranslationService.detect_language') as mock_detect:
            mock_detect.return_value = AsyncMock(
                detected_language='en',
                confidence=0.95,
                possible_languages=[{"language": "en", "confidence": 0.95}]
            )
            
            response = client.post("/translation/detect-language", json={
                "text": "Hello, this is a test message."
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["detected_language"] == "en"
            assert data["confidence"] == 0.95

    def test_translate_content_high_priority(self):
        """Test translation endpoint with high priority"""
        with patch('services.ai_service.translation_service.TranslationService.translate_content') as mock_translate:
            mock_translate.return_value = AsyncMock(
                translation_id="trans-123",
                content_id="content-1",
                translated_text="Hola mundo",
                source_language="en",
                target_language="es",
                quality_score=QualityScore.GOOD,
                confidence=0.8,
                status=TranslationStatus.COMPLETED,
                created_at=datetime.utcnow(),
                completed_at=datetime.utcnow()
            )
            
            response = client.post("/translation/translate", json={
                "content_id": "content-1",
                "content_type": "chapter",
                "source_text": "Hello world",
                "source_language": "en",
                "target_language": "es",
                "user_id": "user-123",
                "priority": 5
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["translated_text"] == "Hola mundo"

    def test_translate_content_low_priority(self):
        """Test translation endpoint with low priority (background processing)"""
        response = client.post("/translation/translate", json={
            "content_id": "content-1",
            "content_type": "chapter",
            "source_text": "Hello world",
            "source_language": "en",
            "target_language": "es",
            "user_id": "user-123",
            "priority": 1
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["message"] == "Translation queued for processing"
        assert data["status"] == "queued"

    def test_get_translation_endpoint(self):
        """Test get translation endpoint"""
        with patch('services.ai_service.translation_service.TranslationService.get_translation') as mock_get:
            mock_get.return_value = AsyncMock(
                translation_id="trans-123",
                content_id="content-1",
                translated_text="Hola mundo",
                source_language="en",
                target_language="es",
                quality_score=QualityScore.GOOD,
                confidence=0.8,
                status=TranslationStatus.COMPLETED,
                created_at=datetime.utcnow()
            )
            
            response = client.get("/translation/translation/trans-123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["translation_id"] == "trans-123"
            assert data["translated_text"] == "Hola mundo"

    def test_get_translation_not_found(self):
        """Test get translation endpoint when translation not found"""
        with patch('services.ai_service.translation_service.TranslationService.get_translation') as mock_get:
            mock_get.return_value = None
            
            response = client.get("/translation/translation/nonexistent")
            
            assert response.status_code == 404
            assert "Translation not found" in response.json()["detail"]

    def test_get_content_translations_endpoint(self):
        """Test get content translations endpoint"""
        with patch('services.ai_service.translation_service.TranslationService.get_content_translations') as mock_get:
            mock_get.return_value = [
                AsyncMock(
                    translation_id="trans-1",
                    content_id="content-1",
                    translated_text="Hola mundo",
                    target_language="es"
                ),
                AsyncMock(
                    translation_id="trans-2",
                    content_id="content-1",
                    translated_text="Bonjour le monde",
                    target_language="fr"
                )
            ]
            
            response = client.get("/translation/content/content-1/translations")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2

    def test_edit_translation_endpoint(self):
        """Test edit translation endpoint"""
        with patch('services.ai_service.translation_service.TranslationService.edit_translation') as mock_edit:
            mock_edit.return_value = AsyncMock(
                translation_id="trans-123",
                translated_text="Edited translation",
                status=TranslationStatus.MANUAL_REVIEW,
                quality_score=QualityScore.EXCELLENT
            )
            
            response = client.put("/translation/translation/trans-123/edit", json={
                "translation_id": "trans-123",
                "edited_text": "Edited translation",
                "editor_id": "editor-456",
                "edit_notes": "Improved accuracy"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["translated_text"] == "Edited translation"

    def test_sync_translations_endpoint(self):
        """Test sync translations endpoint"""
        with patch('services.ai_service.translation_service.TranslationService.sync_translations') as mock_sync:
            mock_sync.return_value = {
                "status": "sync_initiated",
                "updated_count": 2,
                "sync_type": "update"
            }
            
            response = client.post("/translation/sync", json={
                "original_content_id": "content-1",
                "translation_ids": ["trans-1", "trans-2"],
                "sync_type": "update"
            })
            
            assert response.status_code == 200
            data = response.json()
            assert data["status"] == "sync_initiated"
            assert data["updated_count"] == 2

    def test_get_supported_languages_endpoint(self):
        """Test get supported languages endpoint"""
        response = client.get("/translation/languages")
        
        assert response.status_code == 200
        data = response.json()
        assert isinstance(data, dict)
        assert "en" in data
        assert data["en"] == "English"

    def test_get_translation_status_endpoint(self):
        """Test get translation status endpoint"""
        with patch('services.ai_service.translation_service.TranslationService.get_content_translations') as mock_get:
            mock_translations = [
                Mock(status=TranslationStatus.COMPLETED, target_language="es", quality_score=QualityScore.GOOD),
                Mock(status=TranslationStatus.COMPLETED, target_language="fr", quality_score=QualityScore.EXCELLENT),
                Mock(status=TranslationStatus.PENDING, target_language="de", quality_score=QualityScore.FAIR)
            ]
            mock_get.return_value = mock_translations
            
            response = client.get("/translation/content/content-1/translation-status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["content_id"] == "content-1"
            assert data["total_translations"] == 3
            assert data["by_status"]["completed"] == 2
            assert data["by_status"]["pending"] == 1
            assert data["by_language"]["es"] == 1
            assert data["by_quality"]["good"] == 1

class TestTranslationAPIErrors:
    def test_detect_language_error(self):
        """Test language detection endpoint error handling"""
        with patch('services.ai_service.translation_service.TranslationService.detect_language') as mock_detect:
            mock_detect.side_effect = Exception("Detection service unavailable")
            
            response = client.post("/translation/detect-language", json={
                "text": "Hello, this is a test message."
            })
            
            assert response.status_code == 500
            assert "Language detection failed" in response.json()["detail"]

    def test_translate_content_error(self):
        """Test translation endpoint error handling"""
        with patch('services.ai_service.translation_service.TranslationService.translate_content') as mock_translate:
            mock_translate.side_effect = Exception("Translation service unavailable")
            
            response = client.post("/translation/translate", json={
                "content_id": "content-1",
                "content_type": "chapter",
                "source_text": "Hello world",
                "source_language": "en",
                "target_language": "es",
                "user_id": "user-123",
                "priority": 5
            })
            
            assert response.status_code == 500
            assert "Translation failed" in response.json()["detail"]

    def test_edit_translation_error(self):
        """Test edit translation endpoint error handling"""
        with patch('services.ai_service.translation_service.TranslationService.edit_translation') as mock_edit:
            mock_edit.side_effect = Exception("Edit failed")
            
            response = client.put("/translation/translation/trans-123/edit", json={
                "translation_id": "trans-123",
                "edited_text": "Edited translation",
                "editor_id": "editor-456"
            })
            
            assert response.status_code == 500
            assert "Failed to edit translation" in response.json()["detail"]

class TestTranslationAPIValidation:
    def test_invalid_translation_request(self):
        """Test translation request validation"""
        response = client.post("/translation/translate", json={
            "content_id": "",  # Invalid empty content_id
            "source_text": "Hello world",
            "source_language": "en",
            "target_language": "es",
            "user_id": "user-123"
        })
        
        assert response.status_code == 422  # Validation error

    def test_invalid_language_detection_request(self):
        """Test language detection request validation"""
        response = client.post("/translation/detect-language", json={
            # Missing required 'text' field
        })
        
        assert response.status_code == 422  # Validation error

    def test_invalid_edit_request(self):
        """Test edit translation request validation"""
        response = client.put("/translation/translation/trans-123/edit", json={
            "translation_id": "trans-123",
            # Missing required 'edited_text' and 'editor_id' fields
        })
        
        assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    pytest.main([__file__])