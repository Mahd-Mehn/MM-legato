from typing import Generator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.services.auth_service import AuthService

security = HTTPBearer()

def get_current_user(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(security)
) -> User:
    """Get current authenticated user."""
    token = credentials.credentials
    payload = verify_token(token)
    
    email: str = payload.get("sub")
    if email is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user = AuthService.get_user_by_email(db, email=email)
    if user is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

def get_current_writer(current_user: User = Depends(get_current_user)) -> User:
    """Get current user and verify they are a writer."""
    if not current_user.is_writer:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Writer access required"
        )
    return current_user

def get_current_user_optional(
    db: Session = Depends(get_db),
    credentials: HTTPAuthorizationCredentials = Depends(HTTPBearer(auto_error=False))
) -> User | None:
    """Get current authenticated user, or None if not authenticated."""
    if not credentials:
        return None
    
    try:
        token = credentials.credentials
        payload = verify_token(token)
        
        email: str = payload.get("sub")
        if email is None:
            return None
        
        user = AuthService.get_user_by_email(db, email=email)
        return user
    except:
        return None