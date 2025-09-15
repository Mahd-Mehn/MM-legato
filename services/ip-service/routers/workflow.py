from fastapi import APIRouter, HTTPException, Depends, status, Query
from sqlalchemy.orm import Session
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
import json

from models import LicensingAgreement, RevenueDistribution
from workflow_service import LicensingWorkflowService, WorkflowStatus, RevenueDistributionStatus, AdaptationRights
from database import get_db
from schemas import (
    WorkflowCreationRequest,
    WorkflowCreationResponse,
    RevenueDistributionRequest,
    RevenueDistributionResponse,
    MilestoneUpdateRequest,
    MilestoneUpdateResponse,
    DisputeRequest,
    DisputeResponse,
    WorkflowAnalyticsResponse
)

router = APIRouter(prefix="/workflow", tags=["Licensing Workflow & Revenue Distribution"])

workflow_service = LicensingWorkflowService()

@router.post("/create", response_model=WorkflowCreationResponse)
async def create_licensing_workflow(
    request: WorkflowCreationRequest,
    db: Session = Depends(get_db)
):
    """Create automated licensing workflow"""
    try:
        # Verify agreement exists
        agreement = db.query(LicensingAgreement).filter(
            LicensingAgreement.agreement_id == request.agreement_id
        ).first()
        
        if not agreement:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Licensing agreement not found"
            )
        
        # Create workflow
        workflow = workflow_service.create_licensing_workflow(
            agreement_id=request.agreement_id,
            registration_id=agreement.registration_id,
            studio_id=request.studio_id,
            writer_id=request.writer_id,
            license_terms=request.license_terms
        )
        
        return WorkflowCreationResponse(**workflow)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow creation failed: {str(e)}"
        )

@router.post("/revenue/distribute", response_model=RevenueDistributionResponse)
async def process_revenue_distribution(
    request: RevenueDistributionRequest,
    db: Session = Depends(get_db)
):
    """Process automated revenue distribution"""
    try:
        # Validate revenue amount
        if request.gross_revenue <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gross revenue must be positive"
            )
        
        # Process distribution
        distribution = workflow_service.process_revenue_distribution(
            workflow_id=request.workflow_id,
            gross_revenue=request.gross_revenue,
            period_start=request.period_start,
            period_end=request.period_end,
            revenue_source=request.revenue_source
        )
        
        return RevenueDistributionResponse(**distribution)
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Revenue distribution failed: {str(e)}"
        )

@router.post("/milestone/update", response_model=MilestoneUpdateResponse)
async def update_adaptation_milestone(
    request: MilestoneUpdateRequest,
    db: Session = Depends(get_db)
):
    """Update adaptation milestone progress"""
    try:
        milestone_update = workflow_service.track_adaptation_progress(
            workflow_id=request.workflow_id,
            milestone_id=request.milestone_id,
            status=request.status,
            completion_date=request.completion_date,
            notes=request.notes,
            performance_data=request.performance_data
        )
        
        return MilestoneUpdateResponse(**milestone_update)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Milestone update failed: {str(e)}"
        )

@router.get("/analytics/{workflow_id}", response_model=WorkflowAnalyticsResponse)
async def get_licensing_analytics(
    workflow_id: str,
    time_period: str = Query("last_30_days", description="Time period for analytics"),
    db: Session = Depends(get_db)
):
    """Get licensing performance analytics"""
    try:
        analytics = workflow_service.generate_licensing_analytics(
            workflow_id=workflow_id,
            time_period=time_period
        )
        
        return WorkflowAnalyticsResponse(**analytics)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Analytics generation failed: {str(e)}"
        )

@router.post("/dispute/create", response_model=DisputeResponse)
async def create_licensing_dispute(
    request: DisputeRequest,
    db: Session = Depends(get_db)
):
    """Create licensing dispute for resolution"""
    try:
        dispute = workflow_service.manage_licensing_disputes(
            workflow_id=request.workflow_id,
            dispute_type=request.dispute_type,
            description=request.description,
            raised_by=request.raised_by
        )
        
        return DisputeResponse(**dispute)
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Dispute creation failed: {str(e)}"
        )

