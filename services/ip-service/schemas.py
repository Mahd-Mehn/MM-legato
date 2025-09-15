from pydantic import BaseModel, Field
from typing import Dict, Any, Optional, List
from datetime import datetime

class ContentRegistrationRequest(BaseModel):
    """Request model for content registration"""
    content_id: str = Field(..., description="Unique identifier for the content")
    content: str = Field(..., min_length=1, description="The actual content to be protected")
    content_type: str = Field(..., description="Type of content (story, chapter, etc.)")
    author_id: str = Field(..., description="Unique identifier for the author")
    title: str = Field(..., min_length=1, max_length=500, description="Title of the content")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Additional metadata")

class ContentRegistrationResponse(BaseModel):
    """Response model for content registration"""
    registration_id: str = Field(..., description="Unique registration identifier")
    content_hash: str = Field(..., description="SHA-256 hash of the content")
    timestamp: datetime = Field(..., description="Registration timestamp")
    timestamp_authority: Optional[str] = Field(None, description="Timestamp authority used")
    verification_url: str = Field(..., description="URL to verify the registration")
    status: str = Field(..., description="Registration status")

class CertificateRequest(BaseModel):
    """Request model for certificate generation"""
    registration_id: str = Field(..., description="Registration ID to generate certificate for")
    author_name: str = Field(..., min_length=1, description="Author's display name for certificate")
    regenerate: bool = Field(default=False, description="Whether to regenerate existing certificate")

class CertificateResponse(BaseModel):
    """Response model for certificate generation"""
    certificate_id: str = Field(..., description="Unique certificate identifier")
    certificate_number: str = Field(..., description="Human-readable certificate number")
    certificate_url: str = Field(..., description="URL to download the certificate")
    verification_url: str = Field(..., description="URL to verify the certificate")
    issued_at: datetime = Field(..., description="Certificate issuance timestamp")
    status: str = Field(..., description="Certificate status")

class HashVerificationRequest(BaseModel):
    """Request model for hash verification"""
    content: str = Field(..., description="Content to verify")
    expected_hash: str = Field(..., description="Expected SHA-256 hash")
    metadata: Optional[Dict[str, Any]] = Field(default=None, description="Metadata used in original hash")

class HashVerificationResponse(BaseModel):
    """Response model for hash verification"""
    is_valid: bool = Field(..., description="Whether the hash is valid")
    expected_hash: str = Field(..., description="Expected hash")
    computed_hash: str = Field(..., description="Computed hash from provided content")
    verification_method: str = Field(..., description="Hash verification method used")
    verified_at: datetime = Field(..., description="Verification timestamp")

class IPRegistrationInfo(BaseModel):
    """Model for IP registration information"""
    id: str
    content_id: str
    content_hash: str
    content_type: str
    author_id: str
    title: str
    timestamp: datetime
    timestamp_authority: Optional[str]
    verification_method: str
    is_verified: bool
    created_at: datetime

class ContentHashInfo(BaseModel):
    """Model for content hash information"""
    hash_algorithm: str
    content_length: int
    verification_status: str
    last_verified_at: Optional[datetime]

class CertificateInfo(BaseModel):
    """Model for certificate information"""
    id: str
    certificate_number: str
    issued_at: datetime
    status: str

class VerificationResponse(BaseModel):
    """Response model for registration verification"""
    registration: IPRegistrationInfo
    content_hash: Optional[ContentHashInfo]
    certificates: list[CertificateInfo]
    verification_status: str

class BlockchainRegistrationRequest(BaseModel):
    """Request model for blockchain registration"""
    registration_id: str = Field(..., description="Registration ID to register on blockchain")
    blockchain_network: str = Field(default="ethereum", description="Blockchain network to use")
    priority: str = Field(default="standard", description="Transaction priority (low, standard, high)")

class BlockchainRegistrationResponse(BaseModel):
    """Response model for blockchain registration"""
    blockchain_record_id: str = Field(..., description="Blockchain record identifier")
    transaction_hash: str = Field(..., description="Blockchain transaction hash")
    blockchain_network: str = Field(..., description="Blockchain network used")
    status: str = Field(..., description="Transaction status")
    estimated_confirmation_time: Optional[str] = Field(None, description="Estimated confirmation time")

