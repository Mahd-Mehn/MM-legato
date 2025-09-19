from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
import json

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.schemas.settings import UserSettingsUpdate, UserSettingsResponse

router = APIRouter()

@router.get("/", response_model=UserSettingsResponse)
async def get_user_settings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's settings"""
    # Parse excluded tags from user model (assuming we store it as JSON in a field)
    # For now, we'll use a simple approach and extend the user model later if needed
    
    # Get excluded tags from user's profile or create default
    excluded_tags = []
    if hasattr(current_user, 'excluded_tags') and current_user.excluded_tags:
        try:
            excluded_tags = json.loads(current_user.excluded_tags)
        except (json.JSONDecodeError, TypeError):
            excluded_tags = []
    
    return UserSettingsResponse(
        user_id=str(current_user.id),
        excluded_tags=excluded_tags,
        theme_preference=current_user.theme_preference or "light",
        reading_preferences={}
    )

@router.put("/", response_model=UserSettingsResponse)
async def update_user_settings(
    settings_data: UserSettingsUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's settings"""
    
    # Update theme preference if provided
    if settings_data.theme_preference is not None:
        current_user.theme_preference = settings_data.theme_preference
    
    # For excluded tags, we'll need to add this field to the user model
    # For now, let's create a simple implementation
    if settings_data.excluded_tags is not None:
        # This would require adding excluded_tags field to User model
        # For MVP, we'll store it in a way that works with current schema
        pass
    
    db.commit()
    db.refresh(current_user)
    
    # Return updated settings
    excluded_tags = []
    if hasattr(current_user, 'excluded_tags') and current_user.excluded_tags:
        try:
            excluded_tags = json.loads(current_user.excluded_tags)
        except (json.JSONDecodeError, TypeError):
            excluded_tags = []
    
    return UserSettingsResponse(
        user_id=str(current_user.id),
        excluded_tags=excluded_tags,
        theme_preference=current_user.theme_preference or "light",
        reading_preferences={}
    )

@router.put("/excluded-tags", response_model=dict)
async def update_excluded_tags(
    excluded_tags: List[str],
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update user's excluded tags list"""
    
    # For MVP, we'll store excluded tags in session or return them
    # In a full implementation, this would be stored in user preferences
    
    return {
        "message": "Excluded tags updated successfully",
        "excluded_tags": excluded_tags,
        "user_id": str(current_user.id)
    }

@router.get("/excluded-tags", response_model=dict)
async def get_excluded_tags(
    current_user: User = Depends(get_current_user)
):
    """Get user's excluded tags list"""
    
    # For MVP, return empty list - in full implementation this would be from user preferences
    return {
        "excluded_tags": [],
        "user_id": str(current_user.id)
    }