'use client';

import { useState } from 'react';
import { Calendar, CreditCard, Download, Settings, AlertCircle, CheckCircle } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface Subscription {
  id: string;
  plan: string;
  status: 'active' | 'cancelled' | 'expired';
  price: number;
  currency: string;
  period: 'monthly' | 'yearly';
  nextBilling: string;
  cancelledAt?: string;
  features: string[];
}

interface PaymentMethod {
  id: string;
  type: 'card' | 'paypal';
  last4?: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  email?: string;
  isDefault: boolean;
}

const mockSubscription: Subscription = {
  id: 'sub_123',
  plan: 'Pro',
  status: 'active',
  price: 19.99,
  currency: 'USD',
  period: 'monthly',
  nextBilling: '2024-02-15',
  features: [
    'Unlimited reading',
    'Ad-free experience',
    'Premium stories access',
    'Offline reading',
    'Advanced analytics',
    'Priority support',
  ],
};

const mockPaymentMethods: PaymentMethod[] = [
  {
    id: 'pm_1',
    type: 'card',
    last4: '4242',
    brand: 'visa',
    expiryMonth: 12,
    expiryYear: 2025,
    isDefault: true,
  },
  {
    id: 'pm_2',
    type: 'paypal',
    email: 'user@example.com',
    isDefault: false,
  },
];

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription>(mockSubscription);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>(mockPaymentMethods);
  const [loading, setLoading] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);

  const handleCancelSubscription = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual cancellation API call
      console.log('Cancelling subscription:', subscription.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubscription(prev => ({
        ...prev,
        status: 'cancelled',
        cancelledAt: new Date().toISOString(),
      }));
      
      setShowCancelModal(false);
    } catch (error) {
      console.error('Failed to cancel subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleReactivateSubscription = async () => {
    setLoading(true);
    try {
      // TODO: Implement actual reactivation API call
      console.log('Reactivating subscription:', subscription.id);
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      setSubscription(prev => ({
        ...prev,
        status: 'active',
        cancelledAt: undefined,
      }));
    } catch (error) {
      console.error('Failed to reactivate subscription:', error);
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'cancelled':
        return 'text-orange-600 bg-orange-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Subscription Management
          </h1>
          <p className="text-gray-600">
            Manage your subscription, billing, and payment methods
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Current Subscription */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Current Subscription</span>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getStatusColor(subscription.status)}`}>
                    {subscription.status}
                  </span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <h3 className="text-2xl font-bold text-gray-900">
                      {subscription.plan} Plan
                    </h3>
                    <p className="text-gray-600">
                      ${subscription.price}/{subscription.period}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-gray-500">Next billing</p>
                    <p className="font-semibold text-gray-900">
                      {formatDate(subscription.nextBilling)}
                    </p>
                  </div>
                </div>

                {subscription.status === 'cancelled' && subscription.cancelledAt && (
                  <div className="mb-6 p-4 bg-orange-50 border border-orange-200 rounded-lg">
                    <div className="flex items-center">
                      <AlertCircle className="w-5 h-5 text-orange-600 mr-2" />
                      <div>
                        <p className="text-sm font-medium text-orange-800">
                          Subscription Cancelled
                        </p>
                        <p className="text-sm text-orange-600">
                          Your subscription was cancelled on {formatDate(subscription.cancelledAt)}.
                          You'll continue to have access until {formatDate(subscription.nextBilling)}.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div className="space-y-2 mb-6">
                  <h4 className="font-medium text-gray-900">Included features:</h4>
                  <ul className="space-y-1">
                    {subscription.features.map((feature, index) => (
                      <li key={index} className="flex items-center text-sm text-gray-600">
                        <CheckCircle className="w-4 h-4 text-green-500 mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="flex flex-col sm:flex-row gap-3">
                  {subscription.status === 'active' ? (
                    <>
                      <Button variant="outline">
                        Change Plan
                      </Button>
                      <Button
                        variant="destructive"
                        onClick={() => setShowCancelModal(true)}
                      >
                        Cancel Subscription
                      </Button>
                    </>
                  ) : (
                    <Button
                      onClick={handleReactivateSubscription}
                      loading={loading}
                    >
                      Reactivate Subscription
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Payment Methods */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Payment Methods</span>
                  <Button variant="outline" size="sm">
                    Add New
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {paymentMethods.map((method) => (
                    <div
                      key={method.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <CreditCard className="w-5 h-5 text-gray-400" />
                        <div>
                          {method.type === 'card' ? (
                            <>
                              <p className="font-medium text-gray-900">
                                •••• •••• •••• {method.last4}
                              </p>
                              <p className="text-sm text-gray-500">
                                {method.brand?.toUpperCase()} expires {method.expiryMonth}/{method.expiryYear}
                              </p>
                            </>
                          ) : (
                            <>
                              <p className="font-medium text-gray-900">PayPal</p>
                              <p className="text-sm text-gray-500">{method.email}</p>
                            </>
                          )}
                        </div>
                        {method.isDefault && (
                          <span className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded">
                            Default
                          </span>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="ghost" size="sm">
                          Edit
                        </Button>
                        <Button variant="ghost" size="sm">
                          Remove
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Billing History */}
            <Card>
              <CardHeader>
                <CardTitle>Billing History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { date: '2024-01-15', amount: 19.99, status: 'paid' },
                    { date: '2023-12-15', amount: 19.99, status: 'paid' },
                    { date: '2023-11-15', amount: 19.99, status: 'paid' },
                  ].map((invoice, index) => (
                    <div
                      key={index}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <Calendar className="w-5 h-5 text-gray-400" />
                        <div>
                          <p className="font-medium text-gray-900">
                            ${invoice.amount}
                          </p>
                          <p className="text-sm text-gray-500">
                            {formatDate(invoice.date)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className="px-2 py-1 bg-green-100 text-green-700 text-xs rounded">
                          Paid
                        </span>
                        <Button variant="ghost" size="sm">
                          <Download className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" fullWidth>
                  <Settings className="w-4 h-4 mr-2" />
                  Account Settings
                </Button>
                <Button variant="outline" fullWidth>
                  <Download className="w-4 h-4 mr-2" />
                  Download Data
                </Button>
                <Button variant="outline" fullWidth>
                  Contact Support
                </Button>
              </CardContent>
            </Card>

            {/* Usage Stats */}
            <Card>
              <CardHeader>
                <CardTitle>This Month</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Stories Read</span>
                    <span className="font-medium">24</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-primary-600 h-2 rounded-full" style={{ width: '80%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Reading Time</span>
                    <span className="font-medium">42h</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-green-600 h-2 rounded-full" style={{ width: '65%' }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-sm mb-1">
                    <span>Offline Downloads</span>
                    <span className="font-medium">8</span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div className="bg-blue-600 h-2 rounded-full" style={{ width: '40%' }} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Cancel Subscription Modal */}
        {showCancelModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-red-600">Cancel Subscription</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-gray-600 mb-6">
                  Are you sure you want to cancel your subscription? You'll lose access to premium features at the end of your current billing period.
                </p>
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    fullWidth
                    onClick={() => setShowCancelModal(false)}
                  >
                    Keep Subscription
                  </Button>
                  <Button
                    variant="destructive"
                    fullWidth
                    loading={loading}
                    onClick={handleCancelSubscription}
                  >
                    Cancel Subscription
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}