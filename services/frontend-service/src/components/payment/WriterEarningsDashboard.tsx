'use client';

import { useState, useEffect } from 'react';
import { DollarSign, TrendingUp, Calendar, Download, Eye, Users, BookOpen, CreditCard } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import { useAuth } from '@/contexts/AuthContext';

interface EarningsData {
  total_earnings: {
    USD: number;
    NGN: number;
    CAD: number;
  };
  available_for_payout: {
    USD: number;
    NGN: number;
    CAD: number;
  };
  pending_payout: {
    USD: number;
    NGN: number;
    CAD: number;
  };
  earnings_by_source: {
    content_sales: number;
    tips: number;
    subscriptions: number;
    licensing: number;
  };
  monthly_earnings: Array<{
    month: string;
    amount: number;
    currency: string;
  }>;
  top_performing_content: Array<{
    id: string;
    title: string;
    earnings: number;
    views: number;
    conversion_rate: number;
  }>;
  payout_history: Array<{
    id: string;
    amount: number;
    currency: string;
    status: string;
    requested_at: string;
    processed_at?: string;
  }>;
}

interface TaxReportData {
  year: number;
  total_income: number;
  currency: string;
  breakdown_by_source: {
    content_sales: number;
    tips: number;
    subscriptions: number;
    licensing: number;
  };
  breakdown_by_month: Array<{
    month: string;
    amount: number;
  }>;
  tax_documents: Array<{
    type: string;
    url: string;
    generated_at: string;
  }>;
}

