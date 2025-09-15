'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { 
  Eye, 
  Clock, 
  TrendingUp, 
  Users, 
  MessageCircle, 
  Heart, 
  Bookmark, 
  Share2,
  Award,
  Zap,
  Target,
  BarChart3
} from 'lucide-react';

interface EngagementMetrics {
  views: number;
  uniqueReaders: number;
  averageReadTime: number;
  completionRate: number;
  comments: number;
  likes: number;
  bookmarks: number;
  shares: number;
  readerRetention: number;
  engagementScore: number;
}

interface ReaderEngagementProps {
  storyId: string;
  chapterId?: string;
  className?: string;
}

export default function ReaderEngagement({ 
  storyId, 
  chapterId, 
  className = '' 
}: ReaderEngagementProps) {
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    views: 0,
    uniqueReaders: 0,
    averageReadTime: 0,
    completionRate: 0,
    comments: 0,
    likes: 0,
    bookmarks: 0,
    shares: 0,
    readerRetention: 0,
    engagementScore: 0
  });

  const [loading, setLoading] = useState(true);
  const [timeframe, setTimeframe] = useState<'24h' | '7d' | '30d' | 'all'>('7d');

  // Mock data based on timeframe
  const mockMetrics: Record<string, EngagementMetrics> = {
    '24h': {
      views: 1247,
      uniqueReaders: 892,
      averageReadTime: 8.5,
      completionRate: 78,
      comments: 34,
      likes: 156,
      bookmarks: 89,
      shares: 23,
      readerRetention: 65,
      engagementScore: 82
    },
    '7d': {
      views: 8934,
      uniqueReaders: 5621,
      averageReadTime: 9.2,
      completionRate: 81,
      comments: 187,
      likes: 892,
      bookmarks: 445,
      shares: 134,
      readerRetention: 72,
      engagementScore: 87
    },
    '30d': {
      views: 34567,
      uniqueReaders: 18923,
      averageReadTime: 8.8,
      completionRate: 79,
      comments: 623,
      likes: 3421,
      bookmarks: 1567,
      shares: 456,
      readerRetention: 69,
      engagementScore: 85
    },
    'all': {
      views: 125000,
      uniqueReaders: 67890,
      averageReadTime: 9.1,
      completionRate: 83,
      comments: 2156,
      likes: 12456,
      bookmarks: 5678,
      shares: 1234,
      readerRetention: 74,
      engagementScore: 89
    }
  };

  useEffect(() => {
    const loadMetrics = async () => {
      setLoading(true);
      try {
        // Simulate API call
        await new Promise(resolve => setTimeout(resolve, 1000));
        setMetrics(mockMetrics[timeframe]);
      } catch (error) {
        console.error('Failed to load engagement metrics:', error);
      } finally {
        setLoading(false);
      }
    };

    loadMetrics();
  }, [timeframe, storyId, chapterId]);

  const formatNumber = (num: number): string => {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    }
    if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  };

  const getEngagementLevel = (score: number): { label: string; color: string } => {
    if (score >= 90) return { label: 'Exceptional', color: 'text-purple-600 bg-purple-100' };
    if (score >= 80) return { label: 'Excellent', color: 'text-green-600 bg-green-100' };
    if (score >= 70) return { label: 'Good', color: 'text-blue-600 bg-blue-100' };
    if (score >= 60) return { label: 'Average', color: 'text-yellow-600 bg-yellow-100' };
    return { label: 'Needs Improvement', color: 'text-red-600 bg-red-100' };
  };

  const engagementLevel = getEngagementLevel(metrics.engagementScore);

  const metricCards = [
    {
      title: 'Total Views',
      value: formatNumber(metrics.views),
      icon: Eye,
      color: 'text-blue-600 bg-blue-100',
      change: '+12.5%'
    },
    {
      title: 'Unique Readers',
      value: formatNumber(metrics.uniqueReaders),
      icon: Users,
      color: 'text-green-600 bg-green-100',
      change: '+8.3%'
    },
    {
      title: 'Avg. Read Time',
      value: `${metrics.averageReadTime}min`,
      icon: Clock,
      color: 'text-purple-600 bg-purple-100',
      change: '+2.1%'
    },
    {
      title: 'Completion Rate',
      value: `${metrics.completionRate}%`,
      icon: Target,
      color: 'text-orange-600 bg-orange-100',
      change: '+5.7%'
    },
    {
      title: 'Comments',
      value: formatNumber(metrics.comments),
      icon: MessageCircle,
      color: 'text-indigo-600 bg-indigo-100',
      change: '+18.9%'
    },
    {
      title: 'Likes',
      value: formatNumber(metrics.likes),
      icon: Heart,
      color: 'text-red-600 bg-red-100',
      change: '+15.2%'
    },
    {
      title: 'Bookmarks',
      value: formatNumber(metrics.bookmarks),
      icon: Bookmark,
      color: 'text-yellow-600 bg-yellow-100',
      change: '+9.8%'
    },
    {
      title: 'Shares',
      value: formatNumber(metrics.shares),
      icon: Share2,
      color: 'text-teal-600 bg-teal-100',
      change: '+22.4%'
    }
  ];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary-100 rounded-xl">
              <BarChart3 className="w-6 h-6 text-primary-600" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-reading-text font-crimson">Reader Engagement</h3>
              <p className="text-reading-muted">Track how readers interact with your content</p>
            </div>
          </div>
          
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value as any)}
            className="text-sm border border-gray-300 rounded-lg px-3 py-2 bg-white dark:bg-gray-700 dark:border-gray-600"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="all">All Time</option>
          </select>
        </div>

        {/* Engagement Score */}
        <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary-600" />
              <span className="font-semibold text-reading-text">Engagement Score</span>
            </div>
            <span className={`px-3 py-1 rounded-full text-sm font-medium ${engagementLevel.color}`}>
              {engagementLevel.label}
            </span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="text-3xl font-bold text-primary-600">
              {loading ? '--' : metrics.engagementScore}
            </div>
            <div className="flex-1">
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2">
                <motion.div 
                  className="bg-primary-500 h-2 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: loading ? 0 : `${metrics.engagementScore}%` }}
                  transition={{ duration: 1, delay: 0.5 }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0</span>
                <span>100</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="p-6">
        {loading ? (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-gray-200 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="w-8 h-8 bg-gray-300 dark:bg-gray-600 rounded-lg mb-3" />
                  <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded mb-2" />
                  <div className="h-6 bg-gray-300 dark:bg-gray-600 rounded" />
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {metricCards.map((metric, index) => (
              <motion.div
                key={metric.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`p-2 rounded-lg ${metric.color}`}>
                    <metric.icon className="w-4 h-4" />
                  </div>
                  <span className="text-xs text-green-600 font-medium">
                    {metric.change}
                  </span>
                </div>
                
                <div className="text-2xl font-bold text-reading-text mb-1">
                  {metric.value}
                </div>
                
                <div className="text-sm text-reading-muted">
                  {metric.title}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Additional Insights */}
        <div className="mt-6 grid md:grid-cols-2 gap-4">
          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <TrendingUp className="w-5 h-5 text-green-600" />
              <span className="font-semibold text-reading-text">Reader Retention</span>
            </div>
            <div className="text-2xl font-bold text-green-600 mb-1">
              {loading ? '--' : `${metrics.readerRetention}%`}
            </div>
            <p className="text-sm text-reading-muted">
              Readers who return to continue reading
            </p>
          </div>

          <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
            <div className="flex items-center gap-2 mb-3">
              <Award className="w-5 h-5 text-purple-600" />
              <span className="font-semibold text-reading-text">Top Performance</span>
            </div>
            <div className="text-sm text-reading-muted">
              {timeframe === '24h' && 'Highest engagement in the last 24 hours'}
              {timeframe === '7d' && 'Strong weekly performance with growing readership'}
              {timeframe === '30d' && 'Consistent monthly growth across all metrics'}
              {timeframe === 'all' && 'Outstanding overall performance since publication'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}