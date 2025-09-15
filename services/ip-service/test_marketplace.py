import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import json

from main import app
from marketplace_service import MarketplaceService, StudioType, NegotiationStatus

client = TestClient(app)
marketplace_service = MarketplaceService()

class TestMarketplaceService:
    """Test marketplace service functionality"""
    
    def test_search_ip_marketplace(self):
        """Test IP marketplace search"""
        filters = {
            "license_types": ["adaptation", "audio_visual"],
            "genres": ["sci-fi"],
            "max_revenue_share": 30.0
        }
        
        results = marketplace_service.search_ip_marketplace(
            filters=filters,
            studio_id="studio_123",
            limit=10,
            offset=0
        )
        
        assert "listings" in results
        assert "total_count" in results
        assert "filters_applied" in results
        assert results["filters_applied"] == filters
        assert len(results["listings"]) <= 10
        
        # Check that results match filters
        for listing in results["listings"]:
            assert any(
                license.get("license_type") in ["adaptation", "audio_visual"]
                for license in listing["available_licenses"]
            )
    
    def test_get_ip_details(self):
        """Test getting detailed IP information"""
        listing_id = "list_001"
        
        details = marketplace_service.get_ip_details(
            listing_id=listing_id,
            studio_id="studio_123"
        )
        
        assert details["listing_id"] == listing_id
        assert "author" in details
        assert "content_details" in details
        assert "licensing_options" in details
        assert "market_performance" in details
        assert "ip_verification" in details
        
        # Check author information
        author = details["author"]
        assert "id" in author
        assert "name" in author
        assert "verified" in author
        
        # Check licensing options
        licensing_options = details["licensing_options"]
        assert len(licensing_options) > 0
        for option in licensing_options:
            assert "license_type" in option
            assert "terms" in option
    
    def test_initiate_licensing_negotiation(self):
        """Test initiating licensing negotiation"""
        listing_id = "list_001"
        studio_id = "studio_123"
        license_type = "adaptation"
        initial_offer = {
            "revenue_share_percentage": 25.0,
            "territory": "north_america",
            "duration_months": 24,
            "minimum_guarantee": 10000.0
        }
        message = "We are interested in adapting your story for film."
        
        negotiation = marketplace_service.initiate_licensing_negotiation(
            listing_id=listing_id,
            studio_id=studio_id,
            license_type=license_type,
            initial_offer=initial_offer,
            message=message
        )
        
        assert "negotiation_id" in negotiation
        assert negotiation["listing_id"] == listing_id
        assert negotiation["studio_id"] == studio_id
        assert negotiation["license_type"] == license_type
        assert negotiation["status"] == NegotiationStatus.INITIATED.value
        assert negotiation["initial_offer"] == initial_offer
        assert len(negotiation["messages"]) == 1
        assert negotiation["messages"][0]["message"] == message
    
    def test_send_negotiation_message(self):
        """Test sending negotiation message"""
        negotiation_id = "NEG-20240210150000-ABCD1234"
        sender_id = "studio_123"
        sender_type = "studio"
        message = "We would like to counter-offer with 30% revenue share."
        offer_update = {
            "revenue_share_percentage": 30.0,
            "minimum_guarantee": 15000.0
        }
        
        response = marketplace_service.send_negotiation_message(
            negotiation_id=negotiation_id,
            sender_id=sender_id,
            sender_type=sender_type,
            message=message,
            offer_update=offer_update
        )
        
        assert "message_id" in response
        assert response["status"] == "sent"
        assert "timestamp" in response
    
    def test_generate_licensing_contract(self):
        """Test generating licensing contract"""
        negotiation_id = "NEG-20240210150000-ABCD1234"
        final_terms = {
            "revenue_share_percentage": 30.0,
            "territory": "worldwide",
            "duration_months": 36,
            "minimum_guarantee": 20000.0,
            "exclusivity": True
        }
        
        contract = marketplace_service.generate_licensing_contract(
            negotiation_id=negotiation_id,
            final_terms=final_terms
        )
        
        assert "contract_id" in contract
        assert contract["negotiation_id"] == negotiation_id
        assert contract["final_terms"] == final_terms
        assert contract["digital_signature_required"] == True
        assert contract["status"] == "pending_signatures"
    
    def test_get_studio_dashboard(self):
        """Test getting studio dashboard"""
        studio_id = "studio_123"
        
        dashboard = marketplace_service.get_studio_dashboard(studio_id)
        
        assert dashboard["studio_id"] == studio_id
        assert "active_negotiations" in dashboard
        assert "signed_contracts" in dashboard
        assert "saved_listings" in dashboard
        assert "recommendations" in dashboard
        assert "analytics" in dashboard
        
        # Check analytics structure
        analytics = dashboard["analytics"]
        assert "total_inquiries_sent" in analytics
        assert "response_rate" in analytics
        assert "successful_negotiations" in analytics
    
    def test_create_studio_profile(self):
        """Test creating studio profile"""
        studio_data = {
            "studio_id": "studio_456",
            "name": "Awesome Productions",
            "studio_type": StudioType.FILM_PRODUCTION.value,
            "description": "Independent film production company",
            "website": "https://awesomeproductions.com",
            "contact_email": "contact@awesomeproductions.com",
            "preferred_genres": ["sci-fi", "thriller"],
            "budget_range": "100k_500k",
            "active_projects": 3,
            "completed_projects": 12
        }
        
        result = marketplace_service.create_studio_profile(studio_data)
        
        assert result["studio_id"] == studio_data["studio_id"]
        assert result["profile_created"] == True
        assert result["verification_required"] == True
        assert "created_at" in result

