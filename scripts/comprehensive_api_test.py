#!/usr/bin/env python3
"""
Comprehensive API Test Suite for Legato Platform
Tests all endpoints across all microservices to ensure frontend integration readiness
"""

import requests
import json
import time
import uuid
from datetime import datetime
from typing import Dict, Any, Optional
import sys

class LegatoAPITester:
    def __init__(self):
        self.base_urls = {
            'gateway': 'http://localhost:8000',
            'auth': 'http://localhost:8001',
            'user': 'http://localhost:8002',
            'content': 'http://localhost:8003',
            'ip': 'http://localhost:8004',
            'payment': 'http://localhost:8005',
            'ai': 'http://localhost:8006',
            'analytics': 'http://localhost:8007',
            'community': 'http://localhost:8008'
        }
        self.test_data = {}
        self.auth_token = None
        self.test_user_id = None
        self.test_story_id = None
        self.results = {
            'passed': 0,
            'failed': 0,
            'errors': []
        }

    def log(self, message: str, level: str = "INFO"):
        """Log test messages with timestamp"""
        timestamp = datetime.now().strftime("%H:%M:%S")
        print(f"[{timestamp}] {level}: {message}")

    def make_request(self, method: str, url: str, **kwargs) -> Optional[requests.Response]:
        """Make HTTP request with error handling"""
        try:
            response = requests.request(method, url, timeout=30, **kwargs)
            return response
        except requests.exceptions.RequestException as e:
            self.log(f"Request failed: {e}", "ERROR")
            return None

    def test_endpoint(self, name: str, method: str, url: str, expected_status: int = 200, **kwargs) -> bool:
        """Test a single endpoint"""
        self.log(f"Testing {name}: {method} {url}")
        
        response = self.make_request(method, url, **kwargs)
        if not response:
            self.results['failed'] += 1
            self.results['errors'].append(f"{name}: Request failed")
            return False

        success = response.status_code == expected_status
        if success:
            self.results['passed'] += 1
            self.log(f"✅ {name}: {response.status_code}", "SUCCESS")
        else:
            self.results['failed'] += 1
            error_msg = f"{name}: Expected {expected_status}, got {response.status_code}"
            if response.text:
                error_msg += f" - {response.text[:200]}"
            self.results['errors'].append(error_msg)
            self.log(f"❌ {name}: {response.status_code}", "ERROR")

        return success

    def test_health_endpoints(self):
        """Test all health check endpoints"""
        self.log("=== TESTING HEALTH ENDPOINTS ===")
        
        # Gateway health
        self.test_endpoint(
            "Gateway Health",
            "GET",
            f"{self.base_urls['gateway']}/health"
        )
        
        # Individual service health checks
        for service, url in self.base_urls.items():
            if service != 'gateway':
                self.test_endpoint(
                    f"{service.title()} Service Health",
                    "GET",
                    f"{url}/health"
                )

    def test_auth_service(self):
        """Test authentication service endpoints"""
        self.log("=== TESTING AUTHENTICATION SERVICE ===")
        
        # Generate test user data
        test_email = f"test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "TestPassword123!"
        
        # Test user registration
        register_data = {
            "email": test_email,
            "password": test_password,
            "username": f"testuser_{uuid.uuid4().hex[:8]}",
            "role": "writer"
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_urls['auth']}/auth/register",
            json=register_data
        )
        
        if response and response.status_code == 201:
            self.log("✅ User Registration: 201", "SUCCESS")
            self.results['passed'] += 1
            user_data = response.json()
            self.test_user_id = user_data.get('user_id')
        else:
            self.log("❌ User Registration failed", "ERROR")
            self.results['failed'] += 1
            return

        # Test user login
        login_data = {
            "email": test_email,
            "password": test_password
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_urls['auth']}/auth/login",
            json=login_data
        )
        
        if response and response.status_code == 200:
            self.log("✅ User Login: 200", "SUCCESS")
            self.results['passed'] += 1
            auth_data = response.json()
            self.auth_token = auth_data.get('access_token')
        else:
            self.log("❌ User Login failed", "ERROR")
            self.results['failed'] += 1
            return

        # Test token validation
        headers = {"Authorization": f"Bearer {self.auth_token}"}
        self.test_endpoint(
            "Token Validation",
            "GET",
            f"{self.base_urls['auth']}/auth/profile",
            headers=headers
        )

    def test_user_service(self):
        """Test user management service endpoints"""
        self.log("=== TESTING USER SERVICE ===")
        
        if not self.auth_token or not self.test_user_id:
            self.log("Skipping user service tests - no auth token", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test get user profile
        self.test_endpoint(
            "Get User Profile",
            "GET",
            f"{self.base_urls['user']}/api/users/{self.test_user_id}",
            headers=headers
        )

        # Test update user profile
        profile_update = {
            "bio": "Test user bio for comprehensive testing",
            "display_name": "Test Writer",
            "preferences": {
                "language": "en",
                "theme": "dark"
            }
        }
        
        self.test_endpoint(
            "Update User Profile",
            "PUT",
            f"{self.base_urls['user']}/api/users/{self.test_user_id}",
            json=profile_update,
            headers=headers
        )

        # Test get user stats
        self.test_endpoint(
            "Get User Stats",
            "GET",
            f"{self.base_urls['user']}/api/users/{self.test_user_id}/stats",
            headers=headers
        )

    def test_content_service(self):
        """Test content management service endpoints"""
        self.log("=== TESTING CONTENT SERVICE ===")
        
        if not self.auth_token:
            self.log("Skipping content service tests - no auth token", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test create story
        story_data = {
            "title": f"Test Story {uuid.uuid4().hex[:8]}",
            "description": "A comprehensive test story for API validation",
            "genre": "fantasy",
            "language": "en",
            "tags": ["test", "api", "validation"],
            "is_premium": False
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_urls['content']}/content/stories",
            json=story_data,
            headers=headers
        )
        
        if response and response.status_code == 201:
            self.log("✅ Create Story: 201", "SUCCESS")
            self.results['passed'] += 1
            story_response = response.json()
            self.test_story_id = story_response.get('id')
        else:
            self.log("❌ Create Story failed", "ERROR")
            self.results['failed'] += 1

        # Test get stories
        self.test_endpoint(
            "Get Stories",
            "GET",
            f"{self.base_urls['content']}/content/stories",
            headers=headers
        )

        if self.test_story_id:
            # Test get specific story
            self.test_endpoint(
                "Get Specific Story",
                "GET",
                f"{self.base_urls['content']}/content/stories/{self.test_story_id}",
                headers=headers
            )

            # Test create chapter
            chapter_data = {
                "title": "Test Chapter 1",
                "content": "This is test content for the first chapter of our test story.",
                "chapter_number": 1,
                "is_premium": False
            }
            
            response = self.make_request(
                "POST",
                f"{self.base_urls['content']}/content/stories/{self.test_story_id}/chapters",
                json=chapter_data,
                headers=headers
            )
            
            if response and response.status_code == 201:
                self.log("✅ Create Chapter: 201", "SUCCESS")
                self.results['passed'] += 1
                chapter_response = response.json()
                test_chapter_id = chapter_response.get('id')
                
                # Test get chapters
                self.test_endpoint(
                    "Get Story Chapters",
                    "GET",
                    f"{self.base_urls['content']}/content/stories/{self.test_story_id}/chapters",
                    headers=headers
                )
                
                # Test get specific chapter
                if test_chapter_id:
                    self.test_endpoint(
                        "Get Specific Chapter",
                        "GET",
                        f"{self.base_urls['content']}/chapters/{test_chapter_id}",
                        headers=headers
                    )
            else:
                self.log("❌ Create Chapter failed", "ERROR")
                self.results['failed'] += 1

        # Test story discovery
        self.test_endpoint(
            "Get Trending Stories",
            "GET",
            f"{self.base_urls['content']}/discovery/trending?limit=10"
        )

        # Test search stories
        self.test_endpoint(
            "Search Stories",
            "GET",
            f"{self.base_urls['content']}/discovery/search?q=test&limit=5"
        )

    def test_ip_service(self):
        """Test IP protection service endpoints"""
        self.log("=== TESTING IP PROTECTION SERVICE ===")
        
        if not self.auth_token or not self.test_story_id:
            self.log("Skipping IP service tests - missing auth token or story ID", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test register IP protection
        ip_data = {
            "content_id": self.test_story_id,
            "content_type": "story",
            "title": "Test Story IP Protection",
            "description": "IP protection for test story"
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_urls['ip']}/api/ip/protection/register",
            json=ip_data,
            headers=headers
        )
        
        if response and response.status_code == 201:
            self.log("✅ Register IP Protection: 201", "SUCCESS")
            self.results['passed'] += 1
            ip_response = response.json()
            test_ip_id = ip_response.get('id')
            
            # Test get IP protection status
            if test_ip_id:
                self.test_endpoint(
                    "Get IP Protection Status",
                    "GET",
                    f"{self.base_urls['ip']}/api/ip/protection/{test_ip_id}",
                    headers=headers
                )
        else:
            self.log("❌ Register IP Protection failed", "ERROR")
            self.results['failed'] += 1

        # Test get user IP protections
        self.test_endpoint(
            "Get User IP Protections",
            "GET",
            f"{self.base_urls['ip']}/api/ip/protection/user/{self.test_user_id}",
            headers=headers
        )

        # Test blockchain verification
        self.test_endpoint(
            "Blockchain Verification",
            "GET",
            f"{self.base_urls['ip']}/api/ip/blockchain/verify/{self.test_story_id}",
            headers=headers
        )

    def test_payment_service(self):
        """Test payment service endpoints"""
        self.log("=== TESTING PAYMENT SERVICE ===")
        
        if not self.auth_token or not self.test_user_id:
            self.log("Skipping payment service tests - missing auth token or user ID", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test get coin packages
        self.test_endpoint(
            "Get Coin Packages",
            "GET",
            f"{self.base_urls['payment']}/api/v1/payments/coin-packages"
        )

        # Test get user balance
        self.test_endpoint(
            "Get User Balance",
            "GET",
            f"{self.base_urls['payment']}/api/v1/payments/balance/{self.test_user_id}",
            headers=headers
        )

        # Test get transaction history
        self.test_endpoint(
            "Get Transaction History",
            "GET",
            f"{self.base_urls['payment']}/api/v1/payments/transactions/{self.test_user_id}",
            headers=headers
        )

        # Test revenue analytics
        self.test_endpoint(
            "Get Revenue Analytics",
            "GET",
            f"{self.base_urls['payment']}/api/v1/revenue/analytics/{self.test_user_id}",
            headers=headers
        )

        # Test access control check
        if self.test_story_id:
            self.test_endpoint(
                "Check Content Access",
                "GET",
                f"{self.base_urls['payment']}/api/v1/access/check/{self.test_user_id}/{self.test_story_id}",
                headers=headers
            )

    def test_ai_service(self):
        """Test AI service endpoints"""
        self.log("=== TESTING AI SERVICE ===")
        
        if not self.auth_token:
            self.log("Skipping AI service tests - no auth token", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test text-to-speech generation
        tts_data = {
            "text": "This is a test for text-to-speech generation in the Legato platform.",
            "voice": "default",
            "language": "en"
        }
        
        self.test_endpoint(
            "Text-to-Speech Generation",
            "POST",
            f"{self.base_urls['ai']}/api/ai/tts/generate",
            json=tts_data,
            headers=headers,
            expected_status=202  # Async operation
        )

        # Test translation
        translation_data = {
            "text": "Hello, this is a test translation.",
            "source_language": "en",
            "target_language": "es"
        }
        
        self.test_endpoint(
            "Text Translation",
            "POST",
            f"{self.base_urls['ai']}/api/ai/translate",
            json=translation_data,
            headers=headers
        )

        # Test content analysis
        if self.test_story_id:
            analysis_data = {
                "content_id": self.test_story_id,
                "analysis_type": "sentiment"
            }
            
            self.test_endpoint(
                "Content Analysis",
                "POST",
                f"{self.base_urls['ai']}/api/ai/analyze",
                json=analysis_data,
                headers=headers
            )

    def test_analytics_service(self):
        """Test analytics service endpoints"""
        self.log("=== TESTING ANALYTICS SERVICE ===")
        
        if not self.auth_token or not self.test_user_id:
            self.log("Skipping analytics service tests - missing auth token or user ID", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test user analytics
        self.test_endpoint(
            "Get User Analytics",
            "GET",
            f"{self.base_urls['analytics']}/api/analytics/user/{self.test_user_id}",
            headers=headers
        )

        # Test content analytics
        if self.test_story_id:
            self.test_endpoint(
                "Get Content Analytics",
                "GET",
                f"{self.base_urls['analytics']}/api/analytics/content/{self.test_story_id}",
                headers=headers
            )

        # Test platform analytics
        self.test_endpoint(
            "Get Platform Analytics",
            "GET",
            f"{self.base_urls['analytics']}/api/analytics/platform",
            headers=headers
        )

        # Test record event
        event_data = {
            "event_type": "story_view",
            "user_id": self.test_user_id,
            "content_id": self.test_story_id,
            "metadata": {
                "source": "api_test",
                "timestamp": datetime.now().isoformat()
            }
        }
        
        self.test_endpoint(
            "Record Analytics Event",
            "POST",
            f"{self.base_urls['analytics']}/api/analytics/events",
            json=event_data,
            headers=headers,
            expected_status=201
        )

    def test_community_service(self):
        """Test community service endpoints"""
        self.log("=== TESTING COMMUNITY SERVICE ===")
        
        if not self.auth_token or not self.test_story_id:
            self.log("Skipping community service tests - missing auth token or story ID", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test create comment
        comment_data = {
            "story_id": self.test_story_id,
            "chapter_id": str(uuid.uuid4()),  # Mock chapter ID
            "content": "This is a test comment for API validation!",
            "is_spoiler": False
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_urls['community']}/comments/",
            json=comment_data,
            headers=headers
        )
        
        if response and response.status_code in [200, 201]:
            self.log("✅ Create Comment: 201", "SUCCESS")
            self.results['passed'] += 1
            comment_response = response.json()
            test_comment_id = comment_response.get('id')
            
            # Test get comments
            if test_comment_id:
                self.test_endpoint(
                    "Get Comment",
                    "GET",
                    f"{self.base_urls['community']}/comments/{test_comment_id}",
                    headers=headers
                )
        else:
            self.log("❌ Create Comment failed", "ERROR")
            self.results['failed'] += 1

        # Test create rating
        rating_data = {
            "story_id": self.test_story_id,
            "rating": 5,
            "review_text": "Excellent test story for API validation!",
            "is_spoiler": False
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_urls['community']}/ratings/",
            json=rating_data,
            headers=headers
        )
        
        if response and response.status_code in [200, 201]:
            self.log("✅ Create Rating: 201", "SUCCESS")
            self.results['passed'] += 1
        else:
            self.log("❌ Create Rating failed", "ERROR")
            self.results['failed'] += 1

    def test_gateway_routes(self):
        """Test API Gateway routing"""
        self.log("=== TESTING API GATEWAY ROUTING ===")
        
        # Test gateway root
        self.test_endpoint(
            "Gateway Root",
            "GET",
            f"{self.base_urls['gateway']}/"
        )

        # Test service routing through gateway
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            
            # Test auth service through gateway
            self.test_endpoint(
                "Gateway -> Auth Service",
                "GET",
                f"{self.base_urls['gateway']}/auth/auth/profile",
                headers=headers
            )

            # Test community service through gateway
            self.test_endpoint(
                "Gateway -> Community Service",
                "GET",
                f"{self.base_urls['gateway']}/community/health"
            )

    def run_comprehensive_test(self):
        """Run all tests in sequence"""
        self.log("🚀 Starting Comprehensive Legato API Test Suite")
        self.log("=" * 60)
        
        start_time = time.time()
        
        try:
            # Test in logical order
            self.test_health_endpoints()
            self.test_auth_service()
            self.test_user_service()
            self.test_content_service()
            self.test_ip_service()
            self.test_payment_service()
            self.test_ai_service()
            self.test_analytics_service()
            self.test_community_service()
            self.test_gateway_routes()
            
        except KeyboardInterrupt:
            self.log("Test suite interrupted by user", "WARNING")
        except Exception as e:
            self.log(f"Unexpected error during testing: {e}", "ERROR")
        
        end_time = time.time()
        duration = end_time - start_time
        
        # Print summary
        self.log("=" * 60)
        self.log("🏁 TEST SUITE COMPLETED")
        self.log(f"Duration: {duration:.2f} seconds")
        self.log(f"✅ Passed: {self.results['passed']}")
        self.log(f"❌ Failed: {self.results['failed']}")
        self.log(f"Total Tests: {self.results['passed'] + self.results['failed']}")
        
        if self.results['errors']:
            self.log("\n🔍 FAILED TESTS:")
            for error in self.results['errors']:
                self.log(f"  • {error}", "ERROR")
        
        success_rate = (self.results['passed'] / (self.results['passed'] + self.results['failed'])) * 100 if (self.results['passed'] + self.results['failed']) > 0 else 0
        self.log(f"\n📊 Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 90:
            self.log("🎉 Excellent! Your APIs are ready for frontend integration!", "SUCCESS")
        elif success_rate >= 75:
            self.log("👍 Good! Most APIs are working, check failed tests", "WARNING")
        else:
            self.log("⚠️  Several issues found. Review failed tests before frontend integration", "ERROR")
        
        return success_rate >= 75

if __name__ == "__main__":
    tester = LegatoAPITester()
    success = tester.run_comprehensive_test()
    sys.exit(0 if success else 1)