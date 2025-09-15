#!/usr/bin/env python3
"""
Test API endpoints for the payment service
"""

import requests
import uuid
import json
from decimal import Decimal

BASE_URL = "http://localhost:8005"

def test_health_endpoint():
    """Test health check endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/health")
        print(f"Health check status: {response.status_code}")
        if response.status_code == 200:
            data = response.json()
            print(f"✓ Service: {data['service']}")
            print(f"✓ Database: {data['database']}")
            print(f"✓ Redis: {data['redis']}")
        return response.status_code == 200
    except requests.exceptions.ConnectionError:
        print("❌ Cannot connect to payment service. Make sure it's running on port 8005")
        return False

def test_coin_packages_endpoint():
    """Test coin packages endpoint"""
    try:
        response = requests.get(f"{BASE_URL}/api/v1/payments/coin-packages")
        print(f"Coin packages status: {response.status_code}")
        if response.status_code == 200:
            packages = response.json()
            print(f"✓ Retrieved {len(packages)} coin packages")
            if packages:
                package = packages[0]
                print(f"  - {package['name']}: {package['coin_amount']} coins for ${package['base_price_usd']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error testing coin packages: {e}")
        return False

def test_user_balance_endpoint():
    """Test user balance endpoint"""
    try:
        user_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/v1/payments/users/{user_id}/balance")
        print(f"User balance status: {response.status_code}")
        if response.status_code == 200:
            balance = response.json()
            print(f"✓ User balance: {balance['balance']} coins")
            print(f"  - Lifetime earned: {balance['lifetime_earned']}")
            print(f"  - Lifetime spent: {balance['lifetime_spent']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error testing user balance: {e}")
        return False

def test_spending_analytics_endpoint():
    """Test spending analytics endpoint"""
    try:
        user_id = str(uuid.uuid4())
        response = requests.get(f"{BASE_URL}/api/v1/payments/users/{user_id}/spending-analytics")
        print(f"Spending analytics status: {response.status_code}")
        if response.status_code == 200:
            analytics = response.json()
            print(f"✓ Analytics for user {user_id[:8]}...")
            print(f"  - Total spent: ${analytics['total_spent']}")
            print(f"  - Total coins purchased: {analytics['total_coins_purchased']}")
        return response.status_code == 200
    except Exception as e:
        print(f"❌ Error testing spending analytics: {e}")
        return False

def main():
    """Run all API tests"""
    print("🧪 Testing Payment Service API Endpoints")
    print("=" * 50)
    
    tests = [
        ("Health Check", test_health_endpoint),
        ("Coin Packages", test_coin_packages_endpoint),
        ("User Balance", test_user_balance_endpoint),
        ("Spending Analytics", test_spending_analytics_endpoint),
    ]
    
    passed = 0
    total = len(tests)
    
    for test_name, test_func in tests:
        print(f"\n📋 Testing {test_name}...")
        if test_func():
            print(f"✅ {test_name} passed")
            passed += 1
        else:
            print(f"❌ {test_name} failed")
    
    print(f"\n📊 Results: {passed}/{total} tests passed")
    
    if passed == total:
        print("🎉 All API tests passed!")
    else:
        print("⚠️  Some tests failed. Check the payment service logs.")

if __name__ == "__main__":
    main()