'use client';

import { useState } from 'react';
import { DollarSign, TrendingUp, Eye, Users, Gift, Zap } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface EarningsData {
  total: number;
  breakdown: {
    subscriptions: number;
    coins: number;
    tips: number;
    licensing: number;
    ads: number;
  };
  trends: {
    subscriptions: number;
    coins: number;
    tips: number;
    licensing: number;
    ads: number;
  };
  projectedMonthly: number;
  payoutSchedule: {
    nextPayout: string;
    amount: number;
    status: 'pending' | 'processing' | 'completed';
  };
}

interface EarningsBreakdownProps {
  data: EarningsData;
  timeRange: '7d' | '30d' | '90d';
}

export default function EarningsBreakdown({ data, timeRange }: EarningsBreakdownProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    const sign = value >= 0 ? '+' : '';
    return `${sign}${value.toFixed(1)}%`;
  };

  const earningsCategories = [
    {
      key: 'subscriptions',
      label: 'Subscriptions',
      icon: <Users className="w-5 h-5" />,
      color: 'bg-blue-500',
      amount: data.breakdown.subscriptions,
      trend: data.trends.subscriptions,
      description: 'Monthly subscription revenue',
    },
    {
      key: 'coins',
      label: 'Coin Purchases',
      icon: <Zap className="w-5 h-5" />,
      color: 'bg-yellow-500',
      amount: data.breakdown.coins,
      trend: data.trends.coins,
      description: 'Premium chapter unlocks',
    },
    {
      key: 'tips',
      label: 'Tips & Gifts',
      icon: <Gift className="w-5 h-5" />,
      color: 'bg-pink-500',
      amount: data.breakdown.tips,
      trend: data.trends.tips,
      description: 'Reader appreciation',
    },
    {
      key: 'licensing',
      label: 'Licensing',
      icon: <DollarSign className="w-5 h-5" />,
      color: 'bg-green-500',
      amount: data.breakdown.licensing,
      trend: data.trends.licensing,
      description: 'IP licensing deals',
    },
    {
      key: 'ads',
      label: 'Ad Revenue',
      icon: <Eye className="w-5 h-5" />,
      color: 'bg-purple-500',
      amount: data.breakdown.ads,
      trend: data.trends.ads,
      description: 'Advertisement earnings',
    },
  ];

  const totalPercentages = earningsCategories.map(category => ({
    ...category,
    percentage: data.total > 0 ? (category.amount / data.total) * 100 : 0,
  }));

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Earnings Overview</span>
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(data.total)}
              </div>
              <div className="text-sm text-gray-500">
                Last {timeRange === '7d' ? '7 days' : timeRange === '30d' ? '30 days' : '90 days'}
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(data.projectedMonthly)}
              </div>
              <div className="text-sm text-gray-500">Projected Monthly</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-lg font-semibold text-gray-900">
                {formatCurrency(data.payoutSchedule.amount)}
              </div>
              <div className="text-sm text-gray-500">Next Payout</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                data.payoutSchedule.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : data.payoutSchedule.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {data.payoutSchedule.status}
              </div>
              <div className="text-sm text-gray-500 mt-1">{data.payoutSchedule.nextPayout}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Revenue Breakdown */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Breakdown</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {totalPercentages.map((category) => (
              <div
                key={category.key}
                className={`p-4 rounded-lg border-2 transition-all cursor-pointer ${
                  selectedCategory === category.key
                    ? 'border-primary-300 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setSelectedCategory(
                  selectedCategory === category.key ? null : category.key
                )}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-2 rounded-lg ${category.color} text-white`}>
                      {category.icon}
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900">{category.label}</h3>
                      <p className="text-sm text-gray-500">{category.description}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(category.amount)}
                    </div>
                    <div className="flex items-center space-x-2 text-sm">
                      <span className="text-gray-500">
                        {category.percentage.toFixed(1)}%
                      </span>
                      <span className={`flex items-center ${
                        category.trend >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        <TrendingUp className={`w-3 h-3 mr-1 ${
                          category.trend < 0 ? 'rotate-180' : ''
                        }`} />
                        {formatPercentage(category.trend)}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="mt-3">
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full ${category.color}`}
                      style={{ width: `${category.percentage}%` }}
                    />
                  </div>
                </div>

                {/* Expanded Details */}
                {selectedCategory === category.key && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-gray-500">Average per day:</span>
                        <span className="ml-2 font-medium">
                          {formatCurrency(category.amount / (timeRange === '7d' ? 7 : timeRange === '30d' ? 30 : 90))}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-500">Growth rate:</span>
                        <span className={`ml-2 font-medium ${
                          category.trend >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatPercentage(category.trend)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Payout Information */}
      <Card>
        <CardHeader>
          <CardTitle>Payout Schedule</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Next Payout</span>
              <span className="text-sm text-gray-500">{data.payoutSchedule.nextPayout}</span>
            </div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-sm font-medium text-gray-700">Amount</span>
              <span className="text-lg font-bold text-gray-900">
                {formatCurrency(data.payoutSchedule.amount)}
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Status</span>
              <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                data.payoutSchedule.status === 'completed' 
                  ? 'bg-green-100 text-green-800'
                  : data.payoutSchedule.status === 'processing'
                  ? 'bg-yellow-100 text-yellow-800'
                  : 'bg-gray-100 text-gray-800'
              }`}>
                {data.payoutSchedule.status}
              </span>
            </div>
          </div>
          <div className="mt-4 text-xs text-gray-500">
            Payouts are processed on the 15th of each month. Minimum payout amount is $50.
          </div>
        </CardContent>
      </Card>
    </div>
  );
}