"""
Authentication API routes
"""
from fastapi import APIRouter, Depends, HTTPException, status, Request
from fastapi.security import HTTPBearer
from sqlalchemy.orm import Session
from database import get_db
from models import User, UserProfile, UserSession, UserRole
from schemas import (
    UserRegistrationRequest, UserLoginRequest, TokenResponse, AuthResponse,
    RefreshTokenRequest, PasswordResetRequest, PasswordResetConfirm,
    UserProfileResponse, UserProfileUpdateRequest, ChangePasswordRequest,
    ErrorResponse, SuccessResponse, UserSessionsResponse, SessionInfo,
    validate_username_availability, validate_email_availability
)
from jwt_utils import JWTManager
from auth_dependencies import (
    get_current_user, get_current_active_user, SessionManager,
    blacklist_token, AuthenticationError, AuthorizationError
)
import secrets
import redis
import os
import re
from datetime import datetime, timedelta, timezone
from typing import Optional

router = APIRouter(prefix="/auth", tags=["authentication"])
security = HTTPBearer()

# Redis client for password reset tokens
redis_client = redis.from_url(os.getenv("REDIS_URL", "redis://localhost:6379/0"))

@router.post("/register", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
async def register_user(
    user_data: UserRegistrationRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Register a new user"""
    
    # Check if email is already registered
    if not validate_email_availability(user_data.email, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email address is already registered"
        )
    
    # Check if username is already taken
    if not validate_username_availability(user_data.username, db):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username is already taken"
        )
    
    try:
        # Create user
        user = User(
            email=user_data.email.lower(),
            username=user_data.username.lower(),
            hashed_password=User.hash_password(user_data.password),
            role=user_data.role,
            is_active=True,
            is_verified=False  # Email verification required
        )
        
        db.add(user)
        db.commit()
        db.refresh(user)
        
        # Create user profile
        profile = UserProfile(
            user_id=user.id,
            display_name=user_data.display_name or user_data.username,
            language_preference="en"
        )
        
        db.add(profile)
        db.commit()
        db.refresh(user)  # Refresh to get the profile relationship
        
        # Generate JWT tokens
        token_data = {
            "sub": str(user.id),
            "username": user.username,
            "email": user.email,
            "role": user.role.value,
            "is_active": user.is_active
        }
        
        token_pair = JWTManager.create_token_pair(token_data)
        
        # Create session
        device_info = request.headers.get("User-Agent", "Unknown Device")
        ip_address = request.client.host if request.client else "Unknown"
        
        SessionManager.create_session(
            user_id=str(user.id),
            refresh_token=token_pair["refresh_token"],
            device_info=device_info,
            ip_address=ip_address,
            db=db
        )
        
        # Create user profile response
        user_profile = UserProfileResponse(
            id=str(user.id),
            email=user.email,
            username=user.username,
            role=user.role,
            display_name=user.profile.display_name if user.profile else user.username,
            bio=user.profile.bio if user.profile else None,
            avatar_url=user.profile.avatar_url if user.profile else None,
            language_preference=user.profile.language_preference if user.profile else "en",
            is_active=user.is_active,
            is_verified=user.is_verified,
            created_at=user.created_at
        )
        
        # Create token response
        tokens = TokenResponse(
            access_token=token_pair["access_token"],
            refresh_token=token_pair["refresh_token"],
            token_type="bearer",
            expires_in=15 * 60  # 15 minutes
        )
        
        return AuthResponse(
            user=user_profile,
            tokens=tokens,
            is_first_login=True
        )
        
    except Exception as e:
        db.rollback()
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Registration failed: {str(e)}"
        )

@router.post("/login", response_model=AuthResponse)
async def login_user(
    login_data: UserLoginRequest,
    request: Request,
    db: Session = Depends(get_db)
):
    """Authenticate user and return tokens"""
    
    # Find user by email
    user = db.query(User).filter(User.email == login_data.email.lower()).first()
    
    if not user or not user.verify_password(login_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Account is deactivated"
        )
    
    # Generate JWT tokens
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active
    }
    
    token_pair = JWTManager.create_token_pair(token_data)
    
    # Create session
    device_info = login_data.device_info or request.headers.get("User-Agent", "Unknown Device")
    ip_address = request.client.host if request.client else "Unknown"
    
    SessionManager.create_session(
        user_id=str(user.id),
        refresh_token=token_pair["refresh_token"],
        device_info=device_info,
        ip_address=ip_address,
        db=db
    )
    
    # Create user profile response
    user_profile = UserProfileResponse(
        id=str(user.id),
        email=user.email,
        username=user.username,
        role=user.role,
        display_name=user.profile.display_name if user.profile else user.username,
        bio=user.profile.bio if user.profile else None,
        avatar_url=user.profile.avatar_url if user.profile else None,
        language_preference=user.profile.language_preference if user.profile else "en",
        is_active=user.is_active,
        is_verified=user.is_verified,
        created_at=user.created_at
    )
    
    # Create token response
    tokens = TokenResponse(
        access_token=token_pair["access_token"],
        refresh_token=token_pair["refresh_token"],
        token_type="bearer",
        expires_in=15 * 60  # 15 minutes
    )
    
    return AuthResponse(
        user=user_profile,
        tokens=tokens,
        is_first_login=False
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(
    refresh_data: RefreshTokenRequest,
    db: Session = Depends(get_db)
):
    """Refresh access token using refresh token"""
    
    # Validate refresh token
    session = SessionManager.validate_refresh_token(refresh_data.refresh_token, db)
    if not session:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired refresh token"
        )
    
    # Get user
    user = db.query(User).filter(User.id == session.user_id).first()
    if not user or not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found or inactive"
        )
    
    # Generate new token pair
    token_data = {
        "sub": str(user.id),
        "username": user.username,
        "email": user.email,
        "role": user.role.value,
        "is_active": user.is_active
    }
    
    new_token_pair = JWTManager.create_token_pair(token_data)
    
    # Update session with new refresh token (token rotation)
    session.refresh_token = new_token_pair["refresh_token"]
    session.last_used_at = datetime.now(timezone.utc)
    db.commit()
    
    return TokenResponse(
        access_token=new_token_pair["access_token"],
        refresh_token=new_token_pair["refresh_token"],
        token_type="bearer",
        expires_in=15 * 60  # 15 minutes
    )

@router.post("/logout", response_model=SuccessResponse)
async def logout_user(
    refresh_data: RefreshTokenRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout user and revoke session"""
    
    # Find and revoke session
    session = db.query(UserSession).filter(
        UserSession.refresh_token == refresh_data.refresh_token,
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).first()
    
    if session:
        session.is_active = False
        db.commit()
    
    return SuccessResponse(
        message="Successfully logged out"
    )

@router.post("/logout-all", response_model=SuccessResponse)
async def logout_all_sessions(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Logout from all sessions"""
    
    count = SessionManager.revoke_all_user_sessions(str(current_user.id), db)
    
    return SuccessResponse(
        message=f"Successfully logged out from {count} sessions"
    )

@router.get("/me", response_model=UserProfileResponse)
async def get_current_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current authenticated user profile"""
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        display_name=current_user.profile.display_name if current_user.profile else None,
        bio=current_user.profile.bio if current_user.profile else None,
        avatar_url=current_user.profile.avatar_url if current_user.profile else None,
        language_preference=current_user.profile.language_preference if current_user.profile else "en",
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )

@router.get("/profile", response_model=UserProfileResponse)
async def get_user_profile(
    current_user: User = Depends(get_current_active_user)
):
    """Get current user profile (alias for /me)"""
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        display_name=current_user.profile.display_name if current_user.profile else None,
        bio=current_user.profile.bio if current_user.profile else None,
        avatar_url=current_user.profile.avatar_url if current_user.profile else None,
        language_preference=current_user.profile.language_preference if current_user.profile else "en",
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )

@router.put("/profile", response_model=UserProfileResponse)
async def update_user_profile(
    profile_data: UserProfileUpdateRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Update user profile"""
    
    # Get or create profile
    profile = current_user.profile
    if not profile:
        profile = UserProfile(user_id=current_user.id)
        db.add(profile)
    
    # Update profile fields
    if profile_data.display_name is not None:
        profile.display_name = profile_data.display_name
    if profile_data.bio is not None:
        profile.bio = profile_data.bio
    if profile_data.avatar_url is not None:
        profile.avatar_url = profile_data.avatar_url
    if profile_data.language_preference is not None:
        profile.language_preference = profile_data.language_preference
    
    db.commit()
    db.refresh(current_user)
    
    return UserProfileResponse(
        id=str(current_user.id),
        email=current_user.email,
        username=current_user.username,
        role=current_user.role,
        display_name=profile.display_name,
        bio=profile.bio,
        avatar_url=profile.avatar_url,
        language_preference=profile.language_preference,
        is_active=current_user.is_active,
        is_verified=current_user.is_verified,
        created_at=current_user.created_at
    )

@router.post("/change-password", response_model=SuccessResponse)
async def change_password(
    password_data: ChangePasswordRequest,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Change user password"""
    
    # Verify current password
    if not current_user.verify_password(password_data.current_password):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Current password is incorrect"
        )
    
    # Update password
    current_user.hashed_password = User.hash_password(password_data.new_password)
    db.commit()
    
    # Revoke all sessions except current one (force re-login)
    SessionManager.revoke_all_user_sessions(str(current_user.id), db)
    
    return SuccessResponse(
        message="Password changed successfully. Please log in again."
    )

@router.post("/reset-password", response_model=SuccessResponse)
async def request_password_reset(
    reset_data: PasswordResetRequest,
    db: Session = Depends(get_db)
):
    """Request password reset"""
    
    # Find user by email
    user = db.query(User).filter(User.email == reset_data.email.lower()).first()
    
    # Always return success to prevent email enumeration
    if user and user.is_active:
        # Generate reset token
        reset_token = secrets.token_urlsafe(32)
        
        # Store token in Redis with 1 hour expiration
        redis_client.setex(
            f"password_reset:{reset_token}",
            3600,  # 1 hour
            str(user.id)
        )
        
        # In a real application, send email here
        # For now, we'll just log the token (remove in production)
        print(f"Password reset token for {user.email}: {reset_token}")
    
    return SuccessResponse(
        message="If the email exists, a password reset link has been sent"
    )

@router.post("/reset-password/confirm", response_model=SuccessResponse)
async def confirm_password_reset(
    reset_data: PasswordResetConfirm,
    db: Session = Depends(get_db)
):
    """Confirm password reset with token"""
    
    # Validate reset token
    user_id = redis_client.get(f"password_reset:{reset_data.token}")
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )
    
    # Get user
    user = db.query(User).filter(User.id == user_id.decode()).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User not found"
        )
    
    # Update password
    user.hashed_password = User.hash_password(reset_data.new_password)
    db.commit()
    
    # Delete reset token
    redis_client.delete(f"password_reset:{reset_data.token}")
    
    # Revoke all user sessions
    SessionManager.revoke_all_user_sessions(str(user.id), db)
    
    return SuccessResponse(
        message="Password reset successfully. Please log in with your new password."
    )

