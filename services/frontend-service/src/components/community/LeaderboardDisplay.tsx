'use client';

import { useState, useEffect } from 'react';
import { Trophy, Medal, Award, TrendingUp, Users, BookOpen, MessageSquare, Star, Crown, Zap } from 'lucide-react';
import Card from '../Card';
import Button from '../Button';
import { UserReputationBadge } from './UserReputationBadge';

interface LeaderboardEntry {
  id: string;
  user: {
    id: string;
    username: string;
    displayName: string;
    avatar: string;
    verified: boolean;
  };
  rank: number;
  score: number;
  change: number; // Position change from previous period
  data: {
    storiesPublished?: number;
    chaptersRead?: number;
    commentsPosted?: number;
    likesReceived?: number;
    earnings?: number;
  };
}

interface LeaderboardCategory {
  id: string;
  name: string;
  description: string;
  icon: React.ComponentType<any>;
  metric: string;
  color: string;
}

interface LeaderboardDisplayProps {
  className?: string;
}

export function LeaderboardDisplay({ className = '' }: LeaderboardDisplayProps) {
  const [selectedCategory, setSelectedCategory] = useState('writers');
  const [selectedPeriod, setSelectedPeriod] = useState('monthly');
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRank, setUserRank] = useState<LeaderboardEntry | null>(null);

  const categories: LeaderboardCategory[] = [
    {
      id: 'writers',
      name: 'Top Writers',
      description: 'Most prolific content creators',
      icon: BookOpen,
      metric: 'stories published',
      color: 'blue'
    },
    {
      id: 'readers',
      name: 'Top Readers',
      description: 'Most engaged readers',
      icon: Users,
      metric: 'chapters read',
      color: 'green'
    },
    {
      id: 'community',
      name: 'Community Stars',
      description: 'Most helpful community members',
      icon: MessageSquare,
      metric: 'helpful contributions',
      color: 'purple'
    },
    {
      id: 'earnings',
      name: 'Top Earners',
      description: 'Highest earning creators',
      icon: TrendingUp,
      metric: 'coins earned',
      color: 'yellow'
    },
    {
      id: 'engagement',
      name: 'Most Engaging',
      description: 'Highest reader engagement',
      icon: Star,
      metric: 'likes received',
      color: 'pink'
    }
  ];

  const periods = [
    { id: 'daily', name: 'Today' },
    { id: 'weekly', name: 'This Week' },
    { id: 'monthly', name: 'This Month' },
    { id: 'all_time', name: 'All Time' }
  ];

  useEffect(() => {
    fetchLeaderboard();
  }, [selectedCategory, selectedPeriod]);

  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/community/leaderboard?category=${selectedCategory}&period=${selectedPeriod}`);
      if (response.ok) {
        const data = await response.json();
        setLeaderboard(data.entries);
        setUserRank(data.userRank);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getChangeIndicator = (change: number) => {
    if (change > 0) {
      return (
        <div className="flex items-center text-green-600 text-xs">
          <TrendingUp className="w-3 h-3 mr-1" />
          +{change}
        </div>
      );
    } else if (change < 0) {
      return (
        <div className="flex items-center text-red-600 text-xs rotate-180">
          <TrendingUp className="w-3 h-3 mr-1" />
          {Math.abs(change)}
        </div>
      );
    }
    return <div className="text-gray-400 text-xs">-</div>;
  };

  const formatScore = (score: number, category: string) => {
    if (category === 'earnings') {
      return `${score.toLocaleString()} coins`;
    }
    return score.toLocaleString();
  };

  const selectedCategoryData = categories.find(c => c.id === selectedCategory);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Community Leaderboards
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Celebrate our most active and successful community members
        </p>
      </div>

      {/* Category Selection */}
      <div className="flex flex-wrap gap-2 justify-center">
        {categories.map(category => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                selectedCategory === category.id
                  ? `bg-${category.color}-100 dark:bg-${category.color}-900 text-${category.color}-700 dark:text-${category.color}-300 ring-2 ring-${category.color}-500`
                  : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="w-4 h-4" />
              {category.name}
            </button>
          );
        })}
      </div>

      {/* Period Selection */}
      <div className="flex justify-center">
        <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
          {periods.map(period => (
            <button
              key={period.id}
              onClick={() => setSelectedPeriod(period.id)}
              className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedPeriod === period.id
                  ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              {period.name}
            </button>
          ))}
        </div>
      </div>

      {/* Current Category Info */}
      {selectedCategoryData && (
        <Card className="p-4 text-center">
          <div className="flex items-center justify-center gap-2 mb-2">
            <selectedCategoryData.icon className={`w-5 h-5 text-${selectedCategoryData.color}-600`} />
            <h3 className="font-semibold text-gray-900 dark:text-white">
              {selectedCategoryData.name}
            </h3>
          </div>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            {selectedCategoryData.description} • Ranked by {selectedCategoryData.metric}
          </p>
        </Card>
      )}

      {/* User's Current Rank */}
      {userRank && (
        <Card className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                {getRankIcon(userRank.rank)}
                <span className="font-semibold text-gray-900 dark:text-white">
                  Your Rank: #{userRank.rank}
                </span>
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                {formatScore(userRank.score, selectedCategory)} {selectedCategoryData?.metric}
              </div>
            </div>
            {getChangeIndicator(userRank.change)}
          </div>
        </Card>
      )}

      {/* Leaderboard */}
      <Card className="overflow-hidden">
        {loading ? (
          <div className="p-8 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600 dark:text-gray-400">Loading leaderboard...</p>
          </div>
        ) : leaderboard.length === 0 ? (
          <div className="p-8 text-center">
            <Trophy className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No rankings yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Be the first to make it to the leaderboard!
            </p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {leaderboard.map((entry, index) => (
              <div
                key={entry.id}
                className={`p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors ${
                  entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/10 dark:to-orange-900/10' : ''
                }`}
              >
                <div className="flex items-center gap-4 flex-1">
                  {/* Rank */}
                  <div className="flex items-center gap-2 min-w-[60px]">
                    {getRankIcon(entry.rank)}
                    {entry.rank <= 3 && (
                      <Zap className="w-4 h-4 text-yellow-500 animate-pulse" />
                    )}
                  </div>

                  {/* User Info */}
                  <div className="flex items-center gap-3 flex-1">
                    <img
                      src={entry.user.avatar}
                      alt={entry.user.displayName}
                      className="w-10 h-10 rounded-full border-2 border-white dark:border-gray-800 shadow-sm"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900 dark:text-white">
                          {entry.user.displayName}
                        </span>
                        {entry.user.verified && (
                          <div className="w-4 h-4 bg-blue-500 rounded-full flex items-center justify-center">
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          </div>
                        )}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        @{entry.user.username}
                      </div>
                    </div>
                  </div>

                  {/* Score */}
                  <div className="text-right">
                    <div className="font-semibold text-gray-900 dark:text-white">
                      {formatScore(entry.score, selectedCategory)}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {selectedCategoryData?.metric}
                    </div>
                  </div>

                  {/* Change Indicator */}
                  <div className="min-w-[60px] text-right">
                    {getChangeIndicator(entry.change)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>

      {/* View More */}
      {leaderboard.length >= 10 && (
        <div className="text-center">
          <Button variant="outline" onClick={() => {/* Implement view more */}}>
            View Full Leaderboard
          </Button>
        </div>
      )}
    </div>
  );
}