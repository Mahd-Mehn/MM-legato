from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import redis
from contextlib import asynccontextmanager
from sqlalchemy import text

from database import create_tables, engine
from routers import protection

# Redis setup
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/3")
redis_client = redis.from_url(REDIS_URL)

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events"""
    # Startup
    create_tables()
    yield
    # Shutdown
    pass

app = FastAPI(
    title="Legato IP Protection Service",
    description="Intellectual property protection and licensing service for Legato Platform",
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

# Include routers
app.include_router(protection.router, prefix="/api/ip")
from routers import blockchain, licensing, marketplace, workflow
app.include_router(blockchain.router, prefix="/api/ip")
app.include_router(licensing.router, prefix="/api/ip")
app.include_router(marketplace.router, prefix="/api/ip")
app.include_router(workflow.router, prefix="/api/ip")

@app.get("/")
async def root():
    return {"service": "ip-service", "version": "1.0.0"}

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
        "service": "ip-service",
        "status": "healthy" if db_status == "healthy" and redis_status == "healthy" else "unhealthy",
        "database": db_status,
        "redis": redis_status
    }