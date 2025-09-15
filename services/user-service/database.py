"""
Database configuration and utilities for User Management Service
"""
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import redis
from typing import Generator
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://legato_user:legato_pass@localhost:5432/legato_users")
REDIS_URL = os.getenv("REDIS_URL", "redis://localhost:6379/1")

# Create SQLAlchemy engine
engine = create_engine(
    DATABASE_URL,
    pool_pre_ping=True,
    pool_recycle=300,
    echo=os.getenv("SQL_DEBUG", "false").lower() == "true"
)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Create Redis client
redis_client = redis.from_url(REDIS_URL, decode_responses=True)

def get_database() -> Generator[Session, None, None]:
    """
    Dependency to get database session
    """
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def get_redis() -> redis.Redis:
    """
    Dependency to get Redis client
    """
    return redis_client

def create_tables():
    """
    Create all database tables
    """
    from models import Base
    try:
        Base.metadata.create_all(bind=engine)
        logger.info("Database tables created successfully")
    except Exception as e:
        logger.error(f"Error creating database tables: {e}")
        raise

def check_database_connection() -> bool:
    """
    Check if database connection is working
    """
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
        return True
    except Exception as e:
        logger.error(f"Database connection failed: {e}")
        return False

def check_redis_connection() -> bool:
    """
    Check if Redis connection is working
    """
    try:
        redis_client.ping()
        return True
    except Exception as e:
        logger.error(f"Redis connection failed: {e}")
        return False

# Cache utilities
class CacheManager:
    """Redis cache manager for user data"""
    
    def __init__(self, redis_client: redis.Redis):
        self.redis = redis_client
        self.default_ttl = 3600  # 1 hour
    
    def get_user_profile(self, user_id: str) -> dict:
        """Get user profile from cache"""
        try:
            cache_key = f"user_profile:{user_id}"
            cached_data = self.redis.get(cache_key)
            if cached_data:
                import json
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        return None
    
    def set_user_profile(self, user_id: str, profile_data: dict, ttl: int = None) -> bool:
        """Set user profile in cache"""
        try:
            cache_key = f"user_profile:{user_id}"
            import json
            self.redis.setex(
                cache_key, 
                ttl or self.default_ttl, 
                json.dumps(profile_data, default=str)
            )
            return True
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
            return False
    
    def invalidate_user_profile(self, user_id: str) -> bool:
        """Invalidate user profile cache"""
        try:
            cache_key = f"user_profile:{user_id}"
            self.redis.delete(cache_key)
            return True
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
            return False
    
    def get_user_relationships(self, user_id: str) -> dict:
        """Get user relationships from cache"""
        try:
            cache_key = f"user_relationships:{user_id}"
            cached_data = self.redis.get(cache_key)
            if cached_data:
                import json
                return json.loads(cached_data)
        except Exception as e:
            logger.warning(f"Cache get error: {e}")
        return None
    
    def set_user_relationships(self, user_id: str, relationships_data: dict, ttl: int = None) -> bool:
        """Set user relationships in cache"""
        try:
            cache_key = f"user_relationships:{user_id}"
            import json
            self.redis.setex(
                cache_key, 
                ttl or self.default_ttl, 
                json.dumps(relationships_data, default=str)
            )
            return True
        except Exception as e:
            logger.warning(f"Cache set error: {e}")
            return False
    
    def invalidate_user_relationships(self, user_id: str) -> bool:
        """Invalidate user relationships cache"""
        try:
            cache_key = f"user_relationships:{user_id}"
            self.redis.delete(cache_key)
            return True
        except Exception as e:
            logger.warning(f"Cache invalidation error: {e}")
            return False

# Initialize cache manager
cache_manager = CacheManager(redis_client)