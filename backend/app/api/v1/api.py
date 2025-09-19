from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.books import router as books_router
from app.api.v1.settings import router as settings_router
from app.api.v1.library import router as library_router
from app.api.v1.reading import router as reading_router

api_router = APIRouter()

# Include auth routes
api_router.include_router(auth_router, prefix="/auth", tags=["authentication"])

# Include user routes
api_router.include_router(users_router, prefix="/users", tags=["users"])

# Include book routes
api_router.include_router(books_router, prefix="/books", tags=["books"])

# Include library routes
api_router.include_router(library_router, prefix="/library", tags=["library"])

# Include reading routes
api_router.include_router(reading_router, prefix="/reading", tags=["reading"])

# Include settings routes
api_router.include_router(settings_router, prefix="/settings", tags=["settings"])

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "legato-api-v1", "version": "1.0.0"}