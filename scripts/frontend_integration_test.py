#!/usr/bin/env python3
"""
Frontend Integration Test - Critical API Endpoints
Tests the most important endpoints that the frontend will need
"""

import requests
import json
import uuid
from datetime import datetime

class FrontendIntegrationTest:
    def __init__(self):
        self.gateway_url = 'http://localhost:8000'
        self.auth_token = None
        self.user_id = None
        self.story_id = None
        
    def log(self, message, status="INFO"):
        timestamp = datetime.now().strftime("%H:%M:%S")
        emoji = {"SUCCESS": "✅", "ERROR": "❌", "INFO": "ℹ️", "WARNING": "⚠️"}.get(status, "ℹ️")
        print(f"[{timestamp}] {emoji} {message}")

    def test_user_journey(self):
        """Test complete user journey from registration to content creation"""
        
        self.log("=== FRONTEND INTEGRATION TEST - USER JOURNEY ===")
        
        # 1. User Registration
        self.log("Testing user registration...")
        test_email = f"frontend_test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "FrontendTest123!"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "username": f"frontend_user_{uuid.uuid4().hex[:6]}",
            "role": "writer"
        }
        
        try:
            response = requests.post(
                f"{self.gateway_url}/auth/auth/register",
                json=register_data,
                timeout=10
            )
            if response.status_code in [200, 201]:
                self.log("User registration successful", "SUCCESS")
                user_data = response.json()
                self.auth_token = user_data.get('access_token')
                # Extract user_id from token or use a placeholder
                self.user_id = "test-user-id"  # We'll get this from profile endpoint
            else:
                self.log(f"Registration failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Registration request failed: {e}", "ERROR")
            return False

        # 2. User Login
        self.log("Testing user login...")
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        try:
            response = requests.post(
                f"{self.gateway_url}/auth/auth/login",
                json=login_data,
                timeout=10
            )
            if response.status_code == 200:
                self.log("User login successful", "SUCCESS")
                auth_data = response.json()
                self.auth_token = auth_data.get('access_token')
            else:
                self.log(f"Login failed: {response.status_code} - {response.text}", "ERROR")
                return False
        except Exception as e:
            self.log(f"Login request failed: {e}", "ERROR")
            return False

        headers = {"Authorization": f"Bearer {self.auth_token}"}

        # 3. Get User Profile
        self.log("Testing get user profile...")
        try:
            response = requests.get(
                f"{self.gateway_url}/auth/auth/profile",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                self.log("Get user profile successful", "SUCCESS")
                profile_data = response.json()
                self.user_id = profile_data.get('id', 'test-user-id')
            else:
                self.log(f"Get profile failed: {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Get profile request failed: {e}", "ERROR")

        # 4. Create Story
        self.log("Testing story creation...")
        story_data = {
            "title": f"Frontend Test Story {uuid.uuid4().hex[:6]}",
            "description": "A test story created during frontend integration testing",
            "genre": "fantasy",
            "language": "en",
            "tags": ["test", "frontend", "integration"],
            "is_premium": False
        }
        
        try:
            response = requests.post(
                f"{self.gateway_url}/content/content/stories",
                json=story_data,
                headers=headers,
                timeout=10
            )
            if response.status_code in [200, 201]:
                self.log("Story creation successful", "SUCCESS")
                story_response = response.json()
                self.story_id = story_response.get('id')
            else:
                self.log(f"Story creation failed: {response.status_code} - {response.text}", "ERROR")
        except Exception as e:
            self.log(f"Story creation request failed: {e}", "ERROR")

        # 5. Create Chapter
        if self.story_id:
            self.log("Testing chapter creation...")
            chapter_data = {
                "title": "Chapter 1: The Beginning",
                "content": "This is the first chapter of our test story. It contains sample content to verify that the content management system is working properly for frontend integration.",
                "chapter_number": 1,
                "is_premium": False
            }
            
            try:
                response = requests.post(
                    f"{self.gateway_url}/content/content/stories/{self.story_id}/chapters",
                    json=chapter_data,
                    headers=headers,
                    timeout=10
                )
                if response.status_code in [200, 201]:
                    self.log("Chapter creation successful", "SUCCESS")
                else:
                    self.log(f"Chapter creation failed: {response.status_code} - {response.text}", "ERROR")
            except Exception as e:
                self.log(f"Chapter creation request failed: {e}", "ERROR")

        # 6. Get Stories (Discovery)
        self.log("Testing story discovery...")
        try:
            response = requests.get(
                f"{self.gateway_url}/content/discovery/trending?limit=10",
                timeout=10
            )
            if response.status_code == 200:
                self.log("Story discovery successful", "SUCCESS")
                stories = response.json()
                self.log(f"Found {len(stories.get('stories', []))} stories")
            else:
                self.log(f"Story discovery failed: {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Story discovery request failed: {e}", "ERROR")

        # 7. Get User Balance
        self.log("Testing user balance retrieval...")
        try:
            response = requests.get(
                f"{self.gateway_url}/payments/api/v1/payments/balance/{self.user_id}",
                headers=headers,
                timeout=10
            )
            if response.status_code == 200:
                self.log("User balance retrieval successful", "SUCCESS")
                balance_data = response.json()
                self.log(f"User balance: {balance_data.get('balance', 0)} coins")
            else:
                self.log(f"Balance retrieval failed: {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Balance retrieval request failed: {e}", "ERROR")

        # 8. Test Analytics Event
        self.log("Testing analytics event recording...")
        event_data = {
            "event_type": "story_view",
            "user_id": self.user_id,
            "content_id": self.story_id,
            "metadata": {
                "source": "frontend_test",
                "timestamp": datetime.now().isoformat()
            }
        }
        
        try:
            response = requests.post(
                f"{self.gateway_url}/analytics/api/analytics/events",
                json=event_data,
                headers=headers,
                timeout=10
            )
            if response.status_code in [200, 201]:
                self.log("Analytics event recording successful", "SUCCESS")
            else:
                self.log(f"Analytics event failed: {response.status_code}", "ERROR")
        except Exception as e:
            self.log(f"Analytics event request failed: {e}", "ERROR")

        self.log("=== FRONTEND INTEGRATION TEST COMPLETED ===")
        return True

    def test_critical_endpoints(self):
        """Test critical endpoints that frontend absolutely needs"""
        
        self.log("=== TESTING CRITICAL ENDPOINTS FOR FRONTEND ===")
        
        critical_endpoints = [
            ("GET", "/health", "Gateway Health Check"),
            ("GET", "/content/discovery/trending", "Story Discovery"),
            ("GET", "/payments/api/v1/payments/coin-packages", "Coin Packages"),
        ]
        
        for method, endpoint, name in critical_endpoints:
            try:
                response = requests.request(
                    method,
                    f"{self.gateway_url}{endpoint}",
                    timeout=10
                )
                if response.status_code in [200, 201]:
                    self.log(f"{name}: {response.status_code}", "SUCCESS")
                else:
                    self.log(f"{name}: {response.status_code}", "ERROR")
            except Exception as e:
                self.log(f"{name}: Request failed - {e}", "ERROR")

def main():
    tester = FrontendIntegrationTest()
    
    print("🚀 Starting Frontend Integration Test")
    print("=" * 50)
    
    # Test critical endpoints first
    tester.test_critical_endpoints()
    
    print("\n" + "=" * 50)
    
    # Test complete user journey
    tester.test_user_journey()
    
    print("\n🏁 Frontend Integration Test Complete!")
    print("If all tests passed, your frontend should integrate smoothly!")

if __name__ == "__main__":
    main()