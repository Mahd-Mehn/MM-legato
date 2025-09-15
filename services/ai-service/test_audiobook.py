import pytest
import asyncio
import os
from datetime import datetime
from unittest.mock import AsyncMock, patch, MagicMock

from audiobook_service import AudiobookService
from models import AudiobookRequest, AudiobookResponse
from database import db_manager

class TestAudiobookService:
    
    @pytest.fixture
    def audiobook_service(self):
        return AudiobookService()
    
    @pytest.fixture
    def sample_request(self):
        return AudiobookRequest(
            content_id="story_123_chapter_1",
            text="This is a sample chapter text for testing audiobook generation. It contains multiple sentences to test synchronization markers.",
            language="en",
            voice_id="en-US-AriaNeural",
            speed=1.0,
            user_id="user_123"
        )
    
    @pytest.fixture
    def mock_db_collection(self):
        mock_collection = AsyncMock()
        mock_collection.insert_one = AsyncMock()
        mock_collection.update_one = AsyncMock()
        mock_collection.find_one = AsyncMock()
        mock_collection.find = AsyncMock()
        mock_collection.delete_one = AsyncMock()
        return mock_collection

    def test_split_into_sentences(self, audiobook_service):
        """Test sentence splitting functionality"""
        text = "This is the first sentence. This is the second sentence! And this is the third sentence?"
        sentences = audiobook_service._split_into_sentences(text)
        
        assert len(sentences) == 3
        assert "This is the first sentence" in sentences[0]
        assert "This is the second sentence" in sentences[1]
        assert "And this is the third sentence" in sentences[2]

    def test_split_long_sentences(self, audiobook_service):
        """Test splitting of very long sentences"""
        long_text = "This is a very long sentence, " * 20 + "that should be split into smaller parts."
        sentences = audiobook_service._split_into_sentences(long_text)
        
        # Should split long sentences
        assert len(sentences) > 1
        for sentence in sentences:
            assert len(sentence) <= 200

    def test_get_default_voice(self, audiobook_service):
        """Test default voice selection"""
        assert audiobook_service._get_default_voice("en") == "en-US-AriaNeural"
        assert audiobook_service._get_default_voice("es") == "es-ES-ElviraNeural"
        assert audiobook_service._get_default_voice("unknown") == "en-US-AriaNeural"  # fallback

    @pytest.mark.asyncio
    async def test_generate_audiobook_success(self, audiobook_service, sample_request, mock_db_collection):
        """Test successful audiobook generation"""
        with patch.object(db_manager, 'get_audiobook_collection', return_value=mock_db_collection):
            with patch.object(audiobook_service, '_generate_audio_with_sync') as mock_generate:
                with patch.object(audiobook_service, '_store_audio_file') as mock_store:
                    
                    # Mock the audio generation
                    mock_generate.return_value = {
                        "audio_data": b"fake_audio_data",
                        "duration": 30.5,
                        "sync_markers": [
                            {"sentence_index": 0, "text": "First sentence", "start_time": 0.0, "end_time": 15.0},
                            {"sentence_index": 1, "text": "Second sentence", "start_time": 15.0, "end_time": 30.5}
                        ],
                        "format": "mp3"
                    }
                    
                    mock_store.return_value = "/audio/test_audiobook.mp3"
                    
                    result = await audiobook_service.generate_audiobook(sample_request)
                    
                    assert isinstance(result, AudiobookResponse)
                    assert result.content_id == sample_request.content_id
                    assert result.language == sample_request.language
                    assert result.duration == 30.5
                    assert result.status == "completed"
                    
                    # Verify database operations
                    mock_db_collection.insert_one.assert_called_once()
                    mock_db_collection.update_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_audiobook_failure(self, audiobook_service, sample_request, mock_db_collection):
        """Test audiobook generation failure handling"""
        with patch.object(db_manager, 'get_audiobook_collection', return_value=mock_db_collection):
            with patch.object(audiobook_service, '_generate_audio_with_sync', side_effect=Exception("TTS API error")):
                
                with pytest.raises(Exception) as exc_info:
                    await audiobook_service.generate_audiobook(sample_request)
                
                assert "Audiobook generation failed" in str(exc_info.value)
                
                # Should still insert initial record
                mock_db_collection.insert_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_generate_with_gtts(self, audiobook_service):
        """Test Google TTS generation (fallback)"""
        sentences = ["This is a test sentence.", "This is another test sentence."]
        
        with patch('gtts.gTTS') as mock_gtts:
            with patch('tempfile.NamedTemporaryFile') as mock_temp:
                with patch('builtins.open', create=True) as mock_open:
                    
                    # Mock temporary file
                    mock_temp.return_value.__enter__.return_value.name = "temp_audio.mp3"
                    
                    # Mock file reading
                    mock_open.return_value.__enter__.return_value.read.return_value = b"fake_audio_data"
                    
                    # Mock TTS instance
                    mock_tts_instance = MagicMock()
                    mock_gtts.return_value = mock_tts_instance
                    
                    with patch('os.unlink'):  # Mock file cleanup
                        result = await audiobook_service._generate_with_gtts(sentences, "en", 1.0)
                    
                    assert result["format"] == "mp3"
                    assert len(result["sync_markers"]) == 2
                    assert result["duration"] > 0
                    assert isinstance(result["audio_data"], bytes)

    @pytest.mark.asyncio
    async def test_get_audiobook(self, audiobook_service, mock_db_collection):
        """Test retrieving audiobook by ID"""
        audiobook_data = {
            "audiobook_id": "test_audiobook_123",
            "content_id": "story_123_chapter_1",
            "status": "completed",
            "duration": 30.5
        }
        
        mock_db_collection.find_one.return_value = audiobook_data
        
        with patch.object(db_manager, 'get_audiobook_collection', return_value=mock_db_collection):
            result = await audiobook_service.get_audiobook("test_audiobook_123")
            
            assert result == audiobook_data
            mock_db_collection.find_one.assert_called_once_with({"audiobook_id": "test_audiobook_123"})

    @pytest.mark.asyncio
    async def test_get_audiobooks_by_content(self, audiobook_service, mock_db_collection):
        """Test retrieving all audiobooks for content"""
        audiobooks_data = [
            {"audiobook_id": "audiobook_1", "language": "en"},
            {"audiobook_id": "audiobook_2", "language": "es"}
        ]
        
        mock_cursor = AsyncMock()
        mock_cursor.to_list.return_value = audiobooks_data
        mock_db_collection.find.return_value = mock_cursor
        
        with patch.object(db_manager, 'get_audiobook_collection', return_value=mock_db_collection):
            result = await audiobook_service.get_audiobooks_by_content("story_123_chapter_1")
            
            assert result == audiobooks_data
            mock_db_collection.find.assert_called_once_with({"content_id": "story_123_chapter_1"})

    @pytest.mark.asyncio
    async def test_delete_audiobook(self, audiobook_service, mock_db_collection):
        """Test audiobook deletion"""
        audiobook_data = {
            "audiobook_id": "test_audiobook_123",
            "audio_url": "/audio/test_audiobook_123.mp3"
        }
        
        mock_db_collection.find_one.return_value = audiobook_data
        mock_db_collection.delete_one.return_value = MagicMock(deleted_count=1)
        
        with patch.object(db_manager, 'get_audiobook_collection', return_value=mock_db_collection):
            with patch('os.path.exists', return_value=True):
                with patch('os.remove') as mock_remove:
                    
                    result = await audiobook_service.delete_audiobook("test_audiobook_123")
                    
                    assert result is True
                    mock_remove.assert_called_once()
                    mock_db_collection.delete_one.assert_called_once()

    @pytest.mark.asyncio
    async def test_optimize_for_mobile(self, audiobook_service, mock_db_collection):
        """Test mobile optimization"""
        audiobook_data = {
            "audiobook_id": "test_audiobook_123",
            "status": "completed"
        }
        
        mock_db_collection.find_one.return_value = audiobook_data
        mock_db_collection.update_one.return_value = MagicMock()
        
        with patch.object(db_manager, 'get_audiobook_collection', return_value=mock_db_collection):
            result = await audiobook_service.optimize_for_mobile("test_audiobook_123")
            
            assert result["audiobook_id"] == "test_audiobook_123"
            assert "mobile_quality" in result["optimizations"]
            assert "chunk_urls" in result
            
            mock_db_collection.update_one.assert_called_once()

    def test_store_audio_file(self, audiobook_service):
        """Test audio file storage"""
        audio_data = b"fake_audio_data"
        audiobook_id = "test_audiobook_123"
        
        with patch('os.makedirs'):
            with patch('builtins.open', create=True) as mock_open:
                mock_file = MagicMock()
                mock_open.return_value.__enter__.return_value = mock_file
                
                result = asyncio.run(audiobook_service._store_audio_file(audiobook_id, audio_data))
                
                assert result == f"/audio/{audiobook_id}.mp3"
                mock_file.write.assert_called_once_with(audio_data)

    @pytest.mark.asyncio
    async def test_elevenlabs_generation_mock(self, audiobook_service):
        """Test ElevenLabs API integration (mocked)"""
        sentences = ["Test sentence one.", "Test sentence two."]
        
        # Mock the API key
        audiobook_service.elevenlabs_api_key = "test_api_key"
        
        with patch('httpx.AsyncClient') as mock_client:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_response.content = b"fake_audio_data"
            
            mock_client.return_value.__aenter__.return_value.post.return_value = mock_response
            
            result = await audiobook_service._generate_with_elevenlabs(sentences, "test_voice", 1.0)
            
            assert result["format"] == "mp3"
            assert len(result["sync_markers"]) == 2
            assert isinstance(result["audio_data"], bytes)

if __name__ == "__main__":
    pytest.main([__file__])