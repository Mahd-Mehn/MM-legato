from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from sqlalchemy import and_, or_
from models import (
    Transaction, CoinBalance, 
    TransactionStatus, TransactionType, CurrencyType
)
from schemas import SpendCoinsRequest, TipRequest
from decimal import Decimal
from typing import List, Optional, Dict, Any, Tuple
import uuid
import logging
from datetime import datetime, timedelta
from enum import Enum

logger = logging.getLogger(__name__)

class ContentAccessType(str, Enum):
    FREE = "free"
    COINS = "coins"
    SUBSCRIPTION = "subscription"
    PREMIUM_SUBSCRIPTION = "premium_subscription"

class SubscriptionTier(str, Enum):
    BASIC = "basic"
    PREMIUM = "premium"
    VIP = "vip"

class AccessControlService:
    """Service for managing premium content access control"""
    
    def __init__(self, db: Session):
        self.db = db
    
    # Content Access Pricing Configuration
    DEFAULT_PRICING = {
        "chapter": {
            "coins": 10,  # Default coins per chapter
            "subscription_tiers": [SubscriptionTier.BASIC, SubscriptionTier.PREMIUM, SubscriptionTier.VIP]
        },
        "story": {
            "coins": 50,  # Default coins for full story access
            "subscription_tiers": [SubscriptionTier.PREMIUM, SubscriptionTier.VIP]
        },
        "exclusive_content": {
            "coins": 25,  # Exclusive content pricing
            "subscription_tiers": [SubscriptionTier.VIP]
        }
    }
    
    def check_content_access(self, user_id: uuid.UUID, content_id: uuid.UUID, content_type: str = "chapter") -> Dict[str, Any]:
        """Check if user has access to premium content"""
        try:
            # Get user's coin balance
            from payment_service import PaymentService
            payment_service = PaymentService(self.db)
            user_balance = payment_service.get_user_balance(user_id)
            
            # Check if user has already purchased this content
            existing_purchase = (
                self.db.query(Transaction)
                .filter(Transaction.user_id == user_id)
                .filter(Transaction.transaction_type == TransactionType.COIN_SPEND)
                .filter(Transaction.related_content_id == content_id)
                .filter(Transaction.status == TransactionStatus.COMPLETED)
                .first()
            )
            
            # Get content pricing (in production, this would come from content service)
            content_pricing = self._get_content_pricing(content_id, content_type)
            
            # Check subscription status (simulated - would integrate with user service)
            user_subscription = self._get_user_subscription_status(user_id)
            
            access_result = {
                "user_id": user_id,
                "content_id": content_id,
                "content_type": content_type,
                "has_access": False,
                "access_method": None,
                "required_coins": content_pricing["coins"],
                "user_balance": user_balance,
                "subscription_status": user_subscription,
                "purchase_options": []
            }
            
            # Check access methods in order of preference
            
            # 1. Already purchased
            if existing_purchase:
                access_result.update({
                    "has_access": True,
                    "access_method": "previous_purchase",
                    "purchase_date": existing_purchase.completed_at
                })
                return access_result
            
            # 2. Subscription access
            if (user_subscription["active"] and 
                user_subscription["tier"] in content_pricing["subscription_tiers"]):
                access_result.update({
                    "has_access": True,
                    "access_method": "subscription",
                    "subscription_tier": user_subscription["tier"]
                })
                return access_result
            
            # 3. Coin purchase access
            if user_balance >= content_pricing["coins"]:
                access_result.update({
                    "has_access": True,
                    "access_method": "coins_available"
                })
            
            # Add purchase options
            access_result["purchase_options"] = self._get_purchase_options(content_pricing, user_subscription)
            
            return access_result
            
        except Exception as e:
            logger.error(f"Error checking content access: {e}")
            raise
    
    def purchase_content_access(self, user_id: uuid.UUID, content_id: uuid.UUID, content_type: str = "chapter") -> Dict[str, Any]:
        """Purchase access to premium content using coins"""
        try:
            # Check current access status
            access_check = self.check_content_access(user_id, content_id, content_type)
            
            if access_check["has_access"] and access_check["access_method"] != "coins_available":
                return {
                    "success": True,
                    "message": "User already has access to this content",
                    "access_method": access_check["access_method"]
                }
            
            # Get content pricing
            content_pricing = self._get_content_pricing(content_id, content_type)
            required_coins = content_pricing["coins"]
            
            # Check if user has sufficient coins
            if access_check["user_balance"] < required_coins:
                return {
                    "success": False,
                    "error": "insufficient_coins",
                    "message": f"Insufficient coins. Required: {required_coins}, Available: {access_check['user_balance']}",
                    "required_coins": required_coins,
                    "user_balance": access_check["user_balance"],
                    "coins_needed": required_coins - access_check["user_balance"]
                }
            
            # Process coin spending
            from payment_service import PaymentService
            payment_service = PaymentService(self.db)
            
            spend_request = SpendCoinsRequest(
                coin_amount=required_coins,
                content_id=content_id,
                description=f"Access to {content_type}: {content_id}"
            )
            
            transaction = payment_service.spend_coins(user_id, spend_request)
            
            # Process revenue distribution (would integrate with revenue service)
            self._process_content_revenue_distribution(transaction.id, content_id, content_type)
            
            return {
                "success": True,
                "message": "Content access purchased successfully",
                "transaction_id": transaction.id,
                "coins_spent": required_coins,
                "remaining_balance": access_check["user_balance"] - required_coins,
                "access_granted_at": transaction.completed_at
            }
            
        except Exception as e:
            logger.error(f"Error purchasing content access: {e}")
            raise
    
    def validate_subscription_access(self, user_id: uuid.UUID, content_id: uuid.UUID, required_tier: SubscriptionTier) -> Dict[str, Any]:
        """Validate subscription-based content access"""
        try:
            user_subscription = self._get_user_subscription_status(user_id)
            
            access_result = {
                "user_id": user_id,
                "content_id": content_id,
                "required_tier": required_tier.value,
                "user_tier": user_subscription["tier"],
                "subscription_active": user_subscription["active"],
                "has_access": False
            }
            
            if not user_subscription["active"]:
                access_result["error"] = "subscription_inactive"
                access_result["message"] = "User subscription is not active"
                return access_result
            
            # Check tier hierarchy: VIP > PREMIUM > BASIC
            tier_hierarchy = {
                SubscriptionTier.BASIC: 1,
                SubscriptionTier.PREMIUM: 2,
                SubscriptionTier.VIP: 3
            }
            
            user_tier_level = tier_hierarchy.get(SubscriptionTier(user_subscription["tier"]), 0)
            required_tier_level = tier_hierarchy.get(required_tier, 0)
            
            if user_tier_level >= required_tier_level:
                access_result.update({
                    "has_access": True,
                    "message": "Subscription access granted"
                })
            else:
                access_result.update({
                    "error": "insufficient_tier",
                    "message": f"Content requires {required_tier.value} tier or higher"
                })
            
            return access_result
            
        except Exception as e:
            logger.error(f"Error validating subscription access: {e}")
            raise
    
    def process_tip_transaction(self, sender_id: uuid.UUID, recipient_id: uuid.UUID, tip_request: TipRequest) -> Dict[str, Any]:
        """Process tipping transaction with access control"""
        try:
            # Check sender's balance
            from payment_service import PaymentService
            payment_service = PaymentService(self.db)
            
            sender_balance = payment_service.get_user_balance(sender_id)
            
            if sender_balance < tip_request.coin_amount:
                return {
                    "success": False,
                    "error": "insufficient_coins",
                    "message": f"Insufficient coins for tip. Available: {sender_balance}, Required: {tip_request.coin_amount}",
                    "sender_balance": sender_balance,
                    "tip_amount": tip_request.coin_amount
                }
            
            # Process the tip
            transaction = payment_service.send_tip(sender_id, tip_request)
            
            # Log tip for analytics
            self._log_tip_analytics(sender_id, recipient_id, tip_request.coin_amount, tip_request.message)
            
            return {
                "success": True,
                "message": "Tip sent successfully",
                "transaction_id": transaction.id,
                "sender_id": sender_id,
                "recipient_id": recipient_id,
                "tip_amount": tip_request.coin_amount,
                "sender_remaining_balance": sender_balance - tip_request.coin_amount,
                "sent_at": transaction.completed_at
            }
            
        except Exception as e:
            logger.error(f"Error processing tip transaction: {e}")
            raise
    
    def get_user_content_purchases(self, user_id: uuid.UUID, limit: int = 50) -> List[Dict[str, Any]]:
        """Get user's content purchase history"""
        try:
            purchases = (
                self.db.query(Transaction)
                .filter(Transaction.user_id == user_id)
                .filter(Transaction.transaction_type == TransactionType.COIN_SPEND)
                .filter(Transaction.status == TransactionStatus.COMPLETED)
                .filter(Transaction.related_content_id.isnot(None))
                .order_by(Transaction.completed_at.desc())
                .limit(limit)
                .all()
            )
            
            purchase_history = []
            for purchase in purchases:
                purchase_info = {
                    "transaction_id": purchase.id,
                    "content_id": purchase.related_content_id,
                    "coins_spent": abs(purchase.coin_amount),
                    "purchase_date": purchase.completed_at,
                    "description": purchase.description
                }
                purchase_history.append(purchase_info)
            
            return purchase_history
            
        except Exception as e:
            logger.error(f"Error getting user content purchases: {e}")
            raise
    
    def get_content_revenue_analytics(self, content_id: uuid.UUID, period_days: int = 30) -> Dict[str, Any]:
        """Get revenue analytics for specific content"""
        try:
            period_start = datetime.utcnow() - timedelta(days=period_days)
            
            # Get all purchases for this content
            purchases = (
                self.db.query(Transaction)
                .filter(Transaction.transaction_type == TransactionType.COIN_SPEND)
                .filter(Transaction.status == TransactionStatus.COMPLETED)
                .filter(Transaction.related_content_id == content_id)
                .filter(Transaction.completed_at >= period_start)
                .all()
            )
            
            # Calculate analytics
            total_purchases = len(purchases)
            total_coins_earned = sum(abs(p.coin_amount) for p in purchases)
            total_revenue_usd = total_coins_earned * Decimal("0.01")  # Assuming 1 coin = $0.01
            
            # Get unique purchasers
            unique_purchasers = len(set(p.user_id for p in purchases))
            
            # Calculate daily breakdown
            daily_stats = {}
            for purchase in purchases:
                date_key = purchase.completed_at.date()
                if date_key not in daily_stats:
                    daily_stats[date_key] = {"purchases": 0, "coins": 0, "unique_users": set()}
                
                daily_stats[date_key]["purchases"] += 1
                daily_stats[date_key]["coins"] += abs(purchase.coin_amount)
                daily_stats[date_key]["unique_users"].add(purchase.user_id)
            
            # Convert sets to counts for JSON serialization
            for date_key in daily_stats:
                daily_stats[date_key]["unique_users"] = len(daily_stats[date_key]["unique_users"])
            
            return {
                "content_id": content_id,
                "period_days": period_days,
                "period_start": period_start,
                "total_purchases": total_purchases,
                "total_coins_earned": total_coins_earned,
                "total_revenue_usd": total_revenue_usd,
                "unique_purchasers": unique_purchasers,
                "average_coins_per_purchase": total_coins_earned / total_purchases if total_purchases > 0 else 0,
                "daily_breakdown": {str(k): v for k, v in daily_stats.items()}
            }
            
        except Exception as e:
            logger.error(f"Error getting content revenue analytics: {e}")
            raise
    
    # Helper methods
    def _get_content_pricing(self, content_id: uuid.UUID, content_type: str) -> Dict[str, Any]:
        """Get pricing information for content (simulated - would integrate with content service)"""
        # In production, this would query the content service for actual pricing
        # For now, return default pricing based on content type
        
        if content_type in self.DEFAULT_PRICING:
            return self.DEFAULT_PRICING[content_type].copy()
        else:
            return self.DEFAULT_PRICING["chapter"].copy()  # Default to chapter pricing
    
    def _get_user_subscription_status(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get user's subscription status (simulated - would integrate with user service)"""
        # In production, this would query the user service for actual subscription status
        # For simulation, we'll create a basic subscription status
        
        # Simulate subscription status based on user ID hash
        user_hash = hash(str(user_id))
        
        if user_hash % 4 == 0:
            # 25% have VIP subscription
            return {
                "active": True,
                "tier": SubscriptionTier.VIP.value,
                "expires_at": datetime.utcnow() + timedelta(days=30)
            }
        elif user_hash % 4 == 1:
            # 25% have Premium subscription
            return {
                "active": True,
                "tier": SubscriptionTier.PREMIUM.value,
                "expires_at": datetime.utcnow() + timedelta(days=30)
            }
        elif user_hash % 4 == 2:
            # 25% have Basic subscription
            return {
                "active": True,
                "tier": SubscriptionTier.BASIC.value,
                "expires_at": datetime.utcnow() + timedelta(days=30)
            }
        else:
            # 25% have no active subscription
            return {
                "active": False,
                "tier": None,
                "expires_at": None
            }
    
    def _get_purchase_options(self, content_pricing: Dict[str, Any], user_subscription: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get available purchase options for content"""
        options = []
        
        # Coin purchase option
        options.append({
            "method": "coins",
            "cost": content_pricing["coins"],
            "currency": "coins",
            "description": f"Purchase with {content_pricing['coins']} coins"
        })
        
        # Subscription upgrade options
        if not user_subscription["active"]:
            options.extend([
                {
                    "method": "subscription",
                    "tier": "basic",
                    "cost": 9.99,
                    "currency": "USD",
                    "description": "Subscribe to Basic plan for unlimited access"
                },
                {
                    "method": "subscription",
                    "tier": "premium",
                    "cost": 19.99,
                    "currency": "USD",
                    "description": "Subscribe to Premium plan for unlimited access + exclusive content"
                }
            ])
        
        return options
    
    def _process_content_revenue_distribution(self, transaction_id: uuid.UUID, content_id: uuid.UUID, content_type: str):
        """Process revenue distribution for content purchase"""
        # This would integrate with the revenue distribution service
        # For now, just log the revenue distribution
        logger.info(f"Processing revenue distribution for transaction {transaction_id}, content {content_id}")
    
    def _log_tip_analytics(self, sender_id: uuid.UUID, recipient_id: uuid.UUID, amount: int, message: Optional[str]):
        """Log tip transaction for analytics"""
        logger.info(f"Tip analytics: {sender_id} -> {recipient_id}, {amount} coins, message: {message}")
        # In production, this would send data to analytics service