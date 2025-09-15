'use client';

import { useState, useEffect } from 'react';
import { Lock, Coins, Star, Gift, CreditCard, AlertCircle, Check, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

interface PaymentGateProps {
  contentId: string;
  contentType: 'chapter' | 'story' | 'premium_feature';
  title: string;
  price: number;
  description?: string;
  authorId?: string;
  authorName?: string;
  previewContent?: string;
  onPurchaseSuccess?: () => void;
  onClose?: () => void;
}

interface UserBalance {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

export default function PaymentGate({
  contentId,
  contentType,
  title,
  price,
  description,
  authorId,
  authorName,
  previewContent,
  onPurchaseSuccess,
  onClose,
}: PaymentGateProps) {
  const { user } = useAuth();
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'coins' | 'subscription'>('coins');
  const [hasSubscription, setHasSubscription] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserBalance();
      checkSubscriptionStatus();
    }
  }, [user]);

  const fetchUserBalance = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/payment/users/${user.id}/balance`);
      if (response.ok) {
        const data = await response.json();
        setUserBalance(data);
      }
    } catch (error) {
      console.error('Error fetching user balance:', error);
    }
  };

  const checkSubscriptionStatus = async () => {
    if (!user) return;

    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription`);
      if (response.ok) {
        const data = await response.json();
        setHasSubscription(data && data.status === 'active');
      }
    } catch (error) {
      console.error('Error checking subscription status:', error);
    }
  };

  const handleCoinPurchase = async () => {
    if (!user || !userBalance) return;

    if (userBalance.balance < price) {
      setError(`Insufficient coins. You need ${price - userBalance.balance} more coins.`);
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/spend-coins`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          coin_amount: price,
          content_id: contentId,
          description: `Purchase: ${title}`,
        }),
      });

      if (!response.ok) {
        throw new Error('Payment failed');
      }

      const data = await response.json();
      setSuccess('Purchase successful! You now have access to this content.');
      
      // Update balance
      setUserBalance(prev => prev ? { ...prev, balance: prev.balance - price } : null);
      
      // Call success callback after a short delay
      setTimeout(() => {
        onPurchaseSuccess?.();
      }, 1500);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Purchase failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionAccess = async () => {
    if (!hasSubscription) {
      setError('You need an active subscription to access this content.');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      // In a real implementation, this would verify subscription access
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setSuccess('Access granted through your subscription!');
      
      setTimeout(() => {
        onPurchaseSuccess?.();
      }, 1500);

    } catch (error) {
      setError('Failed to verify subscription access');
    } finally {
      setLoading(false);
    }
  };

  const getContentTypeIcon = () => {
    switch (contentType) {
      case 'chapter':
        return <Lock className="w-8 h-8 text-primary-600" />;
      case 'story':
        return <Star className="w-8 h-8 text-primary-600" />;
      case 'premium_feature':
        return <Gift className="w-8 h-8 text-primary-600" />;
      default:
        return <Lock className="w-8 h-8 text-primary-600" />;
    }
  };

  const getContentTypeLabel = () => {
    switch (contentType) {
      case 'chapter':
        return 'Premium Chapter';
      case 'story':
        return 'Premium Story';
      case 'premium_feature':
        return 'Premium Feature';
      default:
        return 'Premium Content';
    }
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <Lock className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600 mb-6">
              Please sign in to access premium content
            </p>
            <div className="flex space-x-3">
              <Button variant="outline" onClick={onClose} fullWidth>
                Cancel
              </Button>
              <Button variant="primary" fullWidth>
                Sign In
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <Card className="max-w-lg w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              {getContentTypeIcon()}
              <span className="ml-3">{getContentTypeLabel()}</span>
            </div>
            {onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 text-xl"
              >
                ×
              </button>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent>
          {/* Content Info */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
            {description && (
              <p className="text-gray-600 mb-3">{description}</p>
            )}
            {authorName && (
              <p className="text-sm text-gray-500">by {authorName}</p>
            )}
          </div>

          {/* Preview Content */}
          {previewContent && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <h4 className="text-sm font-medium text-gray-900 mb-2">Preview</h4>
              <p className="text-sm text-gray-700 line-clamp-3">{previewContent}</p>
              <div className="text-xs text-gray-500 mt-2">
                Sign in and purchase to read the full content
              </div>
            </div>
          )}

          {/* Error/Success Messages */}
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center">
              <AlertCircle className="w-4 h-4 text-red-600 mr-2" />
              <span className="text-red-800 text-sm">{error}</span>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center">
              <Check className="w-4 h-4 text-green-600 mr-2" />
              <span className="text-green-800 text-sm">{success}</span>
            </div>
          )}

          {/* Payment Options */}
          {!success && (
            <div className="space-y-4">
              {/* Coin Payment Option */}
              <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                paymentMethod === 'coins' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
              }`} onClick={() => setPaymentMethod('coins')}>
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <Coins className="w-5 h-5 text-yellow-600 mr-3" />
                    <div>
                      <div className="font-medium text-gray-900">Pay with Coins</div>
                      <div className="text-sm text-gray-600">
                        {price} coins • 
                        {userBalance ? (
                          <span className={userBalance.balance >= price ? 'text-green-600' : 'text-red-600'}>
                            {' '}Balance: {userBalance.balance} coins
                          </span>
                        ) : (
                          ' Loading balance...'
                        )}
                      </div>
                    </div>
                  </div>
                  <div className={`w-4 h-4 rounded-full border-2 ${
                    paymentMethod === 'coins' ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                  }`}>
                    {paymentMethod === 'coins' && (
                      <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                    )}
                  </div>
                </div>
              </div>

              {/* Subscription Access Option */}
              {hasSubscription && (
                <div className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                  paymentMethod === 'subscription' ? 'border-primary-600 bg-primary-50' : 'border-gray-200'
                }`} onClick={() => setPaymentMethod('subscription')}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <Star className="w-5 h-5 text-primary-600 mr-3" />
                      <div>
                        <div className="font-medium text-gray-900">Use Subscription</div>
                        <div className="text-sm text-gray-600">
                          Access with your active subscription
                        </div>
                      </div>
                    </div>
                    <div className={`w-4 h-4 rounded-full border-2 ${
                      paymentMethod === 'subscription' ? 'border-primary-600 bg-primary-600' : 'border-gray-300'
                    }`}>
                      {paymentMethod === 'subscription' && (
                        <div className="w-2 h-2 bg-white rounded-full mx-auto mt-0.5"></div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* No Subscription Notice */}
              {!hasSubscription && (
                <div className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                  <div className="flex items-center">
                    <Star className="w-5 h-5 text-gray-400 mr-3" />
                    <div>
                      <div className="font-medium text-gray-700">Subscription Access</div>
                      <div className="text-sm text-gray-600">
                        Get unlimited access with a subscription plan
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex space-x-3 pt-4">
                <Button
                  variant="outline"
                  onClick={onClose}
                  fullWidth
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                {paymentMethod === 'coins' && (
                  <Button
                    variant="primary"
                    onClick={handleCoinPurchase}
                    fullWidth
                    loading={loading}
                    disabled={loading || !userBalance || userBalance.balance < price}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Coins className="w-4 h-4 mr-2" />
                        Pay {price} Coins
                      </>
                    )}
                  </Button>
                )}
                
                {paymentMethod === 'subscription' && hasSubscription && (
                  <Button
                    variant="primary"
                    onClick={handleSubscriptionAccess}
                    fullWidth
                    loading={loading}
                    disabled={loading}
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Verifying...
                      </>
                    ) : (
                      <>
                        <Star className="w-4 h-4 mr-2" />
                        Access with Subscription
                      </>
                    )}
                  </Button>
                )}
              </div>

              {/* Need More Coins Link */}
              {paymentMethod === 'coins' && userBalance && userBalance.balance < price && (
                <div className="text-center pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open('/payment?tab=coins', '_blank')}
                  >
                    <CreditCard className="w-4 h-4 mr-2" />
                    Buy More Coins
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}