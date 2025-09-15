from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import func, and_
from models import (
    Transaction, CoinBalance, PayoutRequest, CurrencyRate,
    TransactionStatus, TransactionType, CurrencyType
)
from schemas import PayoutRequestCreate
from decimal import Decimal
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime, timedelta

logger = logging.getLogger(__name__)

class RevenueDistributionService:
    """Service for handling revenue distribution and payouts"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Revenue Sharing Configuration
    REVENUE_SHARES = {
        TransactionType.COIN_PURCHASE: {
            "writer_percentage": Decimal("70.00"),  # 70% to writers
            "platform_percentage": Decimal("30.00")  # 30% to platform
        },
        TransactionType.SUBSCRIPTION: {
            "writer_percentage": Decimal("65.00"),  # 65% to writers (engagement-based)
            "platform_percentage": Decimal("35.00")  # 35% to platform
        },
        "licensing": {
            "writer_percentage": Decimal("85.00"),  # 85% to writers
            "platform_percentage": Decimal("15.00")  # 15% to platform
        },
        "advertising": {
            "writer_percentage": Decimal("60.00"),  # 60% to writers
            "platform_percentage": Decimal("40.00")  # 40% to platform
        }
    }
    
    def calculate_revenue_share(self, transaction_type: TransactionType, amount: Decimal) -> Dict[str, Decimal]:
        """Calculate revenue distribution for a transaction"""
        try:
            if transaction_type in self.REVENUE_SHARES:
                config = self.REVENUE_SHARES[transaction_type]
            else:
                # Default to coin purchase rates
                config = self.REVENUE_SHARES[TransactionType.COIN_PURCHASE]
            
            writer_share = amount * (config["writer_percentage"] / 100)
            platform_share = amount * (config["platform_percentage"] / 100)
            
            return {
                "writer_share": writer_share,
                "platform_share": platform_share,
                "writer_percentage": config["writer_percentage"],
                "platform_percentage": config["platform_percentage"]
            }
        except Exception as e:
            logger.error(f"Error calculating revenue share: {e}")
            raise
    
    def process_content_purchase_revenue(self, transaction_id: uuid.UUID, writer_id: uuid.UUID) -> Dict[str, Any]:
        """Process revenue distribution for content purchase"""
        try:
            # Get the transaction
            transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
            if not transaction:
                raise ValueError(f"Transaction not found: {transaction_id}")
            
            if transaction.transaction_type != TransactionType.COIN_SPEND:
                raise ValueError(f"Invalid transaction type for content purchase: {transaction.transaction_type}")
            
            # Calculate coin value in fiat currency (assuming 1 coin = $0.01 USD)
            coin_value_usd = Decimal(abs(transaction.coin_amount)) * Decimal("0.01")
            
            # Calculate revenue shares
            revenue_share = self.calculate_revenue_share(TransactionType.COIN_PURCHASE, coin_value_usd)
            
            # Create revenue distribution record
            revenue_record = {
                "transaction_id": transaction_id,
                "writer_id": writer_id,
                "content_id": transaction.related_content_id,
                "total_amount": coin_value_usd,
                "writer_amount": revenue_share["writer_share"],
                "platform_amount": revenue_share["platform_share"],
                "currency": CurrencyType.USD,
                "processed_at": datetime.utcnow()
            }
            
            # Add to writer's pending earnings
            self._add_writer_earnings(writer_id, revenue_share["writer_share"], CurrencyType.USD)
            
            logger.info(f"Processed content purchase revenue: ${revenue_share['writer_share']} to writer {writer_id}")
            
            return revenue_record
        except Exception as e:
            logger.error(f"Error processing content purchase revenue: {e}")
            raise
    
    def process_subscription_revenue_pool(self, period_start: datetime, period_end: datetime) -> List[Dict[str, Any]]:
        """Process subscription revenue distribution based on engagement metrics"""
        try:
            # Get all subscription transactions in the period
            subscription_transactions = (
                self.db.query(Transaction)
                .filter(Transaction.transaction_type == TransactionType.SUBSCRIPTION)
                .filter(Transaction.status == TransactionStatus.COMPLETED)
                .filter(and_(
                    Transaction.completed_at >= period_start,
                    Transaction.completed_at <= period_end
                ))
                .all()
            )
            
            if not subscription_transactions:
                logger.info("No subscription transactions found for the period")
                return []
            
            # Calculate total subscription revenue
            total_subscription_revenue = sum(
                t.fiat_amount or Decimal("0") for t in subscription_transactions
            )
            
            # Calculate writer's share of total pool
            revenue_share = self.calculate_revenue_share(TransactionType.SUBSCRIPTION, total_subscription_revenue)
            total_writer_pool = revenue_share["writer_share"]
            
            # Get engagement metrics for all writers in the period
            # This would typically come from analytics service
            # For now, we'll simulate based on content views/reads
            writer_engagement = self._calculate_writer_engagement_metrics(period_start, period_end)
            
            # Distribute revenue based on engagement
            distributions = []
            total_engagement = sum(writer_engagement.values())
            
            if total_engagement > 0:
                for writer_id, engagement_score in writer_engagement.items():
                    writer_share = total_writer_pool * (Decimal(str(engagement_score)) / Decimal(str(total_engagement)))
                    
                    if writer_share > 0:
                        # Add to writer's pending earnings
                        self._add_writer_earnings(writer_id, writer_share, CurrencyType.USD)
                        
                        distributions.append({
                            "writer_id": writer_id,
                            "engagement_score": engagement_score,
                            "revenue_share": writer_share,
                            "period_start": period_start,
                            "period_end": period_end
                        })
            
            logger.info(f"Distributed ${total_writer_pool} subscription revenue to {len(distributions)} writers")
            return distributions
        except Exception as e:
            logger.error(f"Error processing subscription revenue pool: {e}")
            raise
    
    def _calculate_writer_engagement_metrics(self, period_start: datetime, period_end: datetime) -> Dict[uuid.UUID, int]:
        """Calculate engagement metrics for writers in the given period"""
        # This is a simplified implementation
        # In production, this would integrate with analytics service
        
        # Get all content purchases in the period as a proxy for engagement
        content_purchases = (
            self.db.query(Transaction)
            .filter(Transaction.transaction_type == TransactionType.COIN_SPEND)
            .filter(Transaction.status == TransactionStatus.COMPLETED)
            .filter(and_(
                Transaction.completed_at >= period_start,
                Transaction.completed_at <= period_end
            ))
            .filter(Transaction.related_content_id.isnot(None))
            .all()
        )
        
        # Group by content and calculate engagement scores
        # This would need integration with content service to map content to writers
        writer_engagement = {}
        
        for transaction in content_purchases:
            # For simulation, we'll use a hash of content_id to determine writer
            # In production, this would be a proper lookup
            simulated_writer_id = uuid.UUID(int=hash(str(transaction.related_content_id)) % (2**128))
            
            if simulated_writer_id not in writer_engagement:
                writer_engagement[simulated_writer_id] = 0
            
            # Engagement score based on coin amount spent
            writer_engagement[simulated_writer_id] += abs(transaction.coin_amount)
        
        return writer_engagement
    
    def _add_writer_earnings(self, writer_id: uuid.UUID, amount: Decimal, currency: CurrencyType):
        """Add earnings to writer's pending balance"""
        # This would typically be stored in a separate earnings table
        # For now, we'll log the earnings
        logger.info(f"Added ${amount} {currency.value} earnings to writer {writer_id}")
        
        # In production, you would:
        # 1. Store in writer_earnings table
        # 2. Update writer's total pending earnings
        # 3. Trigger notification to writer
        # 4. Update analytics/reporting data
    
    # Payout Processing
    def create_payout_request(self, writer_id: uuid.UUID, payout_data: PayoutRequestCreate) -> PayoutRequest:
        """Create a new payout request for a writer"""
        try:
            # Validate writer has sufficient earnings
            # This would check against writer_earnings table in production
            
            # Convert payment_details dict to JSON string
            import json
            payout_dict = payout_data.dict()
            payout_dict['payment_details'] = json.dumps(payout_dict['payment_details'])
            
            payout_request = PayoutRequest(
                writer_id=writer_id,
                **payout_dict
            )
            
            self.db.add(payout_request)
            self.db.commit()
            self.db.refresh(payout_request)
            
            logger.info(f"Created payout request: {payout_request.id} for writer {writer_id}")
            return payout_request
        except SQLAlchemyError as e:
            logger.error(f"Error creating payout request: {e}")
            self.db.rollback()
            raise
    
    def get_writer_payout_requests(self, writer_id: uuid.UUID, limit: int = 50) -> List[PayoutRequest]:
        """Get payout requests for a writer"""
        return (
            self.db.query(PayoutRequest)
            .filter(PayoutRequest.writer_id == writer_id)
            .order_by(PayoutRequest.created_at.desc())
            .limit(limit)
            .all()
        )
    
    def process_payout_request(self, payout_id: uuid.UUID, external_payout_id: str = None) -> PayoutRequest:
        """Process a payout request"""
        try:
            payout_request = self.db.query(PayoutRequest).filter(PayoutRequest.id == payout_id).first()
            if not payout_request:
                raise ValueError(f"Payout request not found: {payout_id}")
            
            # In production, this would:
            # 1. Integrate with payment processor for bank transfers
            # 2. Handle different payout methods (bank, PayPal, etc.)
            # 3. Validate banking details
            # 4. Process the actual transfer
            
            payout_request.status = TransactionStatus.COMPLETED
            payout_request.processed_at = datetime.utcnow()
            if external_payout_id:
                payout_request.external_payout_id = external_payout_id
            
            self.db.commit()
            self.db.refresh(payout_request)
            
            logger.info(f"Processed payout request: {payout_id}")
            return payout_request
        except SQLAlchemyError as e:
            logger.error(f"Error processing payout request: {e}")
            self.db.rollback()
            raise
    
    # Financial Reporting
    def generate_revenue_report(self, period_start: datetime, period_end: datetime) -> Dict[str, Any]:
        """Generate revenue report for a given period"""
        try:
            # Get all completed transactions in the period
            transactions = (
                self.db.query(Transaction)
                .filter(Transaction.status == TransactionStatus.COMPLETED)
                .filter(and_(
                    Transaction.completed_at >= period_start,
                    Transaction.completed_at <= period_end
                ))
                .all()
            )
            
            # Calculate totals by transaction type
            revenue_by_type = {}
            total_revenue = Decimal("0")
            total_writer_share = Decimal("0")
            total_platform_share = Decimal("0")
            
            for transaction in transactions:
                if transaction.fiat_amount:
                    transaction_type = transaction.transaction_type
                    if transaction_type not in revenue_by_type:
                        revenue_by_type[transaction_type] = {
                            "count": 0,
                            "total_amount": Decimal("0"),
                            "writer_share": Decimal("0"),
                            "platform_share": Decimal("0")
                        }
                    
                    amount = transaction.fiat_amount
                    revenue_share = self.calculate_revenue_share(transaction_type, amount)
                    
                    revenue_by_type[transaction_type]["count"] += 1
                    revenue_by_type[transaction_type]["total_amount"] += amount
                    revenue_by_type[transaction_type]["writer_share"] += revenue_share["writer_share"]
                    revenue_by_type[transaction_type]["platform_share"] += revenue_share["platform_share"]
                    
                    total_revenue += amount
                    total_writer_share += revenue_share["writer_share"]
                    total_platform_share += revenue_share["platform_share"]
            
            # Get payout statistics
            payouts = (
                self.db.query(PayoutRequest)
                .filter(and_(
                    PayoutRequest.created_at >= period_start,
                    PayoutRequest.created_at <= period_end
                ))
                .all()
            )
            
            total_payouts = sum(p.amount for p in payouts if p.status == TransactionStatus.COMPLETED)
            pending_payouts = sum(p.amount for p in payouts if p.status == TransactionStatus.PENDING)
            
            return {
                "period_start": period_start,
                "period_end": period_end,
                "total_revenue": total_revenue,
                "total_writer_share": total_writer_share,
                "total_platform_share": total_platform_share,
                "revenue_by_type": {k.value: v for k, v in revenue_by_type.items()},
                "payouts": {
                    "total_processed": total_payouts,
                    "total_pending": pending_payouts,
                    "count_processed": len([p for p in payouts if p.status == TransactionStatus.COMPLETED]),
                    "count_pending": len([p for p in payouts if p.status == TransactionStatus.PENDING])
                },
                "writer_retention": total_writer_share - total_payouts  # Earnings not yet paid out
            }
        except Exception as e:
            logger.error(f"Error generating revenue report: {e}")
            raise
    
    def get_writer_earnings_summary(self, writer_id: uuid.UUID) -> Dict[str, Any]:
        """Get earnings summary for a writer"""
        try:
            # Get all transactions where this writer earned revenue
            # This is simplified - in production you'd have a proper earnings tracking table
            
            # Calculate total earnings from content purchases (simulated)
            content_purchases = (
                self.db.query(Transaction)
                .filter(Transaction.transaction_type == TransactionType.COIN_SPEND)
                .filter(Transaction.status == TransactionStatus.COMPLETED)
                .filter(Transaction.related_content_id.isnot(None))
                .all()
            )
            
            # Simulate earnings calculation
            total_earnings = Decimal("0")
            for transaction in content_purchases:
                # In production, you'd look up if this writer owns the content
                coin_value = Decimal(abs(transaction.coin_amount)) * Decimal("0.01")
                revenue_share = self.calculate_revenue_share(TransactionType.COIN_PURCHASE, coin_value)
                # Simulate 10% of transactions belong to this writer
                if hash(str(transaction.id)) % 10 == hash(str(writer_id)) % 10:
                    total_earnings += revenue_share["writer_share"]
            
            # Get payout history
            payouts = self.get_writer_payout_requests(writer_id)
            total_paid_out = sum(p.amount for p in payouts if p.status == TransactionStatus.COMPLETED)
            pending_payouts = sum(p.amount for p in payouts if p.status == TransactionStatus.PENDING)
            
            return {
                "writer_id": writer_id,
                "total_earnings": total_earnings,
                "total_paid_out": total_paid_out,
                "pending_payouts": pending_payouts,
                "available_for_payout": total_earnings - total_paid_out - pending_payouts,
                "payout_count": len(payouts),
                "last_payout": max([p.processed_at for p in payouts if p.processed_at], default=None)
            }
        except Exception as e:
            logger.error(f"Error getting writer earnings summary: {e}")
            raise