'use client';

import { useState, useEffect } from 'react';
import { 
  Shield, 
  FileText, 
  Download, 
  Eye, 
  Calendar, 
  CheckCircle, 
  AlertCircle,
  Clock,
  DollarSign,
  Globe,
  Lock
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';

interface IPProtection {
  id: string;
  storyId: string;
  storyTitle: string;
  status: 'protected' | 'pending' | 'expired';
  protectionType: 'basic' | 'premium' | 'blockchain';
  certificateUrl?: string;
  registrationDate: string;
  expiryDate?: string;
  hash: string;
  blockchainTx?: string;
}

interface LicensingDeal {
  id: string;
  storyId: string;
  storyTitle: string;
  licensee: string;
  licenseType: 'film' | 'tv' | 'game' | 'audiobook' | 'translation' | 'merchandise';
  status: 'active' | 'pending' | 'expired' | 'terminated';
  revenue: number;
  startDate: string;
  endDate: string;
  terms: string[];
}

const mockIPProtections: IPProtection[] = [
  {
    id: 'ip1',
    storyId: 'story1',
    storyTitle: 'The Digital Awakening',
    status: 'protected',
    protectionType: 'blockchain',
    certificateUrl: '/certificates/digital-awakening.pdf',
    registrationDate: '2024-01-15',
    hash: 'a1b2c3d4e5f6...',
    blockchainTx: '0x1234567890abcdef...',
  },
  {
    id: 'ip2',
    storyId: 'story2',
    storyTitle: 'Hearts in Lagos',
    status: 'protected',
    protectionType: 'premium',
    certificateUrl: '/certificates/hearts-lagos.pdf',
    registrationDate: '2023-12-01',
    hash: 'f6e5d4c3b2a1...',
  },
  {
    id: 'ip3',
    storyId: 'story3',
    storyTitle: 'The Last Mage',
    status: 'pending',
    protectionType: 'basic',
    registrationDate: '2024-01-20',
    hash: '9876543210fed...',
  },
];

const mockLicensingDeals: LicensingDeal[] = [
  {
    id: 'license1',
    storyId: 'story1',
    storyTitle: 'The Digital Awakening',
    licensee: 'Netflix Studios',
    licenseType: 'tv',
    status: 'active',
    revenue: 25000,
    startDate: '2024-01-01',
    endDate: '2026-01-01',
    terms: [
      'Exclusive TV adaptation rights',
      'Global distribution rights',
      '85% revenue share to author',
      'Creative consultation required',
    ],
  },
  {
    id: 'license2',
    storyId: 'story2',
    storyTitle: 'Hearts in Lagos',
    licensee: 'Audible',
    licenseType: 'audiobook',
    status: 'active',
    revenue: 8500,
    startDate: '2023-11-15',
    endDate: '2025-11-15',
    terms: [
      'Audiobook production rights',
      'English language only',
      '80% revenue share to author',
      'Author approval on narrator',
    ],
  },
  {
    id: 'license3',
    storyId: 'story3',
    storyTitle: 'The Last Mage',
    licensee: 'Epic Games',
    licenseType: 'game',
    status: 'pending',
    revenue: 0,
    startDate: '2024-02-01',
    endDate: '2027-02-01',
    terms: [
      'Video game adaptation rights',
      'Character and world licensing',
      '75% revenue share to author',
      'Sequel rights included',
    ],
  },
];

export default function IPProtectionPage() {
  const [ipProtections, setIPProtections] = useState<IPProtection[]>([]);
  const [licensingDeals, setLicensingDeals] = useState<LicensingDeal[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'protection' | 'licensing'>('protection');

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setIPProtections(mockIPProtections);
      setLicensingDeals(mockLicensingDeals);
      setLoading(false);
    };

    loadData();
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

  const getProtectionStatusColor = (status: string) => {
    switch (status) {
      case 'protected':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'expired':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getLicenseStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-green-600 bg-green-50';
      case 'pending':
        return 'text-orange-600 bg-orange-50';
      case 'expired':
        return 'text-gray-600 bg-gray-50';
      case 'terminated':
        return 'text-red-600 bg-red-50';
      default:
        return 'text-gray-600 bg-gray-50';
    }
  };

  const getProtectionTypeIcon = (type: string) => {
    switch (type) {
      case 'blockchain':
        return <Lock className="w-4 h-4 text-purple-600" />;
      case 'premium':
        return <Shield className="w-4 h-4 text-blue-600" />;
      case 'basic':
        return <FileText className="w-4 h-4 text-gray-600" />;
      default:
        return <FileText className="w-4 h-4 text-gray-600" />;
    }
  };

  const getLicenseTypeIcon = (type: string) => {
    switch (type) {
      case 'film':
      case 'tv':
        return '🎬';
      case 'game':
        return '🎮';
      case 'audiobook':
        return '🎧';
      case 'translation':
        return '🌍';
      case 'merchandise':
        return '🛍️';
      default:
        return '📄';
    }
  };

  if (loading) {
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
              <h1 className="text-3xl font-bold text-gray-900">IP Protection & Licensing</h1>
              <p className="text-gray-600 mt-1">Manage your intellectual property rights and licensing deals</p>
            </div>
            <div className="mt-4 sm:mt-0">
              <Button leftIcon={<Shield className="w-4 h-4" />}>
                Protect New Story
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Tab Navigation */}
        <div className="flex justify-center mb-8">
          <div className="bg-white rounded-lg p-1 shadow-sm border border-gray-200">
            <button
              onClick={() => setActiveTab('protection')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'protection'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <Shield className="w-4 h-4 inline mr-2" />
              IP Protection
            </button>
            <button
              onClick={() => setActiveTab('licensing')}
              className={`px-6 py-2 rounded-md font-medium transition-colors ${
                activeTab === 'licensing'
                  ? 'bg-primary-600 text-white'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
            >
              <DollarSign className="w-4 h-4 inline mr-2" />
              Licensing Deals
            </button>
          </div>
        </div>

        {/* IP Protection Tab */}
        {activeTab === 'protection' && (
          <div className="space-y-6">
            {/* Protection Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {ipProtections.filter(ip => ip.status === 'protected').length}
                  </div>
                  <div className="text-sm text-gray-600">Protected Stories</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {ipProtections.filter(ip => ip.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Protection</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Lock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {ipProtections.filter(ip => ip.protectionType === 'blockchain').length}
                  </div>
                  <div className="text-sm text-gray-600">Blockchain Protected</div>
                </CardContent>
              </Card>
            </div>

            {/* Protection List */}
            <Card>
              <CardHeader>
                <CardTitle>Your Protected Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {ipProtections.map((protection) => (
                    <div
                      key={protection.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0">
                          {getProtectionTypeIcon(protection.protectionType)}
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">
                            {protection.storyTitle}
                          </h3>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="capitalize">{protection.protectionType} protection</span>
                            <span>Registered {formatDate(protection.registrationDate)}</span>
                            {protection.blockchainTx && (
                              <span className="flex items-center">
                                <Lock className="w-3 h-3 mr-1" />
                                Blockchain verified
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-4">
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getProtectionStatusColor(protection.status)}`}>
                          {protection.status}
                        </span>
                        <div className="flex space-x-2">
                          {protection.certificateUrl && (
                            <Button variant="outline" size="sm" leftIcon={<Download className="w-4 h-4" />}>
                              Certificate
                            </Button>
                          )}
                          <Button variant="ghost" size="sm" leftIcon={<Eye className="w-4 h-4" />}>
                            Details
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Licensing Tab */}
        {activeTab === 'licensing' && (
          <div className="space-y-6">
            {/* Licensing Overview */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
              <Card>
                <CardContent className="p-6 text-center">
                  <DollarSign className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatCurrency(licensingDeals.reduce((sum, deal) => sum + deal.revenue, 0))}
                  </div>
                  <div className="text-sm text-gray-600">Total Revenue</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <CheckCircle className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {licensingDeals.filter(deal => deal.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">Active Deals</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {licensingDeals.filter(deal => deal.status === 'pending').length}
                  </div>
                  <div className="text-sm text-gray-600">Pending Deals</div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-6 text-center">
                  <Globe className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {new Set(licensingDeals.map(deal => deal.licenseType)).size}
                  </div>
                  <div className="text-sm text-gray-600">License Types</div>
                </CardContent>
              </Card>
            </div>

            {/* Licensing Deals List */}
            <Card>
              <CardHeader>
                <CardTitle>Licensing Deals</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {licensingDeals.map((deal) => (
                    <div
                      key={deal.id}
                      className="p-6 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-start space-x-4">
                          <div className="text-2xl">
                            {getLicenseTypeIcon(deal.licenseType)}
                          </div>
                          <div>
                            <h3 className="font-semibold text-gray-900 text-lg">
                              {deal.storyTitle}
                            </h3>
                            <p className="text-gray-600">
                              {deal.licenseType.charAt(0).toUpperCase() + deal.licenseType.slice(1)} rights to {deal.licensee}
                            </p>
                            <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                              <span>{formatDate(deal.startDate)} - {formatDate(deal.endDate)}</span>
                              {deal.revenue > 0 && (
                                <span className="text-green-600 font-medium">
                                  {formatCurrency(deal.revenue)} earned
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                        <span className={`px-3 py-1 rounded-full text-sm font-medium capitalize ${getLicenseStatusColor(deal.status)}`}>
                          {deal.status}
                        </span>
                      </div>

                      <div className="border-t border-gray-200 pt-4">
                        <h4 className="font-medium text-gray-900 mb-2">License Terms:</h4>
                        <ul className="space-y-1">
                          {deal.terms.map((term, index) => (
                            <li key={index} className="text-sm text-gray-600 flex items-center">
                              <CheckCircle className="w-3 h-3 text-green-500 mr-2 flex-shrink-0" />
                              {term}
                            </li>
                          ))}
                        </ul>
                      </div>

                      <div className="flex justify-end space-x-2 mt-4">
                        <Button variant="outline" size="sm">
                          View Contract
                        </Button>
                        <Button variant="ghost" size="sm">
                          Contact Licensee
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}