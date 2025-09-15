"""
JWT token utilities for authentication
"""
import os
from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any
from jose import JWTError, jwt
from models import UserRole
import secrets

# JWT Configuration
SECRET_KEY = os.getenv("JWT_SECRET_KEY", secrets.token_urlsafe(32))
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.getenv("ACCESS_TOKEN_EXPIRE_MINUTES", "15"))
REFRESH_TOKEN_EXPIRE_DAYS = int(os.getenv("REFRESH_TOKEN_EXPIRE_DAYS", "30"))

class JWTManager:
    """JWT token management class"""
    
    @staticmethod
    def create_access_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT access token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "access"
        })
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def create_refresh_token(data: Dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
        """Create JWT refresh token"""
        to_encode = data.copy()
        
        if expires_delta:
            expire = datetime.now(timezone.utc) + expires_delta
        else:
            expire = datetime.now(timezone.utc) + timedelta(days=REFRESH_TOKEN_EXPIRE_DAYS)
        
        to_encode.update({
            "exp": expire,
            "iat": datetime.now(timezone.utc),
            "type": "refresh",
            "jti": secrets.token_urlsafe(32)  # JWT ID for token rotation
        })
        
        encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
        return encoded_jwt
    
    @staticmethod
    def verify_token(token: str, token_type: str = "access") -> Optional[Dict[str, Any]]:
        """Verify and decode JWT token"""
        try:
            payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
            
            # Check token type
            if payload.get("type") != token_type:
                return None
            
            # Check expiration
            exp = payload.get("exp")
            if exp and datetime.fromtimestamp(exp, tz=timezone.utc) < datetime.now(timezone.utc):
                return None
            
            return payload
            
        except JWTError:
            return None
    
    @staticmethod
    def get_user_from_token(token: str) -> Optional[Dict[str, Any]]:
        """Extract user information from access token"""
        payload = JWTManager.verify_token(token, "access")
        if not payload:
            return None
        
        return {
            "user_id": payload.get("sub"),
            "username": payload.get("username"),
            "email": payload.get("email"),
            "role": payload.get("role"),
            "is_active": payload.get("is_active", True)
        }
    
    @staticmethod
    def create_token_pair(user_data: Dict[str, Any]) -> Dict[str, str]:
        """Create both access and refresh tokens"""
        access_token = JWTManager.create_access_token(user_data)
        refresh_token = JWTManager.create_refresh_token({"sub": user_data["sub"]})
        
        return {
            "access_token": access_token,
            "refresh_token": refresh_token,
            "token_type": "bearer"
        }

class RoleChecker:
    """Role-based access control utilities"""
    
    # Role hierarchy (higher number = more permissions)
    ROLE_HIERARCHY = {
        UserRole.READER: 1,
        UserRole.WRITER: 2,
        UserRole.STUDIO: 3,
        UserRole.ADMIN: 4
    }
    
    @staticmethod
    def has_permission(user_role: UserRole, required_role: UserRole) -> bool:
        """Check if user role has required permissions"""
        user_level = RoleChecker.ROLE_HIERARCHY.get(user_role, 0)
        required_level = RoleChecker.ROLE_HIERARCHY.get(required_role, 0)
        return user_level >= required_level
    
    @staticmethod
    def can_access_resource(user_role: UserRole, resource_owner_id: str, user_id: str) -> bool:
        """Check if user can access a specific resource"""
        # Admins can access everything
        if user_role == UserRole.ADMIN:
            return True
        
        # Users can access their own resources
        if resource_owner_id == user_id:
            return True
        
        # Studios can access writer resources (for licensing)
        if user_role == UserRole.STUDIO:
            return True
        
        return False
    
    @staticmethod
    def get_allowed_actions(user_role: UserRole) -> list:
        """Get list of allowed actions for a role"""
        actions = {
            UserRole.READER: [
                "read_content",
                "comment",
                "rate",
                "purchase_coins",
                "subscribe"
            ],
            UserRole.WRITER: [
                "read_content",
                "comment", 
                "rate",
                "purchase_coins",
                "subscribe",
                "create_content",
                "edit_content",
                "publish_content",
                "manage_monetization",
                "view_analytics"
            ],
            UserRole.STUDIO: [
                "read_content",
                "browse_marketplace",
                "license_content",
                "contact_writers",
                "manage_contracts"
            ],
            UserRole.ADMIN: [
                "all_actions",
                "manage_users",
                "moderate_content",
                "view_platform_analytics",
                "manage_payments",
                "system_administration"
            ]
        }
        
        return actions.get(user_role, [])

# Token validation utilities
def validate_token_format(token: str) -> bool:
    """Validate JWT token format"""
    if not token:
        return False
    
    # JWT tokens have 3 parts separated by dots
    parts = token.split('.')
    return len(parts) == 3

def extract_bearer_token(authorization_header: str) -> Optional[str]:
    """Extract token from Authorization header"""
    if not authorization_header:
        return None
    
    parts = authorization_header.split()
    if len(parts) != 2 or parts[0].lower() != "bearer":
        return None
    
    return parts[1]