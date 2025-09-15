"""
Test script for authentication models
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserProfile, UserSession, UserRole
from datetime import datetime, timedelta
import uuid

# Test database URL (use in-memory SQLite for testing)
TEST_DATABASE_URL = "sqlite:///:memory:"

def test_user_model():
    """Test User model functionality"""
    # Setup test database
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    
    try:
        # Test user creation
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("testpassword123"),
            role=UserRole.WRITER
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Test password verification
        assert user.verify_password("testpassword123") == True
        assert user.verify_password("wrongpassword") == False
        
        # Test user retrieval
        retrieved_user = db.query(User).filter(User.email == "test@example.com").first()
        assert retrieved_user is not None
        assert retrieved_user.username == "testuser"
        assert retrieved_user.role == UserRole.WRITER
        
        print("✓ User model tests passed")
        
        # Test user profile creation
        profile = UserProfile(
            user_id=user.id,
            display_name="Test User",
            bio="This is a test user",
            language_preference="en"
        )
        
        db.add(profile)
        db.commit()
        
        # Test relationship
        user_with_profile = db.query(User).filter(User.id == user.id).first()
        assert user_with_profile.profile is not None
        assert user_with_profile.profile.display_name == "Test User"
        
        print("✓ UserProfile model tests passed")
        
        # Test user session creation
        session = UserSession(
            user_id=user.id,
            refresh_token=str(uuid.uuid4()),
            device_info="Test Device",
            ip_address="127.0.0.1",
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        db.add(session)
        db.commit()
        
        # Test session functionality
        assert session.is_expired() == False
        
        # Test expired session
        expired_session = UserSession(
            user_id=user.id,
            refresh_token=str(uuid.uuid4()),
            device_info="Test Device",
            ip_address="127.0.0.1",
            expires_at=datetime.utcnow() - timedelta(days=1)
        )
        
        assert expired_session.is_expired() == True
        
        print("✓ UserSession model tests passed")
        
        # Test relationships
        user_with_sessions = db.query(User).filter(User.id == user.id).first()
        assert len(user_with_sessions.sessions) >= 1
        
        print("✓ All model tests passed successfully!")
        
    except Exception as e:
        print(f"✗ Test failed: {e}")
        raise e
    finally:
        db.close()

def test_password_hashing():
    """Test password hashing functionality"""
    password = "testpassword123"
    
    # Test hashing
    hashed1 = User.hash_password(password)
    hashed2 = User.hash_password(password)
    
    # Hashes should be different (salt)
    assert hashed1 != hashed2
    
    # But both should verify correctly
    user1 = User(hashed_password=hashed1)
    user2 = User(hashed_password=hashed2)
    
    assert user1.verify_password(password) == True
    assert user2.verify_password(password) == True
    assert user1.verify_password("wrongpassword") == False
    
    print("✓ Password hashing tests passed")

if __name__ == "__main__":
    print("Running authentication model tests...")
    test_password_hashing()
    test_user_model()
    print("\n✓ All tests completed successfully!")