import os
from pymongo import MongoClient
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from typing import Optional

class DatabaseManager:
    def __init__(self):
        self.mongodb_url = os.getenv("MONGODB_URL", "mongodb://localhost:27017/legato_ai")
        self.redis_url = os.getenv("REDIS_URL", "redis://localhost:6379/5")
        self.mongo_client: Optional[AsyncIOMotorClient] = None
        self.redis_client: Optional[redis.Redis] = None
        self.db = None

    async def connect(self):
        """Initialize database connections"""
        # MongoDB connection
        self.mongo_client = AsyncIOMotorClient(self.mongodb_url)
        self.db = self.mongo_client.get_default_database()
        
        # Redis connection
        self.redis_client = redis.from_url(self.redis_url)
        
        # Test connections
        await self.mongo_client.admin.command('ping')
        await self.redis_client.ping()

    async def disconnect(self):
        """Close database connections"""
        if self.mongo_client:
            self.mongo_client.close()
        if self.redis_client:
            await self.redis_client.close()

    async def get_translation_collection(self):
        """Get translations collection"""
        return self.db.translations

    async def get_audiobook_collection(self):
        """Get audiobooks collection"""
        return self.db.audiobooks

    async def get_adaptation_collection(self):
        """Get content adaptations collection"""
        return self.db.adaptations

    async def cache_set(self, key: str, value: str, expire: int = 3600):
        """Set cache value with expiration"""
        await self.redis_client.set(key, value, ex=expire)

    async def cache_get(self, key: str) -> Optional[str]:
        """Get cache value"""
        result = await self.redis_client.get(key)
        return result.decode('utf-8') if result else None

    async def cache_delete(self, key: str):
        """Delete cache key"""
        await self.redis_client.delete(key)

# Global database manager instance
db_manager = DatabaseManager()