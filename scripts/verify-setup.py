#!/usr/bin/env python3
"""
Verification script for Legato Platform setup
"""

import os
import sys
from pathlib import Path

def check_file_exists(filepath, description):
    """Check if a file exists and report status"""
    if Path(filepath).exists():
        print(f"✅ {description}: {filepath}")
        return True
    else:
        print(f"❌ {description}: {filepath} - NOT FOUND")
        return False

def check_directory_exists(dirpath, description):
    """Check if a directory exists and report status"""
    if Path(dirpath).is_dir():
        print(f"✅ {description}: {dirpath}")
        return True
    else:
        print(f"❌ {description}: {dirpath} - NOT FOUND")
        return False

def main():
    """Main verification function"""
    print("Legato Platform Setup Verification")
    print("=" * 40)
    
    all_good = True
    
    # Check main configuration files
    files_to_check = [
        ("docker-compose.yml", "Docker Compose configuration"),
        ("README.md", "Project documentation"),
        ("Makefile", "Development commands"),
        (".env.example", "Environment template"),
        (".gitignore", "Git ignore rules"),
        ("scripts/init-databases.sh", "Database initialization script"),
    ]
    
    for filepath, description in files_to_check:
        if not check_file_exists(filepath, description):
            all_good = False
    
    print("\nService Structure Check:")
    print("-" * 25)
    
    # Check service directories and files
    services = [
        "api-gateway",
        "auth-service", 
        "user-service",
        "content-service",
        "ip-service",
        "payment-service",
        "ai-service",
        "analytics-service"
    ]
    
    for service in services:
        service_dir = f"services/{service}"
        if not check_directory_exists(service_dir, f"{service} directory"):
            all_good = False
            continue
            
        # Check required files in each service
        required_files = [
            f"{service_dir}/Dockerfile",
            f"{service_dir}/main.py",
            f"{service_dir}/requirements.txt"
        ]
        
        for filepath in required_files:
            if not check_file_exists(filepath, f"{service} - {Path(filepath).name}"):
                all_good = False
    
    print("\nVerification Summary:")
    print("-" * 20)
    
    if all_good:
        print("🎉 All checks passed! The Legato Platform infrastructure is properly set up.")
        print("\nNext steps:")
        print("1. Copy .env.example to .env and configure your environment")
        print("2. Run 'make dev-setup' to start the platform")
        print("3. Check service health with 'make health'")
        return 0
    else:
        print("❌ Some checks failed. Please review the missing files/directories above.")
        return 1

if __name__ == "__main__":
    sys.exit(main())