'use client';

import { useState, useEffect } from 'react';
import { 
  DollarSign, 
  TrendingUp, 
  Calendar, 
  Download, 
  CreditCard,
  Wallet,
  PieChart,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';

interface RevenueData {
  overview: {
    totalEarnings: number;
    monthlyEarnings: number;
    pendingPayouts: number;
    availableBalance: number;
  };
  revenueStreams: RevenueStream[];
  payoutHistory: Payout[];
  monthlyBreakdown: MonthlyRevenue[];
}

interface RevenueStream {
  source: 'subscriptions' | 'coins' | 'licensing' | 'tips' | 'ads';
  amount: number;
  percentage: number;
  change: number;
}

interface Payout {
  id: string;
  amount: number;
  status: 'completed' | 'pending' | 'processing' | 'failed';
  method: 'bank' | 'paypal' | 'crypto';
  date: string;
  transactionId?: string;
}

interface MonthlyRevenue {
  month: string;
  subscriptions: number;
  coins: number;
  licensing: number;
  tips: number;
  ads: number;
  total: number;
}

const mockRevenueData: RevenueData = {
  overview: {
    totalEarnings: 15420.75,
    monthlyEarnings: 2450.50,
    pendingPayouts: 850.25,
    availableBalance: 1600.25,
  },
  revenueStreams: [
    { source: 'subscriptions', amount: 1200.50, percentage: 49, change: 12.5 },
    { source: 'coins', amount: 750.25, percentage: 31, change: 8.3 },
    { source: 'licensing', amount: 350.00, percentage: 14, change: 25.0 },
    { source: 'tips', amount: 100.75, percentage: 4, change: -5.2 },
    { source: 'ads', amount: 49.00, percentage: 2, change: 15.8 },
  ],
  payoutHistory: [
    {
      id: 'payout1',
      amount: 1500.00,
      status: 'completed',
      method: 'bank',
      date: '2024-01-15',
      transactionId: 'TXN123456789',
    },
    {
      id: 'payout2',
      amount: 850.25,
      status: 'processing',
      method: 'paypal',
      date: '2024-01-20',
    },
    {
      id: 'payout3',
      amount: 1200.75,
      status: 'completed',
      method: 'bank',
      date: '2023-12-15',
      transactionId: 'TXN987654321',
    },
  ],
  monthlyBreakdown: [
    {
      month: 'Jan 2024',
      subscriptions: 1200.50,
      coins: 750.25,
      licensing: 350.00,
      tips: 100.75,
      ads: 49.00,
      total: 2450.50,
    },
    {
      month: 'Dec 2023',
      subscriptions: 1100.25,
      coins: 680.50,
      licensing: 280.00,
      tips: 95.50,
      ads: 44.50,
      total: 2200.75,
    },
    {
      month: 'Nov 2023',
      subscriptions: 950.75,
      coins: 620.25,
      licensing: 200.00,
      tips: 85.25,
      ads: 39.75,
      total: 1896.00,
    },
  ],
};

export default function RevenuePage() {
  const [revenueData, setRevenueData] = useState<RevenueData | null>(null);
  const [loading, setLoading] = useState(true);
  const [showPayoutModal, setShowPayoutModal] = useState(false);

  useEffect(() => {
    const loadRevenueData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setRevenueData(mockRevenueData);
      setLoading(false);
    };

    loadRevenueData();
  }, []);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'text-green-600 bg-green-50';
      case 'processing':
        return 'text-blue-600 bg-blue-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'failed':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case 'processing':
        return <Clock className="w-4 h-4 text-blue-600" />;
      case 'pending':
        return <Clock className="w-4 h-4 text-orange-600" />;
      case 'failed':
        return <AlertCircle className="w-4 h-4 text-red-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getRevenueSourceIcon = (source: string) => {
    switch (source) {
      case 'subscriptions':
        return '📱';
      case 'coins':
        return '🪙';
      case 'licensing':
        return '🎬';
      case 'tips':
        return '💝';
      case 'ads':
        return '📺';
      default:
        return '💰';
    }
  };

  if (loading || !revenueData) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Revenue & Payouts</h1>
              <p className="text-gray-600 mt-1">Track your earnings and manage payouts</p>
            </div>
            <div className="mt-4 sm:mt-0 flex space-x-3">
              <Button variant="outline" leftIcon={<Download className="w-4 h-4" />}>
                Export Report
              </Button>
              <Button 
                leftIcon={<Wallet className="w-4 h-4" />}
                onClick={() => setShowPayoutModal(true)}
              >
                Request Payout
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Earnings</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData.overview.totalEarnings)}
                  </p>
                </div>
                <DollarSign className="w-8 h-8 text-green-600" />
              </div>
              <div className="mt-4 flex items-center text-sm text-green-600">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+12.5% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">This Month</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData.overview.monthlyEarnings)}
                  </p>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-600" />
              </div>
              <div className="mt-4 flex items-center text-sm text-blue-600">
                <ArrowUpRight className="w-4 h-4 mr-1" />
                <span>+8.3% from last month</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Available Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData.overview.availableBalance)}
                  </p>
                </div>
                <Wallet className="w-8 h-8 text-purple-600" />
              </div>
              <div className="mt-4">
                <Button size="sm" fullWidth>
                  Request Payout
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Pending Payouts</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {formatCurrency(revenueData.overview.pendingPayouts)}
                  </p>
                </div>
                <Clock className="w-8 h-8 text-orange-600" />
              </div>
              <div className="mt-4 text-sm text-gray-500">
                Processing within 3-5 days
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Revenue Streams */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <PieChart className="w-5 h-5 mr-2" />
                  Revenue Streams
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.revenueStreams.map((stream) => (
                    <div
                      key={stream.source}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="text-2xl">
                          {getRevenueSourceIcon(stream.source)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900 capitalize">
                            {stream.source}
                          </h3>
                          <p className="text-sm text-gray-500">
                            {stream.percentage}% of total revenue
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">
                          {formatCurrency(stream.amount)}
                        </div>
                        <div className={`text-sm flex items-center ${
                          stream.change >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {stream.change >= 0 ? (
                            <ArrowUpRight className="w-3 h-3 mr-1" />
                          ) : (
                            <ArrowDownRight className="w-3 h-3 mr-1" />
                          )}
                          {Math.abs(stream.change)}%
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Monthly Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>Monthly Revenue Breakdown</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2">Month</th>
                        <th className="text-right py-2">Subscriptions</th>
                        <th className="text-right py-2">Coins</th>
                        <th className="text-right py-2">Licensing</th>
                        <th className="text-right py-2">Tips</th>
                        <th className="text-right py-2">Ads</th>
                        <th className="text-right py-2 font-semibold">Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueData.monthlyBreakdown.map((month) => (
                        <tr key={month.month} className="border-b border-gray-100">
                          <td className="py-3 font-medium">{month.month}</td>
                          <td className="text-right py-3">{formatCurrency(month.subscriptions)}</td>
                          <td className="text-right py-3">{formatCurrency(month.coins)}</td>
                          <td className="text-right py-3">{formatCurrency(month.licensing)}</td>
                          <td className="text-right py-3">{formatCurrency(month.tips)}</td>
                          <td className="text-right py-3">{formatCurrency(month.ads)}</td>
                          <td className="text-right py-3 font-semibold">{formatCurrency(month.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Payout History */}
            <Card>
              <CardHeader>
                <CardTitle>Recent Payouts</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {revenueData.payoutHistory.map((payout) => (
                    <div
                      key={payout.id}
                      className="flex items-center justify-between p-3 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          {getStatusIcon(payout.status)}
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">
                            {formatCurrency(payout.amount)}
                          </div>
                          <div className="text-sm text-gray-500">
                            {formatDate(payout.date)} • {payout.method}
                          </div>
                        </div>
                      </div>
                      <span className={`px-2 py-1 rounded text-xs font-medium capitalize ${getStatusColor(payout.status)}`}>
                        {payout.status}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="mt-4">
                  <Button variant="outline" size="sm" fullWidth>
                    View All Payouts
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Payout Methods */}
            <Card>
              <CardHeader>
                <CardTitle>Payout Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <CreditCard className="w-5 h-5 text-gray-400" />
                    <div>
                      <div className="font-medium">Bank Account</div>
                      <div className="text-sm text-gray-500">•••• 1234</div>
                    </div>
                  </div>
                  <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded">
                    Primary
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="w-5 h-5 bg-blue-600 rounded text-white text-xs flex items-center justify-center">
                      P
                    </div>
                    <div>
                      <div className="font-medium">PayPal</div>
                      <div className="text-sm text-gray-500">user@email.com</div>
                    </div>
                  </div>
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  Add Payment Method
                </Button>
              </CardContent>
            </Card>

            {/* Tax Information */}
            <Card>
              <CardHeader>
                <CardTitle>Tax Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm text-gray-600">
                  <p className="mb-2">Year-to-date earnings:</p>
                  <p className="text-lg font-semibold text-gray-900">
                    {formatCurrency(revenueData.overview.totalEarnings)}
                  </p>
                </div>
                <Button variant="outline" size="sm" fullWidth>
                  Download 1099
                </Button>
                <Button variant="outline" size="sm" fullWidth>
                  Tax Settings
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Payout Request Modal */}
        {showPayoutModal && (
          <PayoutModal 
            availableBalance={revenueData.overview.availableBalance}
            onClose={() => setShowPayoutModal(false)}
          />
        )}
      </div>
    </div>
  );
}

function PayoutModal({ 
  availableBalance, 
  onClose 
}: { 
  availableBalance: number; 
  onClose: () => void; 
}) {
  const [amount, setAmount] = useState('');
  const [method, setMethod] = useState('bank');
  const [loading, setLoading] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      // TODO: Implement actual payout request
      console.log('Requesting payout:', { amount, method });
      await new Promise(resolve => setTimeout(resolve, 2000));
      onClose();
    } catch (error) {
      console.error('Payout request failed:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="max-w-md w-full">
        <CardHeader>
          <CardTitle>Request Payout</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Available Balance
              </label>
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(availableBalance)}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payout Amount
              </label>
              <input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.00"
                max={availableBalance}
                step="0.01"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Payout Method
              </label>
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
              >
                <option value="bank">Bank Account (•••• 1234)</option>
                <option value="paypal">PayPal (user@email.com)</option>
              </select>
            </div>

            <div className="text-sm text-gray-500">
              <p>• Minimum payout: $50.00</p>
              <p>• Processing time: 3-5 business days</p>
              <p>• No fees for bank transfers</p>
            </div>

            <div className="flex space-x-3">
              <Button
                type="button"
                variant="outline"
                fullWidth
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                fullWidth
                loading={loading}
                disabled={!amount || parseFloat(amount) < 50}
              >
                Request Payout
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}