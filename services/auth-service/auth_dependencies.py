"""
Authentication dependencies for FastAPI
"""
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from typing import Optional
from database import get_db
from models import User, UserSession, UserRole
from jwt_utils import JWTManager, RoleChecker, extract_bearer_token
import redis
import os

# Security scheme
security = HTTPBearer()

# Redis client for token blacklisting
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

class AuthenticationError(HTTPException):
    """Custom authentication error"""
    def __init__(self, detail: str = "Authentication failed"):
        super().__init__(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=detail,
            headers={"WWW-Authenticate": "Bearer"}
        )

class AuthorizationError(HTTPException):
    """Custom authorization error"""
    def __init__(self, detail: str = "Insufficient permissions"):
        super().__init__(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=detail
        )

async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current authenticated user from JWT token"""
    
    token = credentials.credentials
    
    # Check if token is blacklisted
    if redis_client.get(f"blacklist:{token}"):
        raise AuthenticationError("Token has been revoked")
    
    # Verify token
    user_data = JWTManager.get_user_from_token(token)
    if not user_data:
        raise AuthenticationError("Invalid or expired token")
    
    # Get user from database
    user = db.query(User).filter(User.id == user_data["user_id"]).first()
    if not user:
        raise AuthenticationError("User not found")
    
    # Check if user is active
    if not user.is_active:
        raise AuthenticationError("Account is deactivated")
    
    return user

async def get_current_active_user(
    current_user: User = Depends(get_current_user)
) -> User:
    """Get current active user (alias for clarity)"""
    return current_user

def require_role(required_role: UserRole):
    """Dependency factory for role-based access control"""
    def role_checker(current_user: User = Depends(get_current_user)) -> User:
        if not RoleChecker.has_permission(current_user.role, required_role):
            raise AuthorizationError(
                f"Access denied. Required role: {required_role.value}, "
                f"current role: {current_user.role.value}"
            )
        return current_user
    
    return role_checker

def require_writer_or_admin():
    """Require writer role or higher"""
    return require_role(UserRole.WRITER)

def require_studio_or_admin():
    """Require studio role or higher"""
    return require_role(UserRole.STUDIO)

def require_admin():
    """Require admin role"""
    return require_role(UserRole.ADMIN)

async def get_optional_user(
    authorization: Optional[str] = None,
    db: Session = Depends(get_db)
) -> Optional[User]:
    """Get user from token if provided (for optional authentication)"""
    if not authorization:
        return None
    
    try:
        token = extract_bearer_token(authorization)
        if not token:
            return None
        
        # Check if token is blacklisted
        if redis_client.get(f"blacklist:{token}"):
            return None
        
        # Verify token
        user_data = JWTManager.get_user_from_token(token)
        if not user_data:
            return None
        
        # Get user from database
        user = db.query(User).filter(User.id == user_data["user_id"]).first()
        if not user or not user.is_active:
            return None
        
        return user
        
    except Exception:
        return None

class SessionManager:
    """Manage user sessions and refresh tokens"""
    
    @staticmethod
    def create_session(
        user_id: str,
        refresh_token: str,
        device_info: str,
        ip_address: str,
        db: Session
    ) -> UserSession:
        """Create new user session"""
        from datetime import datetime, timedelta, timezone
        import uuid
        
        # Convert user_id to UUID if it's a string
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        
        session = UserSession(
            user_id=user_id,
            refresh_token=refresh_token,
            device_info=device_info,
            ip_address=ip_address,
            expires_at=datetime.now(timezone.utc) + timedelta(days=30)
        )
        
        db.add(session)
        db.commit()
        db.refresh(session)
        
        return session
    
    @staticmethod
    def validate_refresh_token(refresh_token: str, db: Session) -> Optional[UserSession]:
        """Validate refresh token and return session"""
        session = db.query(UserSession).filter(
            UserSession.refresh_token == refresh_token,
            UserSession.is_active == True
        ).first()
        
        if not session or session.is_expired():
            return None
        
        # Update last used timestamp
        from datetime import datetime, timezone
        session.last_used_at = datetime.now(timezone.utc)
        db.commit()
        
        return session
    
    @staticmethod
    def revoke_session(session_id: str, db: Session) -> bool:
        """Revoke a user session"""
        import uuid
        
        # Convert session_id to UUID if it's a string
        if isinstance(session_id, str):
            session_id = uuid.UUID(session_id)
        
        session = db.query(UserSession).filter(UserSession.id == session_id).first()
        if session:
            session.is_active = False
            db.commit()
            return True
        return False
    
    @staticmethod
    def revoke_all_user_sessions(user_id: str, db: Session) -> int:
        """Revoke all sessions for a user"""
        import uuid
        
        # Convert user_id to UUID if it's a string
        if isinstance(user_id, str):
            user_id = uuid.UUID(user_id)
        
        count = db.query(UserSession).filter(
            UserSession.user_id == user_id,
            UserSession.is_active == True
        ).update({"is_active": False})
        
        db.commit()
        return count
    
    @staticmethod
    def cleanup_expired_sessions(db: Session) -> int:
        """Clean up expired sessions"""
        from datetime import datetime, timezone
        
        count = db.query(UserSession).filter(
            UserSession.expires_at < datetime.now(timezone.utc),
            UserSession.is_active == True
        ).update({"is_active": False})
        
        db.commit()
        return count

def blacklist_token(token: str, expiry_seconds: int = 3600):
    """Add token to blacklist"""
    redis_client.setex(f"blacklist:{token}", expiry_seconds, "1")

def is_token_blacklisted(token: str) -> bool:
    """Check if token is blacklisted"""
    return bool(redis_client.get(f"blacklist:{token}"))