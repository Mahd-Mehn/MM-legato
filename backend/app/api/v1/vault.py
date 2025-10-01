from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timedelta
from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.vault import (
    VaultPasswordVerify, 
    VaultAccessResponse, 
    VaultBooksResponse, 
    MoveBookToVaultRequest,
    VaultStatusResponse
)
from app.services.vault_service import VaultService

router = APIRouter()

# In-memory session storage for vault access (in production, use Redis)
vault_sessions = {}

def create_vault_session(user_id: str) -> str:
    """Create a vault session that expires in 30 minutes"""
    # Clean up any existing sessions for this user first
    sessions_to_remove = []
    for sid, session in vault_sessions.items():
        if session["user_id"] == user_id:
            sessions_to_remove.append(sid)
    
    for sid in sessions_to_remove:
        del vault_sessions[sid]
    
    # Create new session
    session_id = f"vault_{user_id}_{int(datetime.utcnow().timestamp())}"
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    vault_sessions[session_id] = {
        "user_id": user_id,
        "expires_at": expires_at
    }
    print(f"Created vault session {session_id} for user {user_id}, expires at {expires_at}")
    return session_id

def verify_vault_session(session_id: str, user_id: str) -> bool:
    """Verify if vault session is valid and not expired"""
    print(f"Verifying vault session {session_id} for user {user_id}")
    print(f"Available sessions: {list(vault_sessions.keys())}")
    
    if not session_id or session_id not in vault_sessions:
        print(f"Session {session_id} not found in vault_sessions")
        return False
    
    session = vault_sessions[session_id]
    if session["user_id"] != user_id:
        print(f"User ID mismatch: session has {session['user_id']}, expected {user_id}")
        return False
    
    current_time = datetime.utcnow()
    if current_time > session["expires_at"]:
        print(f"Session expired: current time {current_time}, expires at {session['expires_at']}")
        # Clean up expired session
        del vault_sessions[session_id]
        return False
    
    print(f"Session {session_id} is valid, expires at {session['expires_at']}")
    return True

def get_vault_session_from_request(request: Request) -> str:
    """Extract vault session from request headers"""
    session_id = request.headers.get("X-Vault-Session", "")
    print(f"Extracted session ID from request: '{session_id}'")
    return session_id

@router.get("/status", response_model=VaultStatusResponse)
async def get_vault_status(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Check if user has vault password set"""
    vault_service = VaultService(db)
    has_password = vault_service.has_vault_password(current_user)
    
    return VaultStatusResponse(
        success=True,
        message="Vault status retrieved",
        has_vault_password=has_password
    )

@router.post("/verify", response_model=VaultAccessResponse)
async def verify_vault_password(
    password_data: VaultPasswordVerify,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Verify vault password and create session"""
    vault_service = VaultService(db)
    
    if not vault_service.has_vault_password(current_user):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Vault password not set"
        )
    
    if not vault_service.verify_vault_password(current_user, password_data.password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid vault password"
        )
    
    # Create vault session
    session_id = create_vault_session(current_user.id)
    expires_at = datetime.utcnow() + timedelta(minutes=30)
    
    # Return session ID in response for client to store
    return {
        "success": True,
        "message": "Vault access granted",
        "session_expires_at": expires_at.isoformat(),
        "session_id": session_id
    }

@router.get("/books", response_model=VaultBooksResponse)
async def get_vault_books(
    request: Request,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get all books in user's vault (requires active vault session)"""
    session_id = get_vault_session_from_request(request)
    
    if not verify_vault_session(session_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired vault session"
        )
    
    vault_service = VaultService(db)
    books = vault_service.get_vault_books(current_user.id)
    
    return VaultBooksResponse(
        books=books,
        total_count=len(books)
    )

@router.post("/add-book")
async def add_book_to_vault(
    request: Request,
    book_data: MoveBookToVaultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Move a book to vault (requires active vault session)"""
    session_id = get_vault_session_from_request(request)
    
    if not verify_vault_session(session_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired vault session"
        )
    
    vault_service = VaultService(db)
    result = vault_service.move_book_to_vault(current_user.id, book_data.book_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result

@router.post("/remove-book")
async def remove_book_from_vault(
    request: Request,
    book_data: MoveBookToVaultRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Remove a book from vault (requires active vault session)"""
    session_id = get_vault_session_from_request(request)
    
    if not verify_vault_session(session_id, current_user.id):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired vault session"
        )
    
    vault_service = VaultService(db)
    result = vault_service.remove_book_from_vault(current_user.id, book_data.book_id)
    
    if not result["success"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=result["message"]
        )
    
    return result

@router.post("/logout")
async def logout_vault(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Logout from vault session"""
    session_id = get_vault_session_from_request(request)
    
    if session_id in vault_sessions:
        del vault_sessions[session_id]
    
    return {"success": True, "message": "Vault session ended"}

@router.get("/session-status")
async def check_vault_session(
    request: Request,
    current_user: User = Depends(get_current_user)
):
    """Check if current vault session is valid"""
    session_id = get_vault_session_from_request(request)
    is_valid = verify_vault_session(session_id, current_user.id)
    
    if is_valid and session_id in vault_sessions:
        expires_at = vault_sessions[session_id]["expires_at"]
        return {
            "valid": True,
            "expires_at": expires_at.isoformat()
        }
    
    return {"valid": False}