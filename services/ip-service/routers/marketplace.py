from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from models import IPRegistration, MarketplaceListing, LicensingAgreement
from marketplace_service import MarketplaceService, StudioType, NegotiationStatus
from database import get_db
from schemas import (
    MarketplaceSearchRequest,
    MarketplaceSearchResponse,
    IPDetailsResponse,
    NegotiationRequest,
    NegotiationResponse,
    StudioProfileRequest,
    StudioProfileResponse,
    ContractGenerationRequest,
    ContractGenerationResponse
)

router = APIRouter(prefix="/marketplace", tags=["IP Marketplace for Studios"])

marketplace_service = MarketplaceService()

@router.get("/search", response_model=MarketplaceSearchResponse)
async def search_ip_marketplace(
    license_types: Optional[List[str]] = Query(None, description="Filter by license types"),
    genres: Optional[List[str]] = Query(None, description="Filter by content genres"),
    content_types: Optional[List[str]] = Query(None, description="Filter by content types"),
    territories: Optional[List[str]] = Query(None, description="Filter by territories"),
    max_revenue_share: Optional[float] = Query(None, description="Maximum revenue share percentage"),
    min_revenue_share: Optional[float] = Query(None, description="Minimum revenue share percentage"),
    budget_range: Optional[str] = Query(None, description="Budget range filter"),
    language: Optional[str] = Query(None, description="Content language"),
    completion_status: Optional[str] = Query(None, description="Content completion status"),
    min_popularity_score: Optional[float] = Query(None, description="Minimum popularity score"),
    studio_id: Optional[str] = Query(None, description="Studio ID for tracking"),
    limit: int = Query(20, ge=1, le=100, description="Number of results to return"),
    offset: int = Query(0, ge=0, description="Number of results to skip"),
    db: Session = Depends(get_db)
):
    """Search IP marketplace with advanced filters for studios"""
    try:
        filters = {
            "license_types": license_types or [],
            "genres": genres or [],
            "content_types": content_types or [],
            "territories": territories or [],
            "max_revenue_share": max_revenue_share,
            "min_revenue_share": min_revenue_share,
            "budget_range": budget_range,
            "language": language,
            "completion_status": completion_status,
            "min_popularity_score": min_popularity_score
        }
        
        search_results = marketplace_service.search_ip_marketplace(
            filters=filters,
            studio_id=studio_id,
            limit=limit,
            offset=offset
        )
        
        return MarketplaceSearchResponse(**search_results)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/listing/{listing_id}", response_model=IPDetailsResponse)
async def get_ip_details(
    listing_id: str,
    studio_id: Optional[str] = Query(None, description="Studio ID for tracking"),
    db: Session = Depends(get_db)
):
    """Get detailed information about an IP listing"""
    try:
        # Verify listing exists
        listing = db.query(MarketplaceListing).filter(
            MarketplaceListing.listing_id == listing_id
        ).first()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IP listing not found"
            )
        
        ip_details = marketplace_service.get_ip_details(
            listing_id=listing_id,
            studio_id=studio_id
        )
        
        return IPDetailsResponse(**ip_details)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get IP details: {str(e)}"
        )

@router.post("/negotiate", response_model=NegotiationResponse)
async def initiate_licensing_negotiation(
    request: NegotiationRequest,
    db: Session = Depends(get_db)
):
    """Initiate licensing negotiation between studio and author"""
    try:
        # Verify listing exists
        listing = db.query(MarketplaceListing).filter(
            MarketplaceListing.listing_id == request.listing_id
        ).first()
        
        if not listing:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="IP listing not found"
            )
        
        # Verify listing is active
        if listing.status != "active":
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="IP listing is not available for licensing"
            )
        
        negotiation = marketplace_service.initiate_licensing_negotiation(
            listing_id=request.listing_id,
            studio_id=request.studio_id,
            license_type=request.license_type,
            initial_offer=request.initial_offer,
            message=request.message
        )
        
        return NegotiationResponse(**negotiation)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Negotiation initiation failed: {str(e)}"
        )

