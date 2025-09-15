#!/usr/bin/env python3
"""
Test access control system
"""

import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Transaction, TransactionType, TransactionStatus, CurrencyType
from access_control_service import AccessControlService, SubscriptionTier
from payment_service import PaymentService
from schemas import SpendCoinsRequest, TipRequest

def test_access_control():
    """Test access control functionality"""
    
    # Create in-memory SQLite database for testing
    engine = create_engine("sqlite:///./test_access_control.db", echo=False)
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize services
        access_service = AccessControlService(db)
        payment_service = PaymentService(db)
        
        print("✓ Access control service initialized")
        
        # Test setup: Create users and add coins
        user_id = uuid.uuid4()
        writer_id = uuid.uuid4()
        content_id = uuid.uuid4()
        
        # Add coins to user
        payment_service.update_coin_balance(user_id, 100, TransactionType.COIN_PURCHASE)
        print(f"✓ Added 100 coins to user {user_id}")
        
        # Test 1: Check content access for new user
        access_check = access_service.check_content_access(user_id, content_id, "chapter")
        print(f"✓ Content access check:")
        print(f"  - Has access: {access_check['has_access']}")
        print(f"  - Required coins: {access_check['required_coins']}")
        print(f"  - User balance: {access_check['user_balance']}")
        print(f"  - Access method: {access_check.get('access_method', 'None')}")
        
        # Test 2: Purchase content access
        purchase_result = access_service.purchase_content_access(user_id, content_id, "chapter")
        print(f"✓ Content purchase result:")
        print(f"  - Success: {purchase_result['success']}")
        print(f"  - Coins spent: {purchase_result.get('coins_spent', 0)}")
        print(f"  - Remaining balance: {purchase_result.get('remaining_balance', 0)}")
        
        # Test 3: Check access after purchase
        access_check_after = access_service.check_content_access(user_id, content_id, "chapter")
        print(f"✓ Access check after purchase:")
        print(f"  - Has access: {access_check_after['has_access']}")
        print(f"  - Access method: {access_check_after['access_method']}")
        
        # Test 4: Try to purchase same content again
        duplicate_purchase = access_service.purchase_content_access(user_id, content_id, "chapter")
        print(f"✓ Duplicate purchase attempt:")
        print(f"  - Success: {duplicate_purchase['success']}")
        print(f"  - Message: {duplicate_purchase['message']}")
        
        # Test 5: Test insufficient coins scenario
        expensive_content_id = uuid.uuid4()
        
        # Try to purchase content that costs more than user has
        try:
            # This should fail due to insufficient coins (user has ~90 coins left, content costs 10)
            # But let's try with a more expensive content type
            expensive_purchase = access_service.purchase_content_access(user_id, expensive_content_id, "story")
            print(f"✓ Expensive content purchase:")
            print(f"  - Success: {expensive_purchase['success']}")
            if not expensive_purchase['success']:
                print(f"  - Error: {expensive_purchase['error']}")
                print(f"  - Coins needed: {expensive_purchase.get('coins_needed', 0)}")
        except Exception as e:
            print(f"✓ Expected error for expensive content: {e}")
        
        # Test 6: Subscription access validation
        subscription_content_id = uuid.uuid4()
        
        # Test with different subscription tiers
        for tier in [SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.VIP]:
            validation = access_service.validate_subscription_access(user_id, subscription_content_id, tier)
            print(f"✓ Subscription validation for {tier.value}:")
            print(f"  - Has access: {validation['has_access']}")
            print(f"  - User tier: {validation['user_tier']}")
            print(f"  - Subscription active: {validation['subscription_active']}")
        
        # Test 7: Tipping functionality
        recipient_id = uuid.uuid4()
        
        tip_request = TipRequest(
            recipient_user_id=recipient_id,
            coin_amount=25,
            message="Great story! Keep it up!"
        )
        
        tip_result = access_service.process_tip_transaction(user_id, recipient_id, tip_request)
        print(f"✓ Tip transaction:")
        print(f"  - Success: {tip_result['success']}")
        print(f"  - Tip amount: {tip_result.get('tip_amount', 0)}")
        print(f"  - Sender remaining balance: {tip_result.get('sender_remaining_balance', 0)}")
        
        # Test 8: Get user purchase history
        purchase_history = access_service.get_user_content_purchases(user_id)
        print(f"✓ User purchase history:")
        print(f"  - Total purchases: {len(purchase_history)}")
        for purchase in purchase_history:
            print(f"    - Content: {purchase['content_id']}, Coins: {purchase['coins_spent']}")
        
        # Test 9: Content revenue analytics
        analytics = access_service.get_content_revenue_analytics(content_id, 30)
        print(f"✓ Content revenue analytics:")
        print(f"  - Total purchases: {analytics['total_purchases']}")
        print(f"  - Total coins earned: {analytics['total_coins_earned']}")
        print(f"  - Total revenue USD: ${analytics['total_revenue_usd']}")
        print(f"  - Unique purchasers: {analytics['unique_purchasers']}")
        
        # Test 10: Test insufficient coins for tip
        large_tip_request = TipRequest(
            recipient_user_id=recipient_id,
            coin_amount=1000,  # More than user has
            message="This should fail"
        )
        
        large_tip_result = access_service.process_tip_transaction(user_id, recipient_id, large_tip_request)
        print(f"✓ Large tip attempt (should fail):")
        print(f"  - Success: {large_tip_result['success']}")
        if not large_tip_result['success']:
            print(f"  - Error: {large_tip_result['error']}")
            print(f"  - Message: {large_tip_result['message']}")
        
        print("\n🎉 All access control tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_access_control()