@router.get("/sessions", response_model=UserSessionsResponse)
async def get_user_sessions(
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Get user's active sessions"""
    
    sessions = db.query(UserSession).filter(
        UserSession.user_id == current_user.id,
        UserSession.is_active == True
    ).order_by(UserSession.last_used_at.desc()).all()
    
    session_info = [
        SessionInfo(
            id=str(session.id),
            device_info=session.device_info,
            ip_address=session.ip_address,
            created_at=session.created_at,
            last_used_at=session.last_used_at,
            is_active=session.is_active
        )
        for session in sessions
    ]
    
    return UserSessionsResponse(
        sessions=session_info,
        total=len(session_info)
    )

@router.delete("/sessions/{session_id}", response_model=SuccessResponse)
async def revoke_session(
    session_id: str,
    current_user: User = Depends(get_current_active_user),
    db: Session = Depends(get_db)
):
    """Revoke a specific session"""
    
    # Verify session belongs to current user
    session = db.query(UserSession).filter(
        UserSession.id == session_id,
        UserSession.user_id == current_user.id
    ).first()
    
    if not session:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Session not found"
        )
    
    # Revoke session
    success = SessionManager.revoke_session(session_id, db)
    
    if success:
        return SuccessResponse(message="Session revoked successfully")
    else:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to revoke session"
        )

@router.get("/check-username")
async def check_username_availability(
    username: str,
    db: Session = Depends(get_db)
):
    """Check if username is available"""
    
    if not username or len(username.strip()) < 3:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username must be at least 3 characters long"
        )
    
    username = username.strip().lower()
    
    # Validate username format
    if not re.match(r'^[a-zA-Z0-9_-]+$', username):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Username can only contain letters, numbers, underscores, and hyphens"
        )
    
    available = validate_username_availability(username, db)
    
    return {
        "success": True,
        "available": available,
        "username": username
    }

@router.get("/check-email")
async def check_email_availability(
    email: str,
    db: Session = Depends(get_db)
):
    """Check if email is available"""
    
    if not email or not email.strip():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )
    
    email = email.strip().lower()
    
    # Basic email format validation
    if not re.match(r'^[^\s@]+@[^\s@]+\.[^\s@]+$', email):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid email format"
        )
    
    available = validate_email_availability(email, db)
    
    return {
        "success": True,
        "available": available,
        "email": email
    }