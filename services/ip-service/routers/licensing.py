from fastapi import APIRouter, HTTPException, Depends, status
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime
import json

from models import IPRegistration
from licensing_service import LicensingService, LicenseTerms, LicenseType
from database import get_db
from schemas import (
    LicensingAgreementRequest,
    LicensingAgreementResponse
)

router = APIRouter(prefix="/licensing", tags=["Licensing & Rights Management"])

licensing_service = LicensingService()

@router.post("/agreement", response_model=LicensingAgreementResponse)
async def create_licensing_agreement(
    request: LicensingAgreementRequest,
    db: Session = Depends(get_db)
):
    """Create a new licensing agreement"""
    try:
        # Verify registration exists
        registration = db.query(IPRegistration).filter(
            IPRegistration.id == request.registration_id
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )
        
        # Verify licensor owns the registration
        if registration.author_id != request.registration_id.split('_')[0]:  # Simplified check
            # In practice, you'd have proper authorization checks
            pass
        
        # Create license terms
        terms = LicenseTerms(
            license_type=request.license_type,
            territory=request.terms.get("territory"),
            duration_months=request.duration_months,
            revenue_share_percentage=request.revenue_share_percentage,
            minimum_guarantee=request.terms.get("minimum_guarantee"),
            advance_payment=request.terms.get("advance_payment"),
            royalty_rate=request.terms.get("royalty_rate"),
            exclusivity=request.terms.get("exclusivity", False),
            sublicensing_allowed=request.terms.get("sublicensing_allowed", False),
            attribution_required=request.terms.get("attribution_required", True),
            modification_allowed=request.terms.get("modification_allowed", False),
            commercial_use=request.terms.get("commercial_use", True),
            digital_distribution=request.terms.get("digital_distribution", True),
            print_distribution=request.terms.get("print_distribution", False),
            merchandising_rights=request.terms.get("merchandising_rights", False),
            sequel_rights=request.terms.get("sequel_rights", False),
            character_rights=request.terms.get("character_rights", False)
        )
        
        # Validate terms
        validation = licensing_service.validate_license_terms(request.terms)
        if not validation["valid"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Invalid license terms: {', '.join(validation['errors'])}"
            )
        
        # Create agreement
        agreement_data = licensing_service.create_licensing_agreement(
            registration_id=request.registration_id,
            licensor_id=registration.author_id,
            licensee_id=request.licensee_id,
            terms=terms,
            custom_clauses=request.terms.get("custom_clauses")
        )
        
        # Generate contract
        contract_text = licensing_service.generate_license_contract(agreement_data)
        
        # In a real implementation, you'd save this to database
        # For now, we'll return the response
        
        return LicensingAgreementResponse(
            agreement_id=agreement_data["agreement_id"],
            contract_url=f"/api/ip/licensing/contract/{agreement_data['agreement_id']}",
            status=agreement_data["status"],
            created_at=datetime.fromisoformat(agreement_data["created_at"]),
            effective_date=datetime.fromisoformat(agreement_data["effective_date"]),
            expiration_date=datetime.fromisoformat(agreement_data["expiration_date"]) if agreement_data["expiration_date"] else None
        )
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Agreement creation failed: {str(e)}"
        )

@router.get("/templates")
async def get_license_templates():
    """Get available license templates"""
    try:
        templates = licensing_service.get_license_templates()
        return {
            "templates": templates,
            "total_count": len(templates)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to get templates: {str(e)}"
        )

@router.post("/validate-terms")
async def validate_license_terms(terms: Dict[str, Any]):
    """Validate license terms"""
    try:
        validation = licensing_service.validate_license_terms(terms)
        return validation
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Validation failed: {str(e)}"
        )

@router.post("/revenue-calculation")
async def calculate_revenue_share(
    agreement_id: str,
    gross_revenue: float,
    platform_fee_percentage: float = 15.0
):
    """Calculate revenue distribution for an agreement"""
    try:
        # In a real implementation, you'd fetch the agreement from database
        # For now, we'll use mock data
        mock_agreement = {
            "agreement_id": agreement_id,
            "terms": {
                "revenue_share_percentage": 30.0
            }
        }
        
        revenue_breakdown = licensing_service.calculate_revenue_share(
            mock_agreement,
            gross_revenue,
            platform_fee_percentage
        )
        
        return revenue_breakdown
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Revenue calculation failed: {str(e)}"
        )