export default function WriterEarningsDashboard() {
  const { user } = useAuth();
  const [earningsData, setEarningsData] = useState<EarningsData | null>(null);
  const [taxReportData, setTaxReportData] = useState<TaxReportData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCurrency, setSelectedCurrency] = useState<'USD' | 'NGN' | 'CAD'>('USD');
  const [selectedTimeframe, setSelectedTimeframe] = useState<'month' | 'quarter' | 'year'>('month');
  const [showPayoutModal, setShowPayoutModal] = useState(false);
  const [payoutAmount, setPayoutAmount] = useState<string>('');

  useEffect(() => {
    if (user) {
      fetchEarningsData();
      fetchTaxReportData();
    }
  }, [user, selectedTimeframe]);

  const fetchEarningsData = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const response = await fetch(`/api/payment/writers/${user.id}/earnings?timeframe=${selectedTimeframe}`);
      if (response.ok) {
        const data = await response.json();
        setEarningsData(data);
      } else {
        throw new Error('Failed to fetch earnings data');
      }
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load earnings data');
    } finally {
      setLoading(false);
    }
  };

  const fetchTaxReportData = async () => {
    if (!user) return;

    try {
      const currentYear = new Date().getFullYear();
      const response = await fetch(`/api/payment/writers/${user.id}/tax-report?year=${currentYear}`);
      if (response.ok) {
        const data = await response.json();
        setTaxReportData(data);
      }
    } catch (error) {
      console.error('Error fetching tax report data:', error);
    }
  };

  const handleRequestPayout = async () => {
    if (!user || !earningsData) return;

    const amount = parseFloat(payoutAmount);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid payout amount');
      return;
    }

    const availableAmount = earningsData.available_for_payout[selectedCurrency];
    if (amount > availableAmount) {
      setError(`Amount exceeds available balance of ${formatCurrency(availableAmount, selectedCurrency)}`);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/payment/writers/${user.id}/request-payout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount,
          currency: selectedCurrency,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to request payout');
      }

      setShowPayoutModal(false);
      setPayoutAmount('');
      await fetchEarningsData();
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to request payout');
    } finally {
      setLoading(false);
    }
  };

  const handleExportReport = async (type: 'earnings' | 'tax') => {
    if (!user) return;

    try {
      const endpoint = type === 'earnings' 
        ? `/api/payment/writers/${user.id}/earnings/export`
        : `/api/payment/writers/${user.id}/tax-report/export`;
      
      const response = await fetch(endpoint);
      
      if (!response.ok) {
        throw new Error(`Failed to export ${type} report`);
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `${type}-report-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : `Failed to export ${type} report`);
    }
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
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'failed':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (!user) {
    return (
      <div className="text-center py-12">
        <DollarSign className="w-16 h-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Sign In Required</h3>
        <p className="text-gray-600">Please sign in to view your earnings dashboard</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Earnings Dashboard</h1>
          <p className="text-gray-600 mt-2">Track your revenue and manage payouts</p>
        </div>
        
        <div className="flex space-x-3">
          <div className="flex space-x-2">
            {(['USD', 'NGN', 'CAD'] as const).map((currency) => (
              <button
                key={currency}
                onClick={() => setSelectedCurrency(currency)}
                className={`px-3 py-1 rounded-md text-sm font-medium transition-colors ${
                  selectedCurrency === currency
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {currency}
              </button>
            ))}
          </div>
          
          <Button
            variant="outline"
            onClick={() => handleExportReport('earnings')}
          >
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Overview Cards */}
      {earningsData && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6 text-center">
              <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.total_earnings[selectedCurrency], selectedCurrency)}
              </div>
              <div className="text-sm text-gray-600">Total Earnings</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <CreditCard className="w-8 h-8 text-blue-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.available_for_payout[selectedCurrency], selectedCurrency)}
              </div>
              <div className="text-sm text-gray-600">Available for Payout</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <Calendar className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {formatCurrency(earningsData.pending_payout[selectedCurrency], selectedCurrency)}
              </div>
              <div className="text-sm text-gray-600">Pending Payout</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-6 text-center">
              <TrendingUp className="w-8 h-8 text-purple-600 mx-auto mb-2" />
              <div className="text-2xl font-bold text-gray-900">
                {earningsData.monthly_earnings.length > 1 ? 
                  `${((earningsData.monthly_earnings[0].amount / earningsData.monthly_earnings[1].amount - 1) * 100).toFixed(1)}%` : 
                  '0%'
                }
              </div>
              <div className="text-sm text-gray-600">Monthly Growth</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Earnings by Source */}
      {earningsData && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Earnings by Source</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(earningsData.earnings_by_source).map(([source, amount]) => (
                <div key={source} className="text-center p-4 rounded-lg bg-gray-50">
                  <div className="text-xl font-bold text-gray-900 mb-1">
                    {formatCurrency(amount, selectedCurrency)}
                  </div>
                  <div className="text-sm text-gray-600 capitalize">
                    {source.replace('_', ' ')}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Top Performing Content */}
      {earningsData && earningsData.top_performing_content.length > 0 && (
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center">
              <BookOpen className="w-5 h-5 mr-2" />
              Top Performing Content
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {earningsData.top_performing_content.map((content) => (
                <div key={content.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">{content.title}</div>
                    <div className="flex items-center text-sm text-gray-600 mt-1">
                      <Eye className="w-4 h-4 mr-1" />
                      {content.views.toLocaleString()} views
                      <span className="mx-2">•</span>
                      {(content.conversion_rate * 100).toFixed(1)}% conversion
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold text-gray-900">
                      {formatCurrency(content.earnings, selectedCurrency)}
                    </div>
                    <div className="text-sm text-gray-600">earned</div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Section */}
      {earningsData && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Request Payout */}
          <Card>
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Available Balance
                  </label>
                  <div className="text-2xl font-bold text-green-600">
                    {formatCurrency(earningsData.available_for_payout[selectedCurrency], selectedCurrency)}
                  </div>
                </div>
                
                <Button
                  variant="primary"
                  onClick={() => setShowPayoutModal(true)}
                  disabled={earningsData.available_for_payout[selectedCurrency] <= 0}
                  fullWidth
                >
                  Request Payout
                </Button>
                
                <p className="text-sm text-gray-500">
                  Minimum payout amount: {formatCurrency(10, selectedCurrency)}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Payout History */}
          <Card>
            <CardHeader>
              <CardTitle>Recent Payouts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {earningsData.payout_history.slice(0, 5).map((payout) => (
                  <div key={payout.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        {formatCurrency(payout.amount, payout.currency)}
                      </div>
                      <div className="text-sm text-gray-600">
                        {new Date(payout.requested_at).toLocaleDateString()}
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(payout.status)}`}>
                      {payout.status.toUpperCase()}
                    </span>
                  </div>
                ))}
                
                {earningsData.payout_history.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    No payout history yet
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Tax Reporting */}
      {taxReportData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>Tax Reporting ({taxReportData.year})</span>
              <Button
                variant="outline"
                onClick={() => handleExportReport('tax')}
              >
                <Download className="w-4 h-4 mr-2" />
                Export Tax Report
              </Button>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Total Income</h4>
                <div className="text-2xl font-bold text-gray-900 mb-4">
                  {formatCurrency(taxReportData.total_income, taxReportData.currency)}
                </div>
                
                <h4 className="font-medium text-gray-900 mb-3">Income by Source</h4>
                <div className="space-y-2">
                  {Object.entries(taxReportData.breakdown_by_source).map(([source, amount]) => (
                    <div key={source} className="flex justify-between">
                      <span className="text-gray-600 capitalize">{source.replace('_', ' ')}</span>
                      <span className="font-medium">{formatCurrency(amount, taxReportData.currency)}</span>
                    </div>
                  ))}
                </div>
              </div>
              
              <div>
                <h4 className="font-medium text-gray-900 mb-3">Available Documents</h4>
                <div className="space-y-2">
                  {taxReportData.tax_documents.map((doc, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                      <span className="text-sm text-gray-700">{doc.type}</span>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(doc.url, '_blank')}
                      >
                        Download
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Payout Modal */}
      {showPayoutModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <Card className="max-w-md w-full">
            <CardHeader>
              <CardTitle>Request Payout</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Payout Amount ({selectedCurrency})
                  </label>
                  <input
                    type="number"
                    value={payoutAmount}
                    onChange={(e) => setPayoutAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                    min="10"
                    max={earningsData?.available_for_payout[selectedCurrency] || 0}
                    step="0.01"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    Available: {earningsData ? formatCurrency(earningsData.available_for_payout[selectedCurrency], selectedCurrency) : '0'}
                  </p>
                </div>
                
                <div className="flex space-x-3">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowPayoutModal(false);
                      setPayoutAmount('');
                      setError(null);
                    }}
                    fullWidth
                  >
                    Cancel
                  </Button>
                  <Button
                    variant="primary"
                    onClick={handleRequestPayout}
                    loading={loading}
                    disabled={loading}
                    fullWidth
                  >
                    Request Payout
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}