#!/usr/bin/env python3
"""
Test script for licensing and rights management functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from licensing_service import LicensingService, LicenseTerms, LicenseType
import json

def test_license_agreement_creation():
    """Test licensing agreement creation"""
    print("Testing License Agreement Creation...")
    
    licensing_service = LicensingService()
    
    # Create license terms
    terms = LicenseTerms(
        license_type=LicenseType.ADAPTATION.value,
        territory="North America",
        duration_months=24,
        revenue_share_percentage=30.0,
        exclusivity=False,
        modification_allowed=True,
        commercial_use=True,
        attribution_required=True
    )
    
    # Create agreement
    agreement = licensing_service.create_licensing_agreement(
        registration_id="reg_test_123",
        licensor_id="author_456",
        licensee_id="licensee_789",
        terms=terms,
        custom_clauses=["Licensee must provide monthly usage reports"]
    )
    
    print(f"Agreement ID: {agreement['agreement_id']}")
    print(f"License Type: {agreement['license_type']}")
    print(f"Territory: {agreement['terms']['territory']}")
    print(f"Revenue Share: {agreement['terms']['revenue_share_percentage']}%")
    print(f"Status: {agreement['status']}")
    
    return agreement

def test_contract_generation():
    """Test contract document generation"""
    print("\nTesting Contract Generation...")
    
    licensing_service = LicensingService()
    
    # Mock agreement data
    agreement_data = {
        "agreement_id": "LIC-20250111120000-ABC12345",
        "registration_id": "reg_test_123",
        "licensor_id": "author_456",
        "licensee_id": "licensee_789",
        "license_type": "adaptation",
        "terms": {
            "territory": "Europe",
            "duration_months": 36,
            "revenue_share_percentage": 35.0,
            "exclusivity": True,
            "commercial_use": True,
            "modification_allowed": True,
            "digital_distribution": True,
            "attribution_required": True,
            "merchandising_rights": False,
            "sequel_rights": True
        },
        "custom_clauses": [
            "Licensee must maintain quality standards",
            "All adaptations require licensor approval"
        ],
        "effective_date": "2025-01-11T12:00:00Z",
        "expiration_date": "2028-01-11T12:00:00Z",
        "created_at": "2025-01-11T12:00:00Z",
        "platform": "Legato Platform",
        "legal_entity": "Legato Inc."
    }
    
    # Generate contract
    contract = licensing_service.generate_license_contract(agreement_data)
    
    print(f"Contract generated: {len(contract)} characters")
    print("Contract preview:")
    print(contract[:500] + "..." if len(contract) > 500 else contract)

def test_revenue_calculation():
    """Test revenue sharing calculation"""
    print("\nTesting Revenue Calculation...")
    
    licensing_service = LicensingService()
    
    # Mock agreement
    agreement_data = {
        "terms": {
            "revenue_share_percentage": 30.0
        }
    }
    
    # Test revenue calculation
    gross_revenue = 10000.0
    platform_fee_percentage = 15.0
    
    revenue_breakdown = licensing_service.calculate_revenue_share(
        agreement_data,
        gross_revenue,
        platform_fee_percentage
    )
    
    print(f"Gross Revenue: ${revenue_breakdown['gross_revenue']:.2f}")
    print(f"Platform Fee ({platform_fee_percentage}%): ${revenue_breakdown['platform_fee']:.2f}")
    print(f"Net Revenue: ${revenue_breakdown['net_revenue']:.2f}")
    print(f"Licensor Share ({revenue_breakdown['licensor_percentage']}%): ${revenue_breakdown['licensor_share']:.2f}")
    print(f"Licensee Share ({revenue_breakdown['licensee_percentage']}%): ${revenue_breakdown['licensee_share']:.2f}")

def test_license_templates():
    """Test license templates"""
    print("\nTesting License Templates...")
    
    licensing_service = LicensingService()
    
    templates = licensing_service.get_license_templates()
    
    print(f"Available Templates: {len(templates)}")
    for template in templates:
        print(f"  - {template['name']}: {template['description']}")
        print(f"    Type: {template['license_type']}")
        print(f"    Default Revenue Share: {template['default_terms'].get('revenue_share_percentage', 0)}%")

def test_terms_validation():
    """Test license terms validation"""
    print("\nTesting Terms Validation...")
    
    licensing_service = LicensingService()
    
    # Test valid terms
    valid_terms = {
        "revenue_share_percentage": 25.0,
        "duration_months": 24,
        "territory": "Worldwide",
        "exclusivity": False,
        "minimum_guarantee": 5000.0
    }
    
    validation = licensing_service.validate_license_terms(valid_terms)
    print(f"Valid terms validation: {'PASSED' if validation['valid'] else 'FAILED'}")
    if validation['warnings']:
        print(f"  Warnings: {validation['warnings']}")
    
    # Test invalid terms
    invalid_terms = {
        "revenue_share_percentage": 150.0,  # Invalid: > 100%
        "duration_months": -5,  # Invalid: negative
        "minimum_guarantee": -1000.0  # Invalid: negative
    }
    
    validation = licensing_service.validate_license_terms(invalid_terms)
    print(f"Invalid terms validation: {'FAILED (as expected)' if not validation['valid'] else 'UNEXPECTED PASS'}")
    if validation['errors']:
        print(f"  Errors: {validation['errors']}")

def test_marketplace_listing():
    """Test marketplace listing creation"""
    print("\nTesting Marketplace Listing...")
    
    licensing_service = LicensingService()
    
    # Create marketplace listing
    available_licenses = [
        {
            "license_type": "adaptation",
            "revenue_share_percentage": 25.0,
            "territory": "Worldwide",
            "exclusivity": False
        },
        {
            "license_type": "translation",
            "revenue_share_percentage": 30.0,
            "territory": "Europe",
            "exclusivity": True
        }
    ]
    
    content_metadata = {
        "title": "The Digital Nomad's Journey",
        "genre": "Contemporary Fiction",
        "word_count": 85000,
        "language": "English",
        "description": "A story about remote work and travel"
    }
    
    listing = licensing_service.create_licensing_marketplace_listing(
        registration_id="reg_test_123",
        available_licenses=available_licenses,
        content_metadata=content_metadata
    )
    
    print(f"Listing ID: {listing['listing_id']}")
    print(f"Available Licenses: {len(listing['available_licenses'])}")
    print(f"Content Title: {listing['content_metadata']['title']}")
    print(f"Status: {listing['status']}")

def test_rights_summary():
    """Test rights summary generation"""
    print("\nTesting Rights Summary...")
    
    licensing_service = LicensingService()
    
    # Mock agreement
    agreement_data = {
        "agreement_id": "LIC-20250111120000-ABC12345",
        "license_type": "audio_visual",
        "terms": {
            "territory": "North America",
            "duration_months": 60,
            "revenue_share_percentage": 40.0,
            "exclusivity": True,
            "commercial_use": True,
            "modification_allowed": True,
            "digital_distribution": True,
            "merchandising_rights": True,
            "sequel_rights": True,
            "character_rights": True,
            "attribution_required": True,
            "minimum_guarantee": 50000.0
        }
    }
    
    rights_summary = licensing_service.generate_rights_summary(agreement_data)
    
    print(f"Agreement ID: {rights_summary['agreement_id']}")
    print(f"License Type: {rights_summary['license_type']}")
    print(f"Exclusivity: {rights_summary['exclusivity']}")
    print(f"Territory: {rights_summary['territory']}")
    print(f"Duration: {rights_summary['duration']}")
    print(f"Revenue Share: {rights_summary['revenue_share']}")
    
    print("Usage Rights:")
    for right, granted in rights_summary['usage_rights'].items():
        print(f"  - {right}: {'✓' if granted else '✗'}")
    
    print("Extended Rights:")
    for right, granted in rights_summary['extended_rights'].items():
        print(f"  - {right}: {'✓' if granted else '✗'}")

def main():
    """Run all licensing tests"""
    print("=== Legato Licensing & Rights Management Tests ===\n")
    
    try:
        # Test license agreement creation
        agreement = test_license_agreement_creation()
        
        # Test contract generation
        test_contract_generation()
        
        # Test revenue calculation
        test_revenue_calculation()
        
        # Test license templates
        test_license_templates()
        
        # Test terms validation
        test_terms_validation()
        
        # Test marketplace listing
        test_marketplace_listing()
        
        # Test rights summary
        test_rights_summary()
        
        print("\n=== All Licensing Tests Completed ===")
        print("✓ License agreement creation")
        print("✓ Contract document generation")
        print("✓ Revenue sharing calculation")
        print("✓ License templates")
        print("✓ Terms validation")
        print("✓ Marketplace listing")
        print("✓ Rights summary generation")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()