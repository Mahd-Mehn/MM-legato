import pytest
import uuid
from decimal import Decimal
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from fastapi.testclient import TestClient

from main import app
from database import Base
from models import CoinPackage, CoinBalance, Transaction, CurrencyType, TransactionType, TransactionStatus
from payment_service import PaymentService
from schemas import CoinPackageCreate, PurchaseCoinsRequest, SpendCoinsRequest, TipRequest

# Test database setup
TEST_DATABASE_URL = "sqlite:///./test_coin_system.db"
engine = create_engine(TEST_DATABASE_URL, connect_args={"check_same_thread": False})
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

def override_get_db():
    try:
        db = TestingSessionLocal()
        yield db
    finally:
        db.close()

# Override the dependency
from database import get_db
app.dependency_overrides[get_db] = override_get_db

@pytest.fixture(scope="function")
def db_session():
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    yield db
    db.close()
    Base.metadata.drop_all(bind=engine)

@pytest.fixture
def payment_service(db_session):
    """Create payment service instance"""
    return PaymentService(db_session)

@pytest.fixture
def client():
    """Create test client"""
    return TestClient(app)

@pytest.fixture
def sample_user_id():
    """Generate a sample user ID"""
    return uuid.uuid4()

@pytest.fixture
def sample_coin_package(payment_service):
    """Create a sample coin package"""
    package_data = CoinPackageCreate(
        name="Test Package",
        description="Test coin package",
        coin_amount=100,
        base_price_usd=Decimal("1.99"),
        bonus_percentage=Decimal("10.00")
    )
    return payment_service.create_coin_package(package_data)

class TestCoinPackages:
    """Test coin package management"""
    
    def test_create_coin_package(self, payment_service):
        """Test creating a coin package"""
        package_data = CoinPackageCreate(
            name="Starter Pack",
            description="Perfect for new readers",
            coin_amount=100,
            base_price_usd=Decimal("0.99"),
            bonus_percentage=Decimal("5.00")
        )
        
        package = payment_service.create_coin_package(package_data)
        
        assert package.name == "Starter Pack"
        assert package.coin_amount == 100
        assert package.base_price_usd == Decimal("0.99")
        assert package.bonus_percentage == Decimal("5.00")
        assert package.is_active is True
    
    def test_get_coin_packages(self, payment_service, sample_coin_package):
        """Test retrieving coin packages"""
        packages = payment_service.get_coin_packages()
        
        assert len(packages) >= 1
        assert any(p.name == "Test Package" for p in packages)
    
    def test_get_coin_package_by_id(self, payment_service, sample_coin_package):
        """Test retrieving a specific coin package"""
        package = payment_service.get_coin_package(sample_coin_package.id)
        
        assert package is not None
        assert package.name == "Test Package"
        assert package.id == sample_coin_package.id

class TestCoinBalance:
    """Test coin balance management"""
    
    def test_create_coin_balance(self, payment_service, sample_user_id):
        """Test creating a coin balance for new user"""
        balance = payment_service.get_or_create_coin_balance(sample_user_id)
        
        assert balance.user_id == sample_user_id
        assert balance.balance == 0
        assert balance.lifetime_earned == 0
        assert balance.lifetime_spent == 0
    
    def test_get_existing_coin_balance(self, payment_service, sample_user_id):
        """Test retrieving existing coin balance"""
        # Create balance first
        balance1 = payment_service.get_or_create_coin_balance(sample_user_id)
        
        # Get it again
        balance2 = payment_service.get_or_create_coin_balance(sample_user_id)
        
        assert balance1.id == balance2.id
        assert balance1.user_id == balance2.user_id
    
    def test_update_coin_balance_positive(self, payment_service, sample_user_id):
        """Test adding coins to balance"""
        balance = payment_service.update_coin_balance(sample_user_id, 100, TransactionType.COIN_PURCHASE)
        
        assert balance.balance == 100
        assert balance.lifetime_earned == 100
        assert balance.lifetime_spent == 0
    
    def test_update_coin_balance_negative(self, payment_service, sample_user_id):
        """Test spending coins from balance"""
        # First add some coins
        payment_service.update_coin_balance(sample_user_id, 100, TransactionType.COIN_PURCHASE)
        
        # Then spend some
        balance = payment_service.update_coin_balance(sample_user_id, -50, TransactionType.COIN_SPEND)
        
        assert balance.balance == 50
        assert balance.lifetime_earned == 100
        assert balance.lifetime_spent == 50
    
    def test_insufficient_balance_error(self, payment_service, sample_user_id):
        """Test error when trying to spend more coins than available"""
        with pytest.raises(ValueError, match="Insufficient coin balance"):
            payment_service.update_coin_balance(sample_user_id, -100, TransactionType.COIN_SPEND)

