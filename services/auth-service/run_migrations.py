#!/usr/bin/env python3
"""
Script to run database migrations for auth service
"""
import sys
import os

# Add current directory to path for imports
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from migrations import run_migrations, create_admin_user

def main():
    """Main migration runner"""
    print("🚀 Starting Legato Auth Service Database Migration")
    print("=" * 50)
    
    # Run migrations
    print("\n📊 Running database migrations...")
    if not run_migrations():
        print("❌ Migration failed!")
        sys.exit(1)
    
    # Create admin user
    print("\n👤 Creating default admin user...")
    if not create_admin_user():
        print("⚠️  Admin user creation failed (may already exist)")
    
    print("\n✅ Migration completed successfully!")
    print("🎉 Auth service database is ready!")

if __name__ == "__main__":
    main()