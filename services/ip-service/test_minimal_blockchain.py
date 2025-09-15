#!/usr/bin/env python3

# Test minimal blockchain functionality without full service
import hashlib
import time
import json
from datetime import datetime

def test_blockchain_mock():
    """Test basic blockchain functionality"""
    print("Testing Minimal Blockchain Functionality...")
    
    # Mock blockchain registration
    registration_id = "reg_test_123"
    content_hash = "abcdef1234567890abcdef1234567890abcdef1234567890abcdef1234567890"
    author_id = "author_test_456"
    
    # Create mock transaction
    mock_data = f"{registration_id}:{content_hash}:{author_id}:{int(time.time())}"
    mock_tx_hash = "0x" + hashlib.sha256(mock_data.encode()).hexdigest()
    
    print(f"Registration ID: {registration_id}")
    print(f"Content Hash: {content_hash}")
    print(f"Author ID: {author_id}")
    print(f"Mock Transaction Hash: {mock_tx_hash}")
    
    # Test forensic proof
    suspected_content = "This is some content that might be plagiarized."
    suspected_hash = hashlib.sha256(suspected_content.encode()).hexdigest()
    
    # Calculate similarity (simplified)
    def calculate_similarity(hash1: str, hash2: str) -> float:
        if hash1 == hash2:
            return 1.0
        if len(hash1) != len(hash2):
            return 0.0
        matches = sum(c1 == c2 for c1, c2 in zip(hash1, hash2))
        return matches / len(hash1)
    
    similarity = calculate_similarity(content_hash, suspected_hash)
    print(f"Content Similarity: {similarity}")
    
    # Create forensic proof
    forensic_proof = {
        "analysis_id": hashlib.sha256(f"{content_hash}:{suspected_hash}:{int(time.time())}".encode()).hexdigest()[:16],
        "original_hash": content_hash,
        "suspected_hash": suspected_hash,
        "similarity_score": similarity,
        "analysis_timestamp": datetime.utcnow().isoformat(),
        "confidence_level": "high" if similarity > 0.9 else "medium" if similarity > 0.7 else "low"
    }
    
    print(f"Forensic Proof Analysis ID: {forensic_proof['analysis_id']}")
    print(f"Confidence Level: {forensic_proof['confidence_level']}")
    
    print("✓ Minimal blockchain functionality test completed!")

if __name__ == "__main__":
    test_blockchain_mock()