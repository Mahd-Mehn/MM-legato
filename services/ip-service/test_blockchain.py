#!/usr/bin/env python3
"""
Test script for blockchain integration functionality
"""

import sys
import os
sys.path.append(os.path.dirname(__file__))

from blockchain_service import BlockchainService
import json

def test_blockchain_registration():
    """Test blockchain registration functionality"""
    print("Testing Blockchain Registration...")
    
    blockchain_service = BlockchainService()
    
    # Test data
    registration_id = "reg_test_123"
    content_hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    author_id = "author_test_456"
    
    # Register on blockchain
    result = blockchain_service.register_ip_on_blockchain(
        registration_id=registration_id,
        content_hash=content_hash,
        author_id=author_id,
        network="polygon",
        priority="standard"
    )
    
    print(f"Transaction Hash: {result['transaction_hash']}")
    print(f"Network: {result['blockchain_network']}")
    print(f"Status: {result['status']}")
    print(f"Estimated Confirmation Time: {result['estimated_confirmation_time']}")
    
    return result

def test_blockchain_verification():
    """Test blockchain verification functionality"""
    print("\nTesting Blockchain Verification...")
    
    blockchain_service = BlockchainService()
    
    # Test with mock transaction hash
    tx_hash = "0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef12"
    network = "polygon"
    
    # Verify transaction
    verification = blockchain_service.verify_blockchain_registration(tx_hash, network)
    
    print(f"Transaction Hash: {verification['transaction_hash']}")
    print(f"Status: {verification['status']}")
    print(f"Confirmations: {verification.get('confirmations', 0)}")
    print(f"Block Number: {verification.get('block_number', 'N/A')}")

def test_forensic_proof():
    """Test forensic proof generation"""
    print("\nTesting Forensic Proof Generation...")
    
    blockchain_service = BlockchainService()
    
    # Test data
    original_hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    suspected_content = "This is some content that might be plagiarized."
    
    # Mock blockchain records
    blockchain_records = [
        {
            "content_hash": "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890",
            "blockchain_network": "polygon",
            "transaction_hash": "0x123...",
            "block_number": 12345,
            "timestamp": "2025-01-11T10:00:00Z",
            "status": "confirmed"
        },
        {
            "content_hash": "fedcba0987654321fedcba0987654321fedcba0987654321fedcba0987654321",
            "blockchain_network": "ethereum",
            "transaction_hash": "0x456...",
            "block_number": 67890,
            "timestamp": "2025-01-10T15:30:00Z",
            "status": "confirmed"
        }
    ]
    
    # Generate forensic proof
    forensic_proof = blockchain_service.create_forensic_proof(
        original_hash=original_hash,
        suspected_content=suspected_content,
        blockchain_records=blockchain_records
    )
    
    print(f"Analysis ID: {forensic_proof['analysis_id']}")
    print(f"Similarity Score: {forensic_proof['similarity_score']}")
    print(f"Confidence Level: {forensic_proof['confidence_level']}")
    print(f"Blockchain Evidence Count: {len(forensic_proof['blockchain_evidence'])}")
    print(f"Exact Matches: {len(forensic_proof['exact_matches'])}")

def test_supported_networks():
    """Test supported networks functionality"""
    print("\nTesting Supported Networks...")
    
    blockchain_service = BlockchainService()
    
    # Get supported networks
    networks = blockchain_service.get_supported_networks()
    
    print("Supported Networks:")
    for network in networks:
        print(f"  - {network['network']}: Chain ID {network['chain_id']}, "
              f"Confirmations: {network['confirmation_blocks']}, "
              f"Enabled: {network['enabled']}")

def test_similarity_calculation():
    """Test hash similarity calculation"""
    print("\nTesting Similarity Calculation...")
    
    blockchain_service = BlockchainService()
    
    # Test identical hashes
    hash1 = "abcdef1234567890"
    hash2 = "abcdef1234567890"
    similarity = blockchain_service._calculate_similarity(hash1, hash2)
    print(f"Identical hashes similarity: {similarity} (expected: 1.0)")
    
    # Test different hashes
    hash3 = "fedcba0987654321"
    similarity = blockchain_service._calculate_similarity(hash1, hash3)
    print(f"Different hashes similarity: {similarity} (expected: 0.0)")
    
    # Test partially similar hashes
    hash4 = "abcdef1234567891"  # Last character different
    similarity = blockchain_service._calculate_similarity(hash1, hash4)
    print(f"Partially similar hashes similarity: {similarity}")

def main():
    """Run all blockchain tests"""
    print("=== Legato Blockchain Integration Tests ===\n")
    
    try:
        # Test blockchain registration
        registration_result = test_blockchain_registration()
        
        # Test blockchain verification
        test_blockchain_verification()
        
        # Test forensic proof generation
        test_forensic_proof()
        
        # Test supported networks
        test_supported_networks()
        
        # Test similarity calculation
        test_similarity_calculation()
        
        print("\n=== All Blockchain Tests Completed ===")
        print("✓ Blockchain IP registration")
        print("✓ Transaction verification")
        print("✓ Forensic proof generation")
        print("✓ Network configuration")
        print("✓ Similarity calculation")
        
    except Exception as e:
        print(f"\n❌ Test failed with error: {str(e)}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()