from sqlalchemy.orm import Session
from sqlalchemy.exc import SQLAlchemyError
from models import (
    CoinPackage, CoinBalance, Transaction, CurrencyRate, PayoutRequest,
    TransactionStatus, TransactionType, CurrencyType, PaymentProvider
)
from schemas import (
    CoinPackageCreate, CoinPackageUpdate, TransactionCreate,
    PurchaseCoinsRequest, SpendCoinsRequest, TipRequest, PayoutRequestCreate
)
from decimal import Decimal
from typing import List, Optional, Dict, Any
import uuid
import logging
from datetime import datetime

logger = logging.getLogger(__name__)

class PaymentService:
    def __init__(self, db: Session):
        self.db = db
    
    # Coin Package Management
    def create_coin_package(self, package_data: CoinPackageCreate) -> CoinPackage:
        """Create a new coin package"""
        try:
            package = CoinPackage(**package_data.dict())
            self.db.add(package)
            self.db.commit()
            self.db.refresh(package)
            logger.info(f"Created coin package: {package.name}")
            return package
        except SQLAlchemyError as e:
            logger.error(f"Error creating coin package: {e}")
            self.db.rollback()
            raise
    
    def get_coin_packages(self, active_only: bool = True) -> List[CoinPackage]:
        """Get all coin packages"""
        query = self.db.query(CoinPackage)
        if active_only:
            query = query.filter(CoinPackage.is_active == True)
        return query.order_by(CoinPackage.coin_amount).all()
    
    def get_coin_package(self, package_id: uuid.UUID) -> Optional[CoinPackage]:
        """Get a specific coin package"""
        return self.db.query(CoinPackage).filter(CoinPackage.id == package_id).first()
    
    def update_coin_package(self, package_id: uuid.UUID, update_data: CoinPackageUpdate) -> Optional[CoinPackage]:
        """Update a coin package"""
        try:
            package = self.get_coin_package(package_id)
            if not package:
                return None
            
            update_dict = update_data.dict(exclude_unset=True)
            for field, value in update_dict.items():
                setattr(package, field, value)
            
            package.updated_at = datetime.utcnow()
            self.db.commit()
            self.db.refresh(package)
            logger.info(f"Updated coin package: {package.name}")
            return package
        except SQLAlchemyError as e:
            logger.error(f"Error updating coin package: {e}")
            self.db.rollback()
            raise
    
    # Coin Balance Management
    def get_or_create_coin_balance(self, user_id: uuid.UUID) -> CoinBalance:
        """Get or create user's coin balance"""
        balance = self.db.query(CoinBalance).filter(CoinBalance.user_id == user_id).first()
        if not balance:
            balance = CoinBalance(user_id=user_id)
            self.db.add(balance)
            self.db.commit()
            self.db.refresh(balance)
            logger.info(f"Created coin balance for user: {user_id}")
        return balance
    
    def get_user_balance(self, user_id: uuid.UUID) -> int:
        """Get user's current coin balance"""
        balance = self.get_or_create_coin_balance(user_id)
        return balance.balance
    
    def update_coin_balance(self, user_id: uuid.UUID, coin_change: int, transaction_type: TransactionType) -> CoinBalance:
        """Update user's coin balance"""
        try:
            balance = self.get_or_create_coin_balance(user_id)
            
            # Update balance
            balance.balance += coin_change
            
            # Update lifetime counters
            if coin_change > 0:
                balance.lifetime_earned += coin_change
            else:
                balance.lifetime_spent += abs(coin_change)
            
            balance.updated_at = datetime.utcnow()
            
            # Ensure balance doesn't go negative
            if balance.balance < 0:
                raise ValueError(f"Insufficient coin balance. Current: {balance.balance - coin_change}, Required: {abs(coin_change)}")
            
            self.db.commit()
            self.db.refresh(balance)
            logger.info(f"Updated coin balance for user {user_id}: {coin_change} coins")
            return balance
        except SQLAlchemyError as e:
            logger.error(f"Error updating coin balance: {e}")
            self.db.rollback()
            raise
    
    # Transaction Management
    def create_transaction(self, user_id: uuid.UUID, transaction_data: TransactionCreate) -> Transaction:
        """Create a new transaction"""
        try:
            # Get user's coin balance
            balance = self.get_or_create_coin_balance(user_id)
            
            transaction = Transaction(
                user_id=user_id,
                coin_balance_id=balance.id,
                **transaction_data.dict()
            )
            
            self.db.add(transaction)
            self.db.commit()
            self.db.refresh(transaction)
            logger.info(f"Created transaction: {transaction.id}")
            return transaction
        except SQLAlchemyError as e:
            logger.error(f"Error creating transaction: {e}")
            self.db.rollback()
            raise
    
    def get_user_transactions(self, user_id: uuid.UUID, limit: int = 50, offset: int = 0) -> List[Transaction]:
        """Get user's transaction history"""
        return (self.db.query(Transaction)
                .filter(Transaction.user_id == user_id)
                .order_by(Transaction.created_at.desc())
                .offset(offset)
                .limit(limit)
                .all())
    
    def complete_transaction(self, transaction_id: uuid.UUID, external_id: str = None) -> Transaction:
        """Mark transaction as completed"""
        try:
            transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
            if not transaction:
                raise ValueError(f"Transaction not found: {transaction_id}")
            
            transaction.status = TransactionStatus.COMPLETED
            transaction.completed_at = datetime.utcnow()
            if external_id:
                transaction.external_transaction_id = external_id
            
            # Update coin balance if it's a coin transaction
            if transaction.coin_amount != 0:
                self.update_coin_balance(
                    transaction.user_id, 
                    transaction.coin_amount, 
                    transaction.transaction_type
                )
            
            self.db.commit()
            self.db.refresh(transaction)
            logger.info(f"Completed transaction: {transaction_id}")
            return transaction
        except SQLAlchemyError as e:
            logger.error(f"Error completing transaction: {e}")
            self.db.rollback()
            raise
    
    def fail_transaction(self, transaction_id: uuid.UUID, reason: str = None) -> Transaction:
        """Mark transaction as failed"""
        try:
            transaction = self.db.query(Transaction).filter(Transaction.id == transaction_id).first()
            if not transaction:
                raise ValueError(f"Transaction not found: {transaction_id}")
            
            transaction.status = TransactionStatus.FAILED
            if reason:
                transaction.description = f"{transaction.description or ''} - Failed: {reason}"
            
            self.db.commit()
            self.db.refresh(transaction)
            logger.info(f"Failed transaction: {transaction_id}")
            return transaction
        except SQLAlchemyError as e:
            logger.error(f"Error failing transaction: {e}")
            self.db.rollback()
            raise
    
    # Coin Operations
    def spend_coins(self, user_id: uuid.UUID, spend_request: SpendCoinsRequest) -> Transaction:
        """Spend user's coins"""
        try:
            # Check if user has sufficient balance
            current_balance = self.get_user_balance(user_id)
            if current_balance < spend_request.coin_amount:
                raise ValueError(f"Insufficient coins. Balance: {current_balance}, Required: {spend_request.coin_amount}")
            
            # Create spend transaction
            transaction_data = TransactionCreate(
                transaction_type=TransactionType.COIN_SPEND,
                coin_amount=-spend_request.coin_amount,  # Negative for spending
                related_content_id=spend_request.content_id,
                description=spend_request.description or f"Purchased content: {spend_request.content_id}"
            )
            
            transaction = self.create_transaction(user_id, transaction_data)
            
            # Complete the transaction immediately for coin spending
            return self.complete_transaction(transaction.id)
        except Exception as e:
            logger.error(f"Error spending coins: {e}")
            raise
    
    def send_tip(self, sender_id: uuid.UUID, tip_request: TipRequest) -> Transaction:
        """Send tip to another user"""
        try:
            # Check sender's balance
            current_balance = self.get_user_balance(sender_id)
            if current_balance < tip_request.coin_amount:
                raise ValueError(f"Insufficient coins for tip. Balance: {current_balance}, Required: {tip_request.coin_amount}")
            
            # Create tip transaction for sender (spending)
            sender_transaction_data = TransactionCreate(
                transaction_type=TransactionType.TIP,
                coin_amount=-tip_request.coin_amount,
                description=f"Tip sent to user {tip_request.recipient_user_id}: {tip_request.message or 'No message'}"
            )
            
            sender_transaction = self.create_transaction(sender_id, sender_transaction_data)
            
            # Create tip transaction for recipient (receiving)
            recipient_transaction_data = TransactionCreate(
                transaction_type=TransactionType.TIP,
                coin_amount=tip_request.coin_amount,
                description=f"Tip received from user {sender_id}: {tip_request.message or 'No message'}"
            )
            
            recipient_transaction = self.create_transaction(tip_request.recipient_user_id, recipient_transaction_data)
            
            # Complete both transactions
            self.complete_transaction(sender_transaction.id)
            self.complete_transaction(recipient_transaction.id)
            
            logger.info(f"Tip sent: {tip_request.coin_amount} coins from {sender_id} to {tip_request.recipient_user_id}")
            return sender_transaction
        except Exception as e:
            logger.error(f"Error sending tip: {e}")
            raise
    
    # Currency Management
    def get_currency_rate(self, from_currency: CurrencyType, to_currency: CurrencyType) -> Optional[Decimal]:
        """Get exchange rate between currencies"""
        if from_currency == to_currency:
            return Decimal("1.00")
        
        rate = (self.db.query(CurrencyRate)
                .filter(CurrencyRate.from_currency == from_currency)
                .filter(CurrencyRate.to_currency == to_currency)
                .order_by(CurrencyRate.created_at.desc())
                .first())
        
        return rate.rate if rate else None
    
    def convert_currency(self, amount: Decimal, from_currency: CurrencyType, to_currency: CurrencyType) -> Decimal:
        """Convert amount between currencies"""
        rate = self.get_currency_rate(from_currency, to_currency)
        if rate is None:
            raise ValueError(f"Exchange rate not found: {from_currency} to {to_currency}")
        
        return amount * rate
    
    def get_package_price_in_currency(self, package: CoinPackage, currency: CurrencyType) -> Decimal:
        """Get coin package price in specified currency"""
        if currency == CurrencyType.USD:
            return package.base_price_usd
        
        return self.convert_currency(package.base_price_usd, CurrencyType.USD, currency)
    
    # Analytics
    def get_user_spending_summary(self, user_id: uuid.UUID) -> Dict[str, Any]:
        """Get user's spending analytics"""
        balance = self.get_or_create_coin_balance(user_id)
        
        # Get recent transactions
        recent_transactions = self.get_user_transactions(user_id, limit=10)
        
        # Calculate totals
        total_purchased = sum(t.fiat_amount or 0 for t in recent_transactions 
                            if t.transaction_type == TransactionType.COIN_PURCHASE and t.status == TransactionStatus.COMPLETED)
        
        return {
            "current_balance": balance.balance,
            "lifetime_earned": balance.lifetime_earned,
            "lifetime_spent": balance.lifetime_spent,
            "total_purchased_value": total_purchased,
            "recent_transactions": len(recent_transactions)
        }