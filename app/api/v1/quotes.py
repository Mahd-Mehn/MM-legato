from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session, joinedload
from typing import Optional
from uuid import UUID, uuid4
import cloudinary.uploader
from PIL import Image, ImageDraw, ImageFont
from io import BytesIO
import textwrap
import requests

from app.core.database import get_db
from app.core.deps import get_current_user
from app.models.user import User
from app.models.book import Chapter, Book
from app.schemas.quotes import QuoteImageRequest, QuoteImageResponse

router = APIRouter()

@router.post("/generate", response_model=QuoteImageResponse)
async def generate_quote_image(
    request: QuoteImageRequest,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Generate a quote image with text overlay"""
    
    # Get chapter and book info if chapter_id is provided
    chapter = None
    book = None
    if request.chapter_id:
        chapter = db.query(Chapter).options(joinedload(Chapter.book).joinedload(Book.author)).filter(Chapter.id == request.chapter_id).first()
        if chapter:
            book = chapter.book
    
    try:
        # Validate input
        if not request.quote_text or not request.quote_text.strip():
            raise HTTPException(status_code=400, detail="Quote text cannot be empty")
        
        # Create image dimensions
        width = request.width or 800
        height = request.height or 600
        
        # Create base image
        if request.background_color:
            # Solid color background
            img = Image.new('RGB', (width, height), request.background_color)
        else:
            # Default gradient background
            img = Image.new('RGB', (width, height), '#1e293b')
            # Create a simple gradient effect
            draw = ImageDraw.Draw(img)
            for i in range(height):
                alpha = i / height
                color = (
                    int(30 + alpha * 20),   # R
                    int(41 + alpha * 30),   # G  
                    int(59 + alpha * 40)    # B
                )
                draw.line([(0, i), (width, i)], fill=color)
        
        draw = ImageDraw.Draw(img)
        
        # Try to load a nice font, fallback to default
        try:
            # Try to use a system font
            font_size = request.font_size or 32
            title_font_size = int(font_size * 0.7)
            author_font_size = int(font_size * 0.6)
            
            # For Windows, try common font paths
            font_paths = [
                "C:/Windows/Fonts/arial.ttf",
                "C:/Windows/Fonts/calibri.ttf",
                "/System/Library/Fonts/Arial.ttf",  # macOS
                "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",  # Linux
            ]
            
            font = None
            title_font = None
            author_font = None
            
            for font_path in font_paths:
                try:
                    font = ImageFont.truetype(font_path, font_size)
                    title_font = ImageFont.truetype(font_path, title_font_size)
                    author_font = ImageFont.truetype(font_path, author_font_size)
                    break
                except:
                    continue
            
            # Fallback to default font if no system font found
            if not font:
                font = ImageFont.load_default()
                title_font = ImageFont.load_default()
                author_font = ImageFont.load_default()
                
        except Exception:
            font = ImageFont.load_default()
            title_font = ImageFont.load_default()
            author_font = ImageFont.load_default()
        
        # Text color
        text_color = request.text_color or '#ffffff'
        
        # Wrap text to fit image width
        margin = 60
        max_width = width - (margin * 2)
        
        # Wrap the quote text
        wrapped_lines = []
        words = request.quote_text.split()
        current_line = ""
        
        for word in words:
            test_line = current_line + (" " if current_line else "") + word
            # Estimate text width (rough calculation)
            if len(test_line) * (font_size * 0.6) < max_width:
                current_line = test_line
            else:
                if current_line:
                    wrapped_lines.append(current_line)
                current_line = word
        
        if current_line:
            wrapped_lines.append(current_line)
        
        # Calculate all text heights for proper spacing
        line_height = font_size + 8
        quote_height = len(wrapped_lines) * line_height
        
        # Calculate attribution section height
        attribution_height = 0
        if book:
            attribution_height += title_font_size + 5  # Book title
            if book.author:
                attribution_height += author_font_size + 5  # Author name
        
        # LEGATO branding height
        branding_height = author_font_size
        
        # Calculate total content height with proper spacing
        spacing_between_sections = 30
        total_content_height = (
            quote_height + 
            (spacing_between_sections if attribution_height > 0 else 0) +
            attribution_height + 
            spacing_between_sections + 
            branding_height
        )
        
        # Calculate starting Y position to center all content
        content_start_y = (height - total_content_height) // 2
        
        # Ensure minimum top margin
        content_start_y = max(content_start_y, 60)
        
        # Draw quote text
        current_y = content_start_y
        for line in wrapped_lines:
            # Center each line horizontally
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            
            draw.text((x, current_y), line, fill=text_color, font=font)
            current_y += line_height
        
        # Add book and author info if available
        if book:
            current_y += spacing_between_sections
            
            # Book title
            book_text = f"— {book.title}"
            if chapter:
                book_text += f", Chapter {chapter.chapter_number}"
            
            bbox = draw.textbbox((0, 0), book_text, font=title_font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            draw.text((x, current_y), book_text, fill=text_color, font=title_font)
            current_y += title_font_size + 5
            
            # Author name
            if book.author:
                author_text = f"by {book.author.username}"
                bbox = draw.textbbox((0, 0), author_text, font=author_font)
                text_width = bbox[2] - bbox[0]
                x = (width - text_width) // 2
                draw.text((x, current_y), author_text, fill=text_color, font=author_font)
                current_y += author_font_size + 5
        
        # Add final spacing before LEGATO branding
        current_y += spacing_between_sections
        
        # Add "from LEGATO" branding
        legato_text = "from LEGATO"
        # Make LEGATO text slightly smaller and more subtle
        legato_font_size = max(12, int(author_font_size * 0.8))
        try:
            legato_font = ImageFont.truetype(font_paths[0] if font_paths else None, legato_font_size) if font else ImageFont.load_default()
        except:
            legato_font = ImageFont.load_default()
            
        bbox = draw.textbbox((0, 0), legato_text, font=legato_font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        
        # Use calculated position or bottom margin, whichever gives more space
        legato_y = min(current_y, height - 50)
        
        # Draw with slightly reduced opacity effect (using a lighter color)
        if text_color == '#ffffff' or text_color.lower() == 'white':
            legato_color = '#cccccc'  # Lighter for white text
        elif text_color == '#000000' or text_color.lower() == 'black':
            legato_color = '#666666'  # Lighter for black text
        else:
            legato_color = text_color  # Use same color for other colors
            
        draw.text((x, legato_y), legato_text, fill=legato_color, font=legato_font)
        
        # Convert to bytes
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG', quality=95)
        img_buffer.seek(0)
        
        # Upload to Cloudinary or save locally as fallback
        try:
            result = cloudinary.uploader.upload(
                img_buffer,
                resource_type="image",
                public_id=f"quotes/{current_user.id}/{uuid4()}",
                format="png",
                folder="legato/quotes"
            )
            image_url = result['secure_url']
        except Exception as cloudinary_error:
            # Fallback: save locally and return a local URL
            import os
            from pathlib import Path
            
            # Create uploads directory if it doesn't exist
            uploads_dir = Path("uploads/quotes")
            uploads_dir.mkdir(parents=True, exist_ok=True)
            
            # Save file locally
            filename = f"{uuid4()}.png"
            filepath = uploads_dir / filename
            
            img_buffer.seek(0)
            with open(filepath, 'wb') as f:
                f.write(img_buffer.read())
            
            # Return local URL (you might want to serve this through FastAPI static files)
            image_url = f"/uploads/quotes/{filename}"
        
        return QuoteImageResponse(
            image_url=image_url,
            quote_text=request.quote_text,
            book_title=book.title if book else None,
            author_name=book.author.username if book and book.author else None,
            chapter_title=chapter.title if chapter else None
        )
        
    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"Quote generation error: {error_details}")  # For debugging
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate quote image: {str(e)}"
        )

@router.post("/generate-simple", response_model=QuoteImageResponse)
async def generate_simple_quote_image(
    request: dict,
    current_user: User = Depends(get_current_user)
):
    """Generate a simple quote image without chapter context"""
    
    quote_text = request.get('quote_text', '')
    if not quote_text:
        raise HTTPException(status_code=400, detail="Quote text is required")
    
    try:
        # Create simple quote image
        width = 800
        height = 600
        
        # Create gradient background
        img = Image.new('RGB', (width, height), '#1e293b')
        draw = ImageDraw.Draw(img)
        
        # Simple gradient
        for i in range(height):
            alpha = i / height
            color = (
                int(30 + alpha * 20),
                int(41 + alpha * 30),
                int(59 + alpha * 40)
            )
            draw.line([(0, i), (width, i)], fill=color)
        
        # Use default font
        font = ImageFont.load_default()
        
        # Wrap text
        margin = 60
        max_width = width - (margin * 2)
        wrapped_lines = textwrap.wrap(quote_text, width=50)  # Rough character wrap
        
        # Calculate positioning with proper spacing
        line_height = 40
        quote_height = len(wrapped_lines) * line_height
        branding_height = 20
        spacing = 40
        
        total_content_height = quote_height + spacing + branding_height
        content_start_y = (height - total_content_height) // 2
        content_start_y = max(content_start_y, 60)  # Minimum top margin
        
        # Draw quote text
        current_y = content_start_y
        for i, line in enumerate(wrapped_lines):
            bbox = draw.textbbox((0, 0), line, font=font)
            text_width = bbox[2] - bbox[0]
            x = (width - text_width) // 2
            y = current_y + (i * line_height)
            
            draw.text((x, y), line, fill='#ffffff', font=font)
        
        # Add "from LEGATO" branding with proper spacing
        current_y += quote_height + spacing
        legato_text = "from LEGATO"
        bbox = draw.textbbox((0, 0), legato_text, font=font)
        text_width = bbox[2] - bbox[0]
        x = (width - text_width) // 2
        
        # Use lighter color for branding
        draw.text((x, current_y), legato_text, fill='#cccccc', font=font)
        
        # Convert to bytes and upload
        img_buffer = BytesIO()
        img.save(img_buffer, format='PNG')
        img_buffer.seek(0)
        
        # Upload to Cloudinary or save locally as fallback
        try:
            result = cloudinary.uploader.upload(
                img_buffer,
                resource_type="image",
                public_id=f"quotes/{current_user.id}/{uuid4()}",
                format="png",
                folder="legato/quotes"
            )
            image_url = result['secure_url']
        except Exception as cloudinary_error:
            # Fallback: save locally
            import os
            from pathlib import Path
            
            uploads_dir = Path("uploads/quotes")
            uploads_dir.mkdir(parents=True, exist_ok=True)
            
            filename = f"{uuid4()}.png"
            filepath = uploads_dir / filename
            
            img_buffer.seek(0)
            with open(filepath, 'wb') as f:
                f.write(img_buffer.read())
            
            image_url = f"/uploads/quotes/{filename}"
        
        return QuoteImageResponse(
            image_url=image_url,
            quote_text=quote_text,
            book_title=None,
            author_name=None,
            chapter_title=None
        )
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Failed to generate quote image: {str(e)}"
        )