class LicensingAgreementRequest(BaseModel):
    """Request model for licensing agreement creation"""
    registration_id: str = Field(..., description="Registration ID to license")
    licensee_id: str = Field(..., description="Licensee user ID")
    license_type: str = Field(..., description="Type of license (adaptation, translation, etc.)")
    terms: Dict[str, Any] = Field(..., description="Licensing terms and conditions")
    revenue_share_percentage: float = Field(..., ge=0, le=100, description="Revenue share percentage for licensor")
    duration_months: Optional[int] = Field(None, description="License duration in months")
    territory: Optional[str] = Field(None, description="Geographic territory for license")

class LicensingAgreementResponse(BaseModel):
    """Response model for licensing agreement creation"""
    agreement_id: str = Field(..., description="Licensing agreement identifier")
    contract_url: str = Field(..., description="URL to download the contract")
    status: str = Field(..., description="Agreement status")
    created_at: datetime = Field(..., description="Agreement creation timestamp")
    effective_date: datetime = Field(..., description="Agreement effective date")
    expiration_date: Optional[datetime] = Field(None, description="Agreement expiration date")

class PlagiarismCheckRequest(BaseModel):
    """Request model for plagiarism detection"""
    content: str = Field(..., description="Content to check for plagiarism")
    content_type: str = Field(..., description="Type of content being checked")
    author_id: Optional[str] = Field(None, description="Author ID to exclude from results")

class PlagiarismMatch(BaseModel):
    """Model for plagiarism match result"""
    registration_id: str
    content_id: str
    title: str
    author_id: str
    similarity_score: float
    matching_segments: list[str]
    timestamp: datetime

class PlagiarismCheckResponse(BaseModel):
    """Response model for plagiarism detection"""
    is_original: bool = Field(..., description="Whether content appears to be original")
    confidence_score: float = Field(..., description="Confidence score (0-1)")
    matches: list[PlagiarismMatch] = Field(..., description="List of potential matches")
    checked_at: datetime = Field(..., description="Check timestamp")
    total_registrations_checked: int = Field(..., description="Number of registrations checked")

# Marketplace Schemas

class MarketplaceSearchRequest(BaseModel):
    """Request model for marketplace search"""
    license_types: Optional[List[str]] = Field(default=None, description="Filter by license types")
    genres: Optional[List[str]] = Field(default=None, description="Filter by content genres")
    content_types: Optional[List[str]] = Field(default=None, description="Filter by content types")
    territories: Optional[List[str]] = Field(default=None, description="Filter by territories")
    max_revenue_share: Optional[float] = Field(default=None, description="Maximum revenue share percentage")
    min_revenue_share: Optional[float] = Field(default=None, description="Minimum revenue share percentage")
    budget_range: Optional[str] = Field(default=None, description="Budget range filter")
    language: Optional[str] = Field(default=None, description="Content language")
    completion_status: Optional[str] = Field(default=None, description="Content completion status")
    min_popularity_score: Optional[float] = Field(default=None, description="Minimum popularity score")
    limit: int = Field(default=20, ge=1, le=100, description="Number of results to return")
    offset: int = Field(default=0, ge=0, description="Number of results to skip")

class MarketplaceSearchResponse(BaseModel):
    """Response model for marketplace search"""
    listings: List[Dict[str, Any]] = Field(..., description="List of IP listings")
    total_count: int = Field(..., description="Total number of matching listings")
    filters_applied: Dict[str, Any] = Field(..., description="Filters that were applied")
    limit: int = Field(..., description="Number of results returned")
    offset: int = Field(..., description="Number of results skipped")
    search_timestamp: str = Field(..., description="Search timestamp")

class IPDetailsResponse(BaseModel):
    """Response model for detailed IP information"""
    listing_id: str = Field(..., description="Listing identifier")
    registration_id: str = Field(..., description="IP registration identifier")
    title: str = Field(..., description="Content title")
    author: Dict[str, Any] = Field(..., description="Author information")
    content_details: Dict[str, Any] = Field(..., description="Detailed content information")
    licensing_options: List[Dict[str, Any]] = Field(..., description="Available licensing options")
    market_performance: Dict[str, Any] = Field(..., description="Market performance data")
    ip_verification: Dict[str, Any] = Field(..., description="IP verification status")

