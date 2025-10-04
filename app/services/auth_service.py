from sqlalchemy.orm import Session
from fastapi import HTTPException, status
from app.models.user import User
from app.schemas.auth import UserRegister, UserLogin
from app.core.security import get_password_hash, verify_password, create_access_token

class AuthService:
    @staticmethod
    def register_user(db: Session, user_data: UserRegister) -> User:
        """Register a new user."""
        # Check if user already exists
        existing_user = db.query(User).filter(
            (User.email == user_data.email) | (User.username == user_data.username)
        ).first()
        
        if existing_user:
            if existing_user.email == user_data.email:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Email already registered"
                )
            else:
                raise HTTPException(
                    status_code=status.HTTP_400_BAD_REQUEST,
                    detail="Username already taken"
                )
        
        # Create new user with temporary username for onboarding
        import uuid
        hashed_password = get_password_hash(user_data.password)
        temp_username = f"user_{uuid.uuid4().hex[:8]}"  # Temporary username for onboarding
        
        db_user = User(
            email=user_data.email,
            username=temp_username,  # Will be updated during onboarding
            password_hash=hashed_password,
            is_writer=user_data.is_writer
        )
        
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user
    
    @staticmethod
    def authenticate_user(db: Session, user_data: UserLogin) -> User:
        """Authenticate a user and return user object if valid."""
        user = db.query(User).filter(User.email == user_data.email).first()
        
        if not user or not verify_password(user_data.password, user.password_hash):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Incorrect email or password"
            )
        
        return user
    
    @staticmethod
    def create_user_token(user: User) -> str:
        """Create access token for user."""
        return create_access_token(data={"sub": user.email, "user_id": str(user.id)})
    
    @staticmethod
    def get_user_by_email(db: Session, email: str) -> User:
        """Get user by email."""
        return db.query(User).filter(User.email == email).first()
    
    @staticmethod
    def set_vault_password(db: Session, user: User, vault_password: str) -> User:
        """Set vault password for user."""
        hashed_vault_password = get_password_hash(vault_password)
        user.vault_password_hash = hashed_vault_password
        db.commit()
        db.refresh(user)
        return user