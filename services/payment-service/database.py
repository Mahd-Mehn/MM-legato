from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.exc import SQLAlchemyError
import os
import logging

logger = logging.getLogger(__name__)

# Database configuration
DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://legato_user:legato_pass@localhost:5432/legato_payments")

# Create engine with connection pooling
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_pre_ping=True,
    pool_recycle=300
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()

def get_db() -> Session:
    """Dependency to get database session"""
    db = SessionLocal()
    try:
        yield db
    except SQLAlchemyError as e:
        logger.error(f"Database error: {e}")
        db.rollback()
        raise
    finally:
        db.close()

def create_tables():
    """Create all tables"""
    from models import Base
    Base.metadata.create_all(bind=engine)
    logger.info("Database tables created successfully")

def init_default_data(db: Session):
    """Initialize default coin packages and currency rates"""
    from models import CoinPackage, CurrencyRate, CurrencyType
    from decimal import Decimal
    
    # Check if coin packages already exist
    existing_packages = db.query(CoinPackage).count()
    if existing_packages > 0:
        logger.info("Default coin packages already exist")
        return
    
    # Create default coin packages
    default_packages = [
        {
            "name": "Starter Pack",
            "description": "Perfect for new readers",
            "coin_amount": 100,
            "base_price_usd": Decimal("0.99"),
            "bonus_percentage": Decimal("0.00")
        },
        {
            "name": "Reader Pack",
            "description": "Great value for regular readers",
            "coin_amount": 500,
            "base_price_usd": Decimal("4.99"),
            "bonus_percentage": Decimal("5.00")
        },
        {
            "name": "Enthusiast Pack",
            "description": "For avid story lovers",
            "coin_amount": 1200,
            "base_price_usd": Decimal("9.99"),
            "bonus_percentage": Decimal("10.00")
        },
        {
            "name": "Premium Pack",
            "description": "Maximum value for serious readers",
            "coin_amount": 2500,
            "base_price_usd": Decimal("19.99"),
            "bonus_percentage": Decimal("15.00")
        },
        {
            "name": "Ultimate Pack",
            "description": "The ultimate reading experience",
            "coin_amount": 5500,
            "base_price_usd": Decimal("39.99"),
            "bonus_percentage": Decimal("20.00")
        }
    ]
    
    for package_data in default_packages:
        package = CoinPackage(**package_data)
        db.add(package)
    
    # Create default currency rates (approximate rates)
    default_rates = [
        # USD to other currencies
        {"from_currency": CurrencyType.USD, "to_currency": CurrencyType.NGN, "rate": Decimal("750.00")},
        {"from_currency": CurrencyType.USD, "to_currency": CurrencyType.CAD, "rate": Decimal("1.35")},
        
        # NGN to other currencies
        {"from_currency": CurrencyType.NGN, "to_currency": CurrencyType.USD, "rate": Decimal("0.00133")},
        {"from_currency": CurrencyType.NGN, "to_currency": CurrencyType.CAD, "rate": Decimal("0.0018")},
        
        # CAD to other currencies
        {"from_currency": CurrencyType.CAD, "to_currency": CurrencyType.USD, "rate": Decimal("0.74")},
        {"from_currency": CurrencyType.CAD, "to_currency": CurrencyType.NGN, "rate": Decimal("555.56")},
    ]
    
    for rate_data in default_rates:
        rate = CurrencyRate(**rate_data)
        db.add(rate)
    
    try:
        db.commit()
        logger.info("Default data initialized successfully")
    except SQLAlchemyError as e:
        logger.error(f"Error initializing default data: {e}")
        db.rollback()
        raise