class NegotiationRequest(BaseModel):
    """Request model for licensing negotiation"""
    listing_id: str = Field(..., description="IP listing identifier")
    studio_id: str = Field(..., description="Studio identifier")
    license_type: str = Field(..., description="Type of license requested")
    initial_offer: Dict[str, Any] = Field(..., description="Initial licensing offer terms")
    message: Optional[str] = Field(default=None, description="Initial message to author")

class NegotiationResponse(BaseModel):
    """Response model for licensing negotiation"""
    negotiation_id: str = Field(..., description="Negotiation identifier")
    listing_id: str = Field(..., description="IP listing identifier")
    studio_id: str = Field(..., description="Studio identifier")
    license_type: str = Field(..., description="Type of license")
    status: str = Field(..., description="Negotiation status")
    initial_offer: Dict[str, Any] = Field(..., description="Initial offer terms")
    current_terms: Dict[str, Any] = Field(..., description="Current negotiation terms")
    messages: List[Dict[str, Any]] = Field(..., description="Negotiation messages")
    timeline: List[Dict[str, Any]] = Field(..., description="Negotiation timeline")
    expiration_date: str = Field(..., description="Negotiation expiration date")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class ContractGenerationRequest(BaseModel):
    """Request model for contract generation"""
    negotiation_id: str = Field(..., description="Negotiation identifier")
    final_terms: Dict[str, Any] = Field(..., description="Final agreed terms")

class ContractGenerationResponse(BaseModel):
    """Response model for contract generation"""
    contract_id: str = Field(..., description="Contract identifier")
    negotiation_id: str = Field(..., description="Negotiation identifier")
    final_terms: Dict[str, Any] = Field(..., description="Final contract terms")
    contract_url: str = Field(..., description="Contract document URL")
    digital_signature_required: bool = Field(..., description="Whether digital signature is required")
    signature_deadline: str = Field(..., description="Signature deadline")
    status: str = Field(..., description="Contract status")
    created_at: str = Field(..., description="Creation timestamp")

class StudioProfileRequest(BaseModel):
    """Request model for studio profile creation"""
    studio_id: str = Field(..., description="Studio identifier")
    name: str = Field(..., min_length=1, description="Studio name")
    studio_type: str = Field(..., description="Type of studio")
    description: str = Field(..., min_length=1, description="Studio description")
    website: Optional[str] = Field(default=None, description="Studio website")
    contact_email: Optional[str] = Field(default=None, description="Contact email")
    portfolio_url: Optional[str] = Field(default=None, description="Portfolio URL")
    budget_range: Optional[str] = Field(default=None, description="Budget range")
    preferred_genres: Optional[List[str]] = Field(default=None, description="Preferred content genres")
    active_projects: Optional[int] = Field(default=0, description="Number of active projects")
    completed_projects: Optional[int] = Field(default=0, description="Number of completed projects")

class StudioProfileResponse(BaseModel):
    """Response model for studio profile creation"""
    studio_id: str = Field(..., description="Studio identifier")
    profile_created: bool = Field(..., description="Whether profile was created successfully")
    verification_required: bool = Field(..., description="Whether verification is required")
    created_at: str = Field(..., description="Creation timestamp")

# Workflow Schemas

class WorkflowCreationRequest(BaseModel):
    """Request model for workflow creation"""
    agreement_id: str = Field(..., description="Licensing agreement identifier")
    studio_id: str = Field(..., description="Studio identifier")
    writer_id: str = Field(..., description="Writer identifier")
    license_terms: Dict[str, Any] = Field(..., description="License terms and conditions")

class WorkflowCreationResponse(BaseModel):
    """Response model for workflow creation"""
    workflow_id: str = Field(..., description="Workflow identifier")
    agreement_id: str = Field(..., description="Licensing agreement identifier")
    registration_id: str = Field(..., description="IP registration identifier")
    studio_id: str = Field(..., description="Studio identifier")
    writer_id: str = Field(..., description="Writer identifier")
    license_terms: Dict[str, Any] = Field(..., description="License terms")
    status: str = Field(..., description="Workflow status")
    current_step: int = Field(..., description="Current workflow step")
    steps: List[Dict[str, Any]] = Field(..., description="Workflow steps")
    milestones: List[Dict[str, Any]] = Field(..., description="Workflow milestones")
    revenue_tracking: Dict[str, Any] = Field(..., description="Revenue tracking information")
    adaptation_tracking: Dict[str, Any] = Field(..., description="Adaptation tracking information")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")
    expires_at: Optional[str] = Field(default=None, description="Workflow expiration date")

