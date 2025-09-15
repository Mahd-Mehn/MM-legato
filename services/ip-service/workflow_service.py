import os
import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from dataclasses import dataclass
from enum import Enum
from decimal import Decimal, ROUND_HALF_UP

class WorkflowStatus(Enum):
    """Licensing workflow statuses"""
    DRAFT = "draft"
    PENDING_APPROVAL = "pending_approval"
    APPROVED = "approved"
    ACTIVE = "active"
    SUSPENDED = "suspended"
    TERMINATED = "terminated"
    EXPIRED = "expired"

class RevenueDistributionStatus(Enum):
    """Revenue distribution statuses"""
    PENDING = "pending"
    PROCESSING = "processing"
    COMPLETED = "completed"
    FAILED = "failed"
    DISPUTED = "disputed"

class AdaptationRights(Enum):
    """Types of adaptation rights"""
    FILM = "film"
    TV_SERIES = "tv_series"
    STREAMING = "streaming"
    PODCAST = "podcast"
    AUDIOBOOK = "audiobook"
    GAME = "game"
    COMIC = "comic"
    STAGE = "stage"
    RADIO = "radio"

@dataclass
class RevenueDistribution:
    """Revenue distribution calculation"""
    gross_revenue: Decimal
    platform_fee: Decimal
    writer_share: Decimal
    studio_share: Decimal
    platform_percentage: float
    writer_percentage: float
    studio_percentage: float
    distribution_date: datetime
    period_start: datetime
    period_end: datetime

