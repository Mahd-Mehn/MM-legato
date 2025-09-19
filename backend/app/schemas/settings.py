from pydantic import BaseModel
from typing import List, Optional

class UserSettingsBase(BaseModel):
    excluded_tags: Optional[List[str]] = []
    theme_preference: Optional[str] = "light"
    reading_preferences: Optional[dict] = {}

class UserSettingsUpdate(BaseModel):
    excluded_tags: Optional[List[str]] = None
    theme_preference: Optional[str] = None
    reading_preferences: Optional[dict] = None

class UserSettingsResponse(UserSettingsBase):
    user_id: str
    
    class Config:
        from_attributes = True