class RevenueDistributionRequest(BaseModel):
    """Request model for revenue distribution"""
    workflow_id: str = Field(..., description="Workflow identifier")
    gross_revenue: float = Field(..., gt=0, description="Gross revenue amount")
    period_start: datetime = Field(..., description="Revenue period start date")
    period_end: datetime = Field(..., description="Revenue period end date")
    revenue_source: str = Field(default="licensing", description="Source of revenue")

class RevenueDistributionResponse(BaseModel):
    """Response model for revenue distribution"""
    distribution_id: str = Field(..., description="Distribution identifier")
    workflow_id: str = Field(..., description="Workflow identifier")
    gross_revenue: str = Field(..., description="Gross revenue amount")
    platform_fee: str = Field(..., description="Platform fee amount")
    writer_share: str = Field(..., description="Writer share amount")
    studio_share: str = Field(..., description="Studio share amount")
    platform_percentage: float = Field(..., description="Platform fee percentage")
    writer_percentage: float = Field(..., description="Writer share percentage")
    studio_percentage: float = Field(..., description="Studio share percentage")
    revenue_source: str = Field(..., description="Source of revenue")
    period_start: str = Field(..., description="Revenue period start date")
    period_end: str = Field(..., description="Revenue period end date")
    distribution_date: str = Field(..., description="Distribution date")
    status: str = Field(..., description="Distribution status")
    transaction_references: Dict[str, Any] = Field(..., description="Transaction references")
    created_at: str = Field(..., description="Creation timestamp")

class MilestoneUpdateRequest(BaseModel):
    """Request model for milestone update"""
    workflow_id: str = Field(..., description="Workflow identifier")
    milestone_id: str = Field(..., description="Milestone identifier")
    status: str = Field(..., description="Milestone status")
    completion_date: Optional[datetime] = Field(default=None, description="Completion date")
    notes: Optional[str] = Field(default=None, description="Update notes")
    performance_data: Optional[Dict[str, Any]] = Field(default=None, description="Performance data")

class MilestoneUpdateResponse(BaseModel):
    """Response model for milestone update"""
    workflow_id: str = Field(..., description="Workflow identifier")
    milestone_update: Dict[str, Any] = Field(..., description="Milestone update details")
    status: str = Field(..., description="Update status")

class DisputeRequest(BaseModel):
    """Request model for dispute creation"""
    workflow_id: str = Field(..., description="Workflow identifier")
    dispute_type: str = Field(..., description="Type of dispute")
    description: str = Field(..., min_length=1, description="Dispute description")
    raised_by: str = Field(..., description="User who raised the dispute")

class DisputeResponse(BaseModel):
    """Response model for dispute creation"""
    dispute_id: str = Field(..., description="Dispute identifier")
    workflow_id: str = Field(..., description="Workflow identifier")
    dispute_type: str = Field(..., description="Type of dispute")
    description: str = Field(..., description="Dispute description")
    raised_by: str = Field(..., description="User who raised the dispute")
    status: str = Field(..., description="Dispute status")
    priority: str = Field(..., description="Dispute priority")
    resolution_timeline: int = Field(..., description="Expected resolution timeline in days")
    assigned_mediator: Optional[str] = Field(default=None, description="Assigned mediator")
    evidence_submitted: List[str] = Field(..., description="Evidence submitted")
    resolution_steps: List[Dict[str, Any]] = Field(..., description="Resolution steps")
    created_at: str = Field(..., description="Creation timestamp")
    updated_at: str = Field(..., description="Last update timestamp")

class WorkflowAnalyticsResponse(BaseModel):
    """Response model for workflow analytics"""
    workflow_id: str = Field(..., description="Workflow identifier")
    time_period: str = Field(..., description="Analytics time period")
    revenue_performance: Dict[str, Any] = Field(..., description="Revenue performance data")
    adaptation_progress: Dict[str, Any] = Field(..., description="Adaptation progress data")
    rights_utilization: Dict[str, Any] = Field(..., description="Rights utilization data")
    financial_projections: Dict[str, Any] = Field(..., description="Financial projections")