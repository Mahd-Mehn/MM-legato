from pydantic import BaseModel, EmailStr, field_serializer
from typing import Optional
import uuid

class UserRegister(BaseModel):
    email: EmailStr
    username: str
    password: str
    is_writer: bool = False

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class UserResponse(BaseModel):
    id: uuid.UUID
    email: str
    username: str
    profile_picture_url: Optional[str] = None
    is_writer: bool
    theme_preference: str
    coin_balance: int
    
    @field_serializer('id')
    def serialize_id(self, value: uuid.UUID) -> str:
        return str(value)
    
    class Config:
        from_attributes = True

class VaultPasswordSet(BaseModel):
    vault_password: str