@router.post("/negotiate/{negotiation_id}/message")
async def send_negotiation_message(
    negotiation_id: str,
    sender_id: str,
    sender_type: str,
    message: str,
    offer_update: Optional[Dict[str, Any]] = None
):
    """Send message in licensing negotiation"""
    try:
        # Validate sender type
        if sender_type not in ["studio", "author"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid sender type"
            )
        
        message_response = marketplace_service.send_negotiation_message(
            negotiation_id=negotiation_id,
            sender_id=sender_id,
            sender_type=sender_type,
            message=message,
            offer_update=offer_update
        )
        
        return message_response
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Message sending failed: {str(e)}"
        )

@router.post("/contract/generate", response_model=ContractGenerationResponse)
async def generate_licensing_contract(
    request: ContractGenerationRequest,
    db: Session = Depends(get_db)
):
    """Generate final licensing contract from negotiated terms"""
    try:
        # In real implementation, verify negotiation exists and is accepted
        
        contract_data = marketplace_service.generate_licensing_contract(
            negotiation_id=request.negotiation_id,
            final_terms=request.final_terms
        )
        
        return ContractGenerationResponse(**contract_data)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Contract generation failed: {str(e)}"
        )

@router.get("/studio/{studio_id}/dashboard")
async def get_studio_dashboard(
    studio_id: str,
    db: Session = Depends(get_db)
):
    """Get studio dashboard with licensing activities"""
    try:
        dashboard_data = marketplace_service.get_studio_dashboard(studio_id)
        return dashboard_data
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dashboard retrieval failed: {str(e)}"
        )

@router.post("/studio/profile", response_model=StudioProfileResponse)
async def create_studio_profile(
    request: StudioProfileRequest,
    db: Session = Depends(get_db)
):
    """Create or update studio profile"""
    try:
        # Validate studio type
        if request.studio_type not in [e.value for e in StudioType]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid studio type"
            )
        
        profile_data = marketplace_service.create_studio_profile(request.dict())
        return StudioProfileResponse(**profile_data)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Profile creation failed: {str(e)}"
        )

@router.get("/filters/options")
async def get_filter_options():
    """Get available filter options for marketplace search"""
    try:
        filter_options = {
            "license_types": [
                {"value": "adaptation", "label": "Adaptation Rights"},
                {"value": "translation", "label": "Translation Rights"},
                {"value": "distribution", "label": "Distribution Rights"},
                {"value": "merchandising", "label": "Merchandising Rights"},
                {"value": "audio_visual", "label": "Audio-Visual Rights"},
                {"value": "digital_rights", "label": "Digital Rights"},
                {"value": "exclusive", "label": "Exclusive License"},
                {"value": "non_exclusive", "label": "Non-Exclusive License"}
            ],
            "genres": [
                {"value": "sci-fi", "label": "Science Fiction"},
                {"value": "fantasy", "label": "Fantasy"},
                {"value": "romance", "label": "Romance"},
                {"value": "thriller", "label": "Thriller"},
                {"value": "mystery", "label": "Mystery"},
                {"value": "horror", "label": "Horror"},
                {"value": "adventure", "label": "Adventure"},
                {"value": "drama", "label": "Drama"},
                {"value": "comedy", "label": "Comedy"},
                {"value": "historical", "label": "Historical Fiction"},
                {"value": "cyberpunk", "label": "Cyberpunk"},
                {"value": "dystopian", "label": "Dystopian"}
            ],
            "content_types": [
                {"value": "novel", "label": "Novel"},
                {"value": "series", "label": "Series"},
                {"value": "short_story", "label": "Short Story"},
                {"value": "novella", "label": "Novella"},
                {"value": "anthology", "label": "Anthology"},
                {"value": "screenplay", "label": "Screenplay"}
            ],
            "territories": [
                {"value": "worldwide", "label": "Worldwide"},
                {"value": "north_america", "label": "North America"},
                {"value": "europe", "label": "Europe"},
                {"value": "asia", "label": "Asia"},
                {"value": "africa", "label": "Africa"},
                {"value": "south_america", "label": "South America"},
                {"value": "oceania", "label": "Oceania"}
            ],
            "budget_ranges": [
                {"value": "under_10k", "label": "Under $10,000"},
                {"value": "10k_50k", "label": "$10,000 - $50,000"},
                {"value": "50k_100k", "label": "$50,000 - $100,000"},
                {"value": "100k_500k", "label": "$100,000 - $500,000"},
                {"value": "500k_1m", "label": "$500,000 - $1,000,000"},
                {"value": "over_1m", "label": "Over $1,000,000"}
            ],
            "completion_status": [
                {"value": "completed", "label": "Completed"},
                {"value": "ongoing", "label": "Ongoing"},
                {"value": "hiatus", "label": "On Hiatus"}
            ],
            "studio_types": [
                {"value": e.value, "label": e.value.replace("_", " ").title()}
                for e in StudioType
            ]
        }
        
        return filter_options
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Filter options retrieval failed: {str(e)}"
        )

