from sqlalchemy import Column, String, Integer, Float, ForeignKey
from sqlalchemy.orm import relationship
from .base import BaseModel

class ReadingPreferences(BaseModel):
    __tablename__ = "reading_preferences"
    
    user_id = Column(String, ForeignKey("users.id"), nullable=False, unique=True)
    font_family = Column(String(50), default="serif")
    font_size = Column(Integer, default=16)
    line_height = Column(Float, default=1.6)
    background_color = Column(String(7), default="#ffffff")  # Hex color
    text_color = Column(String(7), default="#000000")  # Hex color
    page_width = Column(Integer, default=800)
    brightness = Column(Integer, default=100)
    wallpaper_url = Column(String(500), nullable=True)
    theme_preset = Column(String(20), default="light")
    
    # Relationships
    user = relationship("User", back_populates="reading_preferences")