@router.get("/revenue/calculate")
async def calculate_revenue_distribution(
    gross_revenue: float = Query(..., description="Gross revenue amount"),
    platform_fee_percentage: float = Query(15.0, description="Platform fee percentage"),
    writer_percentage: float = Query(85.0, description="Writer percentage of net revenue")
):
    """Calculate revenue distribution breakdown"""
    try:
        if gross_revenue <= 0:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Gross revenue must be positive"
            )
        
        if not (0 <= platform_fee_percentage <= 100):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Platform fee percentage must be between 0 and 100"
            )
        
        if not (0 <= writer_percentage <= 100):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Writer percentage must be between 0 and 100"
            )
        
        # Calculate distribution
        platform_fee = gross_revenue * (platform_fee_percentage / 100)
        net_revenue = gross_revenue - platform_fee
        writer_share = net_revenue * (writer_percentage / 100)
        studio_share = net_revenue - writer_share
        
        return {
            "gross_revenue": gross_revenue,
            "platform_fee": round(platform_fee, 2),
            "net_revenue": round(net_revenue, 2),
            "writer_share": round(writer_share, 2),
            "studio_share": round(studio_share, 2),
            "breakdown": {
                "platform_percentage": platform_fee_percentage,
                "writer_percentage": writer_percentage,
                "studio_percentage": round(100 - writer_percentage, 2)
            }
        }
        
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Revenue calculation failed: {str(e)}"
        )

@router.get("/workflow/{workflow_id}/status")
async def get_workflow_status(
    workflow_id: str,
    db: Session = Depends(get_db)
):
    """Get current workflow status and progress"""
    try:
        # Mock workflow status - in real implementation, query from database
        workflow_status = {
            "workflow_id": workflow_id,
            "status": WorkflowStatus.ACTIVE.value,
            "current_step": 2,
            "total_steps": 4,
            "progress_percentage": 50.0,
            "steps": [
                {
                    "step_id": "contract_signing",
                    "name": "Contract Signing",
                    "status": "completed",
                    "completed_date": "2024-02-01T10:00:00Z"
                },
                {
                    "step_id": "initial_payment",
                    "name": "Initial Payment",
                    "status": "completed",
                    "completed_date": "2024-02-03T14:30:00Z"
                },
                {
                    "step_id": "development_approval",
                    "name": "Development Approval",
                    "status": "in_progress",
                    "estimated_completion": "2024-02-20T00:00:00Z"
                },
                {
                    "step_id": "revenue_distribution",
                    "name": "Revenue Distribution",
                    "status": "pending",
                    "estimated_completion": "2024-03-01T00:00:00Z"
                }
            ],
            "milestones": [
                {
                    "milestone_id": "script_completion",
                    "name": "Script Completion",
                    "status": "pending",
                    "payment_percentage": 20.0,
                    "estimated_date": "2024-05-01T00:00:00Z"
                },
                {
                    "milestone_id": "production_start",
                    "name": "Production Start",
                    "status": "pending",
                    "payment_percentage": 30.0,
                    "estimated_date": "2024-08-01T00:00:00Z"
                }
            ],
            "next_actions": [
                {
                    "action": "writer_approval_required",
                    "description": "Writer needs to approve development approach",
                    "due_date": "2024-02-20T00:00:00Z",
                    "assigned_to": "writer"
                }
            ],
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return workflow_status
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow status retrieval failed: {str(e)}"
        )

