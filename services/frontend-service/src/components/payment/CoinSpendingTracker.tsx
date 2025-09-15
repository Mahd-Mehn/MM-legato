'use client';

import { useState, useEffect } from 'react';
import { Coins, TrendingUp, TrendingDown, Calendar, Filter, Eye, EyeOff } from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

interface SpendingData {
  total_spent_today: number;
  total_spent_week: number;
  total_spent_month: number;
  spending_by_category: {
    premium_chapters: number;
    tips: number;
    gifts: number;
    other: number;
  };
  recent_purchases: Array<{
    id: string;
    amount: number;
    description: string;
    category: string;
    created_at: string;
  }>;
  spending_trend: Array<{
    date: string;
    amount: number;
  }>;
}

interface CoinSpendingTrackerProps {
  showBalance?: boolean;
  compact?: boolean;
}

export default function CoinSpendingTracker({ 
  showBalance = true, 
  compact = false 
}: CoinSpendingTrackerProps) {
  const { user } = useAuth();
  const [spendingData, setSpendingData] = useState<SpendingData | null>(null);
  const [userBalance, setUserBalance] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [showDetails, setShowDetails] = useState(!compact);
  const [timeframe, setTimeframe] = useState<'today' | 'week' | 'month'>('week');

  useEffect(() => {
    if (user) {
      fetchSpendingData();
      if (showBalance) {
        fetchUserBalance();
      }
    }
  }, [user, timeframe]);

  const fetchSpendingData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/payment/users/${user.id}/spending-analytics?timeframe=${timeframe}`);
      if (response.ok) {
        const data = await response.json();
        setSpendingData(data);
      }
    } catch (error) {
      console.error('Error fetching spending data:', error);
    } finally {
      setLoading(false);
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

  const getSpendingAmount = () => {
    if (!spendingData) return 0;
    switch (timeframe) {
      case 'today':
        return spendingData.total_spent_today;
      case 'week':
        return spendingData.total_spent_week;
      case 'month':
        return spendingData.total_spent_month;
      default:
        return 0;
    }
  };

  const getTimeframeLabel = () => {
    switch (timeframe) {
      case 'today':
        return 'Today';
      case 'week':
        return 'This Week';
      case 'month':
        return 'This Month';
      default:
        return 'This Week';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'premium_chapters':
        return 'bg-blue-100 text-blue-800';
      case 'tips':
        return 'bg-green-100 text-green-800';
      case 'gifts':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCategoryName = (category: string) => {
    return category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (!user) {
    return null;
  }

  if (compact) {
    return (
      <Card className="w-full">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <Coins className="w-5 h-5 text-yellow-600 mr-2" />
              <div>
                <div className="font-medium text-gray-900">
                  {getSpendingAmount().toLocaleString()} coins
                </div>
                <div className="text-sm text-gray-600">spent {getTimeframeLabel().toLowerCase()}</div>
              </div>
            </div>
            
            {showBalance && (
              <div className="text-right">
                <div className="font-medium text-gray-900">
                  {userBalance.toLocaleString()}
                </div>
                <div className="text-sm text-gray-600">balance</div>
              </div>
            )}
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowDetails(!showDetails)}
            >
              {showDetails ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </Button>
          </div>
          
          {showDetails && spendingData && (
            <div className="mt-4 pt-4 border-t border-gray-200">
              <div className="grid grid-cols-2 gap-4">
                {Object.entries(spendingData.spending_by_category).map(([category, amount]) => (
                  amount > 0 && (
                    <div key={category} className="text-center">
                      <div className="text-lg font-semibold text-gray-900">{amount}</div>
                      <div className="text-xs text-gray-600">{formatCategoryName(category)}</div>
                    </div>
                  )
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {showBalance && (
          <Card>
            <CardContent className="p-6 text-center">
              <Coins className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {userBalance.toLocaleString()}
              </div>
              <div className="text-sm text-gray-600">Current Balance</div>
            </CardContent>
          </Card>
        )}
        
        <Card>
          <CardContent className="p-6 text-center">
            <Calendar className="w-8 h-8 text-blue-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {spendingData?.total_spent_today.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Spent Today</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingUp className="w-8 h-8 text-green-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {spendingData?.total_spent_week.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Spent This Week</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6 text-center">
            <TrendingDown className="w-8 h-8 text-purple-600 mx-auto mb-2" />
            <div className="text-2xl font-bold text-gray-900">
              {spendingData?.total_spent_month.toLocaleString() || 0}
            </div>
            <div className="text-sm text-gray-600">Spent This Month</div>
          </CardContent>
        </Card>
      </div>

      {/* Spending by Category */}
      {spendingData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Spending by Category</span>
              <div className="flex space-x-2">
                {(['today', 'week', 'month'] as const).map((period) => (
                  <button
                    key={period}
                    onClick={() => setTimeframe(period)}
                    className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                      timeframe === period
                        ? 'bg-primary-600 text-white'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {period.charAt(0).toUpperCase() + period.slice(1)}
                  </button>
                ))}
              </div>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(spendingData.spending_by_category).map(([category, amount]) => (
                <div key={category} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {amount.toLocaleString()}
                  </div>
                  <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(category)}`}>
                    {formatCategoryName(category)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recent Purchases */}
      {spendingData && spendingData.recent_purchases.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Purchases</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {spendingData.recent_purchases.slice(0, 5).map((purchase) => (
                <div key={purchase.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{purchase.description}</div>
                    <div className="text-sm text-gray-600">
                      {new Date(purchase.created_at).toLocaleDateString()}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-red-600">
                      -{purchase.amount.toLocaleString()} coins
                    </div>
                    <div className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getCategoryColor(purchase.category)}`}>
                      {formatCategoryName(purchase.category)}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Spending Trend Chart Placeholder */}
      {spendingData && spendingData.spending_trend.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Spending Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center bg-gray-50 rounded-lg">
              <div className="text-center">
                <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-2" />
                <div className="text-gray-600">Spending trend chart would go here</div>
                <div className="text-sm text-gray-500">
                  Integration with charting library needed
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}