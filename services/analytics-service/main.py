from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import redis
from pymongo import MongoClient
import logging
from contextlib import asynccontextmanager

from analytics_service import AnalyticsService
from dashboard_service import DashboardService
from analytics_routes import router as analytics_router
from dashboard_routes import router as dashboard_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Global service instances
analytics_service = None
dashboard_service = None

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    global analytics_service
    
    # Startup
    logger.info("Starting Analytics Service...")
    
    # MongoDB setup
    MONGODB_URL = os.getenv("MONGODB_URL", "mongodb://localhost:27017/legato_analytics")
    mongo_client = MongoClient(MONGODB_URL)
    
    # Redis setup
    REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/6")
    redis_client = redis.from_url(REDIS_URL)
    
    # Initialize analytics service
    analytics_service = AnalyticsService(mongo_client, redis_client)
    
    # Initialize dashboard service
    dashboard_service = DashboardService(analytics_service)
    
    logger.info("Analytics and Dashboard Services started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Analytics Service...")
    mongo_client.close()
    redis_client.close()

app = FastAPI(
    title="Legato Analytics Service",
    description="Analytics and metrics collection service for Legato Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(analytics_router)
app.include_router(dashboard_router)

@app.get("/")
async def root():
    return {"service": "analytics-service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        analytics_service.mongo_client.admin.command('ping')
        mongo_status = "healthy"
    except Exception as e:
        mongo_status = f"unhealthy: {str(e)}"
    
    try:
        # Test Redis connection
        analytics_service.redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    return {
        "service": "analytics-service",
        "status": "healthy" if mongo_status == "healthy" and redis_status == "healthy" else "unhealthy",
        "mongodb": mongo_status,
        "redis": redis_status
    }