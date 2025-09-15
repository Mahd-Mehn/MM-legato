'use client';

import { useState, useEffect } from 'react';
import { Star, Check, Crown, Calendar, CreditCard, AlertCircle, Loader2, ArrowRight, Gift } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  features: string[];
  popular?: boolean;
  savings?: string;
  description: string;
}

interface UserSubscription {
  id: string;
  plan_id: string;
  plan_name: string;
  status: 'active' | 'cancelled' | 'expired' | 'past_due';
  current_period_start: string;
  current_period_end: string;
  cancel_at_period_end: boolean;
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
}

interface UsageMetrics {
  stories_read: number;
  premium_chapters_accessed: number;
  offline_downloads: number;
  monthly_limit: number;
  unlimited: boolean;
}

interface BillingHistory {
  id: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'failed';
  invoice_url?: string;
  created_at: string;
  description: string;
}

export default function SubscriptionManager() {
  const { user } = useAuth();
  const [plans, setPlans] = useState<SubscriptionPlan[]>([]);
  const [currentSubscription, setCurrentSubscription] = useState<UserSubscription | null>(null);
  const [usageMetrics, setUsageMetrics] = useState<UsageMetrics | null>(null);
  const [billingHistory, setBillingHistory] = useState<BillingHistory[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [showBillingHistory, setShowBillingHistory] = useState(false);

  useEffect(() => {
    fetchSubscriptionPlans();
    fetchCurrentSubscription();
    fetchUsageMetrics();
    fetchBillingHistory();
  }, []);

  const fetchSubscriptionPlans = async () => {
    try {
      const response = await fetch('/api/payment/subscription-plans');
      if (response.ok) {
        const data = await response.json();
        setPlans(data);
      }
    } catch (error) {
      console.error('Error fetching subscription plans:', error);
    }
  };

  const fetchCurrentSubscription = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription`);
      if (response.ok) {
        const data = await response.json();
        setCurrentSubscription(data);
      }
    } catch (error) {
      console.error('Error fetching current subscription:', error);
    }
  };

  const fetchUsageMetrics = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription/usage`);
      if (response.ok) {
        const data = await response.json();
        setUsageMetrics(data);
      }
    } catch (error) {
      console.error('Error fetching usage metrics:', error);
    }
  };

  const fetchBillingHistory = async () => {
    if (!user) return;
    
    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription/billing-history`);
      if (response.ok) {
        const data = await response.json();
        setBillingHistory(data);
      }
    } catch (error) {
      console.error('Error fetching billing history:', error);
    }
  };

  const handleSubscribe = async (planId: string) => {
    if (!user) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          plan_id: planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to create subscription');
      }

      const data = await response.json();
      setSuccess('Subscription created successfully!');
      await fetchCurrentSubscription();
      await fetchUsageMetrics();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Subscription failed');
    } finally {
      setLoading(false);
    }
  };

  const handleUpgrade = async (planId: string) => {
    if (!user || !currentSubscription) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription/upgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_plan_id: planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to upgrade subscription');
      }

      setSuccess('Subscription upgraded successfully!');
      await fetchCurrentSubscription();
      await fetchUsageMetrics();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Upgrade failed');
    } finally {
      setLoading(false);
    }
  };

  const handleDowngrade = async (planId: string) => {
    if (!user || !currentSubscription) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription/downgrade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          new_plan_id: planId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to downgrade subscription');
      }

      setSuccess('Subscription will be downgraded at the end of your current billing period');
      await fetchCurrentSubscription();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Downgrade failed');
    } finally {
      setLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user || !currentSubscription || !confirm('Are you sure you want to cancel your subscription?')) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription/cancel`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to cancel subscription');
      }

      setSuccess('Subscription cancelled. You will retain access until the end of your current billing period.');
      await fetchCurrentSubscription();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Cancellation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    if (!user || !currentSubscription) return;

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const response = await fetch(`/api/payment/users/${user.id}/subscription/reactivate`, {
        method: 'POST',
      });

      if (!response.ok) {
        throw new Error('Failed to reactivate subscription');
      }

      setSuccess('Subscription reactivated successfully!');
      await fetchCurrentSubscription();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Reactivation failed');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatCurrency = (amount: number, currency: string) => {
    const symbols: { [key: string]: string } = {
      USD: '$',
      NGN: '₦',
      CAD: 'C$',
    };
    return `${symbols[currency] || '$'}${amount.toFixed(2)}`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-100';
      case 'cancelled':
        return 'text-orange-600 bg-orange-100';
      case 'expired':
        return 'text-red-600 bg-red-100';
      case 'past_due':
        return 'text-yellow-600 bg-yellow-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getPlanComparison = (planId: string) => {
    if (!currentSubscription) return 'subscribe';
    
    const currentPlan = plans.find(p => p.id === currentSubscription.plan_id);
    const targetPlan = plans.find(p => p.id === planId);
    
    if (!currentPlan || !targetPlan) return 'subscribe';
    if (currentPlan.id === targetPlan.id) return 'current';
    if (currentPlan.price < targetPlan.price) return 'upgrade';
    if (currentPlan.price > targetPlan.price) return 'downgrade';
    return 'subscribe';
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-4">
          Subscription Plans
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose the perfect plan for your reading needs and unlock premium features
        </p>
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

      {/* Current Subscription Status */}
      {currentSubscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <Crown className="w-5 h-5 mr-2 text-yellow-600" />
              Current Subscription
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Plan Details</h3>
                <div className="space-y-1">
                  <div className="flex items-center">
                    <span className="text-lg font-medium">{currentSubscription.plan_name}</span>
                    <span className={`ml-2 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(currentSubscription.status)}`}>
                      {currentSubscription.status.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-gray-600">
                    {formatCurrency(currentSubscription.price, currentSubscription.currency)} per {currentSubscription.period}
                  </div>
                </div>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">Billing Period</h3>
                <div className="space-y-1">
                  <div className="text-sm text-gray-600">
                    Started: {formatDate(currentSubscription.current_period_start)}
                  </div>
                  <div className="text-sm text-gray-600">
                    {currentSubscription.cancel_at_period_end ? 'Expires' : 'Renews'}: {formatDate(currentSubscription.current_period_end)}
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-2">
                {currentSubscription.status === 'active' && !currentSubscription.cancel_at_period_end && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCancelSubscription}
                    disabled={loading}
                  >
                    Cancel Subscription
                  </Button>
                )}
                
                {currentSubscription.cancel_at_period_end && (
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={handleReactivateSubscription}
                    disabled={loading}
                  >
                    Reactivate Subscription
                  </Button>
                )}
                
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowBillingHistory(!showBillingHistory)}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Billing History
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Usage Metrics */}
      {usageMetrics && currentSubscription && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Usage This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{usageMetrics.stories_read}</div>
                <div className="text-sm text-gray-600">Stories Read</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">{usageMetrics.premium_chapters_accessed}</div>
                <div className="text-sm text-gray-600">Premium Chapters</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-primary-600">
                  {usageMetrics.unlimited ? '∞' : `${usageMetrics.offline_downloads}/${usageMetrics.monthly_limit}`}
                </div>
                <div className="text-sm text-gray-600">Offline Downloads</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Plans */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {plans.map((plan) => {
          const comparison = getPlanComparison(plan.id);
          const isCurrent = comparison === 'current';
          
          return (
            <Card
              key={plan.id}
              className={`relative transition-all hover:shadow-lg ${
                plan.popular ? 'ring-2 ring-primary-600 scale-105' : ''
              } ${isCurrent ? 'ring-2 ring-green-600' : ''}`}
            >
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                  <span className="bg-primary-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Most Popular
                  </span>
                </div>
              )}

              {isCurrent && (
                <div className="absolute -top-3 right-4">
                  <span className="bg-green-600 text-white px-3 py-1 rounded-full text-sm font-medium">
                    Current Plan
                  </span>
                </div>
              )}

              <CardHeader>
                <CardTitle className="text-center">
                  <Star className="w-8 h-8 text-primary-600 mx-auto mb-2" />
                  {plan.name}
                </CardTitle>
              </CardHeader>

              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-3xl font-bold text-gray-900">
                    {formatCurrency(plan.price, plan.currency)}
                  </div>
                  <div className="text-sm text-gray-500">
                    per {plan.period}
                  </div>
                  {plan.savings && (
                    <div className="text-sm text-green-600 font-medium">
                      {plan.savings}
                    </div>
                  )}
                </div>

                <p className="text-sm text-gray-600 mb-4 text-center">
                  {plan.description}
                </p>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feature, index) => (
                    <li key={index} className="flex items-center text-sm">
                      <Check className="w-4 h-4 text-green-500 mr-2 flex-shrink-0" />
                      {feature}
                    </li>
                  ))}
                </ul>

                <div className="space-y-2">
                  {comparison === 'current' && (
                    <Button fullWidth disabled>
                      Current Plan
                    </Button>
                  )}
                  
                  {comparison === 'subscribe' && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => handleSubscribe(plan.id)}
                      loading={loading && selectedPlan === plan.id}
                      disabled={loading}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Subscribing...
                        </>
                      ) : (
                        'Subscribe Now'
                      )}
                    </Button>
                  )}
                  
                  {comparison === 'upgrade' && (
                    <Button
                      fullWidth
                      variant="primary"
                      onClick={() => handleUpgrade(plan.id)}
                      loading={loading && selectedPlan === plan.id}
                      disabled={loading}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Upgrading...
                        </>
                      ) : (
                        <>
                          <ArrowRight className="w-4 h-4 mr-2" />
                          Upgrade
                        </>
                      )}
                    </Button>
                  )}
                  
                  {comparison === 'downgrade' && (
                    <Button
                      fullWidth
                      variant="outline"
                      onClick={() => handleDowngrade(plan.id)}
                      loading={loading && selectedPlan === plan.id}
                      disabled={loading}
                    >
                      {loading && selectedPlan === plan.id ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        'Downgrade'
                      )}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Billing History */}
      {showBillingHistory && billingHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <CreditCard className="w-5 h-5 mr-2" />
              Billing History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {billingHistory.map((bill) => (
                <div key={bill.id} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{bill.description}</div>
                    <div className="text-sm text-gray-600">{formatDate(bill.created_at)}</div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(bill.amount, bill.currency)}
                    </div>
                    <div className={`text-sm px-2 py-1 rounded-full ${
                      bill.status === 'paid' ? 'text-green-600 bg-green-100' :
                      bill.status === 'pending' ? 'text-yellow-600 bg-yellow-100' :
                      'text-red-600 bg-red-100'
                    }`}>
                      {bill.status.toUpperCase()}
                    </div>
                  </div>
                  {bill.invoice_url && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => window.open(bill.invoice_url, '_blank')}
                    >
                      View Invoice
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Free Trial Offer */}
      {!currentSubscription && (
        <div className="text-center mt-8">
          <Card className="max-w-md mx-auto">
            <CardContent className="text-center py-6">
              <Gift className="w-12 h-12 text-primary-600 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Start Your Free Trial
              </h3>
              <p className="text-gray-600 mb-4">
                Try any premium plan free for 7 days. Cancel anytime.
              </p>
              <Button variant="primary">
                Start Free Trial
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}