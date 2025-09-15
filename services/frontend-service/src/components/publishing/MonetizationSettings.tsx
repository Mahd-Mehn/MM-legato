'use client';

import { useState } from 'react';
import { 
  DollarSign, 
  Coins, 
  Crown, 
  Users, 
  TrendingUp,
  Info,
  Settings,
  Calculator
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';

interface MonetizationSettingsProps {
  storyId: string;
  currentSettings: MonetizationConfig;
  onSettingsChange: (settings: MonetizationConfig) => void;
  onSave: () => Promise<void>;
}

interface MonetizationConfig {
  type: 'free' | 'premium' | 'subscription' | 'mixed';
  coinPrice: number;
  subscriptionTier: 'basic' | 'premium' | 'vip';
  freeChapters: number;
  premiumChapters: string[];
  revenueShare: {
    author: number;
    platform: number;
  };
  payoutThreshold: number;
  currency: string;
}

interface RevenueProjection {
  daily: number;
  weekly: number;
  monthly: number;
  yearly: number;
}

export default function MonetizationSettings({
  storyId,
  currentSettings,
  onSettingsChange,
  onSave,
}: MonetizationSettingsProps) {
  const [settings, setSettings] = useState<MonetizationConfig>(currentSettings);
  const [loading, setLoading] = useState(false);
  const [showProjections, setShowProjections] = useState(false);

  // Mock revenue projections based on settings
  const calculateProjections = (): RevenueProjection => {
    const baseReaders = 1000;
    const conversionRate = settings.type === 'free' ? 0 : 0.05;
    const avgSpending = settings.coinPrice * 2;
    
    const daily = baseReaders * conversionRate * avgSpending * (settings.revenueShare.author / 100);
    
    return {
      daily,
      weekly: daily * 7,
      monthly: daily * 30,
      yearly: daily * 365,
    };
  };

  const projections = calculateProjections();

  const handleSettingsUpdate = (updates: Partial<MonetizationConfig>) => {
    const newSettings = { ...settings, ...updates };
    setSettings(newSettings);
    onSettingsChange(newSettings);
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      await onSave();
    } finally {
      setLoading(false);
    }
  };

  const monetizationOptions = [
    {
      type: 'free' as const,
      title: 'Free',
      description: 'All chapters are free to read',
      icon: <Users className="w-5 h-5" />,
      pros: ['Maximum reach', 'Build large audience', 'No barriers to entry'],
      cons: ['No direct revenue', 'Relies on ads/tips'],
    },
    {
      type: 'premium' as const,
      title: 'Premium Chapters',
      description: 'Readers pay coins to unlock chapters',
      icon: <Coins className="w-5 h-5" />,
      pros: ['Direct revenue per chapter', 'Flexible pricing', 'Reward quality content'],
      cons: ['May limit audience', 'Requires consistent quality'],
    },
    {
      type: 'subscription' as const,
      title: 'Subscription Only',
      description: 'Only subscribers can read',
      icon: <Crown className="w-5 h-5" />,
      pros: ['Predictable income', 'Loyal audience', 'Premium positioning'],
      cons: ['Higher barrier to entry', 'Need consistent content'],
    },
    {
      type: 'mixed' as const,
      title: 'Mixed Model',
      description: 'Combination of free and premium',
      icon: <TrendingUp className="w-5 h-5" />,
      pros: ['Best of both worlds', 'Gradual monetization', 'Flexible approach'],
      cons: ['Complex to manage', 'May confuse readers'],
    },
  ];

  return (
    <div className="space-y-6">
      {/* Monetization Type Selection */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <DollarSign className="w-5 h-5" />
            <span>Monetization Strategy</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {monetizationOptions.map((option) => (
              <div
                key={option.type}
                className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${
                  settings.type === option.type
                    ? 'border-primary-500 bg-primary-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => handleSettingsUpdate({ type: option.type })}
              >
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg ${
                    settings.type === option.type ? 'bg-primary-600 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {option.icon}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{option.title}</h3>
                    <p className="text-sm text-gray-500">{option.description}</p>
                  </div>
                </div>
                
                <div className="space-y-2">
                  <div>
                    <h4 className="text-xs font-medium text-green-600 mb-1">Pros:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {option.pros.map((pro, index) => (
                        <li key={index}>• {pro}</li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <h4 className="text-xs font-medium text-red-600 mb-1">Cons:</h4>
                    <ul className="text-xs text-gray-600 space-y-1">
                      {option.cons.map((con, index) => (
                        <li key={index}>• {con}</li>
                      ))}
                    </ul>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Pricing Configuration */}
      {(settings.type === 'premium' || settings.type === 'mixed') && (
        <Card>
          <CardHeader>
            <CardTitle>Pricing Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Coin Price per Chapter
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={settings.coinPrice}
                    onChange={(e) => handleSettingsUpdate({ coinPrice: parseInt(e.target.value) || 10 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
                    <Coins className="w-4 h-4 text-gray-400" />
                  </div>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Recommended: 10-20 coins per chapter
                </p>
              </div>

              {settings.type === 'mixed' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Free Chapters
                  </label>
                  <input
                    type="number"
                    min="0"
                    max="10"
                    value={settings.freeChapters}
                    onChange={(e) => handleSettingsUpdate({ freeChapters: parseInt(e.target.value) || 3 })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary-500"
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Number of chapters available for free
                  </p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Subscription Configuration */}
      {settings.type === 'subscription' && (
        <Card>
          <CardHeader>
            <CardTitle>Subscription Configuration</CardTitle>
          </CardHeader>
          <CardContent>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Subscription Tier
              </label>
              <div className="space-y-3">
                {[
                  { value: 'basic', label: 'Basic ($4.99/month)', description: 'Access to basic subscriber content' },
                  { value: 'premium', label: 'Premium ($9.99/month)', description: 'Access to premium subscriber content' },
                  { value: 'vip', label: 'VIP ($19.99/month)', description: 'Access to all exclusive content' },
                ].map((tier) => (
                  <label key={tier.value} className="flex items-start space-x-3 cursor-pointer">
                    <input
                      type="radio"
                      name="subscriptionTier"
                      value={tier.value}
                      checked={settings.subscriptionTier === tier.value}
                      onChange={(e) => handleSettingsUpdate({ subscriptionTier: e.target.value as any })}
                      className="mt-1 w-4 h-4 text-primary-600 border-gray-300 focus:ring-primary-500"
                    />
                    <div>
                      <div className="font-medium text-gray-900">{tier.label}</div>
                      <div className="text-sm text-gray-500">{tier.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Revenue Projections */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center space-x-2">
              <Calculator className="w-5 h-5" />
              <span>Revenue Projections</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowProjections(!showProjections)}
            >
              {showProjections ? 'Hide' : 'Show'} Details
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {showProjections && (
            <div className="space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 mb-2">
                  <Info className="w-4 h-4 text-blue-600" />
                  <span className="text-sm font-medium text-blue-900">
                    Projection Assumptions
                  </span>
                </div>
                <ul className="text-xs text-blue-700 space-y-1">
                  <li>• Based on 1,000 daily readers</li>
                  <li>• 5% conversion rate for paid content</li>
                  <li>• Average spending of {settings.coinPrice * 2} coins per user</li>
                  <li>• Your revenue share: {settings.revenueShare.author}%</li>
                </ul>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ${projections.daily.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Daily</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ${projections.weekly.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Weekly</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ${projections.monthly.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Monthly</div>
                </div>
                <div className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="text-2xl font-bold text-gray-900">
                    ${projections.yearly.toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">Yearly</div>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Revenue Share Information */}
      <Card>
        <CardHeader>
          <CardTitle>Revenue Share</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <div className="font-medium text-gray-900">Your Share</div>
              <div className="text-sm text-gray-500">After platform fees</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-green-600">
                {settings.revenueShare.author}%
              </div>
              <div className="text-sm text-gray-500">
                Platform: {settings.revenueShare.platform}%
              </div>
            </div>
          </div>
          
          <div className="mt-4 text-sm text-gray-600">
            <p>• Minimum payout threshold: ${settings.payoutThreshold}</p>
            <p>• Payouts processed monthly on the 15th</p>
            <p>• Currency: {settings.currency}</p>
          </div>
        </CardContent>
      </Card>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button
          onClick={handleSave}
          loading={loading}
          leftIcon={<Settings className="w-4 h-4" />}
        >
          Save Monetization Settings
        </Button>
      </div>
    </div>
  );
}