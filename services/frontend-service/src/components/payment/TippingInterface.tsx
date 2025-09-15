'use client';

import { useState, useEffect } from 'react';
import { Gift, Heart, Star, Coins, Send, AlertCircle, Check, Loader2 } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Input from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';

interface TippingInterfaceProps {
  recipientId: string;
  recipientName: string;
  recipientAvatar?: string;
  contentId?: string;
  contentTitle?: string;
  onTipSent?: (amount: number) => void;
  onClose?: () => void;
}

interface UserBalance {
  balance: number;
  lifetime_earned: number;
  lifetime_spent: number;
}

const QUICK_TIP_AMOUNTS = [5, 10, 25, 50, 100];

export default function TippingInterface({
  recipientId,
  recipientName,
  recipientAvatar,
  contentId,
  contentTitle,
  onTipSent,
  onClose,
}: TippingInterfaceProps) {
  const { user } = useAuth();
  const [userBalance, setUserBalance] = useState<UserBalance | null>(null);
  const [tipAmount, setTipAmount] = useState<number>(10);
  const [customAmount, setCustomAmount] = useState<string>('');
  const [message, setMessage] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [useCustomAmount, setUseCustomAmount] = useState(false);

  useEffect(() => {
    if (user) {
      fetchUserBalance();
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

  const handleSendTip = async () => {
    if (!user || !userBalance) return;

    const finalAmount = useCustomAmount ? parseInt(customAmount) : tipAmount;

    if (isNaN(finalAmount) || finalAmount <= 0) {
      setError('Please enter a valid tip amount');
      return;
    }

    if (finalAmount > userBalance.balance) {
      setError(`Insufficient coins. You need ${finalAmount - userBalance.balance} more coins.`);
      return;
    }

    if (finalAmount > 1000) {
      setError('Maximum tip amount is 1000 coins');
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/send-tip`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_user_id: recipientId,
          coin_amount: finalAmount,
          message: message.trim() || undefined,
          content_id: contentId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send tip');
      }

      const data = await response.json();
      setSuccess(`Successfully sent ${finalAmount} coins to ${recipientName}!`);
      
      // Update balance
      setUserBalance(prev => prev ? { ...prev, balance: prev.balance - finalAmount } : null);
      
      // Call success callback
      onTipSent?.(finalAmount);
      
      // Close after a short delay
      setTimeout(() => {
        onClose?.();
      }, 2000);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to send tip');
    } finally {
      setLoading(false);
    }
  };

  const handleCustomAmountChange = (value: string) => {
    const numValue = value.replace(/[^0-9]/g, '');
    setCustomAmount(numValue);
  };

  if (!user) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
        <Card className="max-w-md w-full">
          <CardContent className="text-center py-8">
            <Gift className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Sign In Required
            </h3>
            <p className="text-gray-600 mb-6">
              Please sign in to send tips to creators
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
      <Card className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center">
              <Gift className="w-6 h-6 text-primary-600 mr-2" />
              Send Tip
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
          {/* Recipient Info */}
          <div className="flex items-center mb-6 p-4 bg-gray-50 rounded-lg">
            {recipientAvatar ? (
              <img
                src={recipientAvatar}
                alt={recipientName}
                className="w-12 h-12 rounded-full mr-3"
              />
            ) : (
              <div className="w-12 h-12 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                <span className="text-white font-semibold text-lg">
                  {recipientName.charAt(0).toUpperCase()}
                </span>
              </div>
            )}
            <div>
              <div className="font-semibold text-gray-900">{recipientName}</div>
              {contentTitle && (
                <div className="text-sm text-gray-600">for "{contentTitle}"</div>
              )}
            </div>
          </div>

          {/* Current Balance */}
          {userBalance && (
            <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
              <div className="flex items-center">
                <Coins className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="text-yellow-800 font-medium">
                  Your Balance: {userBalance.balance.toLocaleString()} coins
                </span>
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

          {!success && (
            <>
              {/* Tip Amount Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Choose tip amount
                </label>
                
                {/* Quick Amount Buttons */}
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {QUICK_TIP_AMOUNTS.map((amount) => (
                    <button
                      key={amount}
                      onClick={() => {
                        setTipAmount(amount);
                        setUseCustomAmount(false);
                      }}
                      className={`p-3 rounded-lg border text-center transition-colors ${
                        !useCustomAmount && tipAmount === amount
                          ? 'border-primary-600 bg-primary-50 text-primary-700'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="text-sm font-medium">{amount}</div>
                      <div className="text-xs text-gray-500">coins</div>
                    </button>
                  ))}
                </div>

                {/* Custom Amount */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setUseCustomAmount(!useCustomAmount)}
                    className={`flex-shrink-0 w-5 h-5 rounded border-2 transition-colors ${
                      useCustomAmount
                        ? 'border-primary-600 bg-primary-600'
                        : 'border-gray-300'
                    }`}
                  >
                    {useCustomAmount && (
                      <Check className="w-3 h-3 text-white mx-auto" />
                    )}
                  </button>
                  <div className="flex-1">
                    <Input
                      type="text"
                      placeholder="Custom amount"
                      value={customAmount}
                      onChange={(e) => handleCustomAmountChange(e.target.value)}
                      disabled={!useCustomAmount}
                      className={!useCustomAmount ? 'bg-gray-100' : ''}
                    />
                  </div>
                  <span className="text-sm text-gray-500">coins</span>
                </div>
              </div>

              {/* Optional Message */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Add a message (optional)
                </label>
                <textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Say something nice to the creator..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 resize-none"
                  rows={3}
                  maxLength={200}
                />
                <div className="text-xs text-gray-500 mt-1">
                  {message.length}/200 characters
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex space-x-3">
                <Button
                  variant="outline"
                  onClick={onClose}
                  fullWidth
                  disabled={loading}
                >
                  Cancel
                </Button>
                
                <Button
                  variant="primary"
                  onClick={handleSendTip}
                  fullWidth
                  loading={loading}
                  disabled={
                    loading || 
                    !userBalance || 
                    (useCustomAmount ? 
                      (isNaN(parseInt(customAmount)) || parseInt(customAmount) <= 0) : 
                      tipAmount <= 0
                    )
                  }
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Sending...
                    </>
                  ) : (
                    <>
                      <Send className="w-4 h-4 mr-2" />
                      Send {useCustomAmount ? customAmount || '0' : tipAmount} Coins
                    </>
                  )}
                </Button>
              </div>

              {/* Tip Guidelines */}
              <div className="mt-6 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <div className="flex items-start">
                  <Heart className="w-4 h-4 text-blue-600 mr-2 mt-0.5" />
                  <div className="text-sm text-blue-800">
                    <div className="font-medium mb-1">Show your appreciation!</div>
                    <div>Tips help creators continue producing amazing content. Your support means the world to them.</div>
                  </div>
                </div>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}