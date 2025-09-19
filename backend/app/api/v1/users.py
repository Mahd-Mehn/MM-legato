from fastapi import APIRouter, Depends, HTTPException, UploadFile, File
from sqlalchemy.orm import Session
from app.core.deps import get_db, get_current_user
from app.models.user import User
from app.schemas.user import UserProfile, UserUpdate, OnboardingUpdate
from app.services.media_service import media_service
from typing import Dict, Any

router = APIRouter()

@router.get("/profile", response_model=UserProfile)
async def get_user_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get current user's profile"""
    return current_user

@router.put("/profile", response_model=UserProfile)
async def update_user_profile(
    profile_update: UserUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Update current user's profile"""
    try:
        # Update user fields
        if profile_update.username is not None:
            # Check if username is already taken
            existing_user = db.query(User).filter(
                User.username == profile_update.username,
                User.id != current_user.id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
            current_user.username = profile_update.username
        
        if profile_update.bio is not None:
            current_user.bio = profile_update.bio
        
        if profile_update.profile_picture_url is not None:
            current_user.profile_picture_url = profile_update.profile_picture_url
        
        if profile_update.theme_preference is not None:
            if profile_update.theme_preference not in ['light', 'dark', 'system']:
                raise HTTPException(status_code=400, detail="Invalid theme preference")
            current_user.theme_preference = profile_update.theme_preference
        
        db.commit()
        db.refresh(current_user)
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to update profile: {str(e)}")

@router.post("/profile/upload-picture")
async def upload_profile_picture(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
) -> Dict[str, Any]:
    """Upload profile picture"""
    try:
        # Upload to Cloudinary
        upload_result = await media_service.upload_profile_picture(file, str(current_user.id))
        
        # Update user's profile picture URL
        current_user.profile_picture_url = upload_result['url']
        db.commit()
        
        return {
            "message": "Profile picture uploaded successfully",
            "url": upload_result['url']
        }
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to upload profile picture: {str(e)}")

@router.post("/onboarding", response_model=UserProfile)
async def complete_onboarding(
    onboarding_data: OnboardingUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Complete user onboarding"""
    try:
        # Check if username is already taken
        if onboarding_data.username != current_user.username:
            existing_user = db.query(User).filter(
                User.username == onboarding_data.username,
                User.id != current_user.id
            ).first()
            if existing_user:
                raise HTTPException(status_code=400, detail="Username already taken")
        
        # Update user fields
        current_user.username = onboarding_data.username
        current_user.bio = onboarding_data.bio
        current_user.is_writer = onboarding_data.is_writer
        
        if onboarding_data.profile_picture_url:
            current_user.profile_picture_url = onboarding_data.profile_picture_url
        
        db.commit()
        db.refresh(current_user)
        
        return current_user
        
    except HTTPException:
        raise
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Failed to complete onboarding: {str(e)}")

@router.get("/role-permissions")
async def get_user_role_permissions(
    current_user: User = Depends(get_current_user)
) -> Dict[str, Any]:
    """Get current user's role and permissions"""
    permissions = {
        "can_read": True,
        "can_comment": True,
        "can_like": True,
        "can_purchase": True,
        "can_access_vault": True,
        "can_write": current_user.is_writer,
        "can_publish": current_user.is_writer,
        "can_moderate": current_user.is_writer,
        "can_view_analytics": current_user.is_writer,
        "can_manage_characters": current_user.is_writer,
    }
    
    return {
        "user_id": str(current_user.id),
        "username": current_user.username,
        "is_writer": current_user.is_writer,
        "theme_preference": current_user.theme_preference,
        "permissions": permissions
    }

@router.get("/profile/{user_id}", response_model=UserProfile)
async def get_user_by_id(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Get user profile by ID (public view)"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    return user

@router.get("/dashboard-stats")
async def get_dashboard_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get dashboard statistics for the user"""
    try:
        from app.models.library import ReadingProgress
        from app.models.book import Book, Chapter
        from sqlalchemy import func, text
        
        # Calculate books read (progress >= 90% considered "read")
        books_read_query = text("""
            SELECT COUNT(DISTINCT rp.book_id) 
            FROM reading_progress rp 
            WHERE rp.user_id = :user_id AND rp.position_percentage >= 90
        """)
        books_read_result = db.execute(books_read_query, {"user_id": str(current_user.id)}).scalar()
        books_read = books_read_result or 0
        
        # Calculate estimated reading time based on progress
        # Assume average reading speed of 200 words per minute
        reading_time_query = text("""
            SELECT SUM(
                CASE 
                    WHEN c.word_count IS NOT NULL 
                    THEN (c.word_count * (rp.position_percentage / 100.0)) / 200.0 / 60.0
                    ELSE 0 
                END
            ) as total_hours
            FROM reading_progress rp
            JOIN chapters c ON REPLACE(c.id, '-', '') = REPLACE(rp.chapter_id, '-', '')
            WHERE rp.user_id = :user_id
        """)
        reading_time_result = db.execute(reading_time_query, {"user_id": str(current_user.id)}).scalar()
        reading_time_hours = max(0, int(reading_time_result or 0))
        
        # Count books in progress (for additional context)
        books_in_progress_query = text("""
            SELECT COUNT(DISTINCT rp.book_id) 
            FROM reading_progress rp 
            WHERE rp.user_id = :user_id AND rp.position_percentage > 0 AND rp.position_percentage < 90
        """)
        books_in_progress_result = db.execute(books_in_progress_query, {"user_id": str(current_user.id)}).scalar()
        books_in_progress = books_in_progress_result or 0
        
        # For writers, calculate story views (mock for now, can be implemented later)
        story_views = None
        if current_user.is_writer:
            # Count total chapters in their published books
            writer_stats_query = text("""
                SELECT COUNT(c.id) as total_chapters
                FROM books b
                JOIN chapters c ON REPLACE(b.id, '-', '') = REPLACE(c.book_id, '-', '')
                WHERE REPLACE(b.author_id, '-', '') = REPLACE(:author_id, '-', '') 
                AND b.is_published = 1 AND c.is_published = 1
            """)
            writer_stats_result = db.execute(writer_stats_query, {"author_id": str(current_user.id)}).scalar()
            # Mock story views based on published content
            story_views = (writer_stats_result or 0) * 15  # Mock: 15 views per chapter
        
        return {
            "books_read": books_read,
            "books_in_progress": books_in_progress,
            "reading_time_hours": reading_time_hours,
            "comments_made": 0,  # TODO: Implement when comments system is added
            "coin_balance": current_user.coin_balance or 0,
            "story_views": story_views
        }
        
    except Exception as e:
        print(f"Error calculating dashboard stats: {e}")
        return {
            "books_read": 0,
            "books_in_progress": 0,
            "reading_time_hours": 0,
            "comments_made": 0,
            "coin_balance": current_user.coin_balance or 0,
            "story_views": 0 if current_user.is_writer else None
        }