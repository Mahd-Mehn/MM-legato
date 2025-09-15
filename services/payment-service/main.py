from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
import os
import redis
import logging
from contextlib import asynccontextmanager
from sqlalchemy.orm import Session
from sqlalchemy import text

from database import create_tables, init_default_data, get_db
from payment_routes import router as payment_router
from revenue_routes import router as revenue_router
from access_control_routes import router as access_control_router

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    logger.info("Starting Payment Service...")
    
    # Create database tables
    create_tables()
    
    # Initialize default data
    db = next(get_db())
    try:
        init_default_data(db)
    except Exception as e:
        logger.error(f"Error initializing default data: {e}")
    finally:
        db.close()
    
    logger.info("Payment Service started successfully")
    
    yield
    
    # Shutdown
    logger.info("Shutting down Payment Service...")

app = FastAPI(
    title="Legato Payment Processing Service",
    description="Payment processing and revenue distribution service for Legato Platform",
    version="1.0.0",
    lifespan=lifespan
)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Redis setup
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/4")
redis_client = redis.from_url(REDIS_URL)

# Include payment routes
app.include_router(payment_router, prefix="/api/v1/payments", tags=["payments"])

# Include revenue distribution routes
app.include_router(revenue_router, prefix="/api/v1/revenue", tags=["revenue"])

# Include access control routes
app.include_router(access_control_router, prefix="/api/v1/access", tags=["access-control"])

@app.get("/")
async def root():
    return {
        "service": "payment-service", 
        "version": "1.0.0",
        "description": "Legato Payment Processing Service with coin system and multi-currency support"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test database connection
        db = next(get_db())
        db.execute(text("SELECT 1"))
        db.close()
        db_status = "healthy"
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"
    
    try:
        # Test Redis connection
        redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    # Test payment gateways (basic configuration check)
    stripe_configured = bool(os.getenv("STRIPE_SECRET_KEY"))
    paystack_configured = bool(os.getenv("PAYSTACK_SECRET_KEY"))
    
    return {
        "service": "payment-service",
        "status": "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy",
        "database": db_status,
        "redis": redis_status,
        "payment_gateways": {
            "stripe": "configured" if stripe_configured else "not_configured",
            "paystack": "configured" if paystack_configured else "not_configured"
        },
        "supported_currencies": ["USD", "NGN", "CAD"],
        "features": [
            "coin_system",
            "multi_currency_support", 
            "microtransactions",
            "tipping",
            "revenue_distribution"
        ]
    }