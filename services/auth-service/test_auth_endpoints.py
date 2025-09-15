"""
Integration tests for authentication API endpoints
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserRole
from database import get_db
from main import app
import json

# Test database URL
TEST_DATABASE_URL = "sqlite:///:memory:"

def setup_test_db():
    """Setup test database"""
    engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
    Base.metadata.create_all(bind=engine)
    TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return TestingSessionLocal

def override_get_db():
    """Override database dependency for testing"""
    TestingSessionLocal = setup_test_db()
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()

# Override the dependency
app.dependency_overrides[get_db] = override_get_db

# Create test client
client = TestClient(app)

def test_user_registration():
    """Test user registration endpoint"""
    
    registration_data = {
        "email": "test@example.com",
        "username": "testuser",
        "password": "testpass123",
        "role": "writer",
        "display_name": "Test User"
    }
    
    response = client.post("/auth/register", json=registration_data)
    
    assert response.status_code == 201
    data = response.json()
    
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    assert data["expires_in"] == 900  # 15 minutes
    
    print("✓ User registration test passed")

def test_user_registration_duplicate_email():
    """Test registration with duplicate email"""
    
    # First registration
    registration_data = {
        "email": "duplicate@example.com",
        "username": "user1",
        "password": "testpass123",
        "role": "reader"
    }
    
    response1 = client.post("/auth/register", json=registration_data)
    assert response1.status_code == 201
    
    # Second registration with same email
    registration_data["username"] = "user2"
    response2 = client.post("/auth/register", json=registration_data)
    
    assert response2.status_code == 400
    assert "already registered" in response2.json()["detail"]
    
    print("✓ Duplicate email registration test passed")

def test_user_registration_duplicate_username():
    """Test registration with duplicate username"""
    
    # First registration
    registration_data = {
        "email": "user1@example.com",
        "username": "duplicateuser",
        "password": "testpass123",
        "role": "reader"
    }
    
    response1 = client.post("/auth/register", json=registration_data)
    assert response1.status_code == 201
    
    # Second registration with same username
    registration_data["email"] = "user2@example.com"
    response2 = client.post("/auth/register", json=registration_data)
    
    assert response2.status_code == 400
    assert "already taken" in response2.json()["detail"]
    
    print("✓ Duplicate username registration test passed")

def test_user_login():
    """Test user login endpoint"""
    
    # Register user first
    registration_data = {
        "email": "login@example.com",
        "username": "loginuser",
        "password": "loginpass123",
        "role": "writer"
    }
    
    client.post("/auth/register", json=registration_data)
    
    # Login
    login_data = {
        "email": "login@example.com",
        "password": "loginpass123"
    }
    
    response = client.post("/auth/login", json=login_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["token_type"] == "bearer"
    
    print("✓ User login test passed")

def test_user_login_invalid_credentials():
    """Test login with invalid credentials"""
    
    login_data = {
        "email": "nonexistent@example.com",
        "password": "wrongpassword"
    }
    
    response = client.post("/auth/login", json=login_data)
    
    assert response.status_code == 401
    assert "Invalid email or password" in response.json()["detail"]
    
    print("✓ Invalid credentials login test passed")

def test_token_refresh():
    """Test token refresh endpoint"""
    
    # Register and login user
    registration_data = {
        "email": "refresh@example.com",
        "username": "refreshuser",
        "password": "refreshpass123",
        "role": "reader"
    }
    
    reg_response = client.post("/auth/register", json=registration_data)
    tokens = reg_response.json()
    
    # Refresh token
    refresh_data = {
        "refresh_token": tokens["refresh_token"]
    }
    
    response = client.post("/auth/refresh", json=refresh_data)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "access_token" in data
    assert "refresh_token" in data
    assert data["access_token"] != tokens["access_token"]  # New token
    
    print("✓ Token refresh test passed")

def test_get_user_profile():
    """Test get user profile endpoint"""
    
    # Register user
    registration_data = {
        "email": "profile@example.com",
        "username": "profileuser",
        "password": "profilepass123",
        "role": "writer",
        "display_name": "Profile User"
    }
    
    reg_response = client.post("/auth/register", json=registration_data)
    tokens = reg_response.json()
    
    # Get profile
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.get("/auth/profile", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["email"] == "profile@example.com"
    assert data["username"] == "profileuser"
    assert data["role"] == "writer"
    assert data["display_name"] == "Profile User"
    
    print("✓ Get user profile test passed")

def test_update_user_profile():
    """Test update user profile endpoint"""
    
    # Register user
    registration_data = {
        "email": "update@example.com",
        "username": "updateuser",
        "password": "updatepass123",
        "role": "writer"
    }
    
    reg_response = client.post("/auth/register", json=registration_data)
    tokens = reg_response.json()
    
    # Update profile
    update_data = {
        "display_name": "Updated User",
        "bio": "This is my updated bio",
        "language_preference": "es"
    }
    
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.put("/auth/profile", json=update_data, headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert data["display_name"] == "Updated User"
    assert data["bio"] == "This is my updated bio"
    assert data["language_preference"] == "es"
    
    print("✓ Update user profile test passed")

def test_change_password():
    """Test change password endpoint"""
    
    # Register user
    registration_data = {
        "email": "changepass@example.com",
        "username": "changepassuser",
        "password": "oldpass123",
        "role": "reader"
    }
    
    reg_response = client.post("/auth/register", json=registration_data)
    tokens = reg_response.json()
    
    # Change password
    password_data = {
        "current_password": "oldpass123",
        "new_password": "newpass123"
    }
    
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.post("/auth/change-password", json=password_data, headers=headers)
    
    assert response.status_code == 200
    assert "successfully" in response.json()["message"]
    
    # Test login with new password
    login_data = {
        "email": "changepass@example.com",
        "password": "newpass123"
    }
    
    login_response = client.post("/auth/login", json=login_data)
    assert login_response.status_code == 200
    
    print("✓ Change password test passed")

def test_logout():
    """Test logout endpoint"""
    
    # Register user
    registration_data = {
        "email": "logout@example.com",
        "username": "logoutuser",
        "password": "logoutpass123",
        "role": "reader"
    }
    
    reg_response = client.post("/auth/register", json=registration_data)
    tokens = reg_response.json()
    
    # Logout
    logout_data = {
        "refresh_token": tokens["refresh_token"]
    }
    
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.post("/auth/logout", json=logout_data, headers=headers)
    
    assert response.status_code == 200
    assert "logged out" in response.json()["message"]
    
    print("✓ Logout test passed")

def test_get_user_sessions():
    """Test get user sessions endpoint"""
    
    # Register user
    registration_data = {
        "email": "sessions@example.com",
        "username": "sessionsuser",
        "password": "sessionspass123",
        "role": "writer"
    }
    
    reg_response = client.post("/auth/register", json=registration_data)
    tokens = reg_response.json()
    
    # Get sessions
    headers = {"Authorization": f"Bearer {tokens['access_token']}"}
    response = client.get("/auth/sessions", headers=headers)
    
    assert response.status_code == 200
    data = response.json()
    
    assert "sessions" in data
    assert "total" in data
    assert data["total"] >= 1  # At least the current session
    
    print("✓ Get user sessions test passed")

def test_password_validation():
    """Test password validation"""
    
    # Test weak password
    registration_data = {
        "email": "weak@example.com",
        "username": "weakuser",
        "password": "weak",  # Too short, no numbers
        "role": "reader"
    }
    
    response = client.post("/auth/register", json=registration_data)
    
    assert response.status_code == 422  # Validation error
    
    print("✓ Password validation test passed")

def test_username_validation():
    """Test username validation"""
    
    # Test invalid username with special characters
    registration_data = {
        "email": "invalid@example.com",
        "username": "invalid@user!",  # Invalid characters
        "password": "validpass123",
        "role": "reader"
    }
    
    response = client.post("/auth/register", json=registration_data)
    
    assert response.status_code == 422  # Validation error
    
    print("✓ Username validation test passed")

def test_unauthorized_access():
    """Test unauthorized access to protected endpoints"""
    
    # Try to access profile without token
    response = client.get("/auth/profile")
    
    assert response.status_code == 401
    
    # Try to access profile with invalid token
    headers = {"Authorization": "Bearer invalid_token"}
    response = client.get("/auth/profile", headers=headers)
    
    assert response.status_code == 401
    
    print("✓ Unauthorized access test passed")

if __name__ == "__main__":
    print("Running authentication API endpoint tests...")
    
    test_user_registration()
    test_user_registration_duplicate_email()
    test_user_registration_duplicate_username()
    test_user_login()
    test_user_login_invalid_credentials()
    test_token_refresh()
    test_get_user_profile()
    test_update_user_profile()
    test_change_password()
    test_logout()
    test_get_user_sessions()
    test_password_validation()
    test_username_validation()
    test_unauthorized_access()
    
    print("\n✅ All authentication API tests completed successfully!")