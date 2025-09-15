#!/usr/bin/env python3
"""
Community Features Test Suite
Tests comments, ratings, social features, and fan engagement
"""

import requests
import json
import uuid
from datetime import datetime
from typing import Dict, Any, Optional

class CommunityFeaturesTest:
    def __init__(self):
        self.base_url = "http://localhost:8000"  # Gateway URL
        self.community_url = "http://localhost:8008"  # Direct community service URL
        self.auth_token = None
        self.user_id = None
        self.story_id = None
        self.chapter_id = None
        self.comment_id = None
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

    def setup_test_data(self):
        """Set up test data (user, story, etc.)"""
        self.log("=== SETTING UP TEST DATA ===")
        
        # Create test user and get auth token
        test_email = f"community_test_{uuid.uuid4().hex[:8]}@example.com"
        test_password = "CommunityTest123!"
        
        register_data = {
            "email": test_email,
            "password": test_password,
            "username": f"community_user_{uuid.uuid4().hex[:6]}",
            "role": "writer"
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_url}/auth/auth/register",
            json=register_data
        )
        
        if response and response.status_code in [200, 201]:
            auth_data = response.json()
            self.auth_token = auth_data.get('access_token')
            self.log("✅ Test user created and authenticated", "SUCCESS")
        else:
            self.log("❌ Failed to create test user", "ERROR")
            return False

        # Get user profile to get user ID
        if self.auth_token:
            headers = {"Authorization": f"Bearer {self.auth_token}"}
            response = self.make_request(
                "GET",
                f"{self.base_url}/auth/auth/profile",
                headers=headers
            )
            
            if response and response.status_code == 200:
                profile_data = response.json()
                self.user_id = profile_data.get('id')
                self.log(f"✅ Got user ID: {self.user_id}", "SUCCESS")
            else:
                self.log("❌ Failed to get user profile", "ERROR")
                return False

        # Create test story
        if self.auth_token:
            story_data = {
                "title": f"Community Test Story {uuid.uuid4().hex[:6]}",
                "description": "Test story for community features testing",
                "genre": "fantasy",
                "language": "en",
                "tags": ["test", "community"],
                "is_premium": False
            }
            
            response = self.make_request(
                "POST",
                f"{self.base_url}/content/content/stories",
                json=story_data,
                headers=headers
            )
            
            if response and response.status_code in [200, 201]:
                story_response = response.json()
                self.story_id = story_response.get('id')
                self.log(f"✅ Created test story: {self.story_id}", "SUCCESS")
                
                # Create test chapter
                chapter_data = {
                    "title": "Test Chapter for Comments",
                    "content": "This is test content for community features testing.",
                    "chapter_number": 1,
                    "is_premium": False
                }
                
                response = self.make_request(
                    "POST",
                    f"{self.base_url}/content/content/stories/{self.story_id}/chapters",
                    json=chapter_data,
                    headers=headers
                )
                
                if response and response.status_code in [200, 201]:
                    chapter_response = response.json()
                    self.chapter_id = chapter_response.get('id')
                    self.log(f"✅ Created test chapter: {self.chapter_id}", "SUCCESS")
                else:
                    self.log("❌ Failed to create test chapter", "ERROR")
                    return False
            else:
                self.log("❌ Failed to create test story", "ERROR")
                return False

        return True

    def test_community_service_health(self):
        """Test community service health"""
        self.log("=== TESTING COMMUNITY SERVICE HEALTH ===")
        
        # Test direct community service health
        self.test_endpoint(
            "Community Service Health (Direct)",
            "GET",
            f"{self.community_url}/health"
        )
        
        # Test through gateway
        self.test_endpoint(
            "Community Service Health (Gateway)",
            "GET",
            f"{self.base_url}/community/health"
        )

    def test_comment_system(self):
        """Test comment creation, replies, and reactions"""
        self.log("=== TESTING COMMENT SYSTEM ===")
        
        if not self.auth_token or not self.story_id or not self.chapter_id:
            self.log("Skipping comment tests - missing test data", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test create comment
        comment_data = {
            "story_id": self.story_id,
            "chapter_id": self.chapter_id,
            "content": "This is a test comment for the community features!",
            "is_spoiler": False
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_url}/community/comments/",
            json=comment_data,
            headers=headers
        )
        
        if response and response.status_code in [200, 201]:
            self.log("✅ Comment creation: 201", "SUCCESS")
            self.results['passed'] += 1
            comment_response = response.json()
            self.comment_id = comment_response.get('id')
        else:
            self.log("❌ Comment creation failed", "ERROR")
            self.results['failed'] += 1

        # Test get comments for chapter
        self.test_endpoint(
            "Get Chapter Comments",
            "GET",
            f"{self.base_url}/community/comments/?chapter_id={self.chapter_id}",
            headers=headers
        )

        if self.comment_id:
            # Test get specific comment
            self.test_endpoint(
                "Get Specific Comment",
                "GET",
                f"{self.base_url}/community/comments/{self.comment_id}",
                headers=headers
            )

            # Test comment reaction (like)
            reaction_data = {"is_like": True}
            self.test_endpoint(
                "Like Comment",
                "POST",
                f"{self.base_url}/community/comments/{self.comment_id}/react",
                json=reaction_data,
                headers=headers
            )

            # Test create reply
            reply_data = {
                "story_id": self.story_id,
                "chapter_id": self.chapter_id,
                "content": "This is a reply to the test comment!",
                "parent_comment_id": self.comment_id,
                "is_spoiler": False
            }
            
            self.test_endpoint(
                "Create Comment Reply",
                "POST",
                f"{self.base_url}/community/comments/",
                json=reply_data,
                headers=headers,
                expected_status=201
            )

    def test_rating_system(self):
        """Test story ratings and reviews"""
        self.log("=== TESTING RATING SYSTEM ===")
        
        if not self.auth_token or not self.story_id:
            self.log("Skipping rating tests - missing test data", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test create rating
        rating_data = {
            "story_id": self.story_id,
            "rating": 5,
            "review_text": "This is an excellent test story! Great for testing community features.",
            "is_spoiler": False
        }
        
        response = self.make_request(
            "POST",
            f"{self.base_url}/community/ratings/",
            json=rating_data,
            headers=headers
        )
        
        if response and response.status_code in [200, 201]:
            self.log("✅ Rating creation: 201", "SUCCESS")
            self.results['passed'] += 1
            rating_response = response.json()
            rating_id = rating_response.get('id')
            
            # Test get specific rating
            if rating_id:
                self.test_endpoint(
                    "Get Specific Rating",
                    "GET",
                    f"{self.base_url}/community/ratings/{rating_id}",
                    headers=headers
                )
        else:
            self.log("❌ Rating creation failed", "ERROR")
            self.results['failed'] += 1

        # Test get story ratings
        self.test_endpoint(
            "Get Story Ratings",
            "GET",
            f"{self.base_url}/community/ratings/?story_id={self.story_id}",
            headers=headers
        )

        # Test get rating statistics
        self.test_endpoint(
            "Get Rating Statistics",
            "GET",
            f"{self.base_url}/community/ratings/stats/{self.story_id}",
            headers=headers
        )

    def test_social_features(self):
        """Test social features like following, notifications"""
        self.log("=== TESTING SOCIAL FEATURES ===")
        
        if not self.auth_token or not self.user_id:
            self.log("Skipping social tests - missing test data", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test get user stats
        self.test_endpoint(
            "Get User Social Stats",
            "GET",
            f"{self.base_url}/community/social/stats/{self.user_id}",
            headers=headers
        )

        # Test get user notifications
        self.test_endpoint(
            "Get User Notifications",
            "GET",
            f"{self.base_url}/community/social/notifications?user_id={self.user_id}",
            headers=headers
        )

        # Test get user achievements
        self.test_endpoint(
            "Get User Achievements",
            "GET",
            f"{self.base_url}/community/social/achievements/{self.user_id}",
            headers=headers
        )

    def test_fan_engagement(self):
        """Test fan engagement features"""
        self.log("=== TESTING FAN ENGAGEMENT ===")
        
        if not self.auth_token:
            self.log("Skipping fan engagement tests - missing auth token", "WARNING")
            return

        headers = {"Authorization": f"Bearer {self.auth_token}"}
        
        # Test get leaderboards
        self.test_endpoint(
            "Get Leaderboards",
            "GET",
            f"{self.base_url}/community/fan-engagement/leaderboard?type=readers&limit=10",
            headers=headers
        )

        # Test get contests
        self.test_endpoint(
            "Get Active Contests",
            "GET",
            f"{self.base_url}/community/fan-engagement/contests?status=active",
            headers=headers
        )

    def run_comprehensive_test(self):
        """Run all community feature tests"""
        self.log("🚀 Starting Community Features Test Suite")
        self.log("=" * 60)
        
        start_time = datetime.now()
        
        try:
            # Setup test data first
            if not self.setup_test_data():
                self.log("Failed to setup test data, aborting tests", "ERROR")
                return False
            
            # Run all tests
            self.test_community_service_health()
            self.test_comment_system()
            self.test_rating_system()
            self.test_social_features()
            self.test_fan_engagement()
            
        except KeyboardInterrupt:
            self.log("Test suite interrupted by user", "WARNING")
        except Exception as e:
            self.log(f"Unexpected error during testing: {e}", "ERROR")
        
        end_time = datetime.now()
        duration = (end_time - start_time).total_seconds()
        
        # Print summary
        self.log("=" * 60)
        self.log("🏁 COMMUNITY FEATURES TEST COMPLETED")
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
            self.log("🎉 Excellent! Community features are working great!", "SUCCESS")
        elif success_rate >= 75:
            self.log("👍 Good! Most community features are working", "WARNING")
        else:
            self.log("⚠️  Several community features need attention", "ERROR")
        
        return success_rate >= 75

def main():
    tester = CommunityFeaturesTest()
    success = tester.run_comprehensive_test()
    return 0 if success else 1

if __name__ == "__main__":
    exit(main())