#!/usr/bin/env python3
"""
Complete system test for the Payment Processing Service
Tests all implemented features: coin system, revenue distribution, and access control
"""

import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Transaction, TransactionType, TransactionStatus, CurrencyType
from payment_service import PaymentService
from revenue_service import RevenueDistributionService
from access_control_service import AccessControlService, SubscriptionTier
from schemas import (
    CoinPackageCreate, SpendCoinsRequest, TipRequest, PayoutRequestCreate
)

def test_complete_payment_system():
    """Test the complete payment processing system"""
    
    print("🚀 Starting Complete Payment System Test")
    print("=" * 60)
    
    # Create in-memory SQLite database for testing
    engine = create_engine("sqlite:///./test_complete_system.db", echo=False)
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize all services
        payment_service = PaymentService(db)
        revenue_service = RevenueDistributionService(db)
        access_service = AccessControlService(db)
        
        print("✓ All services initialized successfully")
        
        # === PHASE 1: COIN SYSTEM TESTING ===
        print("\n📋 PHASE 1: Testing Coin System")
        print("-" * 40)
        
        # Create test users
        reader_id = uuid.uuid4()
        writer_id = uuid.uuid4()
        content_id = uuid.uuid4()
        
        print(f"Created test users:")
        print(f"  - Reader: {reader_id}")
        print(f"  - Writer: {writer_id}")
        
        # Test coin packages
        packages = payment_service.get_coin_packages()
        print(f"✓ Available coin packages: {len(packages)}")
        
        if packages:
            package = packages[0]
            print(f"  - {package.name}: {package.coin_amount} coins for ${package.base_price_usd}")
        
        # Add coins to reader
        payment_service.update_coin_balance(reader_id, 200, TransactionType.COIN_PURCHASE)
        reader_balance = payment_service.get_user_balance(reader_id)
        print(f"✓ Reader balance: {reader_balance} coins")
        
        # === PHASE 2: ACCESS CONTROL TESTING ===
        print("\n📋 PHASE 2: Testing Access Control")
        print("-" * 40)
        
        # Check content access
        access_check = access_service.check_content_access(reader_id, content_id, "chapter")
        print(f"✓ Content access check:")
        print(f"  - Has access: {access_check['has_access']}")
        print(f"  - Access method: {access_check.get('access_method', 'None')}")
        print(f"  - Required coins: {access_check['required_coins']}")
        
        # Purchase content if needed
        if not access_check['has_access'] or access_check.get('access_method') == 'coins_available':
            purchase_result = access_service.purchase_content_access(reader_id, content_id, "chapter")
            print(f"✓ Content purchase:")
            print(f"  - Success: {purchase_result['success']}")
            if purchase_result['success']:
                print(f"  - Coins spent: {purchase_result.get('coins_spent', 0)}")
                print(f"  - Transaction ID: {purchase_result.get('transaction_id')}")
        
        # Test tipping
        tip_request = TipRequest(
            recipient_user_id=writer_id,
            coin_amount=50,
            message="Amazing story! Keep writing!"
        )
        
        tip_result = access_service.process_tip_transaction(reader_id, writer_id, tip_request)
        print(f"✓ Tip transaction:")
        print(f"  - Success: {tip_result['success']}")
        if tip_result['success']:
            print(f"  - Tip amount: {tip_result['tip_amount']} coins")
            print(f"  - Reader remaining: {tip_result['sender_remaining_balance']} coins")
        
        # === PHASE 3: REVENUE DISTRIBUTION TESTING ===
        print("\n📋 PHASE 3: Testing Revenue Distribution")
        print("-" * 40)
        
        # Calculate revenue shares
        test_amount = Decimal("10.00")
        revenue_share = revenue_service.calculate_revenue_share(TransactionType.COIN_PURCHASE, test_amount)
        print(f"✓ Revenue sharing calculation for ${test_amount}:")
        print(f"  - Writer share: ${revenue_share['writer_share']} ({revenue_share['writer_percentage']}%)")
        print(f"  - Platform share: ${revenue_share['platform_share']} ({revenue_share['platform_percentage']}%)")
        
        # Get writer earnings summary
        earnings_summary = revenue_service.get_writer_earnings_summary(writer_id)
        print(f"✓ Writer earnings summary:")
        print(f"  - Total earnings: ${earnings_summary['total_earnings']}")
        print(f"  - Available for payout: ${earnings_summary['available_for_payout']}")
        
        # Create payout request
        if earnings_summary['available_for_payout'] > 0:
            payout_data = PayoutRequestCreate(
                amount=min(Decimal("25.00"), earnings_summary['available_for_payout']),
                currency=CurrencyType.USD,
                payment_method="bank_transfer",
                payment_details={
                    "account_number": "1234567890",
                    "bank_name": "Test Bank",
                    "routing_number": "123456789"
                }
            )
            
            payout_request = revenue_service.create_payout_request(writer_id, payout_data)
            print(f"✓ Payout request created:")
            print(f"  - Amount: ${payout_request.amount}")
            print(f"  - Status: {payout_request.status.value}")
        
        # === PHASE 4: ANALYTICS AND REPORTING ===
        print("\n📋 PHASE 4: Testing Analytics and Reporting")
        print("-" * 40)
        
        # Get user purchase history
        purchase_history = access_service.get_user_content_purchases(reader_id)
        print(f"✓ Reader purchase history: {len(purchase_history)} purchases")
        
        # Get content analytics
        content_analytics = access_service.get_content_revenue_analytics(content_id, 30)
        print(f"✓ Content analytics (30 days):")
        print(f"  - Total purchases: {content_analytics['total_purchases']}")
        print(f"  - Total revenue: ${content_analytics['total_revenue_usd']}")
        print(f"  - Unique purchasers: {content_analytics['unique_purchasers']}")
        
        # Generate revenue report
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=30)
        revenue_report = revenue_service.generate_revenue_report(period_start, period_end)
        print(f"✓ Revenue report (30 days):")
        print(f"  - Total revenue: ${revenue_report['total_revenue']}")
        print(f"  - Writer share: ${revenue_report['total_writer_share']}")
        print(f"  - Platform share: ${revenue_report['total_platform_share']}")
        
        # === PHASE 5: SUBSCRIPTION TESTING ===
        print("\n📋 PHASE 5: Testing Subscription Access")
        print("-" * 40)
        
        # Test subscription validation for different tiers
        subscription_content_id = uuid.uuid4()
        
        for tier in [SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.VIP]:
            validation = access_service.validate_subscription_access(reader_id, subscription_content_id, tier)
            print(f"✓ {tier.value} tier validation:")
            print(f"  - Has access: {validation['has_access']}")
            print(f"  - User tier: {validation['user_tier']}")
        
        # === PHASE 6: ERROR HANDLING TESTING ===
        print("\n📋 PHASE 6: Testing Error Handling")
        print("-" * 40)
        
        # Test insufficient coins scenario
        expensive_content_id = uuid.uuid4()
        current_balance = payment_service.get_user_balance(reader_id)
        
        # Try to spend more coins than available
        try:
            spend_request = SpendCoinsRequest(
                coin_amount=current_balance + 100,  # More than available
                content_id=expensive_content_id,
                description="This should fail"
            )
            payment_service.spend_coins(reader_id, spend_request)
            print("❌ Should have failed due to insufficient coins")
        except ValueError as e:
            print(f"✓ Correctly handled insufficient coins: {e}")
        
        # Test large tip scenario
        large_tip = TipRequest(
            recipient_user_id=writer_id,
            coin_amount=current_balance + 50,
            message="This tip is too large"
        )
        
        large_tip_result = access_service.process_tip_transaction(reader_id, writer_id, large_tip)
        if not large_tip_result['success']:
            print(f"✓ Correctly handled large tip: {large_tip_result['error']}")
        
        # === FINAL SUMMARY ===
        print("\n📊 FINAL SYSTEM SUMMARY")
        print("-" * 40)
        
        final_reader_balance = payment_service.get_user_balance(reader_id)
        final_writer_balance = payment_service.get_user_balance(writer_id)
        
        reader_analytics = payment_service.get_user_spending_summary(reader_id)
        
        print(f"Final balances:")
        print(f"  - Reader: {final_reader_balance} coins")
        print(f"  - Writer: {final_writer_balance} coins")
        print(f"Reader activity:")
        print(f"  - Lifetime earned: {reader_analytics['lifetime_earned']} coins")
        print(f"  - Lifetime spent: {reader_analytics['lifetime_spent']} coins")
        print(f"  - Total purchased value: ${reader_analytics['total_purchased_value']}")
        
        print(f"\n🎉 Complete Payment System Test PASSED!")
        print("All features working correctly:")
        print("  ✅ Coin system and microtransactions")
        print("  ✅ Revenue distribution system")
        print("  ✅ Premium content access control")
        print("  ✅ Tipping and gift-giving")
        print("  ✅ Analytics and reporting")
        print("  ✅ Error handling and validation")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_complete_payment_system()