"""
Database migration utilities for auth service
"""
import os
from sqlalchemy import create_engine, text
from models import Base, User, UserProfile, UserSession, UserRole

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://legato_user:legato_pass@localhost:5432/legato_auth")

def run_migrations():
    """Run database migrations"""
    engine = create_engine(DATABASE_URL)
    
    try:
        # Create all tables
        Base.metadata.create_all(bind=engine)
        print("✓ Database tables created successfully")
        
        # Create indexes for performance
        with engine.connect() as conn:
            # Email index (already unique, but explicit for queries)
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_email_active 
                ON users(email) WHERE is_active = true;
            """))
            
            # Username index (already unique, but explicit for queries)
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_users_username_active 
                ON users(username) WHERE is_active = true;
            """))
            
            # Session token index for fast lookups
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_sessions_token_active 
                ON user_sessions(refresh_token) WHERE is_active = true;
            """))
            
            # User sessions by user_id and active status
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_sessions_user_active 
                ON user_sessions(user_id, is_active);
            """))
            
            # Expired sessions cleanup index
            conn.execute(text("""
                CREATE INDEX IF NOT EXISTS idx_sessions_expires_at 
                ON user_sessions(expires_at) WHERE is_active = true;
            """))
            
            conn.commit()
            print("✓ Database indexes created successfully")
        
        return True
        
    except Exception as e:
        print(f"✗ Migration failed: {e}")
        return False

def create_admin_user():
    """Create default admin user for testing"""
    from sqlalchemy.orm import sessionmaker
    
    engine = create_engine(DATABASE_URL)
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    db = SessionLocal()
    try:
        # Check if admin user already exists
        admin_user = db.query(User).filter(User.email == "admin@legato.com").first()
        if admin_user:
            print("✓ Admin user already exists")
            return True
        
        # Create admin user
        admin_user = User(
            email="admin@legato.com",
            username="admin",
            hashed_password=User.hash_password("admin123"),
            role=UserRole.ADMIN,
            is_active=True,
            is_verified=True
        )
        
        db.add(admin_user)
        db.commit()
        db.refresh(admin_user)
        
        # Create admin profile
        admin_profile = UserProfile(
            user_id=admin_user.id,
            display_name="Platform Administrator",
            bio="Default administrator account",
            language_preference="en"
        )
        
        db.add(admin_profile)
        db.commit()
        
        print("✓ Admin user created successfully")
        print(f"  Email: admin@legato.com")
        print(f"  Password: admin123")
        print(f"  User ID: {admin_user.id}")
        
        return True
        
    except Exception as e:
        print(f"✗ Failed to create admin user: {e}")
        db.rollback()
        return False
    finally:
        db.close()

if __name__ == "__main__":
    print("Running database migrations...")
    
    if run_migrations():
        print("\nCreating default admin user...")
        create_admin_user()
        print("\n✓ Migration completed successfully!")
    else:
        print("\n✗ Migration failed!")
        exit(1)