@router.get("/trending")
async def get_trending_ip():
    """Get trending IP listings for studios"""
    try:
        # Mock trending data - in real implementation, this would be calculated from analytics
        trending_ip = [
            {
                "listing_id": "list_001",
                "title": "The Digital Nomad's Journey",
                "author": "Jane Doe",
                "genre": ["sci-fi", "adventure"],
                "trending_score": 9.2,
                "growth_rate": 0.15,
                "recent_inquiries": 8,
                "available_licenses": ["adaptation", "audio_visual"]
            },
            {
                "listing_id": "list_002",
                "title": "Cyberpunk Chronicles",
                "author": "John Smith",
                "genre": ["cyberpunk", "thriller"],
                "trending_score": 8.8,
                "growth_rate": 0.12,
                "recent_inquiries": 12,
                "available_licenses": ["audio_visual", "merchandising"]
            }
        ]
        
        return {
            "trending_listings": trending_ip,
            "updated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Trending IP retrieval failed: {str(e)}"
        )

@router.get("/recommendations/{studio_id}")
async def get_studio_recommendations(
    studio_id: str,
    limit: int = Query(10, ge=1, le=50, description="Number of recommendations")
):
    """Get personalized IP recommendations for studio"""
    try:
        # Mock recommendations - in real implementation, this would use ML algorithms
        recommendations = [
            {
                "listing_id": "list_003",
                "title": "Space Opera Saga",
                "author": "Mike Johnson",
                "match_score": 0.92,
                "reason": "Matches your preferred sci-fi genre and budget range",
                "available_licenses": ["adaptation", "merchandising"],
                "estimated_roi": 0.35
            },
            {
                "listing_id": "list_004",
                "title": "Mystery in the Metaverse",
                "author": "Sarah Wilson",
                "match_score": 0.88,
                "reason": "Similar to your successful previous adaptations",
                "available_licenses": ["audio_visual", "digital_rights"],
                "estimated_roi": 0.42
            }
        ]
        
        return {
            "recommendations": recommendations[:limit],
            "studio_id": studio_id,
            "generated_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Recommendations retrieval failed: {str(e)}"
        )

@router.post("/listing/{listing_id}/save")
async def save_ip_listing(
    listing_id: str,
    studio_id: str
):
    """Save IP listing to studio's favorites"""
    try:
        # In real implementation, save to database
        return {
            "listing_id": listing_id,
            "studio_id": studio_id,
            "saved": True,
            "saved_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Save listing failed: {str(e)}"
        )

@router.delete("/listing/{listing_id}/save")
async def unsave_ip_listing(
    listing_id: str,
    studio_id: str
):
    """Remove IP listing from studio's favorites"""
    try:
        # In real implementation, remove from database
        return {
            "listing_id": listing_id,
            "studio_id": studio_id,
            "saved": False,
            "removed_at": datetime.utcnow().isoformat()
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Unsave listing failed: {str(e)}"
        )

@router.get("/analytics/marketplace")
async def get_marketplace_analytics():
    """Get marketplace analytics for platform insights"""
    try:
        analytics = {
            "total_listings": 1247,
            "active_negotiations": 89,
            "completed_deals": 156,
            "total_revenue_generated": 2456789.50,
            "by_license_type": {
                "adaptation": 45,
                "audio_visual": 32,
                "translation": 28,
                "merchandising": 25,
                "distribution": 26
            },
            "by_studio_type": {
                "film_production": 67,
                "tv_production": 43,
                "streaming_platform": 28,
                "publishing_house": 18
            },
            "average_deal_size": 15750.0,
            "average_negotiation_time_days": 21,
            "success_rate": 0.73,
            "top_genres": [
                {"genre": "sci-fi", "deals": 45},
                {"genre": "fantasy", "deals": 38},
                {"genre": "thriller", "deals": 32}
            ]
        }
        
        return analytics
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics retrieval failed: {str(e)}"
        )