@router.get("/revenue/history/{workflow_id}")
async def get_revenue_history(
    workflow_id: str,
    limit: int = Query(50, ge=1, le=100, description="Number of records to return"),
    offset: int = Query(0, ge=0, description="Number of records to skip"),
    db: Session = Depends(get_db)
):
    """Get revenue distribution history for workflow"""
    try:
        # Mock revenue history - in real implementation, query from database
        revenue_history = [
            {
                "distribution_id": "DIST-20240201120000-ABCD1234",
                "gross_revenue": 5000.00,
                "writer_share": 3612.50,
                "studio_share": 637.50,
                "platform_fee": 750.00,
                "revenue_source": "milestone_payment",
                "period_start": "2024-01-01T00:00:00Z",
                "period_end": "2024-01-31T23:59:59Z",
                "distribution_date": "2024-02-01T12:00:00Z",
                "status": "completed"
            },
            {
                "distribution_id": "DIST-20240301120000-EFGH5678",
                "gross_revenue": 2500.00,
                "writer_share": 1806.25,
                "studio_share": 318.75,
                "platform_fee": 375.00,
                "revenue_source": "royalties",
                "period_start": "2024-02-01T00:00:00Z",
                "period_end": "2024-02-29T23:59:59Z",
                "distribution_date": "2024-03-01T12:00:00Z",
                "status": "completed"
            }
        ]
        
        # Apply pagination
        paginated_history = revenue_history[offset:offset + limit]
        
        return {
            "workflow_id": workflow_id,
            "revenue_history": paginated_history,
            "total_count": len(revenue_history),
            "total_revenue": sum(r["gross_revenue"] for r in revenue_history),
            "total_writer_earnings": sum(r["writer_share"] for r in revenue_history),
            "total_studio_earnings": sum(r["studio_share"] for r in revenue_history),
            "limit": limit,
            "offset": offset
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Revenue history retrieval failed: {str(e)}"
        )

@router.get("/adaptation/rights")
async def get_adaptation_rights_info():
    """Get information about available adaptation rights"""
    try:
        adaptation_rights = [
            {
                "right_type": right.value,
                "description": f"Rights to adapt content for {right.value.replace('_', ' ')}",
                "typical_revenue_share": {
                    "film": "35-45%",
                    "tv_series": "30-40%",
                    "streaming": "25-35%",
                    "podcast": "20-30%",
                    "audiobook": "15-25%",
                    "game": "40-50%",
                    "comic": "25-35%",
                    "stage": "30-40%",
                    "radio": "20-30%"
                }.get(right.value, "25-35%"),
                "typical_duration_months": {
                    "film": 60,
                    "tv_series": 72,
                    "streaming": 48,
                    "podcast": 36,
                    "audiobook": 24,
                    "game": 84,
                    "comic": 48,
                    "stage": 60,
                    "radio": 36
                }.get(right.value, 48)
            }
            for right in AdaptationRights
        ]
        
        return {
            "adaptation_rights": adaptation_rights,
            "total_types": len(adaptation_rights)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Adaptation rights info retrieval failed: {str(e)}"
        )

@router.get("/workflow/templates")
async def get_workflow_templates():
    """Get predefined workflow templates"""
    try:
        templates = [
            {
                "template_id": "film_adaptation",
                "name": "Film Adaptation Workflow",
                "description": "Standard workflow for film adaptation rights",
                "license_type": "audio_visual",
                "estimated_duration_months": 60,
                "typical_milestones": 4,
                "writer_revenue_share": "35-45%",
                "steps": [
                    "Contract Signing",
                    "Initial Payment",
                    "Script Development",
                    "Production Milestones",
                    "Revenue Distribution"
                ]
            },
            {
                "template_id": "translation_rights",
                "name": "Translation Rights Workflow",
                "description": "Workflow for translation and localization rights",
                "license_type": "translation",
                "estimated_duration_months": 24,
                "typical_milestones": 2,
                "writer_revenue_share": "25-35%",
                "steps": [
                    "Contract Signing",
                    "Translation Approval",
                    "Publication",
                    "Revenue Distribution"
                ]
            },
            {
                "template_id": "digital_distribution",
                "name": "Digital Distribution Workflow",
                "description": "Workflow for digital distribution rights",
                "license_type": "distribution",
                "estimated_duration_months": 36,
                "typical_milestones": 3,
                "writer_revenue_share": "20-30%",
                "steps": [
                    "Contract Signing",
                    "Platform Integration",
                    "Marketing Launch",
                    "Revenue Distribution"
                ]
            }
        ]
        
        return {
            "templates": templates,
            "total_count": len(templates)
        }
        
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Workflow templates retrieval failed: {str(e)}"
        )