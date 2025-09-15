import os
import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum

class StudioType(Enum):
    """Types of studios"""
    FILM_PRODUCTION = "film_production"
    TV_PRODUCTION = "tv_production"
    STREAMING_PLATFORM = "streaming_platform"
    PUBLISHING_HOUSE = "publishing_house"
    GAME_STUDIO = "game_studio"
    ANIMATION_STUDIO = "animation_studio"
    PODCAST_NETWORK = "podcast_network"
    INDEPENDENT = "independent"

class NegotiationStatus(Enum):
    """Status of licensing negotiations"""
    INITIATED = "initiated"
    IN_PROGRESS = "in_progress"
    COUNTER_OFFER = "counter_offer"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    EXPIRED = "expired"

@dataclass
class StudioProfile:
    """Studio profile information"""
    studio_id: str
    name: str
    studio_type: str
    description: str
    website: Optional[str] = None
    contact_email: Optional[str] = None
    verified: bool = False
    portfolio_url: Optional[str] = None
    budget_range: Optional[str] = None
    preferred_genres: List[str] = None
    active_projects: int = 0
    completed_projects: int = 0

class MarketplaceService:
    """Service for IP marketplace and studio interactions"""
    
    def __init__(self):
        self.platform_name = "Legato Platform"
        self.platform_url = os.getenv("PLATFORM_URL", "https://legato.app")
        
    def search_ip_marketplace(
        self,
        filters: Dict[str, Any],
        studio_id: Optional[str] = None,
        limit: int = 20,
        offset: int = 0
    ) -> Dict[str, Any]:
        """Search IP marketplace with advanced filters for studios"""
        
        # Extract filter parameters
        license_types = filters.get("license_types", [])
        genres = filters.get("genres", [])
        content_types = filters.get("content_types", [])
        territories = filters.get("territories", [])
        max_revenue_share = filters.get("max_revenue_share")
        min_revenue_share = filters.get("min_revenue_share")
        budget_range = filters.get("budget_range")
        language = filters.get("language")
        completion_status = filters.get("completion_status")
        popularity_score = filters.get("min_popularity_score")
        
        # Mock search results - in real implementation, this would query database
        mock_listings = [
            {
                "listing_id": "list_001",
                "registration_id": "reg_123",
                "title": "The Digital Nomad's Journey",
                "author": {
                    "id": "author_456",
                    "name": "Jane Doe",
                    "verified": True,
                    "previous_adaptations": 2
                },
                "content_metadata": {
                    "type": "novel",
                    "genre": ["sci-fi", "adventure"],
                    "word_count": 85000,
                    "chapters": 24,
                    "completion_status": "completed",
                    "language": "en",
                    "synopsis": "A thrilling journey through digital realms...",
                    "target_audience": "young_adult",
                    "themes": ["technology", "freedom", "identity"]
                },
                "available_licenses": [
                    {
                        "license_type": "adaptation",
                        "revenue_share_percentage": 25.0,
                        "territory": "worldwide",
                        "exclusivity": False,
                        "duration_months": 24,
                        "minimum_guarantee": 5000.0
                    },
                    {
                        "license_type": "audio_visual",
                        "revenue_share_percentage": 35.0,
                        "territory": "north_america",
                        "exclusivity": True,
                        "duration_months": 60,
                        "minimum_guarantee": 25000.0
                    }
                ],
                "marketplace_stats": {
                    "views": 150,
                    "inquiries": 5,
                    "active_negotiations": 2,
                    "popularity_score": 8.5,
                    "reader_rating": 4.7
                },
                "ip_protection": {
                    "registered": True,
                    "blockchain_verified": True,
                    "certificate_issued": True
                },
                "created_at": "2024-01-15T10:30:00Z",
                "updated_at": "2024-02-01T14:20:00Z"
            },
            {
                "listing_id": "list_002",
                "registration_id": "reg_456",
                "title": "Cyberpunk Chronicles",
                "author": {
                    "id": "author_789",
                    "name": "John Smith",
                    "verified": True,
                    "previous_adaptations": 0
                },
                "content_metadata": {
                    "type": "series",
                    "genre": ["cyberpunk", "thriller"],
                    "word_count": 120000,
                    "chapters": 36,
                    "completion_status": "ongoing",
                    "language": "en",
                    "synopsis": "In a dystopian future where technology rules...",
                    "target_audience": "adult",
                    "themes": ["technology", "rebellion", "corporate_power"]
                },
                "available_licenses": [
                    {
                        "license_type": "audio_visual",
                        "revenue_share_percentage": 40.0,
                        "territory": "worldwide",
                        "exclusivity": True,
                        "duration_months": 72,
                        "minimum_guarantee": 50000.0
                    }
                ],
                "marketplace_stats": {
                    "views": 300,
                    "inquiries": 12,
                    "active_negotiations": 4,
                    "popularity_score": 9.2,
                    "reader_rating": 4.9
                },
                "ip_protection": {
                    "registered": True,
                    "blockchain_verified": True,
                    "certificate_issued": True
                },
                "created_at": "2024-01-20T09:15:00Z",
                "updated_at": "2024-02-05T16:45:00Z"
            }
        ]
        
        # Apply filters (simplified implementation)
        filtered_listings = mock_listings
        
        if license_types:
            filtered_listings = [
                listing for listing in filtered_listings
                if any(license.get("license_type") in license_types 
                      for license in listing["available_licenses"])
            ]
        
        if genres:
            filtered_listings = [
                listing for listing in filtered_listings
                if any(genre in listing["content_metadata"]["genre"] for genre in genres)
            ]
        
        if max_revenue_share:
            filtered_listings = [
                listing for listing in filtered_listings
                if any(license.get("revenue_share_percentage", 0) <= max_revenue_share
                      for license in listing["available_licenses"])
            ]
        
        # Apply pagination
        paginated_listings = filtered_listings[offset:offset + limit]
        
        # Track search for analytics
        if studio_id:
            self._track_studio_search(studio_id, filters)
        
        return {
            "listings": paginated_listings,
            "total_count": len(filtered_listings),
            "filters_applied": filters,
            "limit": limit,
            "offset": offset,
            "search_timestamp": datetime.utcnow().isoformat()
        }
    
    def get_ip_details(self, listing_id: str, studio_id: Optional[str] = None) -> Dict[str, Any]:
        """Get detailed information about an IP listing"""
        
        # Mock detailed IP information
        ip_details = {
            "listing_id": listing_id,
            "registration_id": "reg_123",
            "title": "The Digital Nomad's Journey",
            "author": {
                "id": "author_456",
                "name": "Jane Doe",
                "bio": "Award-winning author with 5 published novels...",
                "verified": True,
                "contact_preferences": {
                    "direct_contact": True,
                    "platform_mediated": True,
                    "response_time": "24_hours"
                },
                "portfolio": {
                    "published_works": 5,
                    "adaptations": 2,
                    "awards": ["Hugo Award 2023", "Nebula Award 2022"],
                    "total_readers": 50000
                }
            },
            "content_details": {
                "full_synopsis": "A comprehensive story about...",
                "character_profiles": [
                    {
                        "name": "Alex Chen",
                        "role": "protagonist",
                        "description": "A tech-savvy digital nomad..."
                    }
                ],
                "world_building": "Set in a near-future world where...",
                "themes_analysis": {
                    "primary_themes": ["technology", "freedom", "identity"],
                    "target_demographics": ["18-35", "tech_enthusiasts", "adventure_seekers"],
                    "adaptation_potential": {
                        "film": 9.0,
                        "tv_series": 8.5,
                        "game": 7.0,
                        "podcast": 6.5
                    }
                },
                "sample_content": "Chapter 1 excerpt available upon request...",
                "content_warnings": [],
                "reading_level": "adult"
            },
            "licensing_options": [
                {
                    "license_id": "lic_001",
                    "license_type": "adaptation",
                    "terms": {
                        "revenue_share_percentage": 25.0,
                        "territory": "worldwide",
                        "exclusivity": False,
                        "duration_months": 24,
                        "minimum_guarantee": 5000.0,
                        "advance_payment": 2500.0,
                        "milestone_payments": True
                    },
                    "restrictions": {
                        "content_rating": "PG-13_or_higher",
                        "genre_changes": "minor_allowed",
                        "character_changes": "approval_required"
                    },
                    "negotiable_terms": ["revenue_share", "territory", "duration"]
                }
            ],
            "market_performance": {
                "reader_engagement": {
                    "total_reads": 25000,
                    "completion_rate": 0.85,
                    "rating": 4.7,
                    "reviews_count": 1250,
                    "social_shares": 3500
                },
                "trending_data": {
                    "current_rank": 15,
                    "category": "sci-fi",
                    "growth_rate": 0.12
                }
            },
            "ip_verification": {
                "registration_status": "verified",
                "blockchain_hash": "0x1234567890abcdef...",
                "certificate_url": "/certificates/cert_123.pdf",
                "timestamp_authority": "RFC3161_TSA",
                "verification_url": "/verify/reg_123"
            }
        }
        
        # Track view for analytics
        if studio_id:
            self._track_ip_view(listing_id, studio_id)
        
        return ip_details
    
    def initiate_licensing_negotiation(
        self,
        listing_id: str,
        studio_id: str,
        license_type: str,
        initial_offer: Dict[str, Any],
        message: Optional[str] = None
    ) -> Dict[str, Any]:
        """Initiate licensing negotiation between studio and author"""
        
        negotiation_id = self._generate_negotiation_id(listing_id, studio_id)
        
        negotiation = {
            "negotiation_id": negotiation_id,
            "listing_id": listing_id,
            "studio_id": studio_id,
            "license_type": license_type,
            "status": NegotiationStatus.INITIATED.value,
            "initial_offer": initial_offer,
            "current_terms": initial_offer,
            "messages": [
                {
                    "id": "msg_001",
                    "sender_id": studio_id,
                    "sender_type": "studio",
                    "message": message or "We are interested in licensing your IP.",
                    "timestamp": datetime.utcnow().isoformat(),
                    "offer_attached": True
                }
            ],
            "timeline": [
                {
                    "event": "negotiation_initiated",
                    "timestamp": datetime.utcnow().isoformat(),
                    "details": "Studio initiated licensing negotiation"
                }
            ],
            "expiration_date": (datetime.utcnow() + timedelta(days=30)).isoformat(),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # In real implementation, save to database and notify author
        
        return negotiation
    
    def send_negotiation_message(
        self,
        negotiation_id: str,
        sender_id: str,
        sender_type: str,
        message: str,
        offer_update: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Send message in licensing negotiation"""
        
        message_id = f"msg_{hashlib.sha256(f'{negotiation_id}:{sender_id}:{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:8]}"
        
        new_message = {
            "id": message_id,
            "sender_id": sender_id,
            "sender_type": sender_type,
            "message": message,
            "timestamp": datetime.utcnow().isoformat(),
            "offer_attached": offer_update is not None,
            "offer_details": offer_update
        }
        
        # In real implementation, update negotiation in database
        
        return {
            "message_id": message_id,
            "status": "sent",
            "timestamp": datetime.utcnow().isoformat()
        }
    
    def generate_licensing_contract(
        self,
        negotiation_id: str,
        final_terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate final licensing contract from negotiated terms"""
        
        contract_id = f"contract_{hashlib.sha256(f'{negotiation_id}:{datetime.utcnow().isoformat()}'.encode()).hexdigest()[:12]}"
        
        contract_data = {
            "contract_id": contract_id,
            "negotiation_id": negotiation_id,
            "final_terms": final_terms,
            "contract_url": f"/contracts/{contract_id}.pdf",
            "digital_signature_required": True,
            "signature_deadline": (datetime.utcnow() + timedelta(days=7)).isoformat(),
            "status": "pending_signatures",
            "created_at": datetime.utcnow().isoformat()
        }
        
        return contract_data
    
    def get_studio_dashboard(self, studio_id: str) -> Dict[str, Any]:
        """Get studio dashboard with licensing activities"""
        
        dashboard_data = {
            "studio_id": studio_id,
            "active_negotiations": [
                {
                    "negotiation_id": "neg_001",
                    "listing_title": "The Digital Nomad's Journey",
                    "author_name": "Jane Doe",
                    "license_type": "adaptation",
                    "status": "in_progress",
                    "last_activity": "2024-02-10T15:30:00Z",
                    "days_remaining": 25
                }
            ],
            "signed_contracts": [
                {
                    "contract_id": "contract_001",
                    "title": "Cyberpunk Chronicles",
                    "license_type": "audio_visual",
                    "signed_date": "2024-01-15T10:00:00Z",
                    "status": "active",
                    "revenue_to_date": 15000.0
                }
            ],
            "saved_listings": [
                {
                    "listing_id": "list_003",
                    "title": "Space Opera Saga",
                    "author": "Mike Johnson",
                    "saved_date": "2024-02-08T12:00:00Z"
                }
            ],
            "recommendations": [
                {
                    "listing_id": "list_004",
                    "title": "Mystery in the Metaverse",
                    "match_score": 0.92,
                    "reason": "Matches your preferred genres and budget range"
                }
            ],
            "analytics": {
                "total_inquiries_sent": 15,
                "response_rate": 0.73,
                "successful_negotiations": 3,
                "average_negotiation_time_days": 18,
                "total_licensing_spend": 75000.0
            }
        }
        
        return dashboard_data
    
    def create_studio_profile(self, studio_data: Dict[str, Any]) -> Dict[str, Any]:
        """Create or update studio profile"""
        
        studio_profile = StudioProfile(
            studio_id=studio_data["studio_id"],
            name=studio_data["name"],
            studio_type=studio_data["studio_type"],
            description=studio_data["description"],
            website=studio_data.get("website"),
            contact_email=studio_data.get("contact_email"),
            verified=False,  # Requires verification process
            portfolio_url=studio_data.get("portfolio_url"),
            budget_range=studio_data.get("budget_range"),
            preferred_genres=studio_data.get("preferred_genres", []),
            active_projects=studio_data.get("active_projects", 0),
            completed_projects=studio_data.get("completed_projects", 0)
        )
        
        return {
            "studio_id": studio_profile.studio_id,
            "profile_created": True,
            "verification_required": True,
            "created_at": datetime.utcnow().isoformat()
        }
    
    def _generate_negotiation_id(self, listing_id: str, studio_id: str) -> str:
        """Generate unique negotiation ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        hash_input = f"{listing_id}:{studio_id}:{timestamp}"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"NEG-{timestamp}-{hash_suffix}"
    
    def _track_studio_search(self, studio_id: str, filters: Dict[str, Any]):
        """Track studio search for analytics"""
        # In real implementation, log to analytics service
        pass
    
    def _track_ip_view(self, listing_id: str, studio_id: str):
        """Track IP listing view for analytics"""
        # In real implementation, log to analytics service
        pass