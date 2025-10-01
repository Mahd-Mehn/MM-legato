from pydantic import BaseModel
from typing import List
from app.schemas.library import LibraryResponse

class VaultPasswordVerify(BaseModel):
    password: str

class VaultAccessResponse(BaseModel):
    success: bool
    message: str
    session_expires_at: str = None
    session_id: str = None

class VaultBooksResponse(BaseModel):
    books: List[LibraryResponse]
    total_count: int

class MoveBookToVaultRequest(BaseModel):
    book_id: str

class VaultStatusResponse(BaseModel):
    success: bool
    message: str
    has_vault_password: bool = False