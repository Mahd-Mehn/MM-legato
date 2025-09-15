#!/usr/bin/env python3
"""
Test script for authentication API
"""
import requests
import json

# API endpoints - Direct service URLs
AUTH_SERVICE_URL = "http://localhost:8001"
AUTH_URL = f"{AUTH_SERVICE_URL}/auth"

def test_registration():
    """Test user registration"""
    print("🧪 Testing user registration...")
    
    user_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123",
        "role": "reader",
        "display_name": "Test User"
    }
    
    response = requests.post(f"{AUTH_URL}/register", json=user_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 201:
        print("✅ Registration successful!")
        return response.json()
    else:
        print("❌ Registration failed!")
        return None

def test_login():
    """Test user login"""
    print("\n🧪 Testing user login...")
    
    login_data = {
        "email": "test@example.com",
        "password": "testpass123"
    }
    
    response = requests.post(f"{AUTH_URL}/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Login successful!")
        return response.json()
    else:
        print("❌ Login failed!")
        return None

def test_admin_login():
    """Test admin login"""
    print("\n🧪 Testing admin login...")
    
    login_data = {
        "email": "admin@legato.com",
        "password": "admin123"
    }
    
    response = requests.post(f"{AUTH_URL}/login", json=login_data)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Admin login successful!")
        return response.json()
    else:
        print("❌ Admin login failed!")
        return None

def test_protected_endpoint(token):
    """Test accessing protected endpoint"""
    print("\n🧪 Testing protected endpoint...")
    
    headers = {
        "Authorization": f"Bearer {token}"
    }
    
    response = requests.get(f"{AUTH_URL}/me", headers=headers)
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        print("✅ Protected endpoint access successful!")
        return response.json()
    else:
        print("❌ Protected endpoint access failed!")
        return None

def main():
    """Main test runner"""
    print("🚀 Starting Authentication API Tests")
    print("=" * 50)
    
    # Test admin login first
    admin_auth = test_admin_login()
    if admin_auth and "tokens" in admin_auth:
        test_protected_endpoint(admin_auth["tokens"]["access_token"])
    
    # Test registration
    reg_result = test_registration()
    if reg_result and "tokens" in reg_result:
        # Test protected endpoint with new user token
        test_protected_endpoint(reg_result["tokens"]["access_token"])
    
    # Test login
    login_result = test_login()
    if login_result and "tokens" in login_result:
        # Test protected endpoint with login token
        test_protected_endpoint(login_result["tokens"]["access_token"])
    
    print("\n🎉 Tests completed!")

if __name__ == "__main__":
    main()