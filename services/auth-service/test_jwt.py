"""
Unit tests for JWT authentication system
"""
import pytest
from datetime import datetime, timedelta, timezone
from jwt_utils import JWTManager, RoleChecker
from models import UserRole
import time

def test_jwt_token_creation():
    """Test JWT token creation and verification"""
    
    # Test data
    user_data = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "username": "testuser",
        "email": "test@example.com",
        "role": "writer"
    }
    
    # Create access token
    access_token = JWTManager.create_access_token(user_data)
    assert access_token is not None
    assert isinstance(access_token, str)
    assert len(access_token.split('.')) == 3  # JWT format
    
    # Create refresh token
    refresh_token = JWTManager.create_refresh_token({"sub": user_data["sub"]})
    assert refresh_token is not None
    assert isinstance(refresh_token, str)
    
    print("✓ JWT token creation tests passed")

def test_jwt_token_verification():
    """Test JWT token verification"""
    
    user_data = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "username": "testuser",
        "email": "test@example.com",
        "role": "writer"
    }
    
    # Create and verify access token
    access_token = JWTManager.create_access_token(user_data)
    payload = JWTManager.verify_token(access_token, "access")
    
    assert payload is not None
    assert payload["sub"] == user_data["sub"]
    assert payload["username"] == user_data["username"]
    assert payload["type"] == "access"
    
    # Create and verify refresh token
    refresh_token = JWTManager.create_refresh_token({"sub": user_data["sub"]})
    refresh_payload = JWTManager.verify_token(refresh_token, "refresh")
    
    assert refresh_payload is not None
    assert refresh_payload["sub"] == user_data["sub"]
    assert refresh_payload["type"] == "refresh"
    assert "jti" in refresh_payload  # JWT ID for rotation
    
    print("✓ JWT token verification tests passed")

def test_jwt_token_expiration():
    """Test JWT token expiration"""
    
    user_data = {"sub": "test-user-id"}
    
    # Create token with short expiration
    short_expiry = timedelta(seconds=1)
    token = JWTManager.create_access_token(user_data, short_expiry)
    
    # Token should be valid immediately
    payload = JWTManager.verify_token(token, "access")
    assert payload is not None
    
    # Wait for token to expire
    time.sleep(2)
    
    # Token should now be invalid
    expired_payload = JWTManager.verify_token(token, "access")
    assert expired_payload is None
    
    print("✓ JWT token expiration tests passed")

def test_jwt_token_type_validation():
    """Test JWT token type validation"""
    
    user_data = {"sub": "test-user-id"}
    
    access_token = JWTManager.create_access_token(user_data)
    refresh_token = JWTManager.create_refresh_token(user_data)
    
    # Access token should not verify as refresh token
    assert JWTManager.verify_token(access_token, "refresh") is None
    
    # Refresh token should not verify as access token
    assert JWTManager.verify_token(refresh_token, "access") is None
    
    # Tokens should verify with correct type
    assert JWTManager.verify_token(access_token, "access") is not None
    assert JWTManager.verify_token(refresh_token, "refresh") is not None
    
    print("✓ JWT token type validation tests passed")

def test_get_user_from_token():
    """Test extracting user data from token"""
    
    user_data = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "username": "testuser",
        "email": "test@example.com",
        "role": "writer",
        "is_active": True
    }
    
    token = JWTManager.create_access_token(user_data)
    extracted_data = JWTManager.get_user_from_token(token)
    
    assert extracted_data is not None
    assert extracted_data["user_id"] == user_data["sub"]
    assert extracted_data["username"] == user_data["username"]
    assert extracted_data["email"] == user_data["email"]
    assert extracted_data["role"] == user_data["role"]
    assert extracted_data["is_active"] == user_data["is_active"]
    
    print("✓ User data extraction tests passed")

def test_create_token_pair():
    """Test creating access and refresh token pair"""
    
    user_data = {
        "sub": "123e4567-e89b-12d3-a456-426614174000",
        "username": "testuser",
        "email": "test@example.com",
        "role": "writer"
    }
    
    token_pair = JWTManager.create_token_pair(user_data)
    
    assert "access_token" in token_pair
    assert "refresh_token" in token_pair
    assert "token_type" in token_pair
    assert token_pair["token_type"] == "bearer"
    
    # Verify both tokens
    access_payload = JWTManager.verify_token(token_pair["access_token"], "access")
    refresh_payload = JWTManager.verify_token(token_pair["refresh_token"], "refresh")
    
    assert access_payload is not None
    assert refresh_payload is not None
    assert access_payload["sub"] == user_data["sub"]
    assert refresh_payload["sub"] == user_data["sub"]
    
    print("✓ Token pair creation tests passed")

