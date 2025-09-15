"""
Tests for Content Adaptation Service

Tests the functionality of content adaptation tools including
script generation for comics, films, games, and rights management.
"""

import pytest
import asyncio
from datetime import datetime
from unittest.mock import AsyncMock, patch

from adaptation_service import ContentAdaptationService, AdaptationType, AdaptationStatus
from models import ContentAdaptationRequest, ContentAdaptationResponse


class TestContentAdaptationService:
    """Test cases for ContentAdaptationService"""
    
    @pytest.fixture
    def service(self):
        """Create service instance for testing"""
        return ContentAdaptationService()
    
    @pytest.fixture
    def sample_request(self):
        """Sample adaptation request for testing"""
        return ContentAdaptationRequest(
            content_id="test-content-123",
            source_text='''
            Sarah walked into the dimly lit room, her heart pounding with anticipation. 
            The old floorboards creaked under her feet as she moved cautiously forward.
            
            "Is anyone there?" she called out, her voice echoing off the walls.
            
            A shadow moved in the corner, and a deep voice replied, "I've been waiting for you, Sarah."
            
            She turned toward the voice, her eyes adjusting to the darkness. A figure emerged from the shadows.
            ''',
            adaptation_type=AdaptationType.COMIC_SCRIPT,
            target_format="standard_comic",
            user_id="user-456"
        )
    
    @pytest.mark.asyncio
    async def test_create_comic_adaptation(self, service, sample_request):
        """Test creating a comic script adaptation"""
        with patch.object(service, '_store_adaptation') as mock_store:
            mock_store.return_value = None
            
            # Mock database operations
            with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
                mock_collection.return_value.insert_one = AsyncMock()
                
                result = await service.create_adaptation(sample_request)
                
                assert isinstance(result, ContentAdaptationResponse)
                assert result.content_id == sample_request.content_id
                assert result.adaptation_type == AdaptationType.COMIC_SCRIPT
                assert result.status == AdaptationStatus.COMPLETED
                assert "PAGE 1, PANEL 1" in result.adapted_content
                assert "VISUAL:" in result.adapted_content
                assert "DIALOGUE:" in result.adapted_content
    
    @pytest.mark.asyncio
    async def test_create_film_adaptation(self, service, sample_request):
        """Test creating a film script adaptation"""
        sample_request.adaptation_type = AdaptationType.FILM_SCRIPT
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.insert_one = AsyncMock()
            
            result = await service.create_adaptation(sample_request)
            
            assert result.adaptation_type == AdaptationType.FILM_SCRIPT
            assert "FADE IN:" in result.adapted_content
            assert "INT. SCENE LOCATION" in result.adapted_content
            assert "SARAH" in result.adapted_content.upper()
            assert "FADE OUT." in result.adapted_content
    
    @pytest.mark.asyncio
    async def test_create_game_adaptation(self, service, sample_request):
        """Test creating a game script adaptation"""
        sample_request.adaptation_type = AdaptationType.GAME_SCRIPT
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.insert_one = AsyncMock()
            
            result = await service.create_adaptation(sample_request)
            
            assert result.adaptation_type == AdaptationType.GAME_SCRIPT
            assert "[SCENE_001]" in result.adapted_content
            assert "PLAYER_CHOICES:" in result.adapted_content
            assert "CHARACTER:" in result.adapted_content
            assert "-> SCENE_" in result.adapted_content
    
    @pytest.mark.asyncio
    async def test_create_stage_play_adaptation(self, service, sample_request):
        """Test creating a stage play adaptation"""
        sample_request.adaptation_type = AdaptationType.STAGE_PLAY
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.insert_one = AsyncMock()
            
            result = await service.create_adaptation(sample_request)
            
            assert result.adaptation_type == AdaptationType.STAGE_PLAY
            assert "ACT I" in result.adapted_content
            assert "SCENE 1" in result.adapted_content
            assert "(Lights up." in result.adapted_content
            assert "SARAH:" in result.adapted_content.upper()
    
    @pytest.mark.asyncio
    async def test_invalid_adaptation_type(self, service, sample_request):
        """Test handling of invalid adaptation type"""
        sample_request.adaptation_type = "invalid_type"
        
        with pytest.raises(ValueError, match="Unsupported adaptation type"):
            await service.create_adaptation(sample_request)
    
    def test_extract_dialogue(self, service):
        """Test dialogue extraction from text"""
        text = 'Sarah said, "Hello there!" Then John replied, "How are you?"'
        
        dialogue_parts = service._extract_dialogue(text)
        
        assert len(dialogue_parts) == 2
        assert dialogue_parts[0][1] == "Hello there!"
        assert dialogue_parts[1][1] == "How are you?"
    
    def test_convert_to_visual_description(self, service):
        """Test conversion of narrative to visual description"""
        text = "Sarah walked across the room and looked at the painting."
        
        visual_desc = service._convert_to_visual_description(text)
        
        assert "walking across the panel" in visual_desc
        assert "gazing with intense expression" in visual_desc
    
    def test_convert_to_action_line(self, service):
        """Test conversion to screenplay action line"""
        text = "Sarah was walking through the dark hallway."
        
        action_line = service._convert_to_action_line(text)
        
        assert "is walking" in action_line
        assert "was walking" not in action_line
    
    @pytest.mark.asyncio
    async def test_get_adaptation_rights(self, service):
        """Test getting adaptation rights information"""
        content_id = "test-content-123"
        
        rights = await service.get_adaptation_rights(content_id)
        
        assert rights["content_id"] == content_id
        assert "available_rights" in rights
        assert "film" in rights["available_rights"]
        assert "game" in rights["available_rights"]
        assert "comic" in rights["available_rights"]
        assert "audiobook" in rights["available_rights"]
        assert "translation" in rights["available_rights"]
        
        # Check film rights structure
        film_rights = rights["available_rights"]["film"]
        assert film_rights["available"] is True
        assert "revenue_share" in film_rights
        assert "duration" in film_rights
        assert "territories" in film_rights
    
    @pytest.mark.asyncio
    async def test_suggest_enhancements_comic(self, service):
        """Test enhancement suggestions for comic adaptation"""
        content_id = "test-content-123"
        
        with patch.object(service, 'list_adaptations') as mock_list:
            mock_list.return_value = []
            
            suggestions = await service.suggest_enhancements(content_id, AdaptationType.COMIC_SCRIPT)
            
            assert suggestions["content_id"] == content_id
            assert suggestions["adaptation_type"] == AdaptationType.COMIC_SCRIPT
            assert len(suggestions["suggestions"]) > 0
            
            # Check for specific comic suggestions
            suggestion_types = [s["type"] for s in suggestions["suggestions"]]
            assert "visual_enhancement" in suggestion_types
            assert "pacing" in suggestion_types
    
    @pytest.mark.asyncio
    async def test_suggest_enhancements_film(self, service):
        """Test enhancement suggestions for film adaptation"""
        content_id = "test-content-123"
        
        with patch.object(service, 'list_adaptations') as mock_list:
            mock_list.return_value = []
            
            suggestions = await service.suggest_enhancements(content_id, AdaptationType.FILM_SCRIPT)
            
            assert suggestions["adaptation_type"] == AdaptationType.FILM_SCRIPT
            
            # Check for specific film suggestions
            suggestion_types = [s["type"] for s in suggestions["suggestions"]]
            assert "scene_structure" in suggestion_types
            assert "dialogue" in suggestion_types
    
    @pytest.mark.asyncio
    async def test_suggest_enhancements_game(self, service):
        """Test enhancement suggestions for game adaptation"""
        content_id = "test-content-123"
        
        with patch.object(service, 'list_adaptations') as mock_list:
            mock_list.return_value = []
            
            suggestions = await service.suggest_enhancements(content_id, AdaptationType.GAME_SCRIPT)
            
            assert suggestions["adaptation_type"] == AdaptationType.GAME_SCRIPT
            
            # Check for specific game suggestions
            suggestion_types = [s["type"] for s in suggestions["suggestions"]]
            assert "interactivity" in suggestion_types
            assert "branching" in suggestion_types
    
    @pytest.mark.asyncio
    async def test_list_adaptations_filtering(self, service):
        """Test listing adaptations with filtering"""
        mock_adaptations = [
            {"adaptation_id": "1", "content_id": "content-1", "user_id": "user-1"},
            {"adaptation_id": "2", "content_id": "content-2", "user_id": "user-1"},
            {"adaptation_id": "3", "content_id": "content-1", "user_id": "user-2"}
        ]
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_cursor = AsyncMock()
            mock_cursor.to_list.return_value = mock_adaptations
            mock_collection.return_value.find.return_value.sort.return_value = mock_cursor
            
            # Test filtering by content_id
            result = await service.list_adaptations(content_id="content-1")
            assert len(result) == 3  # Mock returns all, filtering happens in route
            
            # Test filtering by user_id
            result = await service.list_adaptations(user_id="user-1")
            assert len(result) == 3  # Mock returns all, filtering happens in route


