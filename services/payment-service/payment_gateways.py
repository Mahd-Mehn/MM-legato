import stripe
import requests
from typing import Dict, Any, Optional
from decimal import Decimal
import os
import logging
from schemas import CurrencyType, PaymentProvider
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)

class PaymentGateway(ABC):
    """Abstract base class for payment gateways"""
    
    @abstractmethod
    def create_payment_intent(self, amount: Decimal, currency: CurrencyType, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create a payment intent"""
        pass
    
    @abstractmethod
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a payment"""
        pass
    
    @abstractmethod
    def refund_payment(self, payment_intent_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """Refund a payment"""
        pass

class StripeGateway(PaymentGateway):
    """Stripe payment gateway integration"""
    
    def __init__(self):
        self.api_key = os.getenv("STRIPE_SECRET_KEY")
        if not self.api_key:
            raise ValueError("STRIPE_SECRET_KEY environment variable is required")
        
        stripe.api_key = self.api_key
        logger.info("Stripe gateway initialized")
    
    def create_payment_intent(self, amount: Decimal, currency: CurrencyType, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Stripe payment intent"""
        try:
            # Convert amount to cents (Stripe expects smallest currency unit)
            amount_cents = int(amount * 100)
            
            intent = stripe.PaymentIntent.create(
                amount=amount_cents,
                currency=currency.value.lower(),
                metadata=metadata,
                automatic_payment_methods={
                    'enabled': True,
                },
            )
            
            logger.info(f"Created Stripe payment intent: {intent.id}")
            
            return {
                "payment_intent_id": intent.id,
                "client_secret": intent.client_secret,
                "status": intent.status,
                "amount": amount,
                "currency": currency
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating payment intent: {e}")
            raise Exception(f"Payment gateway error: {str(e)}")
    
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Confirm a Stripe payment"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            logger.info(f"Retrieved Stripe payment intent: {intent.id}, status: {intent.status}")
            
            return {
                "payment_intent_id": intent.id,
                "status": intent.status,
                "amount": Decimal(intent.amount) / 100,  # Convert from cents
                "currency": intent.currency.upper(),
                "charges": [
                    {
                        "id": charge.id,
                        "status": charge.status,
                        "payment_method": charge.payment_method
                    } for charge in intent.charges.data
                ]
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error confirming payment: {e}")
            raise Exception(f"Payment gateway error: {str(e)}")
    
    def refund_payment(self, payment_intent_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """Refund a Stripe payment"""
        try:
            intent = stripe.PaymentIntent.retrieve(payment_intent_id)
            
            refund_data = {"payment_intent": payment_intent_id}
            if amount:
                refund_data["amount"] = int(amount * 100)  # Convert to cents
            
            refund = stripe.Refund.create(**refund_data)
            
            logger.info(f"Created Stripe refund: {refund.id}")
            
            return {
                "refund_id": refund.id,
                "status": refund.status,
                "amount": Decimal(refund.amount) / 100,
                "currency": refund.currency.upper()
            }
        except stripe.error.StripeError as e:
            logger.error(f"Stripe error creating refund: {e}")
            raise Exception(f"Payment gateway error: {str(e)}")

class PaystackGateway(PaymentGateway):
    """Paystack payment gateway integration (for African markets)"""
    
    def __init__(self):
        self.secret_key = os.getenv("PAYSTACK_SECRET_KEY")
        self.public_key = os.getenv("PAYSTACK_PUBLIC_KEY")
        
        if not self.secret_key:
            raise ValueError("PAYSTACK_SECRET_KEY environment variable is required")
        
        self.base_url = "https://api.paystack.co"
        self.headers = {
            "Authorization": f"Bearer {self.secret_key}",
            "Content-Type": "application/json"
        }
        logger.info("Paystack gateway initialized")
    
    def create_payment_intent(self, amount: Decimal, currency: CurrencyType, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Create a Paystack transaction"""
        try:
            # Paystack expects amount in kobo for NGN (multiply by 100)
            if currency == CurrencyType.NGN:
                amount_kobo = int(amount * 100)
            else:
                amount_kobo = int(amount * 100)  # For other currencies
            
            payload = {
                "amount": amount_kobo,
                "currency": currency.value,
                "metadata": metadata
            }
            
            response = requests.post(
                f"{self.base_url}/transaction/initialize",
                json=payload,
                headers=self.headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Paystack API error: {response.text}")
            
            data = response.json()
            
            if not data.get("status"):
                raise Exception(f"Paystack error: {data.get('message', 'Unknown error')}")
            
            transaction_data = data["data"]
            
            logger.info(f"Created Paystack transaction: {transaction_data['reference']}")
            
            return {
                "payment_intent_id": transaction_data["reference"],
                "authorization_url": transaction_data["authorization_url"],
                "access_code": transaction_data["access_code"],
                "status": "requires_action",  # Paystack requires user action
                "amount": amount,
                "currency": currency
            }
        except requests.RequestException as e:
            logger.error(f"Paystack request error: {e}")
            raise Exception(f"Payment gateway error: {str(e)}")
    
    def confirm_payment(self, payment_intent_id: str) -> Dict[str, Any]:
        """Verify a Paystack transaction"""
        try:
            response = requests.get(
                f"{self.base_url}/transaction/verify/{payment_intent_id}",
                headers=self.headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Paystack API error: {response.text}")
            
            data = response.json()
            
            if not data.get("status"):
                raise Exception(f"Paystack error: {data.get('message', 'Unknown error')}")
            
            transaction_data = data["data"]
            
            logger.info(f"Verified Paystack transaction: {payment_intent_id}, status: {transaction_data['status']}")
            
            # Convert amount back from kobo/cents
            amount = Decimal(transaction_data["amount"]) / 100
            
            return {
                "payment_intent_id": transaction_data["reference"],
                "status": transaction_data["status"],
                "amount": amount,
                "currency": transaction_data["currency"],
                "gateway_response": transaction_data.get("gateway_response"),
                "paid_at": transaction_data.get("paid_at")
            }
        except requests.RequestException as e:
            logger.error(f"Paystack request error: {e}")
            raise Exception(f"Payment gateway error: {str(e)}")
    
    def refund_payment(self, payment_intent_id: str, amount: Optional[Decimal] = None) -> Dict[str, Any]:
        """Refund a Paystack transaction"""
        try:
            payload = {"transaction": payment_intent_id}
            if amount:
                # Convert to kobo for NGN
                payload["amount"] = int(amount * 100)
            
            response = requests.post(
                f"{self.base_url}/refund",
                json=payload,
                headers=self.headers
            )
            
            if response.status_code != 200:
                raise Exception(f"Paystack API error: {response.text}")
            
            data = response.json()
            
            if not data.get("status"):
                raise Exception(f"Paystack error: {data.get('message', 'Unknown error')}")
            
            refund_data = data["data"]
            
            logger.info(f"Created Paystack refund: {refund_data['id']}")
            
            return {
                "refund_id": refund_data["id"],
                "status": refund_data["status"],
                "amount": Decimal(refund_data["amount"]) / 100,
                "currency": refund_data["currency"]
            }
        except requests.RequestException as e:
            logger.error(f"Paystack request error: {e}")
            raise Exception(f"Payment gateway error: {str(e)}")

class PaymentGatewayFactory:
    """Factory for creating payment gateway instances"""
    
    @staticmethod
    def get_gateway(provider: PaymentProvider, currency: CurrencyType) -> PaymentGateway:
        """Get appropriate payment gateway based on provider and currency"""
        
        # Auto-select gateway based on currency if provider not specified
        if provider is None:
            if currency == CurrencyType.NGN:
                provider = PaymentProvider.PAYSTACK
            else:
                provider = PaymentProvider.STRIPE
        
        if provider == PaymentProvider.STRIPE:
            return StripeGateway()
        elif provider == PaymentProvider.PAYSTACK:
            return PaystackGateway()
        else:
            raise ValueError(f"Unsupported payment provider: {provider}")
    
    @staticmethod
    def get_recommended_provider(currency: CurrencyType) -> PaymentProvider:
        """Get recommended payment provider for currency"""
        if currency == CurrencyType.NGN:
            return PaymentProvider.PAYSTACK
        else:
            return PaymentProvider.STRIPE