from fastapi import FastAPI
import os
import logging
from contextlib import asynccontextmanager

from database import create_tables, check_database_connection, check_redis_connection
from user_routes import router as user_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("Starting User Management Service...")
    
    # Create database tables
    try:
        create_tables()
        logger.info("Database tables created/verified")
    except Exception as e:
        logger.error(f"Failed to create database tables: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("Shutting down User Management Service...")

app = FastAPI(
    title="Legato User Management Service",
    description="User profile and relationship management service for Legato Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(user_router)

@app.get("/")
async def root():
    return {"service": "user-service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    db_status = "healthy" if check_database_connection() else "unhealthy"
    redis_status = "healthy" if check_redis_connection() else "unhealthy"
    
    overall_status = "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy"
    
    return {
        "service": "user-service",
        "status": overall_status,
        "database": db_status,
        "redis": redis_status
    }