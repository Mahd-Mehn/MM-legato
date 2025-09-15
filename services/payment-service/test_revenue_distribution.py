#!/usr/bin/env python3
"""
Test revenue distribution system
"""

import uuid
from decimal import Decimal
from datetime import datetime, timedelta
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from models import Base, Transaction, TransactionType, TransactionStatus, CurrencyType
from revenue_service import RevenueDistributionService
from schemas import PayoutRequestCreate

def test_revenue_distribution():
    """Test revenue distribution functionality"""
    
    # Create in-memory SQLite database for testing
    engine = create_engine("sqlite:///./test_revenue.db", echo=False)
    Base.metadata.create_all(engine)
    
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    db = SessionLocal()
    
    try:
        # Initialize revenue service
        revenue_service = RevenueDistributionService(db)
        
        print("✓ Revenue distribution service initialized")
        
        # Test 1: Calculate revenue share
        test_amount = Decimal("10.00")
        revenue_share = revenue_service.calculate_revenue_share(TransactionType.COIN_PURCHASE, test_amount)
        
        print(f"✓ Revenue share calculation:")
        print(f"  - Total: ${test_amount}")
        print(f"  - Writer: ${revenue_share['writer_share']} ({revenue_share['writer_percentage']}%)")
        print(f"  - Platform: ${revenue_share['platform_share']} ({revenue_share['platform_percentage']}%)")
        
        # Test 2: Create a content purchase transaction
        user_id = uuid.uuid4()
        writer_id = uuid.uuid4()
        content_id = uuid.uuid4()
        
        # Create a coin spend transaction (simulating content purchase)
        transaction = Transaction(
            user_id=user_id,
            transaction_type=TransactionType.COIN_SPEND,
            status=TransactionStatus.COMPLETED,
            coin_amount=-50,  # Spent 50 coins
            related_content_id=content_id,
            completed_at=datetime.utcnow()
        )
        
        db.add(transaction)
        db.commit()
        db.refresh(transaction)
        
        print(f"✓ Created content purchase transaction: {transaction.id}")
        
        # Test 3: Process content purchase revenue
        revenue_record = revenue_service.process_content_purchase_revenue(transaction.id, writer_id)
        
        print(f"✓ Processed content purchase revenue:")
        print(f"  - Writer earnings: ${revenue_record['writer_amount']}")
        print(f"  - Platform share: ${revenue_record['platform_amount']}")
        
        # Test 4: Create payout request
        payout_data = PayoutRequestCreate(
            amount=Decimal("25.00"),
            currency=CurrencyType.USD,
            payment_method="bank_transfer",
            payment_details={
                "account_number": "1234567890",
                "bank_name": "Test Bank",
                "routing_number": "123456789"
            }
        )
        
        payout_request = revenue_service.create_payout_request(writer_id, payout_data)
        print(f"✓ Created payout request: {payout_request.id} for ${payout_request.amount}")
        
        # Test 5: Process payout request
        processed_payout = revenue_service.process_payout_request(payout_request.id, "ext_payout_123")
        print(f"✓ Processed payout request: {processed_payout.status.value}")
        
        # Test 6: Get writer earnings summary
        earnings_summary = revenue_service.get_writer_earnings_summary(writer_id)
        print(f"✓ Writer earnings summary:")
        print(f"  - Total earnings: ${earnings_summary['total_earnings']}")
        print(f"  - Total paid out: ${earnings_summary['total_paid_out']}")
        print(f"  - Available for payout: ${earnings_summary['available_for_payout']}")
        
        # Test 7: Generate revenue report
        period_end = datetime.utcnow()
        period_start = period_end - timedelta(days=30)
        
        revenue_report = revenue_service.generate_revenue_report(period_start, period_end)
        print(f"✓ Revenue report (last 30 days):")
        print(f"  - Total revenue: ${revenue_report['total_revenue']}")
        print(f"  - Writer share: ${revenue_report['total_writer_share']}")
        print(f"  - Platform share: ${revenue_report['total_platform_share']}")
        print(f"  - Payouts processed: ${revenue_report['payouts']['total_processed']}")
        
        # Test 8: Test subscription revenue pool distribution
        # Create some subscription transactions
        for i in range(3):
            sub_transaction = Transaction(
                user_id=uuid.uuid4(),
                transaction_type=TransactionType.SUBSCRIPTION,
                status=TransactionStatus.COMPLETED,
                fiat_amount=Decimal("9.99"),
                currency=CurrencyType.USD,
                completed_at=datetime.utcnow() - timedelta(days=i)
            )
            db.add(sub_transaction)
        
        db.commit()
        
        distributions = revenue_service.process_subscription_revenue_pool(period_start, period_end)
        print(f"✓ Subscription revenue pool distributed to {len(distributions)} writers")
        
        if distributions:
            total_distributed = sum(d["revenue_share"] for d in distributions)
            print(f"  - Total distributed: ${total_distributed}")
        
        print("\n🎉 All revenue distribution tests passed!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")
        raise
    finally:
        db.close()

if __name__ == "__main__":
    test_revenue_distribution()