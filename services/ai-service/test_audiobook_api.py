import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch, MagicMock
from datetime import datetime

from main import app
from models import AudiobookRequest, AudiobookResponse
from audiobook_service import audiobook_service

client = TestClient(app)

class TestAudiobookAPI:
    
    def test_generate_audiobook_success(self):
        """Test successful audiobook generation via API"""
        request_data = {
            "content_id": "story_123_chapter_1",
            "text": "This is a test chapter for audiobook generation. It has multiple sentences for testing.",
            "language": "en",
            "voice_id": "en-US-AriaNeural",
            "speed": 1.0,
            "user_id": "user_123"
        }
        
        mock_response = AudiobookResponse(
            audiobook_id="audiobook_123",
            content_id="story_123_chapter_1",
            audio_url="/audio/audiobook_123.mp3",
            duration=25.5,
            language="en",
            voice_id="en-US-AriaNeural",
            status="completed",
            created_at=datetime.utcnow()
        )
        
        with patch.object(audiobook_service, 'generate_audiobook', return_value=mock_response):
            response = client.post("/audiobook/generate", json=request_data)
            
            assert response.status_code == 200
            data = response.json()
            assert data["audiobook_id"] == "audiobook_123"
            assert data["content_id"] == "story_123_chapter_1"
            assert data["status"] == "completed"
            assert data["duration"] == 25.5

    def test_generate_audiobook_empty_text(self):
        """Test audiobook generation with empty text"""
        request_data = {
            "content_id": "story_123_chapter_1",
            "text": "",
            "language": "en",
            "user_id": "user_123"
        }
        
        response = client.post("/audiobook/generate", json=request_data)
        
        assert response.status_code == 400
        assert "Text content cannot be empty" in response.json()["detail"]

    def test_generate_audiobook_text_too_long(self):
        """Test audiobook generation with text that's too long"""
        request_data = {
            "content_id": "story_123_chapter_1",
            "text": "A" * 60000,  # Exceeds 50,000 character limit
            "language": "en",
            "user_id": "user_123"
        }
        
        response = client.post("/audiobook/generate", json=request_data)
        
        assert response.status_code == 400
        assert "Text content too long" in response.json()["detail"]

    def test_generate_audiobook_service_error(self):
        """Test audiobook generation when service fails"""
        request_data = {
            "content_id": "story_123_chapter_1",
            "text": "This is a test chapter.",
            "language": "en",
            "user_id": "user_123"
        }
        
        with patch.object(audiobook_service, 'generate_audiobook', side_effect=Exception("TTS service unavailable")):
            response = client.post("/audiobook/generate", json=request_data)
            
            assert response.status_code == 500
            assert "Audiobook generation failed" in response.json()["detail"]

    def test_get_audiobook_success(self):
        """Test retrieving audiobook by ID"""
        audiobook_data = {
            "audiobook_id": "audiobook_123",
            "content_id": "story_123_chapter_1",
            "status": "completed",
            "duration": 25.5,
            "language": "en",
            "voice_id": "en-US-AriaNeural",
            "created_at": datetime.utcnow().isoformat()
        }
        
        with patch.object(audiobook_service, 'get_audiobook', return_value=audiobook_data):
            response = client.get("/audiobook/audiobook_123")
            
            assert response.status_code == 200
            data = response.json()
            assert data["audiobook_id"] == "audiobook_123"
            assert data["status"] == "completed"

    def test_get_audiobook_not_found(self):
        """Test retrieving non-existent audiobook"""
        with patch.object(audiobook_service, 'get_audiobook', return_value=None):
            response = client.get("/audiobook/nonexistent_id")
            
            assert response.status_code == 404
            assert "Audiobook not found" in response.json()["detail"]

    def test_get_audiobooks_by_content(self):
        """Test retrieving all audiobooks for content"""
        audiobooks_data = [
            {
                "audiobook_id": "audiobook_123",
                "content_id": "story_123_chapter_1",
                "language": "en",
                "status": "completed"
            },
            {
                "audiobook_id": "audiobook_124",
                "content_id": "story_123_chapter_1",
                "language": "es",
                "status": "completed"
            }
        ]
        
        with patch.object(audiobook_service, 'get_audiobooks_by_content', return_value=audiobooks_data):
            response = client.get("/audiobook/content/story_123_chapter_1")
            
            assert response.status_code == 200
            data = response.json()
            assert len(data) == 2
            assert data[0]["language"] == "en"
            assert data[1]["language"] == "es"

    def test_delete_audiobook_success(self):
        """Test successful audiobook deletion"""
        with patch.object(audiobook_service, 'delete_audiobook', return_value=True):
            response = client.delete("/audiobook/audiobook_123")
            
            assert response.status_code == 200
            assert "deleted successfully" in response.json()["message"]

    def test_delete_audiobook_not_found(self):
        """Test deleting non-existent audiobook"""
        with patch.object(audiobook_service, 'delete_audiobook', return_value=False):
            response = client.delete("/audiobook/nonexistent_id")
            
            assert response.status_code == 404
            assert "Audiobook not found" in response.json()["detail"]

    def test_optimize_audiobook_for_mobile(self):
        """Test mobile optimization"""
        optimization_result = {
            "audiobook_id": "audiobook_123",
            "optimizations": {
                "mobile_quality": "128kbps",
                "streaming_chunks": True,
                "adaptive_bitrate": True,
                "compression": "optimized"
            },
            "mobile_url": "/audio/mobile/audiobook_123.mp3",
            "chunk_urls": ["/audio/chunks/audiobook_123_chunk_1.mp3"]
        }
        
        with patch.object(audiobook_service, 'optimize_for_mobile', return_value=optimization_result):
            response = client.post("/audiobook/audiobook_123/optimize-mobile")
            
            assert response.status_code == 200
            data = response.json()
            assert data["audiobook_id"] == "audiobook_123"
            assert "mobile_quality" in data["optimizations"]

    def test_get_sync_markers(self):
        """Test retrieving synchronization markers"""
        audiobook_data = {
            "audiobook_id": "audiobook_123",
            "sync_markers": [
                {"sentence_index": 0, "text": "First sentence", "start_time": 0.0, "end_time": 10.0},
                {"sentence_index": 1, "text": "Second sentence", "start_time": 10.0, "end_time": 20.0}
            ],
            "duration": 20.0
        }
        
        with patch.object(audiobook_service, 'get_audiobook', return_value=audiobook_data):
            response = client.get("/audiobook/audiobook_123/sync-markers")
            
            assert response.status_code == 200
            data = response.json()
            assert data["audiobook_id"] == "audiobook_123"
            assert len(data["sync_markers"]) == 2
            assert data["total_markers"] == 2
            assert data["duration"] == 20.0

    def test_get_available_voices_all(self):
        """Test retrieving all available voices"""
        response = client.get("/audiobook/voices/available")
        
        assert response.status_code == 200
        data = response.json()
        assert "all_languages" in data
        assert "en" in data["all_languages"]
        assert "es" in data["all_languages"]

    def test_get_available_voices_specific_language(self):
        """Test retrieving voices for specific language"""
        response = client.get("/audiobook/voices/available?language=en")
        
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "en"
        assert len(data["voices"]) > 0
        assert any(voice["id"] == "en-US-AriaNeural" for voice in data["voices"])

    def test_get_available_voices_unsupported_language(self):
        """Test retrieving voices for unsupported language"""
        response = client.get("/audiobook/voices/available?language=xyz")
        
        assert response.status_code == 200
        data = response.json()
        assert data["language"] == "xyz"
        assert len(data["voices"]) == 0
        assert "No voices available" in data["message"]

    def test_get_audiobook_status(self):
        """Test retrieving audiobook generation status"""
        audiobook_data = {
            "audiobook_id": "audiobook_123",
            "status": "processing",
            "created_at": datetime.utcnow().isoformat(),
            "completed_at": None,
            "duration": None,
            "error": None
        }
        
        with patch.object(audiobook_service, 'get_audiobook', return_value=audiobook_data):
            response = client.get("/audiobook/audiobook_123/status")
            
            assert response.status_code == 200
            data = response.json()
            assert data["audiobook_id"] == "audiobook_123"
            assert data["status"] == "processing"
            assert data["completed_at"] is None

    def test_get_audiobook_status_not_found(self):
        """Test retrieving status for non-existent audiobook"""
        with patch.object(audiobook_service, 'get_audiobook', return_value=None):
            response = client.get("/audiobook/nonexistent_id/status")
            
            assert response.status_code == 404
            assert "Audiobook not found" in response.json()["detail"]

    def test_invalid_request_format(self):
        """Test API with invalid request format"""
        invalid_request = {
            "content_id": "story_123_chapter_1",
            # Missing required fields
        }
        
        response = client.post("/audiobook/generate", json=invalid_request)
        
        assert response.status_code == 422  # Validation error

    def test_invalid_speed_parameter(self):
        """Test API with invalid speed parameter"""
        request_data = {
            "content_id": "story_123_chapter_1",
            "text": "This is a test chapter.",
            "language": "en",
            "speed": 3.0,  # Exceeds maximum of 2.0
            "user_id": "user_123"
        }
        
        response = client.post("/audiobook/generate", json=request_data)
        
        assert response.status_code == 422  # Validation error

if __name__ == "__main__":
    pytest.main([__file__])