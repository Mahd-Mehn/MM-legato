import os
import json
import hashlib
from typing import Dict, Any, Optional, List
from datetime import datetime, timedelta
from jinja2 import Template
from dataclasses import dataclass
from enum import Enum

class LicenseType(Enum):
    """Types of licenses available"""
    ADAPTATION = "adaptation"
    TRANSLATION = "translation"
    DISTRIBUTION = "distribution"
    MERCHANDISING = "merchandising"
    AUDIO_VISUAL = "audio_visual"
    DIGITAL_RIGHTS = "digital_rights"
    EXCLUSIVE = "exclusive"
    NON_EXCLUSIVE = "non_exclusive"

class LicenseStatus(Enum):
    """License agreement statuses"""
    DRAFT = "draft"
    PENDING = "pending"
    ACTIVE = "active"
    EXPIRED = "expired"
    TERMINATED = "terminated"
    SUSPENDED = "suspended"

@dataclass
class LicenseTerms:
    """License terms and conditions"""
    license_type: str
    territory: Optional[str] = None
    duration_months: Optional[int] = None
    revenue_share_percentage: float = 0.0
    minimum_guarantee: Optional[float] = None
    advance_payment: Optional[float] = None
    royalty_rate: Optional[float] = None
    exclusivity: bool = False
    sublicensing_allowed: bool = False
    attribution_required: bool = True
    modification_allowed: bool = False
    commercial_use: bool = True
    digital_distribution: bool = True
    print_distribution: bool = False
    merchandising_rights: bool = False
    sequel_rights: bool = False
    character_rights: bool = False

