from pydantic import BaseModel, Field, field_validator, ConfigDict
from typing import Optional, Dict, Any
from decimal import Decimal
from datetime import datetime
from enum import Enum
import uuid

class CurrencyType(str, Enum):
    USD = "USD"
    NGN = "NGN"
    CAD = "CAD"

class TransactionStatus(str, Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

class TransactionType(str, Enum):
    COIN_PURCHASE = "COIN_PURCHASE"
    COIN_SPEND = "COIN_SPEND"
    SUBSCRIPTION = "SUBSCRIPTION"
    TIP = "TIP"
    GIFT = "GIFT"
    PAYOUT = "PAYOUT"
    REFUND = "REFUND"

class PaymentProvider(str, Enum):
    STRIPE = "STRIPE"
    PAYSTACK = "PAYSTACK"

# Coin Package Schemas
class CoinPackageBase(BaseModel):
    name: str = Field(..., max_length=100)
    description: Optional[str] = None
    coin_amount: int = Field(..., gt=0)
    base_price_usd: Decimal = Field(..., gt=0)
    bonus_percentage: Decimal = Field(default=0.00, ge=0, le=100)

class CoinPackageCreate(CoinPackageBase):
    pass

class CoinPackageUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=100)
    description: Optional[str] = None
    coin_amount: Optional[int] = Field(None, gt=0)
    base_price_usd: Optional[Decimal] = Field(None, gt=0)
    bonus_percentage: Optional[Decimal] = Field(None, ge=0, le=100)
    is_active: Optional[bool] = None

class CoinPackageResponse(CoinPackageBase):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    is_active: bool
    created_at: datetime
    updated_at: datetime
    
    # Calculated fields
    total_coins: int  # coin_amount + bonus coins
    price_in_currency: Dict[str, Decimal]  # Prices in different currencies

# Coin Balance Schemas
class CoinBalanceResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    balance: int
    lifetime_earned: int
    lifetime_spent: int
    created_at: datetime
    updated_at: datetime

# Transaction Schemas
class TransactionCreate(BaseModel):
    transaction_type: TransactionType
    coin_amount: Optional[int] = None  # Can be negative for spending
    fiat_amount: Optional[Decimal] = Field(None, gt=0)
    currency: CurrencyType = CurrencyType.USD
    coin_package_id: Optional[uuid.UUID] = None
    related_content_id: Optional[uuid.UUID] = None
    description: Optional[str] = None
    metadata: Optional[Dict[str, Any]] = None

class PurchaseCoinsRequest(BaseModel):
    coin_package_id: uuid.UUID
    currency: CurrencyType = CurrencyType.USD
    payment_method_id: str  # Stripe/Paystack payment method ID
    
    @field_validator('payment_method_id')
    @classmethod
    def validate_payment_method(cls, v):
        if not v or len(v.strip()) == 0:
            raise ValueError('Payment method ID is required')
        return v.strip()

class SpendCoinsRequest(BaseModel):
    coin_amount: int = Field(..., gt=0)
    content_id: uuid.UUID
    description: Optional[str] = None

class TipRequest(BaseModel):
    recipient_user_id: uuid.UUID
    coin_amount: int = Field(..., gt=0)
    message: Optional[str] = Field(None, max_length=500)

class TransactionResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    user_id: uuid.UUID
    transaction_type: TransactionType
    status: TransactionStatus
    coin_amount: int
    fiat_amount: Optional[Decimal]
    currency: Optional[CurrencyType]
    payment_provider: Optional[PaymentProvider]
    external_transaction_id: Optional[str]
    coin_package_id: Optional[uuid.UUID]
    related_content_id: Optional[uuid.UUID]
    description: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]

# Currency Rate Schemas
class CurrencyRateResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    from_currency: CurrencyType
    to_currency: CurrencyType
    rate: Decimal
    created_at: datetime

class CurrencyRateUpdate(BaseModel):
    rate: Decimal = Field(..., gt=0)

# Payout Schemas
class PayoutRequestCreate(BaseModel):
    amount: Decimal = Field(..., gt=0)
    currency: CurrencyType
    payment_method: str = Field(..., max_length=100)
    payment_details: Dict[str, Any]
    
    @field_validator('payment_details')
    @classmethod
    def validate_payment_details(cls, v):
        required_fields = ['account_number', 'bank_name']
        for field in required_fields:
            if field not in v:
                raise ValueError(f'{field} is required in payment_details')
        return v

class PayoutRequestResponse(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    
    id: uuid.UUID
    writer_id: uuid.UUID
    amount: Decimal
    currency: CurrencyType
    status: TransactionStatus
    payment_method: str
    processed_at: Optional[datetime]
    created_at: datetime
    updated_at: datetime

# Payment Processing Responses
class PaymentIntentResponse(BaseModel):
    client_secret: str
    payment_intent_id: str
    amount: Decimal
    currency: CurrencyType

class PaymentConfirmationResponse(BaseModel):
    transaction_id: uuid.UUID
    status: TransactionStatus
    coins_added: int
    new_balance: int

# Analytics Schemas
class TransactionSummary(BaseModel):
    total_transactions: int
    total_revenue: Decimal
    total_coins_purchased: int
    total_coins_spent: int
    currency: CurrencyType

class UserSpendingAnalytics(BaseModel):
    user_id: uuid.UUID
    total_spent: Decimal
    total_coins_purchased: int
    total_coins_spent: int
    favorite_package: Optional[str]
    last_purchase: Optional[datetime]