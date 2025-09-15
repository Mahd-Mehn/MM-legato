# Legato Payment Processing Service

## Overview

The Payment Processing Service implements a comprehensive coin system and microtransaction handling for the Legato platform. It supports multi-currency payments, revenue distribution, and integrates with both Stripe and Paystack payment gateways.

## Features Implemented

### ✅ Task 6.1: Coin System and Microtransaction Handling

- **Coin Package Models**: Predefined coin packages with pricing and bonus structures
- **Multi-Currency Support**: USD, NGN, CAD with automatic currency conversion
- **Payment Gateway Integration**: 
  - Stripe for international payments (USD, CAD)
  - Paystack for African markets (NGN)
- **Coin Balance Tracking**: Real-time balance updates with lifetime statistics
- **Transaction History**: Complete audit trail of all coin movements
- **Microtransactions**: Support for small-value content purchases

### ✅ Task 6.2: Revenue Distribution System

- **Automated Revenue Sharing**: 60-70% to writers, 30-40% to platform
- **Multiple Revenue Streams**: Content purchases, subscriptions, licensing, advertising
- **Payout Processing**: Multiple payment methods with automated processing
- **Subscription Revenue Pooling**: Engagement-based distribution for subscription revenue
- **Financial Reporting**: Comprehensive revenue reports and tax compliance
- **Writer Earnings Tracking**: Real-time earnings and payout management

### ✅ Task 6.3: Premium Content Access Control

- **Payment Gate Enforcement**: Automatic access control for premium content
- **Subscription-Based Access**: Multi-tier subscription validation (Basic, Premium, VIP)
- **Tipping and Gift-Giving**: Direct writer support through coin-based tips
- **Revenue Tracking**: Per-content and per-time-period revenue analytics
- **Bulk Access Control**: Efficient checking of multiple content items
- **Purchase History**: Complete user purchase and access history

## Architecture

### Database Models

- **CoinPackage**: Predefined coin bundles with pricing and bonuses
- **CoinBalance**: User coin balance with lifetime tracking
- **Transaction**: All payment and coin movement records
- **CurrencyRate**: Exchange rates for multi-currency support
- **PayoutRequest**: Writer payout processing

### API Endpoints

#### Coin Packages
- `GET /api/v1/payments/coin-packages` - List available packages
- `POST /api/v1/payments/coin-packages` - Create new package (Admin)
- `GET /api/v1/payments/coin-packages/{id}` - Get specific package

#### User Operations
- `GET /api/v1/payments/users/{user_id}/balance` - Get user balance
- `POST /api/v1/payments/users/{user_id}/purchase-coins` - Create payment intent
- `POST /api/v1/payments/users/{user_id}/confirm-purchase` - Confirm payment
- `POST /api/v1/payments/users/{user_id}/spend-coins` - Spend coins on content
- `POST /api/v1/payments/users/{user_id}/send-tip` - Send tip to another user

#### Analytics
- `GET /api/v1/payments/users/{user_id}/transactions` - Transaction history
- `GET /api/v1/payments/users/{user_id}/spending-analytics` - Spending insights

#### Revenue Distribution
- `POST /api/v1/revenue/content-purchase/{transaction_id}/distribute` - Distribute content revenue
- `POST /api/v1/revenue/subscription-pool/distribute` - Distribute subscription pool
- `POST /api/v1/revenue/writers/{writer_id}/payout-requests` - Create payout request
- `GET /api/v1/revenue/writers/{writer_id}/earnings` - Get writer earnings
- `GET /api/v1/revenue/reports/revenue` - Generate revenue reports

#### Access Control
- `GET /api/v1/access/users/{user_id}/content/{content_id}/access` - Check content access
- `POST /api/v1/access/users/{user_id}/content/{content_id}/purchase` - Purchase content access
- `POST /api/v1/access/users/{sender_id}/tip` - Send tip to writer
- `GET /api/v1/access/users/{user_id}/purchases` - Get purchase history
- `GET /api/v1/access/content/{content_id}/analytics` - Content revenue analytics

## Default Coin Packages

