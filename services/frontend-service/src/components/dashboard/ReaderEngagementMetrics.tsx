'use client';

import { useState } from 'react';
import { 
  Users, 
  Eye, 
  Heart, 
  MessageCircle, 
  Share2, 
  TrendingUp,
  Globe,
  Clock,
  Star,
  BookOpen
} from 'lucide-react';
import Card, { CardHeader, CardTitle, CardContent } from '@/components/Card';
import AnalyticsChart from './AnalyticsChart';

interface DemographicData {
  ageGroups: { range: string; percentage: number; count: number }[];
  genderDistribution: { gender: string; percentage: number; count: number }[];
  geographicDistribution: { country: string; percentage: number; count: number }[];
  languages: { language: string; percentage: number; count: number }[];
}

interface EngagementMetrics {
  totalReaders: number;
  activeReaders: number;
  newReaders: number;
  returningReaders: number;
  averageReadTime: number;
  completionRate: number;
  engagementRate: number;
  socialShares: number;
  comments: number;
  likes: number;
  bookmarks: number;
  follows: number;
  demographics: DemographicData;
  readingPatterns: {
    peakHours: { hour: number; readers: number }[];
    weeklyPattern: { day: string; readers: number }[];
    deviceUsage: { device: string; percentage: number }[];
  };
  contentPerformance: {
    topChapters: { id: string; title: string; views: number; engagement: number }[];
    dropOffPoints: { chapter: number; dropOffRate: number }[];
  };
}

interface ReaderEngagementMetricsProps {
  data: EngagementMetrics;
  timeRange: '7d' | '30d' | '90d';
}

export default function ReaderEngagementMetrics({ data, timeRange }: ReaderEngagementMetricsProps) {
  const [selectedTab, setSelectedTab] = useState<'overview' | 'demographics' | 'patterns' | 'content'>('overview');

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num.toString();
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const formatTime = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <TrendingUp className="w-4 h-4" /> },
    { id: 'demographics', label: 'Demographics', icon: <Users className="w-4 h-4" /> },
    { id: 'patterns', label: 'Reading Patterns', icon: <Clock className="w-4 h-4" /> },
    { id: 'content', label: 'Content Performance', icon: <BookOpen className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <Card>
        <CardContent className="p-0">
          <div className="flex border-b border-gray-200">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setSelectedTab(tab.id as any)}
                className={`flex items-center space-x-2 px-6 py-4 text-sm font-medium border-b-2 transition-colors ${
                  selectedTab === tab.id
                    ? 'border-primary-500 text-primary-600 bg-primary-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Overview Tab */}
      {selectedTab === 'overview' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Key Metrics */}
          <Card>
            <CardHeader>
              <CardTitle>Reader Engagement Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <Users className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.totalReaders)}
                  </div>
                  <div className="text-sm text-gray-500">Total Readers</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <Eye className="w-8 h-8 text-green-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatNumber(data.activeReaders)}
                  </div>
                  <div className="text-sm text-gray-500">Active Readers</div>
                </div>
                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <Clock className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatTime(data.averageReadTime)}
                  </div>
                  <div className="text-sm text-gray-500">Avg Read Time</div>
                </div>
                <div className="text-center p-4 bg-yellow-50 rounded-lg">
                  <Star className="w-8 h-8 text-yellow-600 mx-auto mb-2" />
                  <div className="text-2xl font-bold text-gray-900">
                    {formatPercentage(data.engagementRate)}
                  </div>
                  <div className="text-sm text-gray-500">Engagement Rate</div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Engagement Actions */}
          <Card>
            <CardHeader>
              <CardTitle>Reader Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Heart className="w-5 h-5 text-red-500" />
                    <span className="text-gray-700">Likes</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatNumber(data.likes)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <MessageCircle className="w-5 h-5 text-blue-500" />
                    <span className="text-gray-700">Comments</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatNumber(data.comments)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Share2 className="w-5 h-5 text-green-500" />
                    <span className="text-gray-700">Shares</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatNumber(data.socialShares)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <BookOpen className="w-5 h-5 text-purple-500" />
                    <span className="text-gray-700">Bookmarks</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatNumber(data.bookmarks)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <Users className="w-5 h-5 text-indigo-500" />
                    <span className="text-gray-700">Follows</span>
                  </div>
                  <span className="font-semibold text-gray-900">
                    {formatNumber(data.follows)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Reader Growth Chart */}
          <div className="lg:col-span-2">
            <AnalyticsChart
              title="Reader Growth Over Time"
              data={data.readingPatterns.weeklyPattern.map(item => ({
                date: item.day,
                value: item.readers,
              }))}
              type="area"
              color="blue"
              formatValue={(value) => formatNumber(value)}
            />
          </div>
        </div>
      )}

      {/* Demographics Tab */}
      {selectedTab === 'demographics' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Age Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Age Distribution</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.demographics.ageGroups.map((group, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{group.range}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-blue-500 h-2 rounded-full"
                          style={{ width: `${group.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {formatPercentage(group.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Geographic Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Top Countries</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.demographics.geographicDistribution.slice(0, 5).map((country, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Globe className="w-4 h-4 text-gray-400" />
                      <span className="text-gray-700">{country.country}</span>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${country.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {formatPercentage(country.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Language Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Language Preferences</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.demographics.languages.map((lang, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{lang.language}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-purple-500 h-2 rounded-full"
                          style={{ width: `${lang.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {formatPercentage(lang.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Device Usage */}
          <Card>
            <CardHeader>
              <CardTitle>Device Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.readingPatterns.deviceUsage.map((device, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <span className="text-gray-700">{device.device}</span>
                    <div className="flex items-center space-x-3">
                      <div className="w-24 bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-indigo-500 h-2 rounded-full"
                          style={{ width: `${device.percentage}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium text-gray-900 w-12 text-right">
                        {formatPercentage(device.percentage)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Reading Patterns Tab */}
      {selectedTab === 'patterns' && (
        <div className="space-y-6">
          {/* Peak Reading Hours */}
          <AnalyticsChart
            title="Peak Reading Hours"
            data={data.readingPatterns.peakHours.map(item => ({
              date: `${item.hour}:00`,
              value: item.readers,
            }))}
            type="bar"
            color="purple"
            formatValue={(value) => formatNumber(value)}
          />

          {/* Weekly Reading Pattern */}
          <AnalyticsChart
            title="Weekly Reading Pattern"
            data={data.readingPatterns.weeklyPattern.map(item => ({
              date: item.day,
              value: item.readers,
            }))}
            type="line"
            color="blue"
            formatValue={(value) => formatNumber(value)}
          />
        </div>
      )}

      {/* Content Performance Tab */}
      {selectedTab === 'content' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Top Performing Chapters */}
          <Card>
            <CardHeader>
              <CardTitle>Top Performing Chapters</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.contentPerformance.topChapters.map((chapter, index) => (
                  <div key={chapter.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        Chapter {index + 1}: {chapter.title}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatNumber(chapter.views)} views
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-green-600">
                        {formatPercentage(chapter.engagement)} engagement
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Drop-off Analysis */}
          <Card>
            <CardHeader>
              <CardTitle>Reader Drop-off Points</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {data.contentPerformance.dropOffPoints.map((point, index) => (
                  <div key={index} className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">
                        Chapter {point.chapter}
                      </div>
                      <div className="text-sm text-gray-500">
                        High drop-off rate
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-medium text-red-600">
                        {formatPercentage(point.dropOffRate)} drop-off
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}