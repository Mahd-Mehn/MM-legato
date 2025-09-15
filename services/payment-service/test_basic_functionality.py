#!/usr/bin/env python3
"""
Basic functionality test for the payment service
"""

import uuid
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, CoinPackage, CoinBalance, Transaction, CurrencyType, TransactionType
from payment_service import PaymentService
from schemas import CoinPackageCreate, SpendCoinsRequest

def test_basic_functionality():
    """Test basic payment service functionality"""
    
    # Create in-memory SQLite database for testing
    engine = create_engine("sqlite:///./test_basic.db", echo=False)
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize payment service
        payment_service = PaymentService(db)
        
        print("✓ Payment service initialized")
        
        # Test 1: Create coin package
        package_data = CoinPackageCreate(
            name="Test Package",
            description="Test coin package",
            coin_amount=100,
            base_price_usd=Decimal("1.99"),
            bonus_percentage=Decimal("10.00")
        )
        
        package = payment_service.create_coin_package(package_data)
        print(f"✓ Created coin package: {package.name} - {package.coin_amount} coins for ${package.base_price_usd}")
        
        # Test 2: Create user balance
        user_id = uuid.uuid4()
        balance = payment_service.get_or_create_coin_balance(user_id)
        print(f"✓ Created user balance: {balance.balance} coins")
        
        # Test 3: Add coins to user
        updated_balance = payment_service.update_coin_balance(user_id, 100, TransactionType.COIN_PURCHASE)
        print(f"✓ Added 100 coins. New balance: {updated_balance.balance}")
        
        # Test 4: Spend coins
        content_id = uuid.uuid4()
        spend_request = SpendCoinsRequest(
            coin_amount=50,
            content_id=content_id,
            description="Purchase premium chapter"
        )
        
        transaction = payment_service.spend_coins(user_id, spend_request)
        print(f"✓ Spent 50 coins. Transaction ID: {transaction.id}")
        
        # Test 5: Check final balance
        final_balance = payment_service.get_user_balance(user_id)
        print(f"✓ Final balance: {final_balance} coins")
        
        # Test 6: Get transaction history
        transactions = payment_service.get_user_transactions(user_id)
        print(f"✓ Retrieved {len(transactions)} transactions")
        
        # Test 7: Get spending analytics
        analytics = payment_service.get_user_spending_summary(user_id)
        print(f"✓ Analytics - Earned: {analytics['lifetime_earned']}, Spent: {analytics['lifetime_spent']}")
        
        print("\n🎉 All basic functionality tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_basic_functionality()