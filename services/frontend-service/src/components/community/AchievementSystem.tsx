'use client';

import { useState, useEffect } from 'react';
import { Award, Star, Trophy, Target, Zap, Lock, CheckCircle, Clock, Gift } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import Button from '../Button';

interface Achievement {
  id: string;
  name: string;
  description: string;
  type: 'writing' | 'reading' | 'community' | 'engagement' | 'milestone' | 'special';
  criteria: {
    target: number;
    current: number;
    metric: string;
  };
  points: number;
  iconUrl?: string;
  badgeColor: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isHidden: boolean;
  earnedAt?: string;
  progress: number; // 0-100
}

interface UserAchievementStats {
  totalEarned: number;
  totalPoints: number;
  totalPossible: number;
  recentEarned: Achievement[];
  nextToEarn: Achievement[];
}

interface AchievementSystemProps {
  className?: string;
}

export function AchievementSystem({ className = '' }: AchievementSystemProps) {
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [stats, setStats] = useState<UserAchievementStats | null>(null);
  const [selectedType, setSelectedType] = useState<string>('all');
  const [showEarnedOnly, setShowEarnedOnly] = useState(false);
  const [loading, setLoading] = useState(true);
  const [celebrationAchievement, setCelebrationAchievement] = useState<Achievement | null>(null);

  const achievementTypes = [
    { id: 'all', name: 'All Achievements', icon: Award, color: 'gray' },
    { id: 'writing', name: 'Writing', icon: Star, color: 'blue' },
    { id: 'reading', name: 'Reading', icon: Target, color: 'green' },
    { id: 'community', name: 'Community', icon: Trophy, color: 'purple' },
    { id: 'engagement', name: 'Engagement', icon: Zap, color: 'yellow' },
    { id: 'milestone', name: 'Milestones', icon: CheckCircle, color: 'red' },
    { id: 'special', name: 'Special', icon: Gift, color: 'pink' }
  ];

  const rarityColors = {
    common: 'gray',
    rare: 'blue',
    epic: 'purple',
    legendary: 'yellow'
  };

  const rarityLabels = {
    common: 'Common',
    rare: 'Rare',
    epic: 'Epic',
    legendary: 'Legendary'
  };

  useEffect(() => {
    fetchAchievements();
    fetchUserStats();
  }, []);

  const fetchAchievements = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/community/achievements');
      if (response.ok) {
        const data = await response.json();
        setAchievements(data.achievements);
      }
    } catch (error) {
      console.error('Failed to fetch achievements:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchUserStats = async () => {
    try {
      const response = await fetch('/api/community/achievements/stats');
      if (response.ok) {
        const data = await response.json();
        setStats(data);
        
        // Check for newly earned achievements
        if (data.recentEarned.length > 0) {
          const newest = data.recentEarned[0];
          const earnedTime = new Date(newest.earnedAt).getTime();
          const now = new Date().getTime();
          
          // Show celebration if earned within last 5 minutes
          if (now - earnedTime < 5 * 60 * 1000) {
            setCelebrationAchievement(newest);
          }
        }
      }
    } catch (error) {
      console.error('Failed to fetch user stats:', error);
    }
  };

  const getAchievementIcon = (achievement: Achievement) => {
    if (achievement.iconUrl) {
      return <img src={achievement.iconUrl} alt={achievement.name} className="w-8 h-8" />;
    }
    
    const typeData = achievementTypes.find(t => t.id === achievement.type);
    const Icon = typeData?.icon || Award;
    return <Icon className="w-8 h-8" />;
  };

  const getProgressColor = (progress: number, rarity: string) => {
    if (progress === 100) return 'bg-green-500';
    
    switch (rarity) {
      case 'legendary': return 'bg-yellow-500';
      case 'epic': return 'bg-purple-500';
      case 'rare': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const filteredAchievements = achievements.filter(achievement => {
    if (selectedType !== 'all' && achievement.type !== selectedType) return false;
    if (showEarnedOnly && !achievement.earnedAt) return false;
    if (achievement.isHidden && !achievement.earnedAt) return false;
    return true;
  });

  const earnedAchievements = achievements.filter(a => a.earnedAt);
  const completionPercentage = achievements.length > 0 ? (earnedAchievements.length / achievements.length) * 100 : 0;

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Achievement Celebration Modal */}
      <AnimatePresence>
        {celebrationAchievement && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4"
            onClick={() => setCelebrationAchievement(null)}
          >
            <motion.div
              initial={{ scale: 0.5, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.5, opacity: 0 }}
              className="bg-white dark:bg-gray-800 rounded-2xl p-8 max-w-md w-full text-center"
              onClick={(e) => e.stopPropagation()}
            >
              <motion.div
                animate={{ rotate: [0, 10, -10, 0] }}
                transition={{ duration: 0.5, repeat: 2 }}
                className="mb-4"
              >
                <div className={`w-20 h-20 mx-auto rounded-full bg-${rarityColors[celebrationAchievement.rarity]}-100 dark:bg-${rarityColors[celebrationAchievement.rarity]}-900 flex items-center justify-center`}>
                  {getAchievementIcon(celebrationAchievement)}
                </div>
              </motion.div>
              
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                Achievement Unlocked!
              </h3>
              
              <h4 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
                {celebrationAchievement.name}
              </h4>
              
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                {celebrationAchievement.description}
              </p>
              
              <div className="flex items-center justify-center gap-4 mb-6">
                <div className={`px-3 py-1 rounded-full text-xs font-medium bg-${rarityColors[celebrationAchievement.rarity]}-100 text-${rarityColors[celebrationAchievement.rarity]}-800 dark:bg-${rarityColors[celebrationAchievement.rarity]}-900 dark:text-${rarityColors[celebrationAchievement.rarity]}-200`}>
                  {rarityLabels[celebrationAchievement.rarity]}
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Star className="w-4 h-4 fill-current" />
                  <span className="font-medium">{celebrationAchievement.points} points</span>
                </div>
              </div>
              
              <Button onClick={() => setCelebrationAchievement(null)}>
                Awesome!
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Achievements
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Unlock badges and earn points by engaging with the community
        </p>
      </div>

      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {stats.totalEarned}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Earned</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {stats.totalPoints.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Points</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {completionPercentage.toFixed(0)}%
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Complete</div>
          </Card>
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {stats.nextToEarn.length}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Close to Earning</div>
          </Card>
        </div>
      )}

      {/* Progress Bar */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Overall Progress
          </span>
          <span className="text-sm text-gray-500 dark:text-gray-400">
            {earnedAchievements.length} / {achievements.length}
          </span>
        </div>
        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${completionPercentage}%` }}
          ></div>
        </div>
      </Card>

      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 items-start md:items-center justify-between">
        <div className="flex flex-wrap gap-2">
          {achievementTypes.map(type => {
            const Icon = type.icon;
            return (
              <button
                key={type.id}
                onClick={() => setSelectedType(type.id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  selectedType === type.id
                    ? `bg-${type.color}-100 dark:bg-${type.color}-900 text-${type.color}-700 dark:text-${type.color}-300`
                    : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                }`}
              >
                <Icon className="w-4 h-4" />
                {type.name}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="earned-only"
            checked={showEarnedOnly}
            onChange={(e) => setShowEarnedOnly(e.target.checked)}
            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="earned-only" className="text-sm text-gray-700 dark:text-gray-300">
            Show earned only
          </label>
        </div>
      </div>

      {/* Achievements Grid */}
      {loading ? (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading achievements...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredAchievements.map(achievement => (
            <Card
              key={achievement.id}
              className={`p-4 transition-all hover:shadow-md ${
                achievement.earnedAt
                  ? 'bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 border-green-200 dark:border-green-800'
                  : 'opacity-75'
              }`}
            >
              <div className="flex items-start gap-3">
                <div className={`p-2 rounded-lg ${
                  achievement.earnedAt
                    ? `bg-${rarityColors[achievement.rarity]}-100 dark:bg-${rarityColors[achievement.rarity]}-900`
                    : 'bg-gray-100 dark:bg-gray-800'
                }`}>
                  {achievement.earnedAt ? (
                    getAchievementIcon(achievement)
                  ) : (
                    <Lock className="w-8 h-8 text-gray-400" />
                  )}
                </div>

                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h3 className={`font-semibold ${
                      achievement.earnedAt
                        ? 'text-gray-900 dark:text-white'
                        : 'text-gray-500 dark:text-gray-400'
                    }`}>
                      {achievement.name}
                    </h3>
                    {achievement.earnedAt && (
                      <CheckCircle className="w-4 h-4 text-green-500" />
                    )}
                  </div>

                  <p className={`text-sm mb-3 ${
                    achievement.earnedAt
                      ? 'text-gray-600 dark:text-gray-300'
                      : 'text-gray-400 dark:text-gray-500'
                  }`}>
                    {achievement.description}
                  </p>

                  <div className="flex items-center justify-between mb-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium bg-${rarityColors[achievement.rarity]}-100 text-${rarityColors[achievement.rarity]}-800 dark:bg-${rarityColors[achievement.rarity]}-900 dark:text-${rarityColors[achievement.rarity]}-200`}>
                      {rarityLabels[achievement.rarity]}
                    </div>
                    <div className="flex items-center gap-1 text-yellow-600">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-medium">{achievement.points}</span>
                    </div>
                  </div>

                  {!achievement.earnedAt && (
                    <div>
                      <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
                        <span>Progress</span>
                        <span>{achievement.criteria.current} / {achievement.criteria.target}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                        <div
                          className={`h-1.5 rounded-full transition-all duration-300 ${getProgressColor(achievement.progress, achievement.rarity)}`}
                          style={{ width: `${achievement.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {achievement.earnedAt && (
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <Clock className="w-3 h-3" />
                      <span>Earned {new Date(achievement.earnedAt).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {filteredAchievements.length === 0 && !loading && (
        <Card className="p-8 text-center">
          <Award className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            No achievements found
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            Try adjusting your filters or start engaging with the community to unlock achievements!
          </p>
        </Card>
      )}
    </div>
  );
}