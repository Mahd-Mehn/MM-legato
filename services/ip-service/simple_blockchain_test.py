#!/usr/bin/env python3
"""
Simple test for blockchain service
"""

import sys
import os

# Add current directory to path
current_dir = os.path.dirname(os.path.abspath(__file__))
sys.path.insert(0, current_dir)

try:
    print("Attempting to import BlockchainService...")
    
    # Try to import the module first
    import blockchain_service
    print("blockchain_service module imported successfully")
    
    # Check what's in the module
    print("Module contents:", dir(blockchain_service))
    
    # Try to import the class
    from blockchain_service import BlockchainService
    print("BlockchainService class imported successfully")
    
    # Create instance
    service = BlockchainService()
    print("BlockchainService instance created successfully")
    
    # Test a simple method
    networks = service.get_supported_networks()
    print(f"Supported networks: {len(networks)}")
    
    print("✓ All tests passed!")
    
except Exception as e:
    print(f"❌ Error: {e}")
    import traceback
    traceback.print_exc()