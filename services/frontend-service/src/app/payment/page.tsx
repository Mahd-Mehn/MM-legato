'use client';

import { useState } from 'react';
import { Coins, Star, CreditCard, History, DollarSign } from 'lucide-react';
import { CoinPurchaseSystem, PaymentMethodManager, TransactionHistory, SubscriptionManager } from '@/components/payment';
import Button from '@/components/Button';
import { useAuth } from '@/contexts/AuthContext';

type TabType = 'coins' | 'subscription' | 'methods' | 'history';

export default function PaymentPage() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<TabType>('coins');

  const tabs = [
    { id: 'coins' as TabType, label: 'Buy Coins', icon: Coins },
    { id: 'subscription' as TabType, label: 'Subscriptions', icon: Star },
    { id: 'methods' as TabType, label: 'Payment Methods', icon: CreditCard },
    { id: 'history' as TabType, label: 'Transaction History', icon: History },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with Writer Earnings Link */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Payment Center</h1>
            <p className="text-gray-600 mt-2">Manage your coins, subscriptions, and payment methods</p>
          </div>
          
          {user?.role === 'writer' && (
            <Button
              variant="outline"
              onClick={() => window.open('/payment/writer-earnings', '_blank')}
            >
              <DollarSign className="w-4 h-4 mr-2" />
              Writer Earnings
            </Button>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200 flex flex-wrap">
            {tabs.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className={`px-4 py-2 rounded-md font-medium transition-colors flex items-center ${
                  activeTab === id
                    ? 'bg-primary-600 text-white'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'coins' && <CoinPurchaseSystem />}
          {activeTab === 'subscription' && <SubscriptionManager />}
          {activeTab === 'methods' && <PaymentMethodManager />}
          {activeTab === 'history' && <TransactionHistory />}
        </div>
      </div>
    </div>
  );
}