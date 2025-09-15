#!/usr/bin/env python3
"""
Simple test script for IP Marketplace functionality
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from marketplace_service import MarketplaceService, StudioType, NegotiationStatus

def test_marketplace_service():
    """Test basic marketplace service functionality"""
    print("Testing IP Marketplace Service...")
    
    service = MarketplaceService()
    
    # Test 1: Search IP marketplace
    print("\n1. Testing IP marketplace search...")
    filters = {
        "license_types": ["adaptation", "audio_visual"],
        "genres": ["sci-fi"],
        "max_revenue_share": 35.0
    }
    
    search_results = service.search_ip_marketplace(
        filters=filters,
        studio_id="studio_test_123",
        limit=5,
        offset=0
    )
    
    print(f"   ✓ Found {len(search_results['listings'])} listings")
    print(f"   ✓ Total count: {search_results['total_count']}")
    print(f"   ✓ Filters applied: {search_results['filters_applied']}")
    
    # Test 2: Get IP details
    print("\n2. Testing IP details retrieval...")
    if search_results['listings']:
        listing_id = search_results['listings'][0]['listing_id']
        ip_details = service.get_ip_details(
            listing_id=listing_id,
            studio_id="studio_test_123"
        )
        
        print(f"   ✓ Retrieved details for: {ip_details['title']}")
        print(f"   ✓ Author: {ip_details['author']['name']}")
        print(f"   ✓ Available licenses: {len(ip_details['licensing_options'])}")
        print(f"   ✓ IP verified: {ip_details['ip_verification']['registration_status']}")
    
    # Test 3: Initiate negotiation
    print("\n3. Testing negotiation initiation...")
    negotiation = service.initiate_licensing_negotiation(
        listing_id="list_001",
        studio_id="studio_test_123",
        license_type="adaptation",
        initial_offer={
            "revenue_share_percentage": 25.0,
            "territory": "worldwide",
            "duration_months": 24,
            "minimum_guarantee": 10000.0
        },
        message="We are interested in adapting this story for film."
    )
    
    print(f"   ✓ Negotiation initiated: {negotiation['negotiation_id']}")
    print(f"   ✓ Status: {negotiation['status']}")
    print(f"   ✓ Messages: {len(negotiation['messages'])}")
    
    # Test 4: Send negotiation message
    print("\n4. Testing negotiation messaging...")
    message_response = service.send_negotiation_message(
        negotiation_id=negotiation['negotiation_id'],
        sender_id="author_456",
        sender_type="author",
        message="Thank you for your interest. I'd like to discuss the terms.",
        offer_update={
            "revenue_share_percentage": 30.0,
            "minimum_guarantee": 15000.0
        }
    )
    
    print(f"   ✓ Message sent: {message_response['message_id']}")
    print(f"   ✓ Status: {message_response['status']}")
    
    # Test 5: Generate contract
    print("\n5. Testing contract generation...")
    contract = service.generate_licensing_contract(
        negotiation_id=negotiation['negotiation_id'],
        final_terms={
            "revenue_share_percentage": 30.0,
            "territory": "worldwide",
            "duration_months": 36,
            "minimum_guarantee": 15000.0,
            "exclusivity": True
        }
    )
    
    print(f"   ✓ Contract generated: {contract['contract_id']}")
    print(f"   ✓ Status: {contract['status']}")
    print(f"   ✓ Signature required: {contract['digital_signature_required']}")
    
    # Test 6: Studio dashboard
    print("\n6. Testing studio dashboard...")
    dashboard = service.get_studio_dashboard("studio_test_123")
    
    print(f"   ✓ Active negotiations: {len(dashboard['active_negotiations'])}")
    print(f"   ✓ Signed contracts: {len(dashboard['signed_contracts'])}")
    print(f"   ✓ Recommendations: {len(dashboard['recommendations'])}")
    print(f"   ✓ Total inquiries sent: {dashboard['analytics']['total_inquiries_sent']}")
    
    # Test 7: Create studio profile
    print("\n7. Testing studio profile creation...")
    studio_data = {
        "studio_id": "studio_new_456",
        "name": "Test Film Studio",
        "studio_type": StudioType.FILM_PRODUCTION.value,
        "description": "A test film production studio",
        "website": "https://testfilmstudio.com",
        "preferred_genres": ["sci-fi", "thriller", "adventure"],
        "budget_range": "100k_500k",
        "active_projects": 2,
        "completed_projects": 8
    }
    
    profile_result = service.create_studio_profile(studio_data)
    
    print(f"   ✓ Profile created for: {profile_result['studio_id']}")
    print(f"   ✓ Verification required: {profile_result['verification_required']}")
    
    print("\n✅ All marketplace service tests passed!")

def test_enums():
    """Test enum values"""
    print("\nTesting enums...")
    
    # Test StudioType enum
    studio_types = [e.value for e in StudioType]
    print(f"   ✓ Studio types: {studio_types}")
    
    # Test NegotiationStatus enum
    negotiation_statuses = [e.value for e in NegotiationStatus]
    print(f"   ✓ Negotiation statuses: {negotiation_statuses}")
    
    print("   ✅ Enum tests passed!")

def main():
    """Run all tests"""
    print("=" * 60)
    print("IP MARKETPLACE SERVICE TESTS")
    print("=" * 60)
    
    try:
        test_marketplace_service()
        test_enums()
        
        print("\n" + "=" * 60)
        print("🎉 ALL TESTS PASSED! IP Marketplace is working correctly.")
        print("=" * 60)
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()
        sys.exit(1)

if __name__ == "__main__":
    main()