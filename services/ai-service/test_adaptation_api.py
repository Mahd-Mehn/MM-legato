"""
API Tests for Content Adaptation Service

Tests the REST API endpoints for content adaptation functionality
including script generation and rights management.
"""

import pytest
import asyncio
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch
import json

from main import app
from models import ContentAdaptationRequest
from adaptation_service import AdaptationType


class TestAdaptationAPI:
    """Test cases for Adaptation API endpoints"""
    
    @pytest.fixture
    def client(self):
        """Create test client"""
        return TestClient(app)
    
    @pytest.fixture
    def sample_request_data(self):
        """Sample request data for testing"""
        return {
            "content_id": "test-content-123",
            "source_text": '''
            Sarah walked into the dimly lit room, her heart pounding with anticipation.
            "Is anyone there?" she called out, her voice echoing off the walls.
            A shadow moved in the corner, and a deep voice replied, "I've been waiting for you."
            ''',
            "adaptation_type": "comic_script",
            "target_format": "standard_comic",
            "user_id": "user-456"
        }
    
    def test_create_adaptation_success(self, client, sample_request_data):
        """Test successful adaptation creation"""
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.insert_one = AsyncMock()
            
            response = client.post("/adaptation/create", json=sample_request_data)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "adaptation_id" in data
            assert data["content_id"] == sample_request_data["content_id"]
            assert data["adaptation_type"] == sample_request_data["adaptation_type"]
            assert data["status"] == "completed"
            assert "adapted_content" in data
    
    def test_create_adaptation_invalid_type(self, client, sample_request_data):
        """Test adaptation creation with invalid type"""
        sample_request_data["adaptation_type"] = "invalid_type"
        
        response = client.post("/adaptation/create", json=sample_request_data)
        
        assert response.status_code == 400
        assert "Unsupported adaptation type" in response.json()["detail"]
    
    def test_create_adaptation_missing_fields(self, client):
        """Test adaptation creation with missing required fields"""
        incomplete_data = {
            "content_id": "test-123",
            "adaptation_type": "comic_script"
            # Missing source_text, target_format, user_id
        }
        
        response = client.post("/adaptation/create", json=incomplete_data)
        
        assert response.status_code == 422  # Validation error
    
    def test_get_adaptation_types(self, client):
        """Test getting available adaptation types"""
        response = client.get("/adaptation/types")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "adaptation_types" in data
        types = data["adaptation_types"]
        
        # Check that all expected types are present
        type_values = [t["type"] for t in types]
        assert "comic_script" in type_values
        assert "film_script" in type_values
        assert "game_script" in type_values
        assert "screenplay" in type_values
        assert "stage_play" in type_values
        
        # Check structure of type information
        for adaptation_type in types:
            assert "type" in adaptation_type
            assert "name" in adaptation_type
            assert "description" in adaptation_type
            assert "output_format" in adaptation_type
    
    def test_get_adaptation_by_id_success(self, client):
        """Test retrieving adaptation by ID"""
        adaptation_id = "test-adaptation-123"
        mock_adaptation = {
            "adaptation_id": adaptation_id,
            "content_id": "content-123",
            "adapted_content": "Sample adapted content",
            "adaptation_type": "comic_script",
            "status": "completed"
        }
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.find_one = AsyncMock(return_value=mock_adaptation)
            
            response = client.get(f"/adaptation/{adaptation_id}")
            
            assert response.status_code == 200
            data = response.json()
            assert data["adaptation_id"] == adaptation_id
            assert data["content_id"] == "content-123"
    
    def test_get_adaptation_by_id_not_found(self, client):
        """Test retrieving non-existent adaptation"""
        adaptation_id = "non-existent-123"
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.find_one = AsyncMock(return_value=None)
            
            response = client.get(f"/adaptation/{adaptation_id}")
            
            assert response.status_code == 404
            assert "Adaptation not found" in response.json()["detail"]
    
    def test_list_adaptations_no_filter(self, client):
        """Test listing all adaptations without filters"""
        mock_adaptations = [
            {"adaptation_id": "1", "content_id": "content-1", "adaptation_type": "comic_script"},
            {"adaptation_id": "2", "content_id": "content-2", "adaptation_type": "film_script"}
        ]
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_cursor = AsyncMock()
            mock_cursor.to_list.return_value = mock_adaptations
            mock_collection.return_value.find.return_value.sort.return_value = mock_cursor
            
            response = client.get("/adaptation/")
            
            assert response.status_code == 200
            data = response.json()
            
            assert "adaptations" in data
            assert "total" in data
            assert data["total"] == 2
    
    def test_list_adaptations_with_filters(self, client):
        """Test listing adaptations with filters"""
        mock_adaptations = [
            {"adaptation_id": "1", "content_id": "content-1", "adaptation_type": "comic_script"}
        ]
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_cursor = AsyncMock()
            mock_cursor.to_list.return_value = mock_adaptations
            mock_collection.return_value.find.return_value.sort.return_value = mock_cursor
            
            response = client.get("/adaptation/?content_id=content-1&user_id=user-1")
            
            assert response.status_code == 200
            data = response.json()
            assert "adaptations" in data
    
    def test_get_adaptation_rights(self, client):
        """Test getting adaptation rights for content"""
        content_id = "test-content-123"
        
        response = client.get(f"/adaptation/rights/{content_id}")
        
        assert response.status_code == 200
        data = response.json()
        
        assert data["content_id"] == content_id
        assert "available_rights" in data
        
        # Check that all expected rights are present
        rights = data["available_rights"]
        assert "film" in rights
        assert "television" in rights
        assert "game" in rights
        assert "comic" in rights
        assert "audiobook" in rights
        assert "translation" in rights
        
        # Check structure of rights information
        for right_type, right_info in rights.items():
            assert "available" in right_info
            assert "exclusive" in right_info
            assert "territories" in right_info
            assert "duration" in right_info
            assert "revenue_share" in right_info
    
    def test_get_enhancement_suggestions_success(self, client):
        """Test getting enhancement suggestions"""
        content_id = "test-content-123"
        adaptation_type = "comic_script"
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_cursor = AsyncMock()
            mock_cursor.to_list.return_value = []
            mock_collection.return_value.find.return_value.sort.return_value = mock_cursor
            
            response = client.get(f"/adaptation/suggestions/{content_id}?adaptation_type={adaptation_type}")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["content_id"] == content_id
            assert data["adaptation_type"] == adaptation_type
            assert "suggestions" in data
            assert len(data["suggestions"]) > 0
            
            # Check suggestion structure
            for suggestion in data["suggestions"]:
                assert "type" in suggestion
                assert "suggestion" in suggestion
                assert "priority" in suggestion
    
    def test_get_enhancement_suggestions_invalid_type(self, client):
        """Test getting suggestions with invalid adaptation type"""
        content_id = "test-content-123"
        adaptation_type = "invalid_type"
        
        response = client.get(f"/adaptation/suggestions/{content_id}?adaptation_type={adaptation_type}")
        
        assert response.status_code == 400
        assert "Invalid adaptation type" in response.json()["detail"]
    
    def test_create_batch_adaptations_success(self, client):
        """Test creating multiple adaptations in batch"""
        batch_requests = [
            {
                "content_id": "content-1",
                "source_text": "Sample text 1",
                "adaptation_type": "comic_script",
                "target_format": "standard",
                "user_id": "user-1"
            },
            {
                "content_id": "content-2",
                "source_text": "Sample text 2",
                "adaptation_type": "film_script",
                "target_format": "screenplay",
                "user_id": "user-1"
            }
        ]
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.insert_one = AsyncMock()
            
            response = client.post("/adaptation/batch", json=batch_requests)
            
            assert response.status_code == 200
            data = response.json()
            
            assert "results" in data
            assert "errors" in data
            assert data["total_requested"] == 2
            assert data["successful"] == 2
            assert data["failed"] == 0
    
    def test_create_batch_adaptations_too_many(self, client):
        """Test batch creation with too many requests"""
        # Create 11 requests (exceeds limit of 10)
        batch_requests = []
        for i in range(11):
            batch_requests.append({
                "content_id": f"content-{i}",
                "source_text": f"Sample text {i}",
                "adaptation_type": "comic_script",
                "target_format": "standard",
                "user_id": "user-1"
            })
        
        response = client.post("/adaptation/batch", json=batch_requests)
        
        assert response.status_code == 400
        assert "Maximum 10 adaptations per batch" in response.json()["detail"]
    
    def test_preview_adaptation_formats(self, client):
        """Test getting format previews"""
        response = client.get("/adaptation/formats/preview")
        
        assert response.status_code == 200
        data = response.json()
        
        assert "format_previews" in data
        assert "note" in data
        
        previews = data["format_previews"]
        
        # Check that all adaptation types have previews
        expected_types = ["comic_script", "film_script", "game_script", "screenplay", "stage_play"]
        for adaptation_type in expected_types:
            assert adaptation_type in previews
            
            preview = previews[adaptation_type]
            assert "type" in preview
            assert "sample_input" in preview
            assert "sample_output" in preview
    
    def test_get_adaptation_analytics(self, client):
        """Test getting adaptation analytics"""
        content_id = "test-content-123"
        mock_adaptations = [
            {"adaptation_id": "1", "adaptation_type": "comic_script"},
            {"adaptation_id": "2", "adaptation_type": "film_script"},
            {"adaptation_id": "3", "adaptation_type": "comic_script"}
        ]
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_cursor = AsyncMock()
            mock_cursor.to_list.return_value = mock_adaptations
            mock_collection.return_value.find.return_value.sort.return_value = mock_cursor
            
            response = client.get(f"/adaptation/analytics/{content_id}")
            
            assert response.status_code == 200
            data = response.json()
            
            assert data["content_id"] == content_id
            assert data["total_adaptations"] == 3
            assert "adaptation_breakdown" in data
            assert "most_popular_type" in data
            assert "available_rights" in data
            
            # Check breakdown
            breakdown = data["adaptation_breakdown"]
            assert breakdown["comic_script"] == 2
            assert breakdown["film_script"] == 1
            
            # Check most popular
            most_popular = data["most_popular_type"]
            assert most_popular["type"] == "comic_script"
            assert most_popular["count"] == 2