class LicensingWorkflowService:
    """Service for managing licensing workflows and revenue distribution"""
    
    def __init__(self):
        self.platform_name = "Legato Platform"
        self.default_platform_fee = 15.0  # 15% platform fee
        self.writer_base_share = 80.0  # Writers get 80-85% of net revenue
        
    def create_licensing_workflow(
        self,
        agreement_id: str,
        registration_id: str,
        studio_id: str,
        writer_id: str,
        license_terms: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create automated licensing workflow"""
        
        workflow_id = self._generate_workflow_id(agreement_id)
        
        # Define workflow steps based on license type
        workflow_steps = self._generate_workflow_steps(license_terms)
        
        workflow = {
            "workflow_id": workflow_id,
            "agreement_id": agreement_id,
            "registration_id": registration_id,
            "studio_id": studio_id,
            "writer_id": writer_id,
            "license_terms": license_terms,
            "status": WorkflowStatus.DRAFT.value,
            "current_step": 0,
            "steps": workflow_steps,
            "milestones": self._generate_milestones(license_terms),
            "revenue_tracking": {
                "total_revenue": "0.00",
                "writer_earnings": "0.00",
                "studio_earnings": "0.00",
                "platform_earnings": "0.00",
                "last_distribution": None
            },
            "adaptation_tracking": {
                "rights_granted": license_terms.get("adaptation_rights", []),
                "development_status": "pre_production",
                "milestones_completed": [],
                "performance_metrics": {}
            },
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat(),
            "expires_at": self._calculate_expiration_date(license_terms)
        }
        
        return workflow
    
    def _generate_workflow_steps(self, license_terms: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate workflow steps based on license terms"""
        
        license_type = license_terms.get("license_type", "adaptation")
        steps = []
        
        # Common initial steps
        steps.extend([
            {
                "step_id": "contract_signing",
                "name": "Contract Signing",
                "description": "Both parties sign the licensing agreement",
                "status": "pending",
                "required": True,
                "estimated_duration_days": 7,
                "dependencies": []
            },
            {
                "step_id": "initial_payment",
                "name": "Initial Payment",
                "description": "Process advance payment if applicable",
                "status": "pending",
                "required": license_terms.get("advance_payment", 0) > 0,
                "estimated_duration_days": 3,
                "dependencies": ["contract_signing"]
            }
        ])
        
        # License-specific steps
        if license_type in ["adaptation", "audio_visual"]:
            steps.extend([
                {
                    "step_id": "development_approval",
                    "name": "Development Approval",
                    "description": "Writer approves development approach",
                    "status": "pending",
                    "required": True,
                    "estimated_duration_days": 14,
                    "dependencies": ["initial_payment"]
                },
                {
                    "step_id": "milestone_tracking",
                    "name": "Milestone Tracking",
                    "description": "Track development milestones",
                    "status": "pending",
                    "required": True,
                    "estimated_duration_days": 365,
                    "dependencies": ["development_approval"]
                }
            ])
        
        # Revenue distribution steps
        steps.append({
            "step_id": "revenue_distribution",
            "name": "Revenue Distribution",
            "description": "Automated revenue sharing",
            "status": "pending",
            "required": True,
            "estimated_duration_days": 30,
            "dependencies": ["milestone_tracking"] if license_type in ["adaptation", "audio_visual"] else ["initial_payment"],
            "recurring": True,
            "frequency": "monthly"
        })
        
        return steps
    
    def _generate_milestones(self, license_terms: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate milestones based on license terms"""
        
        license_type = license_terms.get("license_type", "adaptation")
        milestones = []
        
        if license_type in ["adaptation", "audio_visual"]:
            milestones = [
                {
                    "milestone_id": "script_completion",
                    "name": "Script Completion",
                    "description": "First draft of adaptation script completed",
                    "payment_percentage": 20.0,
                    "estimated_date": (datetime.utcnow() + timedelta(days=90)).isoformat(),
                    "status": "pending"
                },
                {
                    "milestone_id": "production_start",
                    "name": "Production Start",
                    "description": "Principal photography or production begins",
                    "payment_percentage": 30.0,
                    "estimated_date": (datetime.utcnow() + timedelta(days=180)).isoformat(),
                    "status": "pending"
                },
                {
                    "milestone_id": "production_completion",
                    "name": "Production Completion",
                    "description": "Principal photography or production completed",
                    "payment_percentage": 25.0,
                    "estimated_date": (datetime.utcnow() + timedelta(days=270)).isoformat(),
                    "status": "pending"
                },
                {
                    "milestone_id": "release",
                    "name": "Release",
                    "description": "Content released to public",
                    "payment_percentage": 25.0,
                    "estimated_date": (datetime.utcnow() + timedelta(days=365)).isoformat(),
                    "status": "pending"
                }
            ]
        elif license_type == "translation":
            milestones = [
                {
                    "milestone_id": "translation_completion",
                    "name": "Translation Completion",
                    "description": "Translation work completed",
                    "payment_percentage": 50.0,
                    "estimated_date": (datetime.utcnow() + timedelta(days=60)).isoformat(),
                    "status": "pending"
                },
                {
                    "milestone_id": "publication",
                    "name": "Publication",
                    "description": "Translated work published",
                    "payment_percentage": 50.0,
                    "estimated_date": (datetime.utcnow() + timedelta(days=90)).isoformat(),
                    "status": "pending"
                }
            ]
        
        return milestones
    
    def process_revenue_distribution(
        self,
        workflow_id: str,
        gross_revenue: float,
        period_start: datetime,
        period_end: datetime,
        revenue_source: str = "licensing"
    ) -> Dict[str, Any]:
        """Process automated revenue distribution"""
        
        # Convert to Decimal for precise calculations and round gross revenue to 2 decimal places
        gross_revenue_decimal = Decimal(str(gross_revenue)).quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Calculate platform fee (15% default)
        platform_fee_decimal = gross_revenue_decimal * Decimal(str(self.default_platform_fee / 100))
        platform_fee_decimal = platform_fee_decimal.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        net_revenue = gross_revenue_decimal - platform_fee_decimal
        
        # For licensing deals, writers typically get 80-85% of net revenue
        writer_percentage = 85.0  # 85% to writer
        studio_percentage = 15.0  # 15% to studio (from net revenue)
        
        writer_share = net_revenue * Decimal(str(writer_percentage / 100))
        writer_share = writer_share.quantize(Decimal('0.01'), rounding=ROUND_HALF_UP)
        
        # Studio share is the remainder to ensure total adds up exactly
        studio_share = net_revenue - writer_share
        
        distribution = RevenueDistribution(
            gross_revenue=gross_revenue_decimal,
            platform_fee=platform_fee_decimal,
            writer_share=writer_share,
            studio_share=studio_share,
            platform_percentage=self.default_platform_fee,
            writer_percentage=writer_percentage,
            studio_percentage=studio_percentage,
            distribution_date=datetime.utcnow(),
            period_start=period_start,
            period_end=period_end
        )
        
        # Create distribution record
        distribution_id = self._generate_distribution_id(workflow_id)
        
        distribution_record = {
            "distribution_id": distribution_id,
            "workflow_id": workflow_id,
            "gross_revenue": str(distribution.gross_revenue),
            "platform_fee": str(distribution.platform_fee),
            "writer_share": str(distribution.writer_share),
            "studio_share": str(distribution.studio_share),
            "platform_percentage": distribution.platform_percentage,
            "writer_percentage": distribution.writer_percentage,
            "studio_percentage": distribution.studio_percentage,
            "revenue_source": revenue_source,
            "period_start": period_start.isoformat(),
            "period_end": period_end.isoformat(),
            "distribution_date": distribution.distribution_date.isoformat(),
            "status": RevenueDistributionStatus.PENDING.value,
            "transaction_references": {
                "writer_payment": None,
                "studio_payment": None,
                "platform_fee_collection": None
            },
            "created_at": datetime.utcnow().isoformat()
        }
        
        return distribution_record
    
    def track_adaptation_progress(
        self,
        workflow_id: str,
        milestone_id: str,
        status: str,
        completion_date: Optional[datetime] = None,
        notes: Optional[str] = None,
        performance_data: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """Track adaptation rights progress and milestones"""
        
        milestone_update = {
            "milestone_id": milestone_id,
            "status": status,
            "completion_date": completion_date.isoformat() if completion_date else None,
            "notes": notes,
            "performance_data": performance_data or {},
            "updated_at": datetime.utcnow().isoformat()
        }
        
        # In real implementation, this would update the workflow in database
        
        return {
            "workflow_id": workflow_id,
            "milestone_update": milestone_update,
            "status": "updated"
        }
    
    def generate_licensing_analytics(
        self,
        workflow_id: str,
        time_period: str = "last_30_days"
    ) -> Dict[str, Any]:
        """Generate licensing performance analytics"""
        
        # Mock analytics data - in real implementation, this would query actual data
        analytics = {
            "workflow_id": workflow_id,
            "time_period": time_period,
            "revenue_performance": {
                "total_revenue": 45678.90,
                "writer_earnings": 38827.07,
                "studio_earnings": 6851.83,
                "platform_earnings": 6851.83,
                "growth_rate": 0.15,
                "revenue_by_source": {
                    "licensing_fees": 25000.00,
                    "milestone_payments": 15000.00,
                    "royalties": 5678.90
                }
            },
            "adaptation_progress": {
                "development_stage": "production",
                "milestones_completed": 2,
                "total_milestones": 4,
                "completion_percentage": 50.0,
                "estimated_completion_date": "2024-12-15",
                "performance_metrics": {
                    "audience_engagement": 8.5,
                    "critical_reception": 7.8,
                    "market_potential": 9.2
                }
            },
            "rights_utilization": {
                "active_adaptations": 1,
                "territories_covered": ["North America", "Europe"],
                "media_formats": ["film", "streaming"],
                "licensing_efficiency": 0.85
            },
            "financial_projections": {
                "projected_total_revenue": 125000.00,
                "projected_writer_earnings": 106250.00,
                "projected_completion_date": "2024-12-31",
                "roi_estimate": 2.74
            }
        }
        
        return analytics
    
    def manage_licensing_disputes(
        self,
        workflow_id: str,
        dispute_type: str,
        description: str,
        raised_by: str
    ) -> Dict[str, Any]:
        """Handle licensing disputes and resolution"""
        
        dispute_id = self._generate_dispute_id(workflow_id)
        
        dispute = {
            "dispute_id": dispute_id,
            "workflow_id": workflow_id,
            "dispute_type": dispute_type,
            "description": description,
            "raised_by": raised_by,
            "status": "open",
            "priority": self._calculate_dispute_priority(dispute_type),
            "resolution_timeline": self._calculate_resolution_timeline(dispute_type),
            "assigned_mediator": None,
            "evidence_submitted": [],
            "resolution_steps": self._generate_resolution_steps(dispute_type),
            "created_at": datetime.utcnow().isoformat(),
            "updated_at": datetime.utcnow().isoformat()
        }
        
        return dispute
    
    def _generate_workflow_id(self, agreement_id: str) -> str:
        """Generate unique workflow ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        hash_input = f"{agreement_id}:{timestamp}"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"WF-{timestamp}-{hash_suffix}"
    
    def _generate_distribution_id(self, workflow_id: str) -> str:
        """Generate unique distribution ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        hash_input = f"{workflow_id}:{timestamp}"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"DIST-{timestamp}-{hash_suffix}"
    
    def _generate_dispute_id(self, workflow_id: str) -> str:
        """Generate unique dispute ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        hash_input = f"{workflow_id}:{timestamp}"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"DISP-{timestamp}-{hash_suffix}"
    
    def _calculate_expiration_date(self, license_terms: Dict[str, Any]) -> Optional[str]:
        """Calculate workflow expiration date"""
        duration_months = license_terms.get("duration_months")
        if duration_months:
            expiration = datetime.utcnow() + timedelta(days=duration_months * 30)
            return expiration.isoformat()
        return None
    
    def _calculate_dispute_priority(self, dispute_type: str) -> str:
        """Calculate dispute priority based on type"""
        high_priority_types = ["payment_dispute", "contract_breach", "ip_violation"]
        if dispute_type in high_priority_types:
            return "high"
        elif dispute_type in ["milestone_disagreement", "quality_concern"]:
            return "medium"
        else:
            return "low"
    
    def _calculate_resolution_timeline(self, dispute_type: str) -> int:
        """Calculate expected resolution timeline in days"""
        timeline_map = {
            "payment_dispute": 7,
            "contract_breach": 14,
            "ip_violation": 21,
            "milestone_disagreement": 10,
            "quality_concern": 14,
            "communication_issue": 5
        }
        return timeline_map.get(dispute_type, 14)
    
    def _generate_resolution_steps(self, dispute_type: str) -> List[Dict[str, Any]]:
        """Generate resolution steps based on dispute type"""
        
        common_steps = [
            {
                "step": "evidence_collection",
                "description": "Collect and review evidence from both parties",
                "estimated_days": 3
            },
            {
                "step": "mediation",
                "description": "Platform-mediated discussion between parties",
                "estimated_days": 5
            },
            {
                "step": "resolution",
                "description": "Implement agreed resolution",
                "estimated_days": 2
            }
        ]
        
        if dispute_type == "payment_dispute":
            common_steps.insert(1, {
                "step": "financial_audit",
                "description": "Audit payment records and calculations",
                "estimated_days": 2
            })
        
        return common_steps