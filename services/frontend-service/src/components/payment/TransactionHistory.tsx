'use client';

import { useState, useEffect } from 'react';
import { Calendar, Download, Filter, Search, Coins, CreditCard, Gift, ArrowUpRight, ArrowDownLeft, RefreshCw } from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import Input from '@/components/Input';
import { useAuth } from '@/contexts/AuthContext';

interface Transaction {
  id: string;
  transaction_type: 'COIN_PURCHASE' | 'COIN_SPEND' | 'TIP' | 'GIFT' | 'REFUND';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' | 'REFUNDED';
  coin_amount: number;
  fiat_amount?: number;
  currency?: string;
  description: string;
  created_at: string;
  completed_at?: string;
  external_transaction_id?: string;
  related_content_id?: string;
}

interface TransactionFilters {
  type: string;
  status: string;
  dateFrom: string;
  dateTo: string;
  search: string;
}

export default function TransactionHistory() {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filters, setFilters] = useState<TransactionFilters>({
    type: 'all',
    status: 'all',
    dateFrom: '',
    dateTo: '',
    search: '',
  });
  const [showFilters, setShowFilters] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchTransactions(true);
  }, [filters]);

  const fetchTransactions = async (reset = false) => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({
        limit: '20',
        offset: reset ? '0' : ((page - 1) * 20).toString(),
      });

      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);
      if (filters.search) params.append('search', filters.search);

      const response = await fetch(`/api/payment/users/${user.id}/transactions?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch transactions');
      }

      const data = await response.json();
      
      if (reset) {
        setTransactions(data);
        setPage(1);
      } else {
        setTransactions(prev => [...prev, ...data]);
      }
      
      setHasMore(data.length === 20);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to load transactions');
    } finally {
      setLoading(false);
    }
  };

  const handleLoadMore = () => {
    setPage(prev => prev + 1);
    fetchTransactions(false);
  };

  const handleExportTransactions = async () => {
    if (!user) return;

    try {
      const params = new URLSearchParams();
      if (filters.type !== 'all') params.append('type', filters.type);
      if (filters.status !== 'all') params.append('status', filters.status);
      if (filters.dateFrom) params.append('date_from', filters.dateFrom);
      if (filters.dateTo) params.append('date_to', filters.dateTo);

      const response = await fetch(`/api/payment/users/${user.id}/transactions/export?${params}`);
      
      if (!response.ok) {
        throw new Error('Failed to export transactions');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.style.display = 'none';
      a.href = url;
      a.download = `transactions-${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to export transactions');
    }
  };

  const getTransactionIcon = (transaction: Transaction) => {
    switch (transaction.transaction_type) {
      case 'COIN_PURCHASE':
        return <CreditCard className="w-5 h-5 text-green-600" />;
      case 'COIN_SPEND':
        return <Coins className="w-5 h-5 text-blue-600" />;
      case 'TIP':
        return <Gift className="w-5 h-5 text-purple-600" />;
      case 'GIFT':
        return <Gift className="w-5 h-5 text-pink-600" />;
      case 'REFUND':
        return <RefreshCw className="w-5 h-5 text-orange-600" />;
      default:
        return <Coins className="w-5 h-5 text-gray-600" />;
    }
  };

  const getTransactionDirection = (transaction: Transaction) => {
    if (transaction.transaction_type === 'COIN_PURCHASE' || transaction.transaction_type === 'REFUND') {
      return 'in';
    }
    return 'out';
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return 'text-green-600 bg-green-100';
      case 'PENDING':
        return 'text-yellow-600 bg-yellow-100';
      case 'FAILED':
        return 'text-red-600 bg-red-100';
      case 'CANCELLED':
        return 'text-gray-600 bg-gray-100';
      case 'REFUNDED':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const formatTransactionType = (type: string) => {
    return type.replace('_', ' ').toLowerCase().replace(/\b\w/g, l => l.toUpperCase());
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
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

  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Transaction History</h1>
          <p className="text-gray-600 mt-2">View and manage your payment transactions</p>
        </div>
        <div className="flex space-x-3">
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" />
            Filters
          </Button>
          <Button
            variant="outline"
            onClick={handleExportTransactions}
          >
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Filters */}
      {showFilters && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filter Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Type
                </label>
                <select
                  value={filters.type}
                  onChange={(e) => setFilters({ ...filters, type: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Types</option>
                  <option value="COIN_PURCHASE">Coin Purchase</option>
                  <option value="COIN_SPEND">Coin Spend</option>
                  <option value="TIP">Tips</option>
                  <option value="GIFT">Gifts</option>
                  <option value="REFUND">Refunds</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={filters.status}
                  onChange={(e) => setFilters({ ...filters, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500"
                >
                  <option value="all">All Status</option>
                  <option value="COMPLETED">Completed</option>
                  <option value="PENDING">Pending</option>
                  <option value="FAILED">Failed</option>
                  <option value="CANCELLED">Cancelled</option>
                  <option value="REFUNDED">Refunded</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  From Date
                </label>
                <Input
                  type="date"
                  value={filters.dateFrom}
                  onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  To Date
                </label>
                <Input
                  type="date"
                  value={filters.dateTo}
                  onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Search
                </label>
                <Input
                  type="text"
                  placeholder="Search transactions..."
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
            </div>

            <div className="flex justify-end mt-4">
              <Button
                variant="outline"
                onClick={() => setFilters({
                  type: 'all',
                  status: 'all',
                  dateFrom: '',
                  dateTo: '',
                  search: '',
                })}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error Message */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800">{error}</p>
        </div>
      )}

      {/* Transactions List */}
      <div className="space-y-4">
        {transactions.length === 0 && !loading ? (
          <Card>
            <CardContent className="text-center py-12">
              <Coins className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No transactions found</h3>
              <p className="text-gray-600">Your transaction history will appear here</p>
            </CardContent>
          </Card>
        ) : (
          transactions.map((transaction) => {
            const direction = getTransactionDirection(transaction);
            const isPositive = direction === 'in';
            
            return (
              <Card key={transaction.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className="flex-shrink-0">
                        {getTransactionIcon(transaction)}
                      </div>
                      
                      <div className="ml-4">
                        <div className="flex items-center">
                          <h3 className="text-lg font-medium text-gray-900">
                            {formatTransactionType(transaction.transaction_type)}
                          </h3>
                          <span className={`ml-3 px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(transaction.status)}`}>
                            {transaction.status}
                          </span>
                        </div>
                        
                        <p className="text-sm text-gray-600 mt-1">
                          {transaction.description}
                        </p>
                        
                        <div className="flex items-center text-sm text-gray-500 mt-2">
                          <Calendar className="w-4 h-4 mr-1" />
                          {formatDate(transaction.created_at)}
                          {transaction.external_transaction_id && (
                            <>
                              <span className="mx-2">•</span>
                              <span>ID: {transaction.external_transaction_id.slice(-8)}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className={`flex items-center text-lg font-semibold ${
                        isPositive ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {isPositive ? (
                          <ArrowDownLeft className="w-4 h-4 mr-1" />
                        ) : (
                          <ArrowUpRight className="w-4 h-4 mr-1" />
                        )}
                        {isPositive ? '+' : '-'}{Math.abs(transaction.coin_amount).toLocaleString()} coins
                      </div>
                      
                      {transaction.fiat_amount && transaction.currency && (
                        <div className="text-sm text-gray-500 mt-1">
                          {formatCurrency(transaction.fiat_amount, transaction.currency)}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>

      {/* Load More */}
      {hasMore && transactions.length > 0 && (
        <div className="text-center mt-8">
          <Button
            variant="outline"
            onClick={handleLoadMore}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Loading...' : 'Load More Transactions'}
          </Button>
        </div>
      )}

      {/* Loading State */}
      {loading && transactions.length === 0 && (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto"></div>
          <p className="text-gray-600 mt-4">Loading transactions...</p>
        </div>
      )}
    </div>
  );
}