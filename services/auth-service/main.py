from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import redis
from database import engine, get_db, init_database
from models import User, UserProfile, UserSession
from auth_routes import router as auth_router
from sqlalchemy.orm import Session
from sqlalchemy import text

app = FastAPI(
    title="Legato Authentication Service",
    description="Authentication and authorization service for Legato Platform",
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

# Include authentication routes
app.include_router(auth_router)

# Redis setup
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/0")
redis_client = redis.from_url(REDIS_URL)

# Initialize database on startup
@app.on_event("startup")
async def startup_event():
    """Initialize database tables on startup"""
    init_database()

@app.get("/")
async def root():
    return {"service": "auth-service", "version": "1.0.0"}

@app.get("/health")
async def health_check(db: Session = Depends(get_db)):
    """Health check endpoint"""
    try:
        # Test database connection with a simple query
        db.execute(text("SELECT 1"))
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    try:
        # Test Redis connection
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    try:
        # Test model access
        user_count = db.query(User).count()
        model_status = f"healthy (users: {user_count})"
    except Exception as e:
        model_status = f"unhealthy: {str(e)}"
    
    return {
        "service": "auth-service",
        "status": "healthy" if all(s.startswith("healthy") for s in [db_status, redis_status, model_status]) else "unhealthy",
        "database": db_status,
        "redis": redis_status,
        "models": model_status
    }