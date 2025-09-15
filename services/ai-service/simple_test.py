#!/usr/bin/env python3
"""
Simple test script to verify the translation service functionality
"""
import asyncio
import sys
import os

# Add the current directory to Python path for imports
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from models import TranslationRequest, LanguageDetectionRequest
from translation_service import TranslationService

async def test_basic_functionality():
    """Test basic translation service functionality"""
    print("Testing Translation Service...")
    
    # Initialize service
    service = TranslationService()
    
    # Test 1: Language Detection
    print("\n1. Testing Language Detection...")
    try:
        detection_request = LanguageDetectionRequest(text="Hello, this is a test message.")
        result = await service.detect_language(detection_request)
        print(f"   Detected language: {result.detected_language}")
        print(f"   Confidence: {result.confidence}")
        print("   ✓ Language detection working")
    except Exception as e:
        print(f"   ✗ Language detection failed: {e}")
    
    # Test 2: Translation (library-based, no database)
    print("\n2. Testing Translation (library-based)...")
    try:
        # Test the library translation method directly
        translated_text, confidence = await service._translate_with_library(
            "Hello world, this is a test.", "en", "es"
        )
        print(f"   Original: Hello world, this is a test.")
        print(f"   Translated: {translated_text}")
        print(f"   Confidence: {confidence}")
        print("   ✓ Library translation working")
    except Exception as e:
        print(f"   ✗ Library translation failed: {e}")
    
    # Test 3: Supported Languages
    print("\n3. Testing Supported Languages...")
    try:
        languages = service.get_supported_languages()
        print(f"   Found {len(languages)} supported languages")
        print(f"   Sample: {list(languages.items())[:5]}")
        print("   ✓ Language list working")
    except Exception as e:
        print(f"   ✗ Language list failed: {e}")
    
    print("\n✓ Basic functionality tests completed!")

if __name__ == "__main__":
    asyncio.run(test_basic_functionality())