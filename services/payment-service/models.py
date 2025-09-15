from sqlalchemy import Column, String, Integer, DateTime, Boolean, Text, ForeignKey, Enum, Numeric
from sqlalchemy.orm import declarative_base, relationship
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime
import enum

Base = declarative_base()

class CurrencyType(enum.Enum):
    USD = "USD"
    NGN = "NGN"
    CAD = "CAD"

class TransactionStatus(enum.Enum):
    PENDING = "PENDING"
    COMPLETED = "COMPLETED"
    FAILED = "FAILED"
    CANCELLED = "CANCELLED"
    REFUNDED = "REFUNDED"

class TransactionType(enum.Enum):
    COIN_PURCHASE = "COIN_PURCHASE"
    COIN_SPEND = "COIN_SPEND"
    SUBSCRIPTION = "SUBSCRIPTION"
    TIP = "TIP"
    GIFT = "GIFT"
    PAYOUT = "PAYOUT"
    REFUND = "REFUND"

class PaymentProvider(enum.Enum):
    STRIPE = "STRIPE"
    PAYSTACK = "PAYSTACK"

class CoinPackage(Base):
    """Predefined coin packages with pricing and bonuses"""
    __tablename__ = "coin_packages"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    coin_amount = Column(Integer, nullable=False)
    base_price_usd = Column(Numeric(10, 2), nullable=False)
    bonus_percentage = Column(Numeric(5, 2), default=0.00)  # e.g., 10.00 for 10% bonus
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="coin_package")

class CoinBalance(Base):
    """User coin balance tracking"""
    __tablename__ = "coin_balances"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    balance = Column(Integer, default=0)  # Total coins available
    lifetime_earned = Column(Integer, default=0)  # Total coins ever earned
    lifetime_spent = Column(Integer, default=0)  # Total coins ever spent
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationships
    transactions = relationship("Transaction", back_populates="coin_balance")

class Transaction(Base):
    """All payment transactions and coin movements"""
    __tablename__ = "transactions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), nullable=False)
    transaction_type = Column(Enum(TransactionType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Amounts
    coin_amount = Column(Integer, default=0)  # Coins involved in transaction
    fiat_amount = Column(Numeric(10, 2))  # Fiat currency amount
    currency = Column(Enum(CurrencyType), default=CurrencyType.USD)
    
    # Payment processing
    payment_provider = Column(Enum(PaymentProvider))
    external_transaction_id = Column(String(255))  # Provider's transaction ID
    payment_method_id = Column(String(255))  # Stripe/Paystack payment method ID
    
    # References
    coin_package_id = Column(UUID(as_uuid=True), ForeignKey("coin_packages.id"))
    coin_balance_id = Column(UUID(as_uuid=True), ForeignKey("coin_balances.id"))
    related_content_id = Column(UUID(as_uuid=True))  # Story/chapter ID for content purchases
    
    # Metadata
    description = Column(Text)
    transaction_metadata = Column(Text)  # JSON string for additional data
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime)
    
    # Relationships
    coin_package = relationship("CoinPackage", back_populates="transactions")
    coin_balance = relationship("CoinBalance", back_populates="transactions")

class CurrencyRate(Base):
    """Exchange rates for multi-currency support"""
    __tablename__ = "currency_rates"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    from_currency = Column(Enum(CurrencyType), nullable=False)
    to_currency = Column(Enum(CurrencyType), nullable=False)
    rate = Column(Numeric(10, 6), nullable=False)  # Exchange rate
    created_at = Column(DateTime, default=datetime.utcnow)
    
    class Meta:
        unique_together = ['from_currency', 'to_currency']

class PayoutRequest(Base):
    """Writer payout requests and processing"""
    __tablename__ = "payout_requests"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    writer_id = Column(UUID(as_uuid=True), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(Enum(CurrencyType), nullable=False)
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    
    # Payout details
    payment_method = Column(String(100))  # bank_transfer, paypal, etc.
    payment_details = Column(Text)  # JSON string with payment info
    
    # Processing
    processed_at = Column(DateTime)
    external_payout_id = Column(String(255))
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class RevenueDistribution(Base):
    """Revenue distribution records for audit and tracking"""
    __tablename__ = "revenue_distributions"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    transaction_id = Column(UUID(as_uuid=True), ForeignKey("transactions.id"), nullable=False)
    writer_id = Column(UUID(as_uuid=True), nullable=False)
    content_id = Column(UUID(as_uuid=True))  # Related content if applicable
    
    # Revenue amounts
    total_amount = Column(Numeric(10, 2), nullable=False)
    writer_amount = Column(Numeric(10, 2), nullable=False)
    platform_amount = Column(Numeric(10, 2), nullable=False)
    currency = Column(Enum(CurrencyType), nullable=False)
    
    # Revenue sharing percentages at time of distribution
    writer_percentage = Column(Numeric(5, 2), nullable=False)
    platform_percentage = Column(Numeric(5, 2), nullable=False)
    
    # Distribution type and metadata
    distribution_type = Column(String(50), nullable=False)  # content_purchase, subscription_pool, licensing, etc.
    distribution_period_start = Column(DateTime)  # For subscription pools
    distribution_period_end = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationships
    transaction = relationship("Transaction", backref="revenue_distributions")

class WriterEarnings(Base):
    """Writer earnings tracking and balance"""
    __tablename__ = "writer_earnings"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    writer_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    
    # Earnings by currency
    total_earned_usd = Column(Numeric(12, 2), default=0.00)
    total_earned_ngn = Column(Numeric(12, 2), default=0.00)
    total_earned_cad = Column(Numeric(12, 2), default=0.00)
    
    # Payouts by currency
    total_paid_usd = Column(Numeric(12, 2), default=0.00)
    total_paid_ngn = Column(Numeric(12, 2), default=0.00)
    total_paid_cad = Column(Numeric(12, 2), default=0.00)
    
    # Pending payouts by currency
    pending_payout_usd = Column(Numeric(12, 2), default=0.00)
    pending_payout_ngn = Column(Numeric(12, 2), default=0.00)
    pending_payout_cad = Column(Numeric(12, 2), default=0.00)
    
    # Statistics
    total_transactions = Column(Integer, default=0)
    first_earning_date = Column(DateTime)
    last_earning_date = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

class SubscriptionRevenuePool(Base):
    """Subscription revenue pool distribution records"""
    __tablename__ = "subscription_revenue_pools"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    period_start = Column(DateTime, nullable=False)
    period_end = Column(DateTime, nullable=False)
    
    # Pool totals
    total_subscription_revenue = Column(Numeric(12, 2), nullable=False)
    total_writer_pool = Column(Numeric(12, 2), nullable=False)
    total_platform_share = Column(Numeric(12, 2), nullable=False)
    
    # Distribution metrics
    total_engagement_score = Column(Numeric(15, 2), nullable=False)
    writers_count = Column(Integer, nullable=False)
    
    # Processing status
    status = Column(Enum(TransactionStatus), default=TransactionStatus.PENDING)
    processed_at = Column(DateTime)
    
    # Timestamps
    created_at = Column(DateTime, default=datetime.utcnow)