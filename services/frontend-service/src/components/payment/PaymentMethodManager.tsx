'use client';

import { useState, useEffect } from 'react';
import { CreditCard, Plus, Trash2, Edit, Check, AlertCircle, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Input from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal' | 'crypto';
  last4?: string;
  brand?: string;
  exp_month?: number;
  exp_year?: number;
  email?: string;
  wallet_type?: string;
  is_default: boolean;
  created_at: string;
}

interface CardFormData {
  card_number: string;
  exp_month: string;
  exp_year: string;
  cvc: string;
  name: string;
}

export default function PaymentMethodManager() {
  const { user } = useAuth();
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [addingType, setAddingType] = useState<'card' | 'paypal' | 'crypto'>('card');
  const [cardForm, setCardForm] = useState<CardFormData>({
    card_number: '',
    exp_month: '',
    exp_year: '',
    cvc: '',
    name: '',
  });
  const [paypalEmail, setPaypalEmail] = useState('');
  const [cryptoWallet, setCryptoWallet] = useState('');

  useEffect(() => {
    fetchPaymentMethods();
  }, []);

  const fetchPaymentMethods = async () => {
    if (!user) return;
    
    setLoading(true);
    try {
      const response = await fetch(`/api/payment/users/${user.id}/payment-methods`);
      if (response.ok) {
        const data = await response.json();
        setPaymentMethods(data);
      } else {
        throw new Error('Failed to fetch payment methods');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load payment methods');
    } finally {
      setLoading(false);
    }
  };

  const handleAddPaymentMethod = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      let payload: any = { type: addingType };

      if (addingType === 'card') {
        // Validate card form
        if (!cardForm.card_number || !cardForm.exp_month || !cardForm.exp_year || !cardForm.cvc || !cardForm.name) {
          throw new Error('Please fill in all card details');
        }
        
        // Basic card number validation
        const cardNumber = cardForm.card_number.replace(/\s/g, '');
        if (cardNumber.length < 13 || cardNumber.length > 19) {
          throw new Error('Invalid card number');
        }

        payload = {
          ...payload,
          card_number: cardNumber,
          exp_month: parseInt(cardForm.exp_month),
          exp_year: parseInt(cardForm.exp_year),
          cvc: cardForm.cvc,
          name: cardForm.name,
        };
      } else if (addingType === 'paypal') {
        if (!paypalEmail) {
          throw new Error('Please enter your PayPal email');
        }
        payload.email = paypalEmail;
      } else if (addingType === 'crypto') {
        if (!cryptoWallet) {
          throw new Error('Please enter your crypto wallet address');
        }
        payload.wallet_address = cryptoWallet;
      }

      const response = await fetch(`/api/payment/users/${user.id}/payment-methods`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to add payment method');
      }

      setSuccess('Payment method added successfully!');
      setShowAddForm(false);
      resetForms();
      await fetchPaymentMethods();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to add payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePaymentMethod = async (methodId: string) => {
    if (!user || !confirm('Are you sure you want to delete this payment method?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/payment-methods/${methodId}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete payment method');
      }

      setSuccess('Payment method deleted successfully!');
      await fetchPaymentMethods();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to delete payment method');
    } finally {
      setLoading(false);
    }
  };

  const handleSetDefault = async (methodId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/payment-methods/${methodId}/set-default`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to set default payment method');
      }

      setSuccess('Default payment method updated!');
      await fetchPaymentMethods();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update default payment method');
    } finally {
      setLoading(false);
    }
  };

  const resetForms = () => {
    setCardForm({
      card_number: '',
      exp_month: '',
      exp_year: '',
      cvc: '',
      name: '',
    });
    setPaypalEmail('');
    setCryptoWallet('');
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = matches && matches[0] || '';
    const parts = [];
    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }
    if (parts.length) {
      return parts.join(' ');
    } else {
      return v;
    }
  };

  const getCardBrand = (number: string) => {
    const cleanNumber = number.replace(/\s/g, '');
    if (cleanNumber.startsWith('4')) return 'visa';
    if (cleanNumber.startsWith('5') || cleanNumber.startsWith('2')) return 'mastercard';
    if (cleanNumber.startsWith('3')) return 'amex';
    return 'unknown';
  };

  const renderPaymentMethodIcon = (method: PaymentMethod) => {
    if (method.type === 'card') {
      return <CreditCard className="w-6 h-6 text-gray-600" />;
    } else if (method.type === 'paypal') {
      return <div className="w-6 h-6 bg-blue-600 rounded text-white text-sm flex items-center justify-center font-bold">P</div>;
    } else if (method.type === 'crypto') {
      return <div className="w-6 h-6 bg-orange-500 rounded text-white text-sm flex items-center justify-center font-bold">₿</div>;
    }
    return <CreditCard className="w-6 h-6 text-gray-600" />;
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Payment Methods</h1>
          <p className="text-gray-600 mt-2">Manage your payment methods for coin purchases</p>
        </div>
        <Button
          onClick={() => setShowAddForm(true)}
          disabled={showAddForm}
        >
          <Plus className="w-4 h-4 mr-2" />
          Add Payment Method
        </Button>
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

      {/* Add Payment Method Form */}
      {showAddForm && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Add New Payment Method</CardTitle>
          </CardHeader>
          <CardContent>
            {/* Payment Type Selector */}
            <div className="flex space-x-4 mb-6">
              {[
                { type: 'card' as const, label: 'Credit/Debit Card', icon: CreditCard },
                { type: 'paypal' as const, label: 'PayPal', icon: () => <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">P</div> },
                { type: 'crypto' as const, label: 'Crypto Wallet', icon: () => <div className="w-5 h-5 bg-orange-500 rounded text-white text-xs flex items-center justify-center">₿</div> },
              ].map(({ type, label, icon: Icon }) => (
                <button
                  key={type}
                  onClick={() => setAddingType(type)}
                  className={`flex items-center px-4 py-2 rounded-lg border transition-colors ${
                    addingType === type
                      ? 'border-primary-600 bg-primary-50 text-primary-700'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                >
                  <Icon />
                  <span className="ml-2">{label}</span>
                </button>
              ))}
            </div>

            {/* Card Form */}
            {addingType === 'card' && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Card Number
                  </label>
                  <Input
                    type="text"
                    placeholder="1234 5678 9012 3456"
                    value={cardForm.card_number}
                    onChange={(e) => setCardForm({ ...cardForm, card_number: formatCardNumber(e.target.value) })}
                    maxLength={19}
                  />
                </div>
                
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Month
                    </label>
                    <Input
                      type="text"
                      placeholder="MM"
                      value={cardForm.exp_month}
                      onChange={(e) => setCardForm({ ...cardForm, exp_month: e.target.value.replace(/\D/g, '').slice(0, 2) })}
                      maxLength={2}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Year
                    </label>
                    <Input
                      type="text"
                      placeholder="YYYY"
                      value={cardForm.exp_year}
                      onChange={(e) => setCardForm({ ...cardForm, exp_year: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      maxLength={4}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      CVC
                    </label>
                    <Input
                      type="text"
                      placeholder="123"
                      value={cardForm.cvc}
                      onChange={(e) => setCardForm({ ...cardForm, cvc: e.target.value.replace(/\D/g, '').slice(0, 4) })}
                      maxLength={4}
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cardholder Name
                  </label>
                  <Input
                    type="text"
                    placeholder="John Doe"
                    value={cardForm.name}
                    onChange={(e) => setCardForm({ ...cardForm, name: e.target.value })}
                  />
                </div>
              </div>
            )}

            {/* PayPal Form */}
            {addingType === 'paypal' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  PayPal Email
                </label>
                <Input
                  type="email"
                  placeholder="your-email@example.com"
                  value={paypalEmail}
                  onChange={(e) => setPaypalEmail(e.target.value)}
                />
              </div>
            )}

            {/* Crypto Form */}
            {addingType === 'crypto' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Wallet Address
                </label>
                <Input
                  type="text"
                  placeholder="1A1zP1eP5QGefi2DMPTfTL5SLmv7DivfNa"
                  value={cryptoWallet}
                  onChange={(e) => setCryptoWallet(e.target.value)}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Enter your Bitcoin wallet address
                </p>
              </div>
            )}

            <div className="flex justify-end space-x-3 mt-6">
              <Button
                variant="outline"
                onClick={() => {
                  setShowAddForm(false);
                  resetForms();
                }}
              >
                Cancel
              </Button>
              <Button
                onClick={handleAddPaymentMethod}
                loading={loading}
                disabled={loading}
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Adding...
                  </>
                ) : (
                  'Add Payment Method'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payment Methods List */}
      <div className="space-y-4">
        {paymentMethods.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <CreditCard className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No payment methods</h3>
              <p className="text-gray-600 mb-6">Add a payment method to start purchasing coins</p>
              <Button onClick={() => setShowAddForm(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Your First Payment Method
              </Button>
            </CardContent>
          </Card>
        ) : (
          paymentMethods.map((method) => (
            <Card key={method.id}>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    {renderPaymentMethodIcon(method)}
                    <div className="ml-4">
                      {method.type === 'card' && (
                        <div>
                          <div className="font-medium text-gray-900">
                            {method.brand?.toUpperCase()} •••• {method.last4}
                          </div>
                          <div className="text-sm text-gray-500">
                            Expires {method.exp_month?.toString().padStart(2, '0')}/{method.exp_year}
                          </div>
                        </div>
                      )}
                      {method.type === 'paypal' && (
                        <div>
                          <div className="font-medium text-gray-900">PayPal</div>
                          <div className="text-sm text-gray-500">{method.email}</div>
                        </div>
                      )}
                      {method.type === 'crypto' && (
                        <div>
                          <div className="font-medium text-gray-900">{method.wallet_type} Wallet</div>
                          <div className="text-sm text-gray-500">Crypto payment method</div>
                        </div>
                      )}
                      {method.is_default && (
                        <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 mt-1">
                          <Check className="w-3 h-3 mr-1" />
                          Default
                        </span>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    {!method.is_default && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSetDefault(method.id)}
                        disabled={loading}
                      >
                        Set Default
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeletePaymentMethod(method.id)}
                      disabled={loading}
                      className="text-red-600 hover:text-red-700 hover:border-red-300"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}