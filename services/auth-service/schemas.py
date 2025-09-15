"""
Pydantic schemas for authentication API
"""
from pydantic import BaseModel, EmailStr, Field, validator
from typing import Optional
from models import UserRole, User
from datetime import datetime
from sqlalchemy.orm import Session
import re

class UserRegistrationRequest(BaseModel):
    """User registration request schema"""
    email: EmailStr = Field(..., description="User email address")
    username: str = Field(..., min_length=3, max_length=50, description="Unique username")
    password: str = Field(..., min_length=8, max_length=128, description="User password")
    role: UserRole = Field(default=UserRole.READER, description="User role")
    display_name: Optional[str] = Field(None, max_length=150, description="Display name")
    
    @validator('username')
    def validate_username(cls, v):
        """Validate username format"""
        if not re.match(r'^[a-zA-Z0-9_-]+$', v):
            raise ValueError('Username can only contain letters, numbers, underscores, and hyphens')
        return v.lower()
    
    @validator('password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserLoginRequest(BaseModel):
    """User login request schema"""
    email: EmailStr = Field(..., description="User email address")
    password: str = Field(..., description="User password")
    device_info: Optional[str] = Field(None, max_length=500, description="Device information")

class TokenResponse(BaseModel):
    """Token response schema"""
    access_token: str = Field(..., description="JWT access token")
    refresh_token: str = Field(..., description="JWT refresh token")
    token_type: str = Field(default="bearer", description="Token type")
    expires_in: int = Field(..., description="Token expiration in seconds")

class AuthResponse(BaseModel):
    """Authentication response schema with user data and tokens"""
    user: 'UserProfileResponse' = Field(..., description="User profile data")
    tokens: TokenResponse = Field(..., description="Authentication tokens")
    is_first_login: bool = Field(default=False, description="Whether this is the user's first login")

class RefreshTokenRequest(BaseModel):
    """Refresh token request schema"""
    refresh_token: str = Field(..., description="JWT refresh token")

class PasswordResetRequest(BaseModel):
    """Password reset request schema"""
    email: EmailStr = Field(..., description="User email address")

class PasswordResetConfirm(BaseModel):
    """Password reset confirmation schema"""
    token: str = Field(..., description="Password reset token")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class UserProfileResponse(BaseModel):
    """User profile response schema"""
    id: str = Field(..., description="User ID")
    email: str = Field(..., description="User email")
    username: str = Field(..., description="Username")
    role: UserRole = Field(..., description="User role")
    display_name: Optional[str] = Field(None, description="Display name")
    bio: Optional[str] = Field(None, description="User biography")
    avatar_url: Optional[str] = Field(None, description="Avatar URL")
    language_preference: str = Field(default="en", description="Language preference")
    is_active: bool = Field(..., description="Account status")
    is_verified: bool = Field(..., description="Email verification status")
    created_at: datetime = Field(..., description="Account creation date")
    
    class Config:
        from_attributes = True

class UserProfileUpdateRequest(BaseModel):
    """User profile update request schema"""
    display_name: Optional[str] = Field(None, max_length=150, description="Display name")
    bio: Optional[str] = Field(None, max_length=1000, description="User biography")
    avatar_url: Optional[str] = Field(None, max_length=500, description="Avatar URL")
    language_preference: Optional[str] = Field(None, max_length=10, description="Language preference")
    
    @validator('avatar_url')
    def validate_avatar_url(cls, v):
        """Validate avatar URL format"""
        if v and not re.match(r'^https?://', v):
            raise ValueError('Avatar URL must be a valid HTTP/HTTPS URL')
        return v

class ChangePasswordRequest(BaseModel):
    """Change password request schema"""
    current_password: str = Field(..., description="Current password")
    new_password: str = Field(..., min_length=8, max_length=128, description="New password")
    
    @validator('new_password')
    def validate_password(cls, v):
        """Validate password strength"""
        if len(v) < 8:
            raise ValueError('Password must be at least 8 characters long')
        if not re.search(r'[A-Za-z]', v):
            raise ValueError('Password must contain at least one letter')
        if not re.search(r'\d', v):
            raise ValueError('Password must contain at least one number')
        return v

class ErrorResponse(BaseModel):
    """Error response schema"""
    error: str = Field(..., description="Error type")
    message: str = Field(..., description="Error message")
    details: Optional[dict] = Field(None, description="Additional error details")

class SuccessResponse(BaseModel):
    """Success response schema"""
    success: bool = Field(default=True, description="Success status")
    message: str = Field(..., description="Success message")
    data: Optional[dict] = Field(None, description="Additional data")

class SessionInfo(BaseModel):
    """Session information schema"""
    id: str = Field(..., description="Session ID")
    device_info: Optional[str] = Field(None, description="Device information")
    ip_address: Optional[str] = Field(None, description="IP address")
    created_at: datetime = Field(..., description="Session creation date")
    last_used_at: datetime = Field(..., description="Last used date")
    is_active: bool = Field(..., description="Session status")
    
    class Config:
        from_attributes = True

class UserSessionsResponse(BaseModel):
    """User sessions response schema"""
    sessions: list[SessionInfo] = Field(..., description="List of user sessions")
    total: int = Field(..., description="Total number of sessions")

# Validation utilities
def validate_email_format(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username_availability(username: str, db) -> bool:
    """Check if username is available"""
    from models import User
    existing_user = db.query(User).filter(User.username == username.lower()).first()
    return existing_user is None

def validate_email_availability(email: str, db) -> bool:
    """Check if email is available"""
    from models import User
    existing_user = db.query(User).filter(User.email == email.lower()).first()
    return existing_user is None

# Validation utilities
def validate_email_format(email: str) -> bool:
    """Validate email format"""
    pattern = r'^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$'
    return bool(re.match(pattern, email))

def validate_username_availability(username: str, db: Session) -> bool:
    """Check if username is available"""
    existing_user = db.query(User).filter(User.username == username.lower()).first()
    return existing_user is None

def validate_email_availability(email: str, db: Session) -> bool:
    """Check if email is available"""
    existing_user = db.query(User).filter(User.email == email.lower()).first()
    return existing_user is None