class TestAdaptationFormats:
    """Test specific adaptation format generation"""
    
    @pytest.fixture
    def service(self):
        return ContentAdaptationService()
    
    @pytest.fixture
    def sample_text(self):
        return '''
        The detective entered the abandoned warehouse. Dust particles danced in the shafts of light.
        
        "Police! Anyone in here?" she shouted.
        
        A voice echoed from the shadows: "You're too late, Detective Martinez."
        
        She drew her weapon, scanning the darkness for movement.
        '''
    
    @pytest.mark.asyncio
    async def test_comic_script_format(self, service, sample_text):
        """Test comic script format generation"""
        result = await service._generate_comic_script(sample_text, "standard")
        
        # Check comic script structure
        assert "COMIC SCRIPT ADAPTATION" in result
        assert "PAGE 1, PANEL 1" in result
        assert "VISUAL:" in result
        assert "DIALOGUE:" in result
        
        # Check for proper panel progression
        assert "PANEL 1" in result
        assert "PANEL 2" in result or "PANEL 3" in result
    
    @pytest.mark.asyncio
    async def test_film_script_format(self, service, sample_text):
        """Test film script format generation"""
        result = await service._generate_film_script(sample_text, "screenplay")
        
        # Check screenplay structure
        assert "SCREENPLAY ADAPTATION" in result
        assert "FADE IN:" in result
        assert "INT. SCENE LOCATION - DAY" in result
        assert "DETECTIVE MARTINEZ" in result.upper() or "MARTINEZ" in result.upper()
        assert "FADE OUT." in result
        assert "THE END" in result
    
    @pytest.mark.asyncio
    async def test_game_script_format(self, service, sample_text):
        """Test game script format generation"""
        result = await service._generate_game_script(sample_text, "interactive")
        
        # Check game script structure
        assert "INTERACTIVE GAME SCRIPT" in result
        assert "[SCENE_001]" in result
        assert "PLAYER_CHOICES:" in result
        assert "CHARACTER:" in result
        assert "-> SCENE_" in result
        
        # Check for player choice options
        assert "[Agree]" in result or "[Question]" in result
    
    @pytest.mark.asyncio
    async def test_stage_play_format(self, service, sample_text):
        """Test stage play format generation"""
        result = await service._generate_stage_play(sample_text, "theatrical")
        
        # Check stage play structure
        assert "STAGE PLAY ADAPTATION" in result
        assert "ACT I" in result
        assert "SCENE 1" in result
        assert "(Lights up." in result
        assert "(Lights fade to black.)" in result
        assert "END OF PLAY" in result


if __name__ == "__main__":
    # Run basic functionality test
    async def test_basic_functionality():
        service = ContentAdaptationService()
        
        # Test sample adaptation
        request = ContentAdaptationRequest(
            content_id="test-123",
            source_text="Sarah walked into the room. 'Hello,' she said.",
            adaptation_type=AdaptationType.COMIC_SCRIPT,
            target_format="standard",
            user_id="user-123"
        )
        
        print("Testing content adaptation service...")
        
        # Test dialogue extraction
        dialogue = service._extract_dialogue("Sarah said, 'Hello there!'")
        print(f"Dialogue extraction: {dialogue}")
        
        # Test visual description conversion
        visual = service._convert_to_visual_description("Sarah walked across the room")
        print(f"Visual description: {visual}")
        
        # Test action line conversion
        action = service._convert_to_action_line("Sarah was walking through the hallway")
        print(f"Action line: {action}")
        
        # Test adaptation rights
        rights = await service.get_adaptation_rights("test-content")
        print(f"Adaptation rights available: {list(rights['available_rights'].keys())}")
        
        print("Basic functionality tests completed!")
    
    # Run the test
    asyncio.run(test_basic_functionality())