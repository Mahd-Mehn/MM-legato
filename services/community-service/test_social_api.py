"""
Test social engagement API endpoints
"""
import requests
import json
import uuid
from datetime import datetime, timedelta

# Test configuration
BASE_URL = "http://localhost:8000"
SOCIAL_URL = f"{BASE_URL}/social"

def test_api_endpoints():
    """Test social engagement API endpoints"""
    print("Testing Social Engagement API endpoints...")
    
    # Generate test user IDs
    user1_id = str(uuid.uuid4())
    user2_id = str(uuid.uuid4())
    
    try:
        # Test 1: Follow a user
        print("1. Testing user following...")
        follow_data = {
            "following_id": user2_id,
            "notification_enabled": True
        }
        
        response = requests.post(
            f"{SOCIAL_URL}/follow?follower_id={user1_id}",
            json=follow_data
        )
        
        if response.status_code == 200:
            follow_result = response.json()
            print(f"   ✓ Follow successful: {follow_result['follower_id']} -> {follow_result['following_id']}")
        else:
            print(f"   ✗ Follow failed: {response.status_code} - {response.text}")
            return False
        
        # Test 2: Get follow stats
        print("2. Testing follow stats...")
        response = requests.get(f"{SOCIAL_URL}/follow/stats/{user2_id}?current_user_id={user1_id}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✓ Follow stats: {stats['followers_count']} followers, following: {stats['is_following']}")
        else:
            print(f"   ✗ Follow stats failed: {response.status_code} - {response.text}")
            return False
        
        # Test 3: Get notifications
        print("3. Testing notifications...")
        response = requests.get(f"{SOCIAL_URL}/notifications?user_id={user2_id}")
        
        if response.status_code == 200:
            notifications = response.json()
            print(f"   ✓ Notifications: {notifications['total']} total, {notifications['unread_count']} unread")
        else:
            print(f"   ✗ Notifications failed: {response.status_code} - {response.text}")
            return False
        
        # Test 4: Get user stats
        print("4. Testing user stats...")
        response = requests.get(f"{SOCIAL_URL}/stats/{user1_id}")
        
        if response.status_code == 200:
            stats = response.json()
            print(f"   ✓ User stats: {stats['total_points']} points, {stats['followers_count']} followers")
        else:
            print(f"   ✗ User stats failed: {response.status_code} - {response.text}")
            return False
        
        # Test 5: Get contests
        print("5. Testing contests...")
        response = requests.get(f"{SOCIAL_URL}/contests")
        
        if response.status_code == 200:
            contests = response.json()
            print(f"   ✓ Contests: {contests['total']} total contests")
        else:
            print(f"   ✗ Contests failed: {response.status_code} - {response.text}")
            return False
        
        # Test 6: Create social share
        print("6. Testing social sharing...")
        share_data = {
            "content_type": "story",
            "content_id": str(uuid.uuid4()),
            "platform": "twitter",
            "share_text": "Check out this amazing story!"
        }
        
        response = requests.post(
            f"{SOCIAL_URL}/share?user_id={user1_id}",
            json=share_data
        )
        
        if response.status_code == 200:
            share_result = response.json()
            print(f"   ✓ Social share created: {share_result['platform']} - {share_result['share_url']}")
        else:
            print(f"   ✗ Social share failed: {response.status_code} - {response.text}")
            return False
        
        # Test 7: Get leaderboard
        print("7. Testing leaderboard...")
        response = requests.get(f"{SOCIAL_URL}/leaderboard/writers?user_id={user1_id}")
        
        if response.status_code == 200:
            leaderboard = response.json()
            print(f"   ✓ Leaderboard: {leaderboard['category']} - {len(leaderboard['entries'])} entries")
        else:
            print(f"   ✗ Leaderboard failed: {response.status_code} - {response.text}")
            return False
        
        print("\nAll API tests passed! ✅")
        return True
        
    except requests.exceptions.ConnectionError:
        print("❌ Could not connect to the API. Make sure the service is running on http://localhost:8000")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {e}")
        return False

if __name__ == "__main__":
    # Check if service is running
    try:
        response = requests.get(f"{BASE_URL}/health")
        if response.status_code == 200:
            print("✅ Community service is running")
            test_api_endpoints()
        else:
            print("❌ Community service health check failed")
    except requests.exceptions.ConnectionError:
        print("❌ Community service is not running. Start it with: python main.py")
    except Exception as e:
        print(f"❌ Error checking service: {e}")