class LicensingService:
    """Service for licensing and rights management"""
    
    def __init__(self):
        self.platform_name = "Legato Platform"
        self.platform_url = os.getenv("PLATFORM_URL", "https://legato.app")
        self.legal_entity = os.getenv("LEGAL_ENTITY", "Legato Inc.")
        
    def create_licensing_agreement(
        self,
        registration_id: str,
        licensor_id: str,
        licensee_id: str,
        terms: LicenseTerms,
        custom_clauses: Optional[List[str]] = None
    ) -> Dict[str, Any]:
        """Create a new licensing agreement"""
        
        # Generate agreement ID
        agreement_id = self._generate_agreement_id(registration_id, licensee_id)
        
        # Calculate dates
        effective_date = datetime.utcnow()
        expiration_date = None
        if terms.duration_months:
            expiration_date = effective_date + timedelta(days=terms.duration_months * 30)
        
        # Create agreement data
        agreement_data = {
            "agreement_id": agreement_id,
            "registration_id": registration_id,
            "licensor_id": licensor_id,
            "licensee_id": licensee_id,
            "license_type": terms.license_type,
            "terms": {
                "territory": terms.territory,
                "duration_months": terms.duration_months,
                "revenue_share_percentage": terms.revenue_share_percentage,
                "minimum_guarantee": terms.minimum_guarantee,
                "advance_payment": terms.advance_payment,
                "royalty_rate": terms.royalty_rate,
                "exclusivity": terms.exclusivity,
                "sublicensing_allowed": terms.sublicensing_allowed,
                "attribution_required": terms.attribution_required,
                "modification_allowed": terms.modification_allowed,
                "commercial_use": terms.commercial_use,
                "digital_distribution": terms.digital_distribution,
                "print_distribution": terms.print_distribution,
                "merchandising_rights": terms.merchandising_rights,
                "sequel_rights": terms.sequel_rights,
                "character_rights": terms.character_rights
            },
            "custom_clauses": custom_clauses or [],
            "effective_date": effective_date.isoformat(),
            "expiration_date": expiration_date.isoformat() if expiration_date else None,
            "status": LicenseStatus.DRAFT.value,
            "created_at": datetime.utcnow().isoformat(),
            "platform": self.platform_name,
            "legal_entity": self.legal_entity
        }
        
        return agreement_data
    
    def _generate_agreement_id(self, registration_id: str, licensee_id: str) -> str:
        """Generate unique agreement ID"""
        timestamp = datetime.utcnow().strftime("%Y%m%d%H%M%S")
        hash_input = f"{registration_id}:{licensee_id}:{timestamp}"
        hash_suffix = hashlib.sha256(hash_input.encode()).hexdigest()[:8].upper()
        return f"LIC-{timestamp}-{hash_suffix}"
    
    def generate_license_contract(self, agreement_data: Dict[str, Any]) -> str:
        """Generate legal contract document"""
        
        contract_template = """
# INTELLECTUAL PROPERTY LICENSE AGREEMENT

**Agreement ID:** {{ agreement_id }}  
**Date:** {{ created_at }}

## PARTIES

**LICENSOR:** {{ licensor_id }}  
**LICENSEE:** {{ licensee_id }}  
**PLATFORM:** {{ platform }} ({{ legal_entity }})

## LICENSED PROPERTY

**Registration ID:** {{ registration_id }}  
**Content Type:** {{ license_type }}

## GRANT OF LICENSE

Subject to the terms and conditions of this Agreement, Licensor hereby grants to Licensee a {{ "exclusive" if terms.exclusivity else "non-exclusive" }} license to use the Licensed Property.

## TERRITORY

{% if terms.territory %}
This license is granted for the territory of: {{ terms.territory }}
{% else %}
This license is granted worldwide.
{% endif %}

## TERM

{% if terms.duration_months %}
This Agreement shall commence on {{ effective_date }} and shall continue for {{ terms.duration_months }} months, expiring on {{ expiration_date }}.
{% else %}
This Agreement shall commence on {{ effective_date }} and shall continue indefinitely until terminated.
{% endif %}

## FINANCIAL TERMS

{% if terms.revenue_share_percentage > 0 %}
**Revenue Share:** Licensee shall pay Licensor {{ terms.revenue_share_percentage }}% of net revenues.
{% endif %}

{% if terms.minimum_guarantee %}
**Minimum Guarantee:** ${{ terms.minimum_guarantee }}
{% endif %}

{% if terms.advance_payment %}
**Advance Payment:** ${{ terms.advance_payment }}
{% endif %}

{% if terms.royalty_rate %}
**Royalty Rate:** {{ terms.royalty_rate }}%
{% endif %}

## RIGHTS GRANTED

The following rights are granted under this license:

- **Commercial Use:** {{ "Permitted" if terms.commercial_use else "Not Permitted" }}
- **Digital Distribution:** {{ "Permitted" if terms.digital_distribution else "Not Permitted" }}
- **Print Distribution:** {{ "Permitted" if terms.print_distribution else "Not Permitted" }}
- **Modifications:** {{ "Permitted" if terms.modification_allowed else "Not Permitted" }}
- **Sublicensing:** {{ "Permitted" if terms.sublicensing_allowed else "Not Permitted" }}
- **Merchandising Rights:** {{ "Included" if terms.merchandising_rights else "Not Included" }}
- **Sequel Rights:** {{ "Included" if terms.sequel_rights else "Not Included" }}
- **Character Rights:** {{ "Included" if terms.character_rights else "Not Included" }}

## ATTRIBUTION

{% if terms.attribution_required %}
Licensee must provide appropriate attribution to the Licensor in all uses of the Licensed Property.
{% else %}
No attribution is required.
{% endif %}

## CUSTOM CLAUSES

{% for clause in custom_clauses %}
{{ loop.index }}. {{ clause }}
{% endfor %}

## REVENUE SHARING AND PAYMENTS

All payments shall be made through the {{ platform }} platform. Revenue sharing will be calculated and distributed automatically based on the terms specified above.

## TERMINATION

This Agreement may be terminated by either party with 30 days written notice. Upon termination, all rights granted hereunder shall immediately revert to the Licensor.

## GOVERNING LAW

This Agreement shall be governed by the laws of [JURISDICTION] and any disputes shall be resolved through the {{ platform }} dispute resolution process.

## DIGITAL SIGNATURE

This agreement is digitally signed and verified through the {{ platform }} blockchain-based IP protection system.

**Agreement Hash:** {{ agreement_hash }}  
**Verification URL:** {{ platform_url }}/verify/agreement/{{ agreement_id }}

---

*This is a legally binding agreement generated by {{ platform }}. For questions or disputes, please contact our legal team.*
        """
        
        # Calculate agreement hash for verification
        agreement_hash = hashlib.sha256(
            json.dumps(agreement_data, sort_keys=True).encode()
        ).hexdigest()[:16]
        
        # Render template
        template = Template(contract_template)
        contract = template.render(
            **agreement_data,
            agreement_hash=agreement_hash,
            platform_url=self.platform_url
        )
        
        return contract
    
    def calculate_revenue_share(
        self,
        agreement_data: Dict[str, Any],
        gross_revenue: float,
        platform_fee_percentage: float = 15.0
    ) -> Dict[str, float]:
        """Calculate revenue distribution"""
        
        terms = agreement_data.get("terms", {})
        revenue_share_percentage = terms.get("revenue_share_percentage", 0.0)
        
        # Calculate platform fee
        platform_fee = gross_revenue * (platform_fee_percentage / 100)
        net_revenue = gross_revenue - platform_fee
        
        # Calculate licensor share
        licensor_share = net_revenue * (revenue_share_percentage / 100)
        
        # Calculate licensee share (remaining after licensor and platform)
        licensee_share = net_revenue - licensor_share
        
        return {
            "gross_revenue": gross_revenue,
            "platform_fee": platform_fee,
            "net_revenue": net_revenue,
            "licensor_share": licensor_share,
            "licensee_share": licensee_share,
            "licensor_percentage": revenue_share_percentage,
            "licensee_percentage": 100 - revenue_share_percentage - platform_fee_percentage,
            "platform_percentage": platform_fee_percentage
        }
    
    def get_license_templates(self) -> List[Dict[str, Any]]:
        """Get predefined license templates"""
        
        templates = [
            {
                "id": "adaptation_standard",
                "name": "Standard Adaptation License",
                "description": "Standard license for adapting content to different media",
                "license_type": LicenseType.ADAPTATION.value,
                "default_terms": {
                    "revenue_share_percentage": 25.0,
                    "duration_months": 24,
                    "exclusivity": False,
                    "modification_allowed": True,
                    "commercial_use": True,
                    "attribution_required": True,
                    "sequel_rights": False
                }
            },
            {
                "id": "translation_exclusive",
                "name": "Exclusive Translation Rights",
                "description": "Exclusive rights to translate content to specific language",
                "license_type": LicenseType.TRANSLATION.value,
                "default_terms": {
                    "revenue_share_percentage": 30.0,
                    "duration_months": 36,
                    "exclusivity": True,
                    "modification_allowed": False,
                    "commercial_use": True,
                    "attribution_required": True,
                    "digital_distribution": True
                }
            },
            {
                "id": "distribution_digital",
                "name": "Digital Distribution License",
                "description": "Rights to distribute content through digital channels",
                "license_type": LicenseType.DISTRIBUTION.value,
                "default_terms": {
                    "revenue_share_percentage": 20.0,
                    "duration_months": 12,
                    "exclusivity": False,
                    "modification_allowed": False,
                    "commercial_use": True,
                    "digital_distribution": True,
                    "print_distribution": False
                }
            },
            {
                "id": "merchandising_standard",
                "name": "Merchandising Rights",
                "description": "Rights to create and sell merchandise based on content",
                "license_type": LicenseType.MERCHANDISING.value,
                "default_terms": {
                    "revenue_share_percentage": 35.0,
                    "duration_months": 18,
                    "exclusivity": False,
                    "merchandising_rights": True,
                    "character_rights": True,
                    "commercial_use": True,
                    "attribution_required": True
                }
            },
            {
                "id": "audiovisual_adaptation",
                "name": "Audio-Visual Adaptation",
                "description": "Rights to adapt content for film, TV, or streaming",
                "license_type": LicenseType.AUDIO_VISUAL.value,
                "default_terms": {
                    "revenue_share_percentage": 40.0,
                    "duration_months": 60,
                    "exclusivity": True,
                    "modification_allowed": True,
                    "sequel_rights": True,
                    "character_rights": True,
                    "commercial_use": True,
                    "minimum_guarantee": 10000.0
                }
            }
        ]
        
        return templates
    
    def validate_license_terms(self, terms: Dict[str, Any]) -> Dict[str, Any]:
        """Validate license terms and return validation result"""
        
        errors = []
        warnings = []
        
        # Validate revenue share percentage
        revenue_share = terms.get("revenue_share_percentage", 0)
        if revenue_share < 0 or revenue_share > 100:
            errors.append("Revenue share percentage must be between 0 and 100")
        elif revenue_share > 50:
            warnings.append("Revenue share percentage above 50% is unusually high")
        
        # Validate duration
        duration = terms.get("duration_months")
        if duration is not None:
            if duration <= 0:
                errors.append("Duration must be positive")
            elif duration > 120:
                warnings.append("Duration over 10 years is unusually long")
        
        # Validate financial terms
        min_guarantee = terms.get("minimum_guarantee")
        advance_payment = terms.get("advance_payment")
        
        if min_guarantee is not None and min_guarantee < 0:
            errors.append("Minimum guarantee cannot be negative")
        
        if advance_payment is not None and advance_payment < 0:
            errors.append("Advance payment cannot be negative")
        
        # Validate territory
        territory = terms.get("territory")
        if territory and len(territory.strip()) == 0:
            warnings.append("Territory is empty")
        
        # Check for conflicting terms
        if terms.get("exclusivity") and terms.get("sublicensing_allowed"):
            warnings.append("Exclusive licenses with sublicensing rights may create conflicts")
        
        return {
            "valid": len(errors) == 0,
            "errors": errors,
            "warnings": warnings
        }
    
    def create_licensing_marketplace_listing(
        self,
        registration_id: str,
        available_licenses: List[Dict[str, Any]],
        content_metadata: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Create marketplace listing for licensing opportunities"""
        
        listing_id = hashlib.sha256(
            f"{registration_id}:{datetime.utcnow().isoformat()}".encode()
        ).hexdigest()[:12]
        
        listing = {
            "listing_id": listing_id,
            "registration_id": registration_id,
            "content_metadata": content_metadata,
            "available_licenses": available_licenses,
            "created_at": datetime.utcnow().isoformat(),
            "status": "active",
            "views": 0,
            "inquiries": 0,
            "active_licenses": 0
        }
        
        return listing
    
    def generate_rights_summary(self, agreement_data: Dict[str, Any]) -> Dict[str, Any]:
        """Generate summary of rights granted in agreement"""
        
        terms = agreement_data.get("terms", {})
        
        rights_summary = {
            "agreement_id": agreement_data.get("agreement_id"),
            "license_type": agreement_data.get("license_type"),
            "exclusivity": "Exclusive" if terms.get("exclusivity") else "Non-Exclusive",
            "territory": terms.get("territory", "Worldwide"),
            "duration": f"{terms.get('duration_months')} months" if terms.get("duration_months") else "Indefinite",
            "revenue_share": f"{terms.get('revenue_share_percentage', 0)}%",
            
            "usage_rights": {
                "commercial_use": terms.get("commercial_use", False),
                "modification_allowed": terms.get("modification_allowed", False),
                "sublicensing_allowed": terms.get("sublicensing_allowed", False),
                "attribution_required": terms.get("attribution_required", True)
            },
            
            "distribution_rights": {
                "digital_distribution": terms.get("digital_distribution", False),
                "print_distribution": terms.get("print_distribution", False)
            },
            
            "extended_rights": {
                "merchandising_rights": terms.get("merchandising_rights", False),
                "sequel_rights": terms.get("sequel_rights", False),
                "character_rights": terms.get("character_rights", False)
            },
            
            "financial_terms": {
                "revenue_share_percentage": terms.get("revenue_share_percentage", 0),
                "minimum_guarantee": terms.get("minimum_guarantee"),
                "advance_payment": terms.get("advance_payment"),
                "royalty_rate": terms.get("royalty_rate")
            }
        }
        
        return rights_summary