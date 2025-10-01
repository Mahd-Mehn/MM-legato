from fastapi import APIRouter
from app.api.v1.auth import router as auth_router
from app.api.v1.users import router as users_router
from app.api.v1.books import router as books_router
from app.api.v1.settings import router as settings_router
from app.api.v1.library import router as library_router
from app.api.v1.reading import router as reading_router
from app.api.v1.audio import router as audio_router
from app.api.v1.translation import router as translation_router
from app.api.v1.quotes import router as quotes_router
from app.api.v1.comments import router as comments_router
from app.api.v1.reviews import router as reviews_router
from app.api.v1.characters import router as characters_router
from app.api.v1.moderation import router as moderation_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.vault import router as vault_router
from app.api.v1.analytics import router as analytics_router

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

# Include advanced reading features
api_router.include_router(audio_router, prefix="/audio", tags=["audio"])
api_router.include_router(translation_router, prefix="/translation", tags=["translation"])
api_router.include_router(quotes_router, prefix="/quotes", tags=["quotes"])

# Include community features
api_router.include_router(comments_router, prefix="/comments", tags=["comments"])
api_router.include_router(reviews_router, prefix="/reviews", tags=["reviews"])

# Include character management
api_router.include_router(characters_router, prefix="/characters", tags=["characters"])

# Include moderation features
api_router.include_router(moderation_router, prefix="/moderation", tags=["moderation"])

# Include notification features
api_router.include_router(notifications_router, prefix="/notifications", tags=["notifications"])

# Include vault features
api_router.include_router(vault_router, prefix="/vault", tags=["vault"])

# Include analytics features
api_router.include_router(analytics_router, prefix="/analytics", tags=["analytics"])

@api_router.get("/health")
async def health_check():
    return {"status": "healthy", "service": "legato-api-v1", "version": "1.0.0"}