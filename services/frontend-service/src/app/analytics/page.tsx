'use client';

import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  Users, 
  Eye, 
  Heart, 
  DollarSign, 
  BookOpen,
  Calendar,
  Globe,
  Clock,
  Target,
  BarChart3,
  TestTube,
  Lightbulb,
  Activity
} from 'lucide-react';
import Button from '@/components/Button';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import LoadingSpinner from '@/components/LoadingSpinner';
import { 
  AdvancedAnalyticsChart, 
  ReaderBehaviorHeatmap, 
  ContentRecommendationsEngine, 
  ABTestingInterface 
} from '@/components/analytics';

interface AnalyticsData {
  overview: {
    totalViews: number;
    totalLikes: number;
    totalRevenue: number;
    totalFollowers: number;
    averageReadTime: number;
    completionRate: number;
  };
  viewsOverTime: DataPoint[];
  revenueOverTime: DataPoint[];
  topStories: StoryAnalytics[];
  audienceData: AudienceData;
  readerBehavior: ReaderBehavior;
}

interface DataPoint {
  date: string;
  value: number;
}

interface StoryAnalytics {
  id: string;
  title: string;
  views: number;
  likes: number;
  revenue: number;
  completionRate: number;
  averageReadTime: number;
  chapters: number;
}

interface AudienceData {
  demographics: {
    ageGroups: { range: string; percentage: number }[];
    genders: { gender: string; percentage: number }[];
    locations: { country: string; percentage: number }[];
  };
  readingHabits: {
    peakHours: { hour: number; activity: number }[];
    deviceTypes: { device: string; percentage: number }[];
  };
}

interface ReaderBehavior {
  averageSessionTime: number;
  bounceRate: number;
  returnRate: number;
  chaptersPerSession: number;
}

const mockAnalyticsData: AnalyticsData = {
  overview: {
    totalViews: 125430,
    totalLikes: 8920,
    totalRevenue: 2450.75,
    totalFollowers: 1240,
    averageReadTime: 12.5,
    completionRate: 68.5,
  },
  viewsOverTime: [
    { date: '2024-01-01', value: 1200 },
    { date: '2024-01-02', value: 1350 },
    { date: '2024-01-03', value: 1100 },
    { date: '2024-01-04', value: 1500 },
    { date: '2024-01-05', value: 1800 },
    { date: '2024-01-06', value: 1650 },
    { date: '2024-01-07', value: 1900 },
  ],
  revenueOverTime: [
    { date: '2024-01-01', value: 45.50 },
    { date: '2024-01-02', value: 52.25 },
    { date: '2024-01-03', value: 38.75 },
    { date: '2024-01-04', value: 67.00 },
    { date: '2024-01-05', value: 89.25 },
    { date: '2024-01-06', value: 76.50 },
    { date: '2024-01-07', value: 95.75 },
  ],
  topStories: [
    {
      id: '1',
      title: 'The Digital Awakening',
      views: 45230,
      likes: 3420,
      revenue: 850.25,
      completionRate: 72.5,
      averageReadTime: 15.2,
      chapters: 45,
    },
    {
      id: '2',
      title: 'Hearts in Lagos',
      views: 38900,
      likes: 2890,
      revenue: 650.50,
      completionRate: 68.8,
      averageReadTime: 11.8,
      chapters: 32,
    },
    {
      id: '3',
      title: 'The Last Mage',
      views: 41300,
      likes: 2610,
      revenue: 950.00,
      completionRate: 65.2,
      averageReadTime: 13.5,
      chapters: 67,
    },
  ],
  audienceData: {
    demographics: {
      ageGroups: [
        { range: '18-24', percentage: 35 },
        { range: '25-34', percentage: 42 },
        { range: '35-44', percentage: 18 },
        { range: '45+', percentage: 5 },
      ],
      genders: [
        { gender: 'Female', percentage: 68 },
        { gender: 'Male', percentage: 30 },
        { gender: 'Other', percentage: 2 },
      ],
      locations: [
        { country: 'Nigeria', percentage: 45 },
        { country: 'United States', percentage: 25 },
        { country: 'United Kingdom', percentage: 12 },
        { country: 'Canada', percentage: 8 },
        { country: 'Others', percentage: 10 },
      ],
    },
    readingHabits: {
      peakHours: [
        { hour: 0, activity: 15 },
        { hour: 6, activity: 25 },
        { hour: 12, activity: 45 },
        { hour: 18, activity: 85 },
        { hour: 21, activity: 100 },
      ],
      deviceTypes: [
        { device: 'Mobile', percentage: 78 },
        { device: 'Desktop', percentage: 18 },
        { device: 'Tablet', percentage: 4 },
      ],
    },
  },
  readerBehavior: {
    averageSessionTime: 18.5,
    bounceRate: 25.8,
    returnRate: 74.2,
    chaptersPerSession: 2.3,
  },
};