class TestCoinSpending:
    """Test coin spending functionality"""
    
    def test_spend_coins_success(self, payment_service, sample_user_id):
        """Test successful coin spending"""
        # Add coins first
        payment_service.update_coin_balance(sample_user_id, 100, TransactionType.COIN_PURCHASE)
        
        # Spend coins
        content_id = uuid.uuid4()
        spend_request = SpendCoinsRequest(
            coin_amount=50,
            content_id=content_id,
            description="Purchase premium chapter"
        )
        
        transaction = payment_service.spend_coins(sample_user_id, spend_request)
        
        assert transaction.transaction_type == TransactionType.COIN_SPEND
        assert transaction.coin_amount == -50
        assert transaction.status == TransactionStatus.COMPLETED
        assert transaction.related_content_id == content_id
        
        # Check balance updated
        balance = payment_service.get_user_balance(sample_user_id)
        assert balance == 50
    
    def test_spend_coins_insufficient_balance(self, payment_service, sample_user_id):
        """Test spending coins with insufficient balance"""
        content_id = uuid.uuid4()
        spend_request = SpendCoinsRequest(
            coin_amount=100,
            content_id=content_id
        )
        
        with pytest.raises(ValueError, match="Insufficient coins"):
            payment_service.spend_coins(sample_user_id, spend_request)

class TestTipping:
    """Test tipping functionality"""
    
    def test_send_tip_success(self, payment_service):
        """Test successful tip sending"""
        sender_id = uuid.uuid4()
        recipient_id = uuid.uuid4()
        
        # Add coins to sender
        payment_service.update_coin_balance(sender_id, 100, TransactionType.COIN_PURCHASE)
        
        # Send tip
        tip_request = TipRequest(
            recipient_user_id=recipient_id,
            coin_amount=25,
            message="Great story!"
        )
        
        transaction = payment_service.send_tip(sender_id, tip_request)
        
        assert transaction.transaction_type == TransactionType.TIP
        assert transaction.coin_amount == -25
        assert transaction.status == TransactionStatus.COMPLETED
        
        # Check balances
        sender_balance = payment_service.get_user_balance(sender_id)
        recipient_balance = payment_service.get_user_balance(recipient_id)
        
        assert sender_balance == 75
        assert recipient_balance == 25
    
    def test_send_tip_insufficient_balance(self, payment_service):
        """Test tip sending with insufficient balance"""
        sender_id = uuid.uuid4()
        recipient_id = uuid.uuid4()
        
        tip_request = TipRequest(
            recipient_user_id=recipient_id,
            coin_amount=100
        )
        
        with pytest.raises(ValueError, match="Insufficient coins"):
            payment_service.send_tip(sender_id, tip_request)

class TestCurrencyConversion:
    """Test currency conversion functionality"""
    
    def test_get_currency_rate_same_currency(self, payment_service):
        """Test getting rate for same currency"""
        rate = payment_service.get_currency_rate(CurrencyType.USD, CurrencyType.USD)
        assert rate == Decimal("1.00")
    
    def test_convert_currency_same_currency(self, payment_service):
        """Test converting same currency"""
        amount = Decimal("10.00")
        converted = payment_service.convert_currency(amount, CurrencyType.USD, CurrencyType.USD)
        assert converted == amount

class TestAPIEndpoints:
    """Test API endpoints"""
    
    def test_get_coin_packages_endpoint(self, client):
        """Test GET /api/v1/payments/coin-packages"""
        response = client.get("/api/v1/payments/coin-packages")
        assert response.status_code == 200
        
        packages = response.json()
        assert isinstance(packages, list)
    
    def test_get_user_balance_endpoint(self, client):
        """Test GET /api/v1/payments/users/{user_id}/balance"""
        user_id = str(uuid.uuid4())
        response = client.get(f"/api/v1/payments/users/{user_id}/balance")
        assert response.status_code == 200
        
        balance = response.json()
        assert "balance" in balance
        assert "lifetime_earned" in balance
        assert "lifetime_spent" in balance
    
    def test_spend_coins_endpoint(self, client, db_session):
        """Test POST /api/v1/payments/users/{user_id}/spend-coins"""
        user_id = uuid.uuid4()
        content_id = uuid.uuid4()
        
        # Add coins to user first
        payment_service = PaymentService(db_session)
        payment_service.update_coin_balance(user_id, 100, TransactionType.COIN_PURCHASE)
        
        spend_data = {
            "coin_amount": 50,
            "content_id": str(content_id),
            "description": "Test purchase"
        }
        
        response = client.post(f"/api/v1/payments/users/{user_id}/spend-coins", json=spend_data)
        assert response.status_code == 200
        
        transaction = response.json()
        assert transaction["coin_amount"] == -50
        assert transaction["status"] == "completed"

if __name__ == "__main__":
    pytest.main([__file__, "-v"])