from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional
from datetime import datetime
from uuid import UUID

class UserBase(BaseModel):
    email: EmailStr
    username: str
    is_writer: bool = False

class UserCreate(UserBase):
    password: str

class UserUpdate(BaseModel):
    username: Optional[str] = None
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    theme_preference: Optional[str] = None

class UserProfile(BaseModel):
    id: UUID
    email: str
    username: str
    bio: Optional[str] = None
    profile_picture_url: Optional[str] = None
    is_writer: bool
    theme_preference: str
    coin_balance: int
    has_vault_password: bool = False
    created_at: datetime
    updated_at: datetime

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        from_attributes = True

class UserPublic(BaseModel):
    id: UUID
    username: str
    profile_picture_url: Optional[str] = None
    is_writer: bool

    @field_serializer('id')
    def serialize_id(self, value: UUID) -> str:
        return str(value)

    class Config:
        from_attributes = True

class OnboardingUpdate(BaseModel):
    username: str
    bio: Optional[str] = None
    is_writer: bool = False
    profile_picture_url: Optional[str] = None