export default function AnalyticsPage() {
  const [analyticsData, setAnalyticsData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState<'7d' | '30d' | '90d'>('30d');
  const [selectedView, setSelectedView] = useState<'overview' | 'advanced' | 'behavior' | 'recommendations' | 'testing'>('overview');

  // Mock data for advanced components
  const mockContentMetrics = [
    {
      contentId: '1',
      title: 'The Digital Awakening',
      views: 45230,
      uniqueReaders: 12500,
      engagementRate: 0.25,
      completionRate: 0.72,
      averageReadTime: 15.2,
      comments: 342,
      likes: 3420,
      shares: 156,
      revenue: 850.25,
      publishDate: '2024-01-15',
      lastUpdated: '2024-02-01',
      genre: 'Sci-Fi',
      tags: ['technology', 'future', 'AI'],
      chapterCount: 45,
      wordCount: 125000
    },
    {
      contentId: '2',
      title: 'Hearts in Lagos',
      views: 38900,
      uniqueReaders: 9800,
      engagementRate: 0.35,
      completionRate: 0.68,
      averageReadTime: 11.8,
      comments: 289,
      likes: 2890,
      shares: 98,
      revenue: 650.50,
      publishDate: '2024-01-20',
      lastUpdated: '2024-02-05',
      genre: 'Romance',
      tags: ['love', 'Nigeria', 'culture'],
      chapterCount: 32,
      wordCount: 89000
    }
  ];

  const mockAudienceInsights = [
    {
      segment: 'Young Adults (18-25)',
      size: 5200,
      engagement: 0.42,
      preferences: ['Romance', 'Adventure', 'Short chapters'],
      dropOffPoints: [3, 7, 15],
      peakReadingTimes: ['7-9 PM', '10-11 PM']
    },
    {
      segment: 'Adults (26-35)',
      size: 3800,
      engagement: 0.38,
      preferences: ['Sci-Fi', 'Thriller', 'Longer chapters'],
      dropOffPoints: [5, 12, 20],
      peakReadingTimes: ['6-8 PM', '9-10 PM']
    }
  ];

  const mockHeatmapData = {
    timeHeatmapData: Array.from({ length: 168 }, (_, i) => ({
      hour: i % 24,
      day: Math.floor(i / 24),
      value: Math.random() * 100,
      metadata: {
        uniqueUsers: Math.floor(Math.random() * 50),
        avgSessionTime: Math.random() * 30,
        bounceRate: Math.random() * 50,
        topContent: ['Story A', 'Story B']
      }
    })),
    scrollHeatmapData: Array.from({ length: 50 }, (_, i) => ({
      position: i * 2,
      intensity: Math.random(),
      clicks: Math.floor(Math.random() * 10),
      timeSpent: Math.random() * 60
    })),
    deviceHeatmapData: [
      ...Array.from({ length: 24 }, (_, i) => ({ device: 'Mobile', hour: i, usage: Math.random() * 100, engagement: Math.random() * 100 })),
      ...Array.from({ length: 24 }, (_, i) => ({ device: 'Desktop', hour: i, usage: Math.random() * 50, engagement: Math.random() * 80 })),
      ...Array.from({ length: 24 }, (_, i) => ({ device: 'Tablet', hour: i, usage: Math.random() * 20, engagement: Math.random() * 70 }))
    ],
    geographicData: [
      { country: 'Nigeria', lat: 9.0820, lng: 8.6753, users: 2500, engagement: 85.2 },
      { country: 'United States', lat: 39.8283, lng: -98.5795, users: 1800, engagement: 72.1 },
      { country: 'United Kingdom', lat: 55.3781, lng: -3.4360, users: 950, engagement: 78.5 },
      { country: 'Canada', lat: 56.1304, lng: -106.3468, users: 650, engagement: 74.8 },
      { country: 'South Africa', lat: -30.5595, lng: 22.9375, users: 420, engagement: 81.3 }
    ]
  };

  const mockABTests = [
    {
      id: 'test_1',
      name: 'Chapter Title Optimization',
      description: 'Testing different chapter title formats to improve click-through rates',
      status: 'running' as const,
      startDate: '2024-01-15',
      targetMetric: 'click_through_rate',
      variants: [
        { id: 'control', name: 'Control', description: 'Original titles', trafficPercentage: 50, configuration: {}, isControl: true },
        { id: 'variant_a', name: 'Descriptive Titles', description: 'More descriptive chapter titles', trafficPercentage: 50, configuration: {}, isControl: false }
      ],
      results: [
        { variantId: 'control', variantName: 'Control', participants: 1250, conversions: 156, conversionRate: 12.48, confidence: 85, isWinner: false, metrics: { views: 5200, engagement: 24.5, revenue: 125.50, completionRate: 68.2 } },
        { variantId: 'variant_a', variantName: 'Descriptive Titles', participants: 1180, conversions: 189, conversionRate: 16.02, confidence: 85, isWinner: true, metrics: { views: 4950, engagement: 28.1, revenue: 142.30, completionRate: 72.1 } }
      ],
      totalParticipants: 2430,
      confidence: 85,
      winner: 'variant_a',
      createdAt: '2024-01-10',
      updatedAt: '2024-02-01'
    },
    {
      id: 'test_2',
      name: 'Story Cover Design',
      description: 'Testing different cover designs for better engagement',
      status: 'completed' as const,
      startDate: '2024-01-01',
      endDate: '2024-01-31',
      targetMetric: 'engagement_rate',
      variants: [
        { id: 'control', name: 'Original Cover', description: 'Current cover design', trafficPercentage: 50, configuration: {}, isControl: true },
        { id: 'variant_a', name: 'Minimalist Cover', description: 'Clean, minimalist design', trafficPercentage: 50, configuration: {}, isControl: false }
      ],
      results: [
        { variantId: 'control', variantName: 'Original Cover', participants: 2100, conversions: 420, conversionRate: 20.00, confidence: 95, isWinner: false, metrics: { views: 8500, engagement: 32.1, revenue: 285.75, completionRate: 65.8 } },
        { variantId: 'variant_a', variantName: 'Minimalist Cover', participants: 2050, conversions: 533, conversionRate: 26.00, confidence: 95, isWinner: true, metrics: { views: 8200, engagement: 38.5, revenue: 342.20, completionRate: 71.2 } }
      ],
      totalParticipants: 4150,
      confidence: 95,
      winner: 'variant_a',
      createdAt: '2023-12-28',
      updatedAt: '2024-01-31'
    }
  ];

  useEffect(() => {
    const loadAnalytics = async () => {
      setLoading(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      setAnalyticsData(mockAnalyticsData);
      setLoading(false);
    };

    loadAnalytics();
  }, [timeRange]);

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  if (loading || !analyticsData) {
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
              <h1 className="text-3xl font-bold text-gray-900">Analytics Dashboard</h1>
              <p className="text-gray-600 mt-1">Track your story performance and audience insights</p>
            </div>
            <div className="mt-4 sm:mt-0 flex items-center space-x-4">
              <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
                {[
                  { value: '7d', label: '7 days' },
                  { value: '30d', label: '30 days' },
                  { value: '90d', label: '90 days' },
                ].map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setTimeRange(option.value as any)}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                      timeRange === option.value
                        ? 'bg-white text-gray-900 shadow-sm'
                        : 'text-gray-600 hover:text-gray-900'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* View Navigation */}
          <div className="mt-6">
            <div className="flex flex-wrap gap-1 bg-gray-100 rounded-lg p-1">
              {[
                { value: 'overview', label: 'Overview', icon: <BarChart3 className="w-4 h-4" /> },
                { value: 'advanced', label: 'Advanced Charts', icon: <TrendingUp className="w-4 h-4" /> },
                { value: 'behavior', label: 'Reader Behavior', icon: <Activity className="w-4 h-4" /> },
                { value: 'recommendations', label: 'Recommendations', icon: <Lightbulb className="w-4 h-4" /> },
                { value: 'testing', label: 'A/B Testing', icon: <TestTube className="w-4 h-4" /> },
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setSelectedView(option.value as any)}
                  className={`flex items-center space-x-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    selectedView === option.value
                      ? 'bg-white text-gray-900 shadow-sm'
                      : 'text-gray-600 hover:text-gray-900'
                  }`}
                >
                  {option.icon}
                  <span className="hidden sm:inline">{option.label}</span>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Conditional Content Based on Selected View */}
        {selectedView === 'overview' && (
          <>
            {/* Overview Stats */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-6 mb-8">
          <MetricCard
            title="Total Views"
            value={formatNumber(analyticsData.overview.totalViews)}
            icon={<Eye className="w-5 h-5 text-blue-600" />}
            change="+12.5%"
            changeType="positive"
          />
          <MetricCard
            title="Total Likes"
            value={formatNumber(analyticsData.overview.totalLikes)}
            icon={<Heart className="w-5 h-5 text-red-600" />}
            change="+8.3%"
            changeType="positive"
          />
          <MetricCard
            title="Revenue"
            value={formatCurrency(analyticsData.overview.totalRevenue)}
            icon={<DollarSign className="w-5 h-5 text-green-600" />}
            change="+15.2%"
            changeType="positive"
          />
          <MetricCard
            title="Followers"
            value={formatNumber(analyticsData.overview.totalFollowers)}
            icon={<Users className="w-5 h-5 text-purple-600" />}
            change="+6.7%"
            changeType="positive"
          />
          <MetricCard
            title="Avg. Read Time"
            value={`${analyticsData.overview.averageReadTime}m`}
            icon={<Clock className="w-5 h-5 text-orange-600" />}
            change="+2.1%"
            changeType="positive"
          />
          <MetricCard
            title="Completion Rate"
            value={`${analyticsData.overview.completionRate}%`}
            icon={<Target className="w-5 h-5 text-indigo-600" />}
            change="-1.2%"
            changeType="negative"
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Views Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2" />
                Views Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-blue-50 to-blue-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <TrendingUp className="w-12 h-12 text-blue-500 mx-auto mb-2" />
                  <p className="text-gray-600">Chart visualization would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Revenue Chart */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <DollarSign className="w-5 h-5 mr-2" />
                Revenue Over Time
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64 bg-gradient-to-r from-green-50 to-green-100 rounded-lg flex items-center justify-center">
                <div className="text-center">
                  <DollarSign className="w-12 h-12 text-green-500 mx-auto mb-2" />
                  <p className="text-gray-600">Chart visualization would go here</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Top Stories */}
            <Card>
              <CardHeader>
                <CardTitle>Top Performing Stories</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {analyticsData.topStories.map((story, index) => (
                    <div
                      key={story.id}
                      className="flex items-center justify-between p-4 border border-gray-200 rounded-lg"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="flex-shrink-0 w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                          <span className="text-sm font-semibold text-primary-600">
                            {index + 1}
                          </span>
                        </div>
                        <div>
                          <h3 className="font-semibold text-gray-900">{story.title}</h3>
                          <p className="text-sm text-gray-500">{story.chapters} chapters</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-6 text-sm">
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">
                            {formatNumber(story.views)}
                          </div>
                          <div className="text-gray-500">views</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">
                            {formatNumber(story.likes)}
                          </div>
                          <div className="text-gray-500">likes</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-green-600">
                            {formatCurrency(story.revenue)}
                          </div>
                          <div className="text-gray-500">revenue</div>
                        </div>
                        <div className="text-center">
                          <div className="font-semibold text-gray-900">
                            {story.completionRate}%
                          </div>
                          <div className="text-gray-500">completion</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Reader Behavior */}
            <Card>
              <CardHeader>
                <CardTitle>Reader Behavior</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsData.readerBehavior.averageSessionTime}m
                    </div>
                    <div className="text-sm text-gray-500">Avg. Session Time</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsData.readerBehavior.bounceRate}%
                    </div>
                    <div className="text-sm text-gray-500">Bounce Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsData.readerBehavior.returnRate}%
                    </div>
                    <div className="text-sm text-gray-500">Return Rate</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-900">
                      {analyticsData.readerBehavior.chaptersPerSession}
                    </div>
                    <div className="text-sm text-gray-500">Chapters/Session</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Demographics */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Users className="w-5 h-5 mr-2" />
                  Demographics
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Age Groups</h4>
                  {analyticsData.audienceData.demographics.ageGroups.map((group) => (
                    <div key={group.range} className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">{group.range}</span>
                      <span className="text-sm font-medium">{group.percentage}%</span>
                    </div>
                  ))}
                </div>
                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Top Locations</h4>
                  {analyticsData.audienceData.demographics.locations.map((location) => (
                    <div key={location.country} className="flex justify-between items-center mb-1">
                      <span className="text-sm text-gray-600">{location.country}</span>
                      <span className="text-sm font-medium">{location.percentage}%</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Device Types */}
            <Card>
              <CardHeader>
                <CardTitle>Device Usage</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.audienceData.readingHabits.deviceTypes.map((device) => (
                    <div key={device.device}>
                      <div className="flex justify-between text-sm mb-1">
                        <span>{device.device}</span>
                        <span className="font-medium">{device.percentage}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-primary-600 h-2 rounded-full" 
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Export Options */}
            <Card>
              <CardHeader>
                <CardTitle>Export Data</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" fullWidth size="sm">
                  Export as PDF
                </Button>
                <Button variant="outline" fullWidth size="sm">
                  Export as CSV
                </Button>
                <Button variant="outline" fullWidth size="sm">
                  Schedule Report
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
          </>
        )}

        {/* Advanced Charts View */}
        {selectedView === 'advanced' && (
          <div className="space-y-8">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <AdvancedAnalyticsChart
                title="Views with Drill-down"
                data={analyticsData.viewsOverTime.map(item => ({
                  date: item.date,
                  value: item.value,
                  metadata: { source: 'organic', device: 'mobile' },
                  breakdown: { mobile: item.value * 0.7, desktop: item.value * 0.3 }
                }))}
                type="line"
                color="blue"
                enableDrillDown={true}
                enableFilters={true}
                enableExport={true}
                drillDownLevels={[
                  {
                    level: 'device',
                    title: 'Views by Device',
                    data: analyticsData.viewsOverTime.map(item => ({
                      date: item.date,
                      value: item.value * 0.7,
                      label: 'Mobile Views'
                    }))
                  }
                ]}
                formatValue={(value) => formatNumber(value)}
              />
              
              <AdvancedAnalyticsChart
                title="Revenue Heatmap"
                data={analyticsData.revenueOverTime.map((item, index) => ({
                  date: item.date,
                  value: item.value,
                  metadata: { day: index % 7 }
                }))}
                type="heatmap"
                color="green"
                formatValue={(value) => formatCurrency(value)}
              />
            </div>
            
            <AdvancedAnalyticsChart
              title="Engagement Distribution"
              data={[
                { date: 'High Engagement', value: 35 },
                { date: 'Medium Engagement', value: 45 },
                { date: 'Low Engagement', value: 20 }
              ]}
              type="pie"
              color="purple"
              formatValue={(value) => `${value}%`}
            />
          </div>
        )}

        {/* Reader Behavior View */}
        {selectedView === 'behavior' && (
          <ReaderBehaviorHeatmap
            timeHeatmapData={mockHeatmapData.timeHeatmapData}
            scrollHeatmapData={mockHeatmapData.scrollHeatmapData}
            deviceHeatmapData={mockHeatmapData.deviceHeatmapData}
            geographicData={mockHeatmapData.geographicData}
            timeRange={timeRange}
          />
        )}

        {/* Recommendations View */}
        {selectedView === 'recommendations' && (
          <ContentRecommendationsEngine
            contentMetrics={mockContentMetrics}
            audienceInsights={mockAudienceInsights}
            timeRange={timeRange}
            writerId="writer_123"
          />
        )}

        {/* A/B Testing View */}
        {selectedView === 'testing' && (
          <ABTestingInterface
            tests={mockABTests}
            onCreateTest={(test) => console.log('Create test:', test)}
            onUpdateTest={(testId, updates) => console.log('Update test:', testId, updates)}
            onDeleteTest={(testId) => console.log('Delete test:', testId)}
            onStartTest={(testId) => console.log('Start test:', testId)}
            onPauseTest={(testId) => console.log('Pause test:', testId)}
            onStopTest={(testId) => console.log('Stop test:', testId)}
          />
        )}
      </div>
    </div>
  );
}

function MetricCard({ 
  title, 
  value, 
  icon, 
  change, 
  changeType 
}: { 
  title: string; 
  value: string; 
  icon: React.ReactNode; 
  change: string; 
  changeType: 'positive' | 'negative' | 'neutral';
}) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center justify-between mb-2">
          <div className="flex-shrink-0">
            {icon}
          </div>
        </div>
        <div className="text-2xl font-bold text-gray-900 mb-1">{value}</div>
        <div className="text-sm text-gray-600 mb-2">{title}</div>
        <div className={`text-xs ${
          changeType === 'positive' 
            ? 'text-green-600' 
            : changeType === 'negative' 
            ? 'text-red-600' 
            : 'text-gray-600'
        }`}>
          {change}
        </div>
      </CardContent>
    </Card>
  );
}