'use client';

import { useState, useEffect } from 'react';
import { Coins, CreditCard, Check, Star, Gift, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

interface CoinPackage {
  id: string;
  name: string;
  coin_amount: number;
  base_price_usd: number;
  bonus_percentage: number;
  total_coins: number;
  price_in_currency: {
    USD: number;
    NGN: number;
    CAD: number;
  };
  is_active: boolean;
  description?: string;
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'crypto';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  email?: string;
  wallet_type?: string;
}

interface Transaction {
  id: string;
  transaction_type: string;
  status: string;
  coin_amount: number;
  fiat_amount: number;
  currency: string;
  description: string;
  created_at: string;
  completed_at?: string;
}

type Currency = 'USD' | 'NGN' | 'CAD';

export default function CoinPurchaseSystem() {
  const { user } = useAuth();
  const [packages, setPackages] = useState<CoinPackage[]>([]);
  const [selectedPackage, setSelectedPackage] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<Currency>('USD');
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddPaymentMethod, setShowAddPaymentMethod] = useState(false);
  const [userBalance, setUserBalance] = useState(0);

  useEffect(() => {
    fetchCoinPackages();
    fetchPaymentMethods();
    fetchUserBalance();
  }, []);

  const fetchCoinPackages = async () => {
    try {
      const response = await fetch('/api/payment/coin-packages');
      if (response.ok) {
        const data = await response.json();
        setPackages(data);
      }
    } catch (error) {
      console.error('Error fetching coin packages:', error);
    }
  };

  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/payment/users/${user.id}/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error);
    }
  };

  const fetchUserBalance = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/payment/users/${user.id}/balance`);
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data.balance);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const handlePurchase = async () => {
    if (!selectedPackage || !selectedPaymentMethod || !user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // Create payment intent
      const intentResponse = await fetch(`/api/payment/users/${user.id}/purchase-coins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coin_package_id: selectedPackage,
          currency: selectedCurrency,
          payment_method_id: selectedPaymentMethod,
        }),
      });

      if (!intentResponse.ok) {
        throw new Error('Failed to create payment intent');
      }

      const intentData = await intentResponse.json();

      // Simulate payment processing (in real implementation, this would use Stripe/PayPal SDK)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Confirm payment
      const confirmResponse = await fetch(`/api/payment/users/${user.id}/confirm-purchase`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          payment_intent_id: intentData.payment_intent_id,
        }),
      });

      if (!confirmResponse.ok) {
        throw new Error('Payment confirmation failed');
      }

      const confirmData = await confirmResponse.json();
      
      setSuccess(`Successfully purchased ${confirmData.coins_added} coins!`);
      setUserBalance(confirmData.new_balance);
      setSelectedPackage(null);
      
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const getCurrencySymbol = (currency: Currency) => {
    switch (currency) {
      case 'USD': return '$';
      case 'NGN': return '₦';
      case 'CAD': return 'C$';
      default: return '$';
    }
  };

  const getPackagePrice = (pkg: CoinPackage) => {
    return pkg.price_in_currency[selectedCurrency] || pkg.base_price_usd;
  };

  const renderPaymentMethodIcon = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return <CreditCard className="w-5 h-5" />;
    } else if (method.type === 'paypal') {
      return <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">PP</div>;
    } else if (method.type === 'crypto') {
      return <div className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center">₿</div>;
    }
    return <CreditCard className="w-5 h-5" />;
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Purchase Coins
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Buy coins to unlock premium content and support your favorite writers
        </p>
        
        {/* Current Balance */}
        <div className="mt-4 inline-flex items-center bg-yellow-50 border border-yellow-200 rounded-lg px-4 py-2">
          <Coins className="w-5 h-5 text-yellow-600 mr-2" />
          <span className="text-yellow-800 font-medium">
            Current Balance: {userBalance.toLocaleString()} coins
          </span>
        </div>
      </div>

      {/* Currency Selector */}
      <div className="flex justify-center mb-8">
        <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
          {(['USD', 'NGN', 'CAD'] as Currency[]).map((currency) => (
            <button
              key={currency}
              onClick={() => setSelectedCurrency(currency)}
              className={`px-4 py-2 rounded-md font-medium transition-colors ${
                selectedCurrency === currency
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              {currency}
            </button>
          ))}
        </div>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-center">
          <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
          <span className="text-red-800">{error}</span>
        </div>
      )}

      {success && (
        <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg flex items-center">
          <Check className="w-5 h-5 text-green-600 mr-2" />
          <span className="text-green-800">{success}</span>
        </div>
      )}

      {/* Coin Packages */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {packages.map((pkg) => {
          const price = getPackagePrice(pkg);
          const bonusCoins = Math.floor(pkg.coin_amount * (pkg.bonus_percentage / 100));
          const isPopular = pkg.bonus_percentage >= 10;
          
          return (
            <Card
              key={pkg.id}
              className={`relative cursor-pointer transition-all hover:shadow-lg ${
                isPopular ? 'ring-2 ring-primary-600' : ''
              } ${selectedPackage === pkg.id ? 'ring-2 ring-primary-600 bg-primary-50' : ''}`}
              onClick={() => setSelectedPackage(pkg.id)}
            >
              {isPopular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Best Value
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-center">
                  <Coins className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
                  {pkg.name}
                </CardTitle>
              </CardHeader>

              <CardContent className="text-center">
                <div className="mb-4">
                  <div className="text-3xl font-bold text-gray-900">
                    {pkg.coin_amount.toLocaleString()}
                  </div>
                  <div className="text-sm text-gray-500">base coins</div>
                  {bonusCoins > 0 && (
                    <div className="text-sm text-green-600 font-medium">
                      +{bonusCoins.toLocaleString()} bonus coins
                    </div>
                  )}
                  <div className="text-lg font-semibold text-primary-600 mt-1">
                    = {pkg.total_coins.toLocaleString()} total
                  </div>
                </div>

                <div className="mb-6">
                  <div className="text-2xl font-bold text-primary-600">
                    {getCurrencySymbol(selectedCurrency)}{price.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {getCurrencySymbol(selectedCurrency)}{(price / pkg.total_coins).toFixed(3)} per coin
                  </div>
                </div>

                {pkg.description && (
                  <p className="text-sm text-gray-600 mb-4">{pkg.description}</p>
                )}

                <Button
                  fullWidth
                  variant={selectedPackage === pkg.id ? 'primary' : 'outline'}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPackage(pkg.id);
                  }}
                >
                  {selectedPackage === pkg.id ? 'Selected' : 'Select'}
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Payment Methods */}
      {selectedPackage && (
        <Card className="max-w-2xl mx-auto mb-8">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span className="flex items-center">
                <CreditCard className="w-5 h-5 mr-2" />
                Payment Method
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAddPaymentMethod(true)}
              >
                Add New
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {paymentMethods.length === 0 ? (
              <div className="text-center py-8">
                <CreditCard className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-4">No payment methods added yet</p>
                <Button onClick={() => setShowAddPaymentMethod(true)}>
                  Add Payment Method
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {paymentMethods.map((method) => (
                  <div
                    key={method.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      selectedPaymentMethod === method.id
                        ? 'border-primary-600 bg-primary-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setSelectedPaymentMethod(method.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        {renderPaymentMethodIcon(method)}
                        <div className="ml-3">
                          {method.type === 'card' && (
                            <div>
                              <div className="font-medium">
                                {method.brand?.toUpperCase()} •••• {method.last4}
                              </div>
                              <div className="text-sm text-gray-500">
                                Expires {method.exp_month}/{method.exp_year}
                              </div>
                            </div>
                          )}
                          {method.type === 'paypal' && (
                            <div>
                              <div className="font-medium">PayPal</div>
                              <div className="text-sm text-gray-500">{method.email}</div>
                            </div>
                          )}
                          {method.type === 'crypto' && (
                            <div>
                              <div className="font-medium">{method.wallet_type}</div>
                              <div className="text-sm text-gray-500">Crypto Wallet</div>
                            </div>
                          )}
                        </div>
                      </div>
                      {selectedPaymentMethod === method.id && (
                        <Check className="w-5 h-5 text-primary-600" />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Purchase Button */}
      {selectedPackage && selectedPaymentMethod && (
        <div className="text-center">
          <Button
            size="lg"
            onClick={handlePurchase}
            loading={loading}
            disabled={loading}
          >
            {loading ? (
              <>
                <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                Processing Payment...
              </>
            ) : (
              <>
                <Coins className="w-5 h-5 mr-2" />
                Complete Purchase
              </>
            )}
          </Button>
          
          <p className="text-sm text-gray-500 mt-2">
            Secure payment processed by our trusted payment partners
          </p>
        </div>
      )}

      {/* Security Notice */}
      <div className="mt-8 text-center">
        <div className="inline-flex items-center text-sm text-gray-500">
          <div className="w-4 h-4 bg-green-500 rounded-full mr-2 flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          256-bit SSL encryption • PCI DSS compliant • Your data is secure
        </div>
      </div>
    </div>
  );
}