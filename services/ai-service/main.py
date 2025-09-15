from fastapi import FastAPI
from contextlib import asynccontextmanager
from database import db_manager
from translation_routes import router as translation_router
from audiobook_routes import router as audiobook_router
from adaptation_routes import router as adaptation_router

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup
    await db_manager.connect()
    yield
    # Shutdown
    await db_manager.disconnect()

app = FastAPI(
    title="Legato AI Enhancement Service",
    description="AI-powered translation and audiobook generation service for Legato Platform",
    version="1.0.0",
    lifespan=lifespan
)

# Include routers
app.include_router(translation_router)
app.include_router(audiobook_router)
app.include_router(adaptation_router)

@app.get("/")
async def root():
    return {"service": "ai-service", "version": "1.0.0"}

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    try:
        # Test MongoDB connection
        await db_manager.mongo_client.admin.command('ping')
        mongo_status = "healthy"
    except Exception as e:
        mongo_status = f"unhealthy: {str(e)}"
    
    try:
        # Test Redis connection
        await db_manager.redis_client.ping()
        redis_status = "healthy"
    except Exception as e:
        redis_status = f"unhealthy: {str(e)}"
    
    return {
        "service": "ai-service",
        "status": "healthy" if mongo_status == "healthy" and redis_status == "healthy" else "unhealthy",
        "mongodb": mongo_status,
        "redis": redis_status
    }