@router.get("/contract/{agreement_id}")
async def get_license_contract(agreement_id: str):
    """Get license contract document"""
    try:
        # In a real implementation, you'd fetch from database
        # For now, return mock contract
        
        mock_agreement = {
            "agreement_id": agreement_id,
            "registration_id": "reg_123",
            "licensor_id": "author_456",
            "licensee_id": "licensee_789",
            "license_type": "adaptation",
            "terms": {
                "territory": "North America",
                "duration_months": 24,
                "revenue_share_percentage": 30.0,
                "exclusivity": False,
                "commercial_use": True,
                "digital_distribution": True,
                "attribution_required": True,
                "modification_allowed": True
            },
            "custom_clauses": [],
            "effective_date": datetime.utcnow().isoformat(),
            "expiration_date": None,
            "created_at": datetime.utcnow().isoformat(),
            "platform": "Legato Platform",
            "legal_entity": "Legato Inc."
        }
        
        contract_text = licensing_service.generate_license_contract(mock_agreement)
        
        from fastapi.responses import PlainTextResponse
        return PlainTextResponse(content=contract_text, media_type="text/plain")
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Contract retrieval failed: {str(e)}"
        )

@router.post("/marketplace/listing")
async def create_marketplace_listing(
    registration_id: str,
    available_licenses: List[Dict[str, Any]],
    content_metadata: Dict[str, Any],
    db: Session = Depends(get_db)
):
    """Create marketplace listing for licensing opportunities"""
    try:
        # Verify registration exists
        registration = db.query(IPRegistration).filter(
            IPRegistration.id == registration_id
        ).first()
        
        if not registration:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Registration not found"
            )
        
        # Create marketplace listing
        listing = licensing_service.create_licensing_marketplace_listing(
            registration_id=registration_id,
            available_licenses=available_licenses,
            content_metadata=content_metadata
        )
        
        return listing
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Listing creation failed: {str(e)}"
        )

@router.get("/marketplace/search")
async def search_licensing_opportunities(
    license_type: Optional[str] = None,
    territory: Optional[str] = None,
    max_revenue_share: Optional[float] = None,
    content_type: Optional[str] = None,
    limit: int = 20,
    offset: int = 0
):
    """Search for licensing opportunities in marketplace"""
    try:
        # In a real implementation, this would query the database
        # For now, return mock search results
        
        mock_results = [
            {
                "listing_id": "list_001",
                "registration_id": "reg_123",
                "title": "The Digital Nomad's Journey",
                "content_type": "story",
                "author": "Jane Doe",
                "available_licenses": [
                    {
                        "license_type": "adaptation",
                        "revenue_share_percentage": 25.0,
                        "territory": "Worldwide",
                        "exclusivity": False
                    }
                ],
                "views": 150,
                "inquiries": 5
            },
            {
                "listing_id": "list_002",
                "registration_id": "reg_456",
                "title": "Cyberpunk Chronicles",
                "content_type": "series",
                "author": "John Smith",
                "available_licenses": [
                    {
                        "license_type": "audio_visual",
                        "revenue_share_percentage": 40.0,
                        "territory": "North America",
                        "exclusivity": True
                    }
                ],
                "views": 300,
                "inquiries": 12
            }
        ]
        
        # Apply filters (simplified)
        filtered_results = mock_results
        if license_type:
            filtered_results = [
                r for r in filtered_results 
                if any(l.get("license_type") == license_type for l in r["available_licenses"])
            ]
        
        if max_revenue_share:
            filtered_results = [
                r for r in filtered_results 
                if any(l.get("revenue_share_percentage", 0) <= max_revenue_share for l in r["available_licenses"])
            ]
        
        # Apply pagination
        paginated_results = filtered_results[offset:offset + limit]
        
        return {
            "results": paginated_results,
            "total_count": len(filtered_results),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Search failed: {str(e)}"
        )

@router.get("/agreement/{agreement_id}/rights-summary")
async def get_rights_summary(agreement_id: str):
    """Get summary of rights granted in agreement"""
    try:
        # Mock agreement data
        mock_agreement = {
            "agreement_id": agreement_id,
            "license_type": "adaptation",
            "terms": {
                "territory": "Europe",
                "duration_months": 36,
                "revenue_share_percentage": 35.0,
                "exclusivity": True,
                "commercial_use": True,
                "modification_allowed": True,
                "digital_distribution": True,
                "merchandising_rights": False,
                "sequel_rights": True,
                "attribution_required": True
            }
        }
        
        rights_summary = licensing_service.generate_rights_summary(mock_agreement)
        return rights_summary
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Rights summary generation failed: {str(e)}"
        )

@router.get("/stats")
async def get_licensing_stats():
    """Get licensing statistics"""
    try:
        # Mock statistics
        stats = {
            "total_agreements": 156,
            "active_agreements": 89,
            "total_revenue_distributed": 45678.90,
            "by_license_type": {
                "adaptation": 45,
                "translation": 32,
                "distribution": 28,
                "merchandising": 15,
                "audio_visual": 12
            },
            "by_territory": {
                "North America": 67,
                "Europe": 43,
                "Asia": 28,
                "Worldwide": 18
            },
            "average_revenue_share": 28.5,
            "marketplace_listings": 234,
            "active_negotiations": 23
        }
        
        return stats
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Stats retrieval failed: {str(e)}"
        )