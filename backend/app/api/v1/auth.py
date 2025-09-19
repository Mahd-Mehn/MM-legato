from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.core.deps import get_current_user
from app.schemas.auth import UserRegister, UserLogin, Token, UserResponse, VaultPasswordSet
from app.services.auth_service import AuthService

router = APIRouter()

@router.post("/register", response_model=Token)
async def register(user_data: UserRegister, db: Session = Depends(get_db)):
    """Register a new user."""
    user = AuthService.register_user(db, user_data)
    access_token = AuthService.create_user_token(user)
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/login", response_model=Token)
async def login(user_data: UserLogin, db: Session = Depends(get_db)):
    """Login user and return access token."""
    user = AuthService.authenticate_user(db, user_data)
    access_token = AuthService.create_user_token(user)
    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me", response_model=UserResponse)
async def get_current_user_info(current_user = Depends(get_current_user)):
    """Get current user information."""
    return current_user

@router.post("/vault-password")
async def set_vault_password(
    vault_data: VaultPasswordSet,
    current_user = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Set vault password for current user."""
    AuthService.set_vault_password(db, current_user, vault_data.vault_password)
    return {"message": "Vault password set successfully"}