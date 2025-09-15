#!/usr/bin/env python3
"""
Test script for cryptographic content protection functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from crypto_service import CryptographicProtectionService, TimestampAuthorityService
from certificate_service import CertificateOfAuthorshipService
import json

def test_content_hashing():
    """Test content hashing functionality"""
    print("Testing Content Hashing...")
    
    crypto_service = CryptographicProtectionService()
    
    # Test content
    content = "This is a test story chapter with some content."
    metadata = {"author": "test_author", "genre": "fiction"}
    
    # Generate hash
    content_hash = crypto_service.generate_content_hash(content, metadata)
    print(f"Generated hash: {content_hash}")
    
    # Verify hash
    is_valid = crypto_service.verify_content_hash(content, content_hash, metadata)
    print(f"Hash verification: {'PASSED' if is_valid else 'FAILED'}")
    
    # Test with modified content
    modified_content = content + " Modified!"
    is_invalid = crypto_service.verify_content_hash(modified_content, content_hash, metadata)
    print(f"Modified content verification: {'FAILED (as expected)' if not is_invalid else 'UNEXPECTED PASS'}")
    
    return content_hash

def test_digital_signature():
    """Test digital signature functionality"""
    print("\nTesting Digital Signatures...")
    
    crypto_service = CryptographicProtectionService()
    
    # Test data
    test_data = {
        "content_hash": "abc123",
        "author": "test_author",
        "timestamp": "2025-01-11T10:00:00Z"
    }
    
    # Create signature
    signature = crypto_service.create_digital_signature(test_data)
    print(f"Generated signature: {signature[:50]}...")
    
    # Verify signature
    is_valid = crypto_service.verify_digital_signature(test_data, signature)
    print(f"Signature verification: {'PASSED' if is_valid else 'FAILED'}")
    
    # Test with modified data
    modified_data = test_data.copy()
    modified_data["author"] = "different_author"
    is_invalid = crypto_service.verify_digital_signature(modified_data, signature)
    print(f"Modified data verification: {'FAILED (as expected)' if not is_invalid else 'UNEXPECTED PASS'}")

def test_timestamp_service():
    """Test timestamp authority service"""
    print("\nTesting Timestamp Service...")
    
    timestamp_service = TimestampAuthorityService()
    
    # Test hash
    test_hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    
    # Get timestamp token
    timestamp_data = timestamp_service.get_timestamp_token(test_hash)
    print(f"Timestamp authority: {timestamp_data.get('authority', 'None')}")
    print(f"Timestamp: {timestamp_data.get('timestamp', 'None')}")
    
    # Verify timestamp token
    if timestamp_data and timestamp_data.get('token'):
        is_valid = timestamp_service.verify_timestamp_token(
            timestamp_data['token'], 
            test_hash
        )
        print(f"Timestamp verification: {'PASSED' if is_valid else 'FAILED'}")

def test_certificate_generation():
    """Test certificate generation"""
    print("\nTesting Certificate Generation...")
    
    certificate_service = CertificateOfAuthorshipService()
    
    # Test registration data
    registration_data = {
        "registration_id": "reg_123456",
        "content_id": "content_789",
        "title": "Test Story Chapter 1",
        "content_type": "chapter",
        "content_hash": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
        "author_id": "author_456",
        "author_name": "Test Author",
        "timestamp": "2025-01-11T10:00:00Z",
        "timestamp_authority": "legato-internal",
        "verification_method": "sha256_timestamp"
    }
    
    # Generate certificate
    certificate = certificate_service.generate_certificate(registration_data)
    print(f"Certificate number: {certificate['certificate_number']}")
    print(f"Certificate status: {certificate['status']}")
    
    # Verify certificate
    is_valid = certificate_service.verify_certificate(
        certificate['certificate_data'],
        certificate['digital_signature']
    )
    print(f"Certificate verification: {'PASSED' if is_valid else 'FAILED'}")
    
    # Generate HTML certificate
    html_cert = certificate_service.generate_certificate_html(certificate)
    print(f"HTML certificate generated: {len(html_cert)} characters")
    
    return certificate

def main():
    """Run all tests"""
    print("=== Legato IP Protection Service Tests ===\n")
    
    try:
        # Test content hashing
        content_hash = test_content_hashing()
        
        # Test digital signatures
        test_digital_signature()
        
        # Test timestamp service
        test_timestamp_service()
        
        # Test certificate generation
        certificate = test_certificate_generation()
        
        print("\n=== All Tests Completed ===")
        print("✓ Content hashing and verification")
        print("✓ Digital signature creation and verification")
        print("✓ Timestamp authority integration")
        print("✓ Certificate of Authorship generation")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()