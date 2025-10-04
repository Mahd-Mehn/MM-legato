from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
import os
from dotenv import load_dotenv

load_dotenv()

# Database URL - using PostgreSQL for production, SQLite for development
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite:///./legato.db")

# Create engine
if DATABASE_URL.startswith("sqlite"):
    engine = create_engine(DATABASE_URL, connect_args={"check_same_thread": False})
else:
    engine = create_engine(DATABASE_URL)

# Create SessionLocal class
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

# Dependency to get DB session
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Function to create all tables
def create_tables():
    """Create all database tables"""
    try:
        # Import all models to ensure they're registered with SQLAlchemy
        from app.models.base import Base
        from app.models import (
            User, Book, Chapter, UserLibrary, Bookmark, ReadingProgress,
            ReadingPreferences, Comment, CommentLike, BookReview, ReviewLike,
            CommentReport, ModerationLog, Character, Notification, NotificationType,
            Transaction, BookView, ChapterView, WriterEarnings
        )
        
        print("Creating database tables...")
        Base.metadata.create_all(bind=engine)
        print("Database tables created successfully!")
        
    except Exception as e:
        print(f"Error creating database tables: {e}")
        raise e