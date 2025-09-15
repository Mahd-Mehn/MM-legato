"""
Unit tests for authentication dependencies
"""
import pytest
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from models import Base, User, UserSession, UserRole
from auth_dependencies import SessionManager
from jwt_utils import JWTManager
from datetime import datetime, timedelta, timezone
import uuid

# Test database URL
TEST_DATABASE_URL = "sqlite:///:memory:"

def setup_test_db():
    """Setup test database"""
    engine = create_engine(TEST_DATABASE_URL)
    Base.metadata.create_all(bind=engine)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    return SessionLocal()

def test_session_manager_create_session():
    """Test session creation"""
    db = setup_test_db()
    
    try:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("password123"),
            role=UserRole.WRITER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create session
        refresh_token = str(uuid.uuid4())
        session = SessionManager.create_session(
            user_id=str(user.id),
            refresh_token=refresh_token,
            device_info="Test Device",
            ip_address="127.0.0.1",
            db=db
        )
        
        assert session is not None
        assert session.user_id == user.id
        assert session.refresh_token == refresh_token
        assert session.is_active == True
        assert not session.is_expired()
        
        print("✓ Session creation tests passed")
        
    finally:
        db.close()

def test_session_manager_validate_refresh_token():
    """Test refresh token validation"""
    db = setup_test_db()
    
    try:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("password123"),
            role=UserRole.WRITER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create session
        refresh_token = str(uuid.uuid4())
        session = SessionManager.create_session(
            user_id=str(user.id),
            refresh_token=refresh_token,
            device_info="Test Device",
            ip_address="127.0.0.1",
            db=db
        )
        
        # Validate token
        validated_session = SessionManager.validate_refresh_token(refresh_token, db)
        assert validated_session is not None
        assert validated_session.id == session.id
        
        # Test invalid token
        invalid_session = SessionManager.validate_refresh_token("invalid-token", db)
        assert invalid_session is None
        
        print("✓ Refresh token validation tests passed")
        
    finally:
        db.close()

def test_session_manager_revoke_session():
    """Test session revocation"""
    db = setup_test_db()
    
    try:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("password123"),
            role=UserRole.WRITER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create session
        refresh_token = str(uuid.uuid4())
        session = SessionManager.create_session(
            user_id=str(user.id),
            refresh_token=refresh_token,
            device_info="Test Device",
            ip_address="127.0.0.1",
            db=db
        )
        
        # Revoke session
        success = SessionManager.revoke_session(str(session.id), db)
        assert success == True
        
        # Check session is inactive
        db.refresh(session)
        assert session.is_active == False
        
        # Test revoking non-existent session
        fake_id = str(uuid.uuid4())
        success = SessionManager.revoke_session(fake_id, db)
        assert success == False
        
        print("✓ Session revocation tests passed")
        
    finally:
        db.close()

def test_session_manager_revoke_all_user_sessions():
    """Test revoking all user sessions"""
    db = setup_test_db()
    
    try:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("password123"),
            role=UserRole.WRITER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create multiple sessions
        sessions = []
        for i in range(3):
            refresh_token = str(uuid.uuid4())
            session = SessionManager.create_session(
                user_id=str(user.id),
                refresh_token=refresh_token,
                device_info=f"Device {i}",
                ip_address="127.0.0.1",
                db=db
            )
            sessions.append(session)
        
        # Revoke all sessions
        count = SessionManager.revoke_all_user_sessions(str(user.id), db)
        assert count == 3
        
        # Check all sessions are inactive
        for session in sessions:
            db.refresh(session)
            assert session.is_active == False
        
        print("✓ Revoke all user sessions tests passed")
        
    finally:
        db.close()

def test_session_manager_cleanup_expired_sessions():
    """Test cleanup of expired sessions"""
    db = setup_test_db()
    
    try:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("password123"),
            role=UserRole.WRITER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create expired session manually
        expired_session = UserSession(
            user_id=user.id,
            refresh_token=str(uuid.uuid4()),
            device_info="Expired Device",
            ip_address="127.0.0.1",
            expires_at=datetime.now(timezone.utc) - timedelta(days=1),  # Expired
            is_active=True
        )
        db.add(expired_session)
        
        # Create active session
        active_session = UserSession(
            user_id=user.id,
            refresh_token=str(uuid.uuid4()),
            device_info="Active Device",
            ip_address="127.0.0.1",
            expires_at=datetime.now(timezone.utc) + timedelta(days=30),  # Active
            is_active=True
        )
        db.add(active_session)
        db.commit()
        
        # Cleanup expired sessions
        count = SessionManager.cleanup_expired_sessions(db)
        assert count == 1
        
        # Check expired session is inactive
        db.refresh(expired_session)
        assert expired_session.is_active == False
        
        # Check active session is still active
        db.refresh(active_session)
        assert active_session.is_active == True
        
        print("✓ Expired session cleanup tests passed")
        
    finally:
        db.close()

def test_jwt_integration_with_session():
    """Test JWT integration with session management"""
    db = setup_test_db()
    
    try:
        # Create test user
        user = User(
            email="test@example.com",
            username="testuser",
            hashed_password=User.hash_password("password123"),
            role=UserRole.WRITER
        )
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create JWT tokens
        user_data = {
            "sub": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role.value
        }
        
        token_pair = JWTManager.create_token_pair(user_data)
        
        # Create session with refresh token
        session = SessionManager.create_session(
            user_id=str(user.id),
            refresh_token=token_pair["refresh_token"],
            device_info="Test Device",
            ip_address="127.0.0.1",
            db=db
        )
        
        # Validate access token
        access_payload = JWTManager.verify_token(token_pair["access_token"], "access")
        assert access_payload is not None
        assert access_payload["sub"] == str(user.id)
        
        # Validate refresh token through session
        validated_session = SessionManager.validate_refresh_token(
            token_pair["refresh_token"], db
        )
        assert validated_session is not None
        assert validated_session.id == session.id
        
        print("✓ JWT integration with session tests passed")
        
    finally:
        db.close()

if __name__ == "__main__":
    print("Running authentication dependencies tests...")
    
    test_session_manager_create_session()
    test_session_manager_validate_refresh_token()
    test_session_manager_revoke_session()
    test_session_manager_revoke_all_user_sessions()
    test_session_manager_cleanup_expired_sessions()
    test_jwt_integration_with_session()
    
    print("\n✅ All authentication dependency tests completed successfully!")