| Package | Coins | Price (USD) | Bonus | Total Coins |
|---------|-------|-------------|-------|-------------|
| Starter Pack | 100 | $0.99 | 0% | 100 |
| Reader Pack | 500 | $4.99 | 5% | 525 |
| Enthusiast Pack | 1,200 | $9.99 | 10% | 1,320 |
| Premium Pack | 2,500 | $19.99 | 15% | 2,875 |
| Ultimate Pack | 5,500 | $39.99 | 20% | 6,600 |

## Currency Support

- **USD**: Primary currency, Stripe integration
- **NGN**: Nigerian Naira, Paystack integration
- **CAD**: Canadian Dollar, Stripe integration

Exchange rates are automatically applied for pricing display and payment processing.

## Payment Flow

### Coin Purchase Flow
1. User selects coin package
2. System creates payment intent with appropriate gateway
3. User completes payment with Stripe/Paystack
4. System confirms payment and credits coins
5. Balance updated with bonus coins included

### Coin Spending Flow
1. User attempts to access premium content
2. System checks coin balance
3. If sufficient, coins are deducted
4. Transaction recorded for audit
5. Content access granted

## Testing

### Basic Functionality Test
```bash
python test_basic_functionality.py
```

### API Endpoint Test
```bash
# Start the service first
uvicorn main:app --host 0.0.0.0 --port 8005

# Then test endpoints
python test_api_endpoints.py
```

## Configuration

### Environment Variables

```bash
# Database
DATABASE_URL=postgresql://legato_user:legato_pass@localhost:5432/legato_payments

# Redis
REDIS_URL=redis://localhost:6379/4

# Payment Gateways
STRIPE_SECRET_KEY=sk_test_...
PAYSTACK_SECRET_KEY=sk_test_...
PAYSTACK_PUBLIC_KEY=pk_test_...
```

### Docker Deployment

```bash
# Build image
docker build -t legato-payment-service .

# Run container
docker run -p 8005:8005 \
  -e DATABASE_URL=postgresql://... \
  -e STRIPE_SECRET_KEY=sk_test_... \
  -e PAYSTACK_SECRET_KEY=sk_test_... \
  legato-payment-service
```

## Security Features

- **Encrypted Storage**: Sensitive payment data encrypted at rest
- **Transaction Integrity**: Atomic operations prevent double-spending
- **Audit Trail**: Complete transaction history for compliance
- **Rate Limiting**: Protection against abuse (to be implemented)
- **Input Validation**: Comprehensive request validation

## Performance Considerations

- **Connection Pooling**: Database connection pooling for scalability
- **Caching**: Redis caching for frequently accessed data
- **Async Processing**: Background task processing for heavy operations
- **Monitoring**: Health checks and metrics collection

## Integration Points

### With Content Service
- Content purchase validation
- Premium content access control
- Revenue tracking per content piece

### With User Service
- User balance synchronization
- Subscription status integration
- Profile-based payment preferences

### With Analytics Service
- Transaction data streaming
- Revenue analytics
- User behavior tracking

## Revenue Distribution (Future Implementation)

The service is designed to support:
- **Writer Revenue**: 60-70% of coin purchases
- **Platform Fee**: 30-40% for operations
- **Licensing Revenue**: 80-85% to writers
- **Subscription Pooling**: Engagement-based distribution

## Compliance

- **PCI DSS**: Payment card data security standards
- **GDPR**: Data protection and privacy compliance
- **Financial Regulations**: Multi-jurisdiction compliance support
- **Tax Reporting**: Automated tax calculation and reporting

## Monitoring and Logging

- **Health Checks**: Service availability monitoring
- **Transaction Logging**: Detailed audit logs
- **Error Tracking**: Comprehensive error reporting
- **Performance Metrics**: Response time and throughput monitoring

## Future Enhancements

- **Subscription Management**: Recurring payment handling
- **Gift Cards**: Prepaid coin vouchers
- **Loyalty Programs**: Reward systems for frequent users
- **Advanced Analytics**: ML-powered spending insights
- **Mobile Payments**: Integration with mobile payment providers