class TestAdaptationIntegration:
    """Integration tests for adaptation functionality"""
    
    @pytest.fixture
    def client(self):
        return TestClient(app)
    
    def test_full_adaptation_workflow(self, client):
        """Test complete adaptation workflow"""
        # Step 1: Get available adaptation types
        types_response = client.get("/adaptation/types")
        assert types_response.status_code == 200
        
        # Step 2: Create an adaptation
        request_data = {
            "content_id": "workflow-test-123",
            "source_text": "Sarah entered the room. 'Hello,' she said softly.",
            "adaptation_type": "comic_script",
            "target_format": "standard",
            "user_id": "workflow-user"
        }
        
        with patch('adaptation_service.db_manager.get_adaptation_collection') as mock_collection:
            mock_collection.return_value.insert_one = AsyncMock()
            
            create_response = client.post("/adaptation/create", json=request_data)
            assert create_response.status_code == 200
            
            adaptation_data = create_response.json()
            adaptation_id = adaptation_data["adaptation_id"]
            
            # Step 3: Retrieve the created adaptation
            mock_collection.return_value.find_one = AsyncMock(return_value={
                "adaptation_id": adaptation_id,
                "content_id": request_data["content_id"],
                "adapted_content": adaptation_data["adapted_content"],
                "adaptation_type": request_data["adaptation_type"],
                "status": "completed"
            })
            
            get_response = client.get(f"/adaptation/{adaptation_id}")
            assert get_response.status_code == 200
            
            # Step 4: Get adaptation rights
            rights_response = client.get(f"/adaptation/rights/{request_data['content_id']}")
            assert rights_response.status_code == 200
            
            # Step 5: Get enhancement suggestions
            suggestions_response = client.get(
                f"/adaptation/suggestions/{request_data['content_id']}?adaptation_type={request_data['adaptation_type']}"
            )
            assert suggestions_response.status_code == 200


if __name__ == "__main__":
    # Run a simple API test
    def test_api_endpoints():
        client = TestClient(app)
        
        print("Testing Adaptation API endpoints...")
        
        # Test health check
        response = client.get("/health")
        print(f"Health check: {response.status_code}")
        
        # Test adaptation types
        response = client.get("/adaptation/types")
        print(f"Adaptation types: {response.status_code}")
        if response.status_code == 200:
            types = response.json()["adaptation_types"]
            print(f"Available types: {[t['type'] for t in types]}")
        
        # Test format previews
        response = client.get("/adaptation/formats/preview")
        print(f"Format previews: {response.status_code}")
        
        # Test adaptation rights
        response = client.get("/adaptation/rights/test-content")
        print(f"Adaptation rights: {response.status_code}")
        
        print("API endpoint tests completed!")
    
    test_api_endpoints()