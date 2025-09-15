"""
Community Service - FastAPI application for comments, ratings, and social features
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import logging

from database import init_database, check_database_health
from comment_routes import router as comment_router
from rating_routes import router as rating_router
from social_routes import router as social_router
from fan_engagement_routes import router as fan_engagement_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Legato Community Service",
    description="Comment, rating, and social features service for Legato Platform",
    version="1.0.0"
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(comment_router)
app.include_router(rating_router)
app.include_router(social_router)
app.include_router(fan_engagement_router)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    try:
        init_database()
        logger.info("Community service started successfully")
    except Exception as e:
        logger.error(f"Failed to initialize database: {e}")
        raise

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "service": "community-service",
        "version": "1.0.0",
        "description": "Comment, rating, and social features service"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        db_healthy = check_database_health()
        
        return {
            "service": "community-service",
            "status": "healthy" if db_healthy else "unhealthy",
            "database": "healthy" if db_healthy else "unhealthy",
            "version": "1.0.0"
        }
    except Exception as e:
        logger.error(f"Health check failed: {e}")
        return {
            "service": "community-service",
            "status": "unhealthy",
            "database": "unhealthy",
            "error": str(e),
            "version": "1.0.0"
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8008)