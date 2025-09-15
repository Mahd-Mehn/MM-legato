#!/usr/bin/env python3
"""
API Test Report Generator
Creates a comprehensive report of all working API endpoints
"""

import requests
import json
import uuid
from datetime import datetime

def test_endpoint(name, method, url, **kwargs):
    """Test an endpoint and return result"""
    try:
        response = requests.request(method, url, timeout=10, **kwargs)
        return {
            "name": name,
            "method": method,
            "url": url,
            "status": response.status_code,
            "success": response.status_code < 400,
            "response_size": len(response.text) if response.text else 0
        }
    except Exception as e:
        return {
            "name": name,
            "method": method,
            "url": url,
            "status": "ERROR",
            "success": False,
            "error": str(e)
        }

def main():
    print("🔍 Legato Platform API Test Report")
    print("=" * 60)
    
    base_url = "http://localhost:8000"  # Gateway URL
    results = []
    
    # Test critical endpoints
    print("\n📋 Testing Critical Endpoints...")
    
    # Health checks
    results.append(test_endpoint("Gateway Health", "GET", f"{base_url}/health"))
    
    # Authentication flow
    test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
    test_password = "TestPassword123!"
    
    register_data = {
        "email": test_email,
        "password": test_password,
        "username": f"testuser_{uuid.uuid4().hex[:8]}",
        "role": "writer"
    }
    
    # Registration
    reg_result = test_endpoint("User Registration", "POST", f"{base_url}/auth/auth/register", json=register_data)
    results.append(reg_result)
    
    auth_token = None
    if reg_result["success"]:
        try:
            reg_response = requests.post(f"{base_url}/auth/auth/register", json=register_data)
            if reg_response.status_code in [200, 201]:
                auth_data = reg_response.json()
                auth_token = auth_data.get('access_token')
        except:
            pass
    
    if auth_token:
        headers = {"Authorization": f"Bearer {auth_token}"}
        
        # Profile
        results.append(test_endpoint("Get User Profile", "GET", f"{base_url}/auth/auth/profile", headers=headers))
        
        # Content creation
        story_data = {
            "title": f"Test Story {uuid.uuid4().hex[:6]}",
            "description": "Test story for API validation",
            "genre": "fantasy",
            "language": "en",
            "tags": ["test", "api"],
            "is_premium": False
        }
        
        story_result = test_endpoint("Create Story", "POST", f"{base_url}/content/content/stories", json=story_data, headers=headers)
        results.append(story_result)
        
        # Get stories
        results.append(test_endpoint("List Stories", "GET", f"{base_url}/content/content/stories", headers=headers))
    
    # Discovery endpoints (no auth needed)
    results.append(test_endpoint("Trending Stories", "GET", f"{base_url}/content/discovery/trending?limit=5"))
    results.append(test_endpoint("Search Stories", "GET", f"{base_url}/content/discovery/search?q=test&limit=5"))
    results.append(test_endpoint("Available Genres", "GET", f"{base_url}/content/discovery/filters/genres"))
    
    # Payment endpoints
    results.append(test_endpoint("Coin Packages", "GET", f"{base_url}/payments/api/v1/payments/coin-packages"))
    
    if auth_token:
        results.append(test_endpoint("User Balance", "GET", f"{base_url}/payments/api/v1/payments/balance/test-user", headers=headers))
    
    # Generate report
    print("\n📊 Test Results Summary")
    print("-" * 60)
    
    passed = sum(1 for r in results if r["success"])
    total = len(results)
    success_rate = (passed / total) * 100 if total > 0 else 0
    
    print(f"✅ Passed: {passed}")
    print(f"❌ Failed: {total - passed}")
    print(f"📈 Success Rate: {success_rate:.1f}%")
    
    print(f"\n🔍 Detailed Results:")
    print("-" * 60)
    
    for result in results:
        status_emoji = "✅" if result["success"] else "❌"
        status_text = result["status"] if isinstance(result["status"], int) else "ERROR"
        print(f"{status_emoji} {result['method']} {result['name']}: {status_text}")
        if not result["success"] and "error" in result:
            print(f"   Error: {result['error']}")
    
    print(f"\n🎯 Frontend Integration Readiness:")
    print("-" * 60)
    
    critical_endpoints = [
        "Gateway Health", "User Registration", "Get User Profile", 
        "Create Story", "Trending Stories", "Coin Packages"
    ]
    
    critical_passed = sum(1 for r in results if r["name"] in critical_endpoints and r["success"])
    critical_total = len(critical_endpoints)
    
    if critical_passed == critical_total:
        print("🎉 EXCELLENT! All critical endpoints are working.")
        print("   Your frontend can integrate smoothly with the backend.")
    elif critical_passed >= critical_total * 0.8:
        print("👍 GOOD! Most critical endpoints are working.")
        print("   Frontend integration should work with minor adjustments.")
    else:
        print("⚠️  WARNING! Several critical endpoints are failing.")
        print("   Review failed endpoints before frontend integration.")
    
    print(f"\n📋 API Endpoints Ready for Frontend:")
    print("-" * 60)
    
    working_endpoints = [r for r in results if r["success"]]
    for endpoint in working_endpoints:
        print(f"• {endpoint['method']} {endpoint['name']}")
    
    print(f"\n🔗 Example API Calls for Frontend:")
    print("-" * 60)
    print(f"Base URL: {base_url}")
    print("Authentication: Bearer token in Authorization header")
    print()
    print("Key Endpoints:")
    print(f"• POST /auth/auth/register - User registration")
    print(f"• POST /auth/auth/login - User login")
    print(f"• GET /auth/auth/profile - Get user profile")
    print(f"• POST /content/content/stories - Create story")
    print(f"• GET /content/discovery/trending - Get trending stories")
    print(f"• GET /payments/api/v1/payments/coin-packages - Get coin packages")
    
    return success_rate >= 80

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)