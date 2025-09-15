from fastapi import FastAPI
import os
import redis
from database import engine, SessionLocal, init_database
from models import Base
from content_routes import router as content_router
from discovery_routes import router as discovery_router
from sqlalchemy import text

app = FastAPI(
    title="Legato Content Management Service",
    description="Story and chapter management service for Legato Platform",
    version="1.0.0"
)

# Include routers
app.include_router(content_router)
app.include_router(discovery_router)

# Redis setup
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/2")
redis_client = redis.from_url(REDIS_URL)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    init_database()

@app.get("/")
async def root():
    return {"service": "content-service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    try:
        # Test Redis connection
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    return {
        "service": "content-service",
        "status": "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy",
        "database": db_status,
        "redis": redis_status
    }