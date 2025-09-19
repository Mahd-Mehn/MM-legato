import cloudinary
import cloudinary.uploader
from fastapi import HTTPException, UploadFile
from app.core.config import settings
import uuid
from typing import Dict, Any

# Configure Cloudinary
cloudinary.config(
    cloud_name=settings.CLOUDINARY_CLOUD_NAME,
    api_key=settings.CLOUDINARY_API_KEY,
    api_secret=settings.CLOUDINARY_API_SECRET
)

class MediaService:
    @staticmethod
    async def upload_profile_picture(file: UploadFile, user_id: str) -> Dict[str, Any]:
        """Upload profile picture to Cloudinary"""
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Validate file size (5MB max)
            file_size = 0
            content = await file.read()
            file_size = len(content)
            
            if file_size > 5 * 1024 * 1024:  # 5MB
                raise HTTPException(status_code=400, detail="File size must be less than 5MB")
            
            # Generate unique filename
            file_extension = file.filename.split('.')[-1] if file.filename else 'jpg'
            public_id = f"profile_pictures/{user_id}_{uuid.uuid4().hex}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                public_id=public_id,
                folder="legato/profile_pictures",
                transformation=[
                    {'width': 400, 'height': 400, 'crop': 'fill', 'gravity': 'face'},
                    {'quality': 'auto', 'fetch_format': 'auto'}
                ],
                allowed_formats=['jpg', 'jpeg', 'png', 'webp']
            )
            
            return {
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'width': result['width'],
                'height': result['height']
            }
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")
    
    @staticmethod
    async def delete_image(public_id: str) -> bool:
        """Delete image from Cloudinary"""
        try:
            result = cloudinary.uploader.destroy(public_id)
            return result.get('result') == 'ok'
        except Exception:
            return False
    
    @staticmethod
    async def upload_book_cover(file: UploadFile, book_id: str) -> Dict[str, Any]:
        """Upload book cover to Cloudinary"""
        try:
            # Validate file type
            if not file.content_type or not file.content_type.startswith('image/'):
                raise HTTPException(status_code=400, detail="File must be an image")
            
            # Validate file size (10MB max for book covers)
            content = await file.read()
            file_size = len(content)
            
            if file_size > 10 * 1024 * 1024:  # 10MB
                raise HTTPException(status_code=400, detail="File size must be less than 10MB")
            
            # Generate unique filename
            public_id = f"book_covers/{book_id}_{uuid.uuid4().hex}"
            
            # Upload to Cloudinary
            result = cloudinary.uploader.upload(
                content,
                public_id=public_id,
                folder="legato/book_covers",
                transformation=[
                    {'width': 600, 'height': 800, 'crop': 'fill'},
                    {'quality': 'auto', 'fetch_format': 'auto'}
                ],
                allowed_formats=['jpg', 'jpeg', 'png', 'webp']
            )
            
            return {
                'url': result['secure_url'],
                'public_id': result['public_id'],
                'width': result['width'],
                'height': result['height']
            }
            
        except Exception as e:
            if isinstance(e, HTTPException):
                raise e
            raise HTTPException(status_code=500, detail=f"Failed to upload image: {str(e)}")

media_service = MediaService()