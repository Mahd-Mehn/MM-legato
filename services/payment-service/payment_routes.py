from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional, Dict, Any
import uuid
import logging
from decimal import Decimal

from database import get_db
from payment_service import PaymentService
from payment_gateways import PaymentGatewayFactory, PaymentProvider
from models import CurrencyType, TransactionType, TransactionStatus
from schemas import (
    CoinPackageCreate, CoinPackageUpdate, CoinPackageResponse,
    CoinBalanceResponse, TransactionCreate, TransactionResponse,
    PurchaseCoinsRequest, SpendCoinsRequest, TipRequest,
    PaymentIntentResponse, PaymentConfirmationResponse,
    TransactionSummary, UserSpendingAnalytics
)

logger = logging.getLogger(__name__)
router = APIRouter()

# Dependency to get payment service
def get_payment_service(db: Session = Depends(get_db)) -> PaymentService:
    return PaymentService(db)

# Coin Package Management
@router.post("/coin-packages", response_model=CoinPackageResponse, status_code=status.HTTP_201_CREATED)
async def create_coin_package(
    package_data: CoinPackageCreate,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Create a new coin package (Admin only)"""
    try:
        package = payment_service.create_coin_package(package_data)
        
        # Calculate additional fields for response
        bonus_coins = int(package.coin_amount * (package.bonus_percentage / 100))
        total_coins = package.coin_amount + bonus_coins
        
        # Get prices in different currencies
        price_usd = package.base_price_usd
        price_ngn = payment_service.convert_currency(price_usd, CurrencyType.USD, CurrencyType.NGN)
        price_cad = payment_service.convert_currency(price_usd, CurrencyType.USD, CurrencyType.CAD)
        
        response_data = CoinPackageResponse(
            **package.__dict__,
            total_coins=total_coins,
            price_in_currency={
                "USD": price_usd,
                "NGN": price_ngn,
                "CAD": price_cad
            }
        )
        
        return response_data
    except Exception as e:
        logger.error(f"Error creating coin package: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coin-packages", response_model=List[CoinPackageResponse])
async def get_coin_packages(
    active_only: bool = Query(True, description="Filter active packages only"),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get all available coin packages"""
    try:
        packages = payment_service.get_coin_packages(active_only=active_only)
        
        response_packages = []
        for package in packages:
            # Calculate additional fields
            bonus_coins = int(package.coin_amount * (package.bonus_percentage / 100))
            total_coins = package.coin_amount + bonus_coins
            
            # Get prices in different currencies
            price_usd = package.base_price_usd
            try:
                price_ngn = payment_service.convert_currency(price_usd, CurrencyType.USD, CurrencyType.NGN)
                price_cad = payment_service.convert_currency(price_usd, CurrencyType.USD, CurrencyType.CAD)
            except ValueError:
                # Fallback if exchange rates not available
                price_ngn = price_usd * 750  # Approximate rate
                price_cad = price_usd * 1.35  # Approximate rate
            
            response_data = CoinPackageResponse(
                **package.__dict__,
                total_coins=total_coins,
                price_in_currency={
                    "USD": price_usd,
                    "NGN": price_ngn,
                    "CAD": price_cad
                }
            )
            response_packages.append(response_data)
        
        return response_packages
    except Exception as e:
        logger.error(f"Error getting coin packages: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/coin-packages/{package_id}", response_model=CoinPackageResponse)
async def get_coin_package(
    package_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get a specific coin package"""
    try:
        package = payment_service.get_coin_package(package_id)
        if not package:
            raise HTTPException(status_code=404, detail="Coin package not found")
        
        # Calculate additional fields
        bonus_coins = int(package.coin_amount * (package.bonus_percentage / 100))
        total_coins = package.coin_amount + bonus_coins
        
        # Get prices in different currencies
        price_usd = package.base_price_usd
        price_ngn = payment_service.convert_currency(price_usd, CurrencyType.USD, CurrencyType.NGN)
        price_cad = payment_service.convert_currency(price_usd, CurrencyType.USD, CurrencyType.CAD)
        
        response_data = CoinPackageResponse(
            **package.__dict__,
            total_coins=total_coins,
            price_in_currency={
                "USD": price_usd,
                "NGN": price_ngn,
                "CAD": price_cad
            }
        )
        
        return response_data
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting coin package: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# User Coin Balance
@router.get("/users/{user_id}/balance", response_model=CoinBalanceResponse)
async def get_user_balance(
    user_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get user's coin balance"""
    try:
        balance = payment_service.get_or_create_coin_balance(user_id)
        return CoinBalanceResponse(**balance.__dict__)
    except Exception as e:
        logger.error(f"Error getting user balance: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Coin Purchase Flow
@router.post("/users/{user_id}/purchase-coins", response_model=PaymentIntentResponse)
async def create_coin_purchase_intent(
    user_id: uuid.UUID,
    purchase_request: PurchaseCoinsRequest,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Create payment intent for coin purchase"""
    try:
        # Get coin package
        package = payment_service.get_coin_package(purchase_request.coin_package_id)
        if not package or not package.is_active:
            raise HTTPException(status_code=404, detail="Coin package not found or inactive")
        
        # Calculate price in requested currency
        price = payment_service.get_package_price_in_currency(package, purchase_request.currency)
        
        # Get appropriate payment gateway
        gateway = PaymentGatewayFactory.get_gateway(None, purchase_request.currency)
        
        # Create payment intent
        metadata = {
            "user_id": str(user_id),
            "coin_package_id": str(package.id),
            "coin_amount": str(package.coin_amount),
            "bonus_percentage": str(package.bonus_percentage)
        }
        
        payment_intent = gateway.create_payment_intent(price, purchase_request.currency, metadata)
        
        # Create pending transaction
        transaction_data = TransactionCreate(
            transaction_type=TransactionType.COIN_PURCHASE,
            coin_amount=package.coin_amount + int(package.coin_amount * (package.bonus_percentage / 100)),
            fiat_amount=price,
            currency=purchase_request.currency,
            coin_package_id=package.id
        )
        
        transaction = payment_service.create_transaction(user_id, transaction_data)
        
        # Update transaction with payment intent ID
        transaction.external_transaction_id = payment_intent["payment_intent_id"]
        payment_service.db.commit()
        
        return PaymentIntentResponse(
            client_secret=payment_intent.get("client_secret", ""),
            payment_intent_id=payment_intent["payment_intent_id"],
            amount=price,
            currency=purchase_request.currency
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error creating coin purchase intent: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/users/{user_id}/confirm-purchase", response_model=PaymentConfirmationResponse)
async def confirm_coin_purchase(
    user_id: uuid.UUID,
    payment_intent_id: str,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Confirm coin purchase after payment"""
    try:
        # Find transaction by external ID
        from models import Transaction
        transaction = (payment_service.db.query(Transaction)
                      .filter(Transaction.user_id == user_id)
                      .filter(Transaction.external_transaction_id == payment_intent_id)
                      .first())
        
        if not transaction:
            raise HTTPException(status_code=404, detail="Transaction not found")
        
        # Get payment gateway and confirm payment
        gateway = PaymentGatewayFactory.get_gateway(transaction.payment_provider, transaction.currency)
        payment_confirmation = gateway.confirm_payment(payment_intent_id)
        
        # Check if payment was successful
        if payment_confirmation["status"] in ["succeeded", "success"]:
            # Complete the transaction
            completed_transaction = payment_service.complete_transaction(transaction.id)
            
            # Get updated balance
            balance = payment_service.get_user_balance(user_id)
            
            return PaymentConfirmationResponse(
                transaction_id=completed_transaction.id,
                status=TransactionStatus.COMPLETED,
                coins_added=completed_transaction.coin_amount,
                new_balance=balance
            )
        else:
            # Mark transaction as failed
            payment_service.fail_transaction(transaction.id, f"Payment status: {payment_confirmation['status']}")
            raise HTTPException(status_code=400, detail="Payment was not successful")
    
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error confirming coin purchase: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Coin Spending
@router.post("/users/{user_id}/spend-coins", response_model=TransactionResponse)
async def spend_coins(
    user_id: uuid.UUID,
    spend_request: SpendCoinsRequest,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Spend user's coins on content"""
    try:
        transaction = payment_service.spend_coins(user_id, spend_request)
        return TransactionResponse(**transaction.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error spending coins: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Tipping
@router.post("/users/{user_id}/send-tip", response_model=TransactionResponse)
async def send_tip(
    user_id: uuid.UUID,
    tip_request: TipRequest,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Send tip to another user"""
    try:
        transaction = payment_service.send_tip(user_id, tip_request)
        return TransactionResponse(**transaction.__dict__)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        logger.error(f"Error sending tip: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Transaction History
@router.get("/users/{user_id}/transactions", response_model=List[TransactionResponse])
async def get_user_transactions(
    user_id: uuid.UUID,
    limit: int = Query(50, ge=1, le=100),
    offset: int = Query(0, ge=0),
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get user's transaction history"""
    try:
        transactions = payment_service.get_user_transactions(user_id, limit, offset)
        return [TransactionResponse(**t.__dict__) for t in transactions]
    except Exception as e:
        logger.error(f"Error getting user transactions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics
@router.get("/users/{user_id}/spending-analytics", response_model=UserSpendingAnalytics)
async def get_user_spending_analytics(
    user_id: uuid.UUID,
    payment_service: PaymentService = Depends(get_payment_service)
):
    """Get user's spending analytics"""
    try:
        analytics = payment_service.get_user_spending_summary(user_id)
        
        # Get recent transactions for additional insights
        recent_transactions = payment_service.get_user_transactions(user_id, limit=100)
        
        # Find favorite package (most purchased)
        package_purchases = {}
        last_purchase = None
        
        for transaction in recent_transactions:
            if (transaction.transaction_type == TransactionType.COIN_PURCHASE and 
                transaction.status == TransactionStatus.COMPLETED and
                transaction.coin_package_id):
                
                package_id = str(transaction.coin_package_id)
                package_purchases[package_id] = package_purchases.get(package_id, 0) + 1
                
                if not last_purchase or transaction.created_at > last_purchase:
                    last_purchase = transaction.created_at
        
        favorite_package = None
        if package_purchases:
            favorite_package_id = max(package_purchases, key=package_purchases.get)
            favorite_package_obj = payment_service.get_coin_package(uuid.UUID(favorite_package_id))
            if favorite_package_obj:
                favorite_package = favorite_package_obj.name
        
        return UserSpendingAnalytics(
            user_id=user_id,
            total_spent=analytics["total_purchased_value"],
            total_coins_purchased=analytics["lifetime_earned"],
            total_coins_spent=analytics["lifetime_spent"],
            favorite_package=favorite_package,
            last_purchase=last_purchase
        )
    except Exception as e:
        logger.error(f"Error getting user spending analytics: {e}")
        raise HTTPException(status_code=500, detail=str(e))