def test_role_hierarchy():
    """Test role-based access control hierarchy"""
    
    # Test role hierarchy
    assert RoleChecker.has_permission(UserRole.ADMIN, UserRole.READER) == True
    assert RoleChecker.has_permission(UserRole.ADMIN, UserRole.WRITER) == True
    assert RoleChecker.has_permission(UserRole.ADMIN, UserRole.STUDIO) == True
    assert RoleChecker.has_permission(UserRole.ADMIN, UserRole.ADMIN) == True
    
    assert RoleChecker.has_permission(UserRole.WRITER, UserRole.READER) == True
    assert RoleChecker.has_permission(UserRole.WRITER, UserRole.WRITER) == True
    assert RoleChecker.has_permission(UserRole.WRITER, UserRole.STUDIO) == False
    assert RoleChecker.has_permission(UserRole.WRITER, UserRole.ADMIN) == False
    
    assert RoleChecker.has_permission(UserRole.READER, UserRole.READER) == True
    assert RoleChecker.has_permission(UserRole.READER, UserRole.WRITER) == False
    
    print("✓ Role hierarchy tests passed")

def test_resource_access_control():
    """Test resource access control"""
    
    user_id = "user-123"
    resource_owner_id = "user-456"
    
    # Admin can access everything
    assert RoleChecker.can_access_resource(UserRole.ADMIN, resource_owner_id, user_id) == True
    
    # Users can access their own resources
    assert RoleChecker.can_access_resource(UserRole.WRITER, user_id, user_id) == True
    assert RoleChecker.can_access_resource(UserRole.READER, user_id, user_id) == True
    
    # Studios can access writer resources (for licensing)
    assert RoleChecker.can_access_resource(UserRole.STUDIO, resource_owner_id, user_id) == True
    
    # Regular users cannot access others' resources
    assert RoleChecker.can_access_resource(UserRole.READER, resource_owner_id, user_id) == False
    assert RoleChecker.can_access_resource(UserRole.WRITER, resource_owner_id, user_id) == False
    
    print("✓ Resource access control tests passed")

def test_role_allowed_actions():
    """Test role-based allowed actions"""
    
    reader_actions = RoleChecker.get_allowed_actions(UserRole.READER)
    writer_actions = RoleChecker.get_allowed_actions(UserRole.WRITER)
    studio_actions = RoleChecker.get_allowed_actions(UserRole.STUDIO)
    admin_actions = RoleChecker.get_allowed_actions(UserRole.ADMIN)
    
    # Readers can read and interact
    assert "read_content" in reader_actions
    assert "comment" in reader_actions
    assert "create_content" not in reader_actions
    
    # Writers can do everything readers can plus create content
    assert "read_content" in writer_actions
    assert "create_content" in writer_actions
    assert "publish_content" in writer_actions
    assert "view_analytics" in writer_actions
    
    # Studios have specific licensing actions
    assert "browse_marketplace" in studio_actions
    assert "license_content" in studio_actions
    assert "create_content" not in studio_actions
    
    # Admins have all permissions
    assert "all_actions" in admin_actions
    assert "manage_users" in admin_actions
    assert "system_administration" in admin_actions
    
    print("✓ Role allowed actions tests passed")

def test_invalid_tokens():
    """Test handling of invalid tokens"""
    
    # Test invalid token format
    assert JWTManager.verify_token("invalid.token", "access") is None
    assert JWTManager.verify_token("", "access") is None
    assert JWTManager.verify_token("not-a-jwt-token", "access") is None
    
    # Test get user from invalid token
    assert JWTManager.get_user_from_token("invalid.token") is None
    assert JWTManager.get_user_from_token("") is None
    
    print("✓ Invalid token handling tests passed")

if __name__ == "__main__":
    print("Running JWT authentication system tests...")
    
    test_jwt_token_creation()
    test_jwt_token_verification()
    test_jwt_token_expiration()
    test_jwt_token_type_validation()
    test_get_user_from_token()
    test_create_token_pair()
    test_role_hierarchy()
    test_resource_access_control()
    test_role_allowed_actions()
    test_invalid_tokens()
    
    print("\n✅ All JWT tests completed successfully!")