class TestMarketplaceAPI:
    """Test marketplace API endpoints"""
    
    def test_search_marketplace_endpoint(self):
        """Test marketplace search endpoint"""
        response = client.get(
            "/api/ip/marketplace/search",
            params={
                "license_types": ["adaptation"],
                "genres": ["sci-fi"],
                "max_revenue_share": 30.0,
                "limit": 5
            }
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "listings" in data
        assert "total_count" in data
        assert len(data["listings"]) <= 5
    
    def test_get_ip_details_endpoint(self):
        """Test IP details endpoint"""
        listing_id = "list_001"
        
        response = client.get(
            f"/api/ip/marketplace/listing/{listing_id}",
            params={"studio_id": "studio_123"}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["listing_id"] == listing_id
        assert "author" in data
        assert "content_details" in data
    
    def test_initiate_negotiation_endpoint(self):
        """Test negotiation initiation endpoint"""
        negotiation_data = {
            "listing_id": "list_001",
            "studio_id": "studio_123",
            "license_type": "adaptation",
            "initial_offer": {
                "revenue_share_percentage": 25.0,
                "territory": "worldwide",
                "duration_months": 24
            },
            "message": "Interested in adaptation rights"
        }
        
        response = client.post(
            "/api/ip/marketplace/negotiate",
            json=negotiation_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "negotiation_id" in data
        assert data["listing_id"] == negotiation_data["listing_id"]
        assert data["studio_id"] == negotiation_data["studio_id"]
    
    def test_studio_dashboard_endpoint(self):
        """Test studio dashboard endpoint"""
        studio_id = "studio_123"
        
        response = client.get(f"/api/ip/marketplace/studio/{studio_id}/dashboard")
        
        assert response.status_code == 200
        data = response.json()
        assert data["studio_id"] == studio_id
        assert "active_negotiations" in data
        assert "analytics" in data
    
    def test_create_studio_profile_endpoint(self):
        """Test studio profile creation endpoint"""
        profile_data = {
            "studio_id": "studio_789",
            "name": "New Studio",
            "studio_type": "film_production",
            "description": "A new film production studio",
            "preferred_genres": ["drama", "comedy"]
        }
        
        response = client.post(
            "/api/ip/marketplace/studio/profile",
            json=profile_data
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["studio_id"] == profile_data["studio_id"]
        assert data["profile_created"] == True
    
    def test_get_filter_options_endpoint(self):
        """Test filter options endpoint"""
        response = client.get("/api/ip/marketplace/filters/options")
        
        assert response.status_code == 200
        data = response.json()
        assert "license_types" in data
        assert "genres" in data
        assert "content_types" in data
        assert "territories" in data
        assert "studio_types" in data
        
        # Check structure of filter options
        for option in data["license_types"]:
            assert "value" in option
            assert "label" in option
    
    def test_get_trending_ip_endpoint(self):
        """Test trending IP endpoint"""
        response = client.get("/api/ip/marketplace/trending")
        
        assert response.status_code == 200
        data = response.json()
        assert "trending_listings" in data
        assert "updated_at" in data
        
        for listing in data["trending_listings"]:
            assert "listing_id" in listing
            assert "title" in listing
            assert "trending_score" in listing
    
    def test_get_recommendations_endpoint(self):
        """Test studio recommendations endpoint"""
        studio_id = "studio_123"
        
        response = client.get(
            f"/api/ip/marketplace/recommendations/{studio_id}",
            params={"limit": 5}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert "recommendations" in data
        assert data["studio_id"] == studio_id
        assert len(data["recommendations"]) <= 5
        
        for rec in data["recommendations"]:
            assert "listing_id" in rec
            assert "match_score" in rec
            assert "reason" in rec
    
    def test_save_listing_endpoint(self):
        """Test save listing endpoint"""
        listing_id = "list_001"
        studio_id = "studio_123"
        
        response = client.post(
            f"/api/ip/marketplace/listing/{listing_id}/save",
            params={"studio_id": studio_id}
        )
        
        assert response.status_code == 200
        data = response.json()
        assert data["listing_id"] == listing_id
        assert data["studio_id"] == studio_id
        assert data["saved"] == True
    
    def test_marketplace_analytics_endpoint(self):
        """Test marketplace analytics endpoint"""
        response = client.get("/api/ip/marketplace/analytics/marketplace")
        
        assert response.status_code == 200
        data = response.json()
        assert "total_listings" in data
        assert "active_negotiations" in data
        assert "completed_deals" in data
        assert "by_license_type" in data
        assert "by_studio_type" in data

if __name__ == "__main__":
    pytest.main([__file__])