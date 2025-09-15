'use client';

import { useState, useEffect } from 'react';
import { Coins, Gift, Star, Zap, TrendingUp, Award, Target, Calendar, Clock, CheckCircle, Trophy } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import Card from '../Card';
import Button from '../Button';

interface Reward {
  id: string;
  type: 'daily_login' | 'writing_streak' | 'reading_goal' | 'community_engagement' | 'achievement_bonus' | 'contest_prize' | 'referral_bonus';
  title: string;
  description: string;
  coinAmount: number;
  bonusMultiplier?: number;
  requirements?: {
    streak?: number;
    target?: number;
    current?: number;
  };
  claimedAt?: string;
  expiresAt?: string;
  isAvailable: boolean;
  icon: string;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface UserCoinStats {
  totalCoins: number;
  todayEarned: number;
  weeklyEarned: number;
  monthlyEarned: number;
  lifetimeEarned: number;
  currentStreak: number;
  longestStreak: number;
  pendingRewards: number;
}

interface DailyChallenge {
  id: string;
  title: string;
  description: string;
  type: 'write' | 'read' | 'engage' | 'social';
  target: number;
  current: number;
  coinReward: number;
  completedAt?: string;
  isCompleted: boolean;
  expiresAt: string;
}

interface RewardSystemProps {
  className?: string;
}

export function RewardSystem({ className = '' }: RewardSystemProps) {
  const [rewards, setRewards] = useState<Reward[]>([]);
  const [coinStats, setCoinStats] = useState<UserCoinStats | null>(null);
  const [dailyChallenges, setDailyChallenges] = useState<DailyChallenge[]>([]);
  const [loading, setLoading] = useState(true);
  const [claimingReward, setClaimingReward] = useState<string | null>(null);
  const [showCelebration, setShowCelebration] = useState<{ coins: number; title: string } | null>(null);

  const rarityColors = {
    common: 'gray',
    rare: 'blue',
    epic: 'purple',
    legendary: 'yellow'
  };

  const rewardTypeIcons = {
    daily_login: Calendar,
    writing_streak: Star,
    reading_goal: Target,
    community_engagement: Zap,
    achievement_bonus: Award,
    contest_prize: Trophy,
    referral_bonus: Gift
  };

  useEffect(() => {
    fetchRewards();
    fetchCoinStats();
    fetchDailyChallenges();
  }, []);

  const fetchRewards = async () => {
    try {
      const response = await fetch('/api/community/rewards');
      if (response.ok) {
        const data = await response.json();
        setRewards(data.rewards);
      }
    } catch (error) {
      console.error('Failed to fetch rewards:', error);
    }
  };

  const fetchCoinStats = async () => {
    try {
      const response = await fetch('/api/community/coins/stats');
      if (response.ok) {
        const data = await response.json();
        setCoinStats(data);
      }
    } catch (error) {
      console.error('Failed to fetch coin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDailyChallenges = async () => {
    try {
      const response = await fetch('/api/community/challenges/daily');
      if (response.ok) {
        const data = await response.json();
        setDailyChallenges(data.challenges);
      }
    } catch (error) {
      console.error('Failed to fetch daily challenges:', error);
    }
  };

  const claimReward = async (rewardId: string) => {
    try {
      setClaimingReward(rewardId);
      const response = await fetch(`/api/community/rewards/${rewardId}/claim`, {
        method: 'POST'
      });

      if (response.ok) {
        const data = await response.json();
        
        // Update rewards list
        setRewards(prev => prev.map(reward => 
          reward.id === rewardId 
            ? { ...reward, claimedAt: new Date().toISOString(), isAvailable: false }
            : reward
        ));

        // Update coin stats
        if (coinStats) {
          setCoinStats(prev => prev ? {
            ...prev,
            totalCoins: prev.totalCoins + data.coinAmount,
            todayEarned: prev.todayEarned + data.coinAmount
          } : null);
        }

        // Show celebration
        setShowCelebration({
          coins: data.coinAmount,
          title: data.rewardTitle
        });

        setTimeout(() => setShowCelebration(null), 3000);
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setClaimingReward(null);
    }
  };

  const getRewardIcon = (reward: Reward) => {
    const IconComponent = rewardTypeIcons[reward.type] || Gift;
    return <IconComponent className="w-6 h-6" />;
  };

  const getChallengeIcon = (type: string) => {
    switch (type) {
      case 'write': return <Star className="w-5 h-5" />;
      case 'read': return <Target className="w-5 h-5" />;
      case 'engage': return <Zap className="w-5 h-5" />;
      case 'social': return <TrendingUp className="w-5 h-5" />;
      default: return <Gift className="w-5 h-5" />;
    }
  };

  const formatTimeRemaining = (expiresAt: string) => {
    const now = new Date();
    const expiry = new Date(expiresAt);
    const diff = expiry.getTime() - now.getTime();
    
    if (diff <= 0) return 'Expired';
    
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const availableRewards = rewards.filter(r => r.isAvailable && !r.claimedAt);
  const claimedRewards = rewards.filter(r => r.claimedAt);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Coin Celebration */}
      <AnimatePresence>
        {showCelebration && (
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            className="fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-400 to-orange-500 text-white p-4 rounded-lg shadow-lg"
          >
            <div className="flex items-center gap-2">
              <Coins className="w-6 h-6" />
              <div>
                <div className="font-bold">+{showCelebration.coins} Coins!</div>
                <div className="text-sm opacity-90">{showCelebration.title}</div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header */}
      <div className="text-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Rewards & Coins
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Earn coins through daily activities and achievements
        </p>
      </div>

      {/* Coin Stats */}
      {coinStats && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="p-4 text-center bg-gradient-to-br from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coins className="w-6 h-6 text-yellow-600" />
              <div className="text-2xl font-bold text-yellow-600">
                {coinStats.totalCoins.toLocaleString()}
              </div>
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Total Coins</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {coinStats.todayEarned}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Today</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
              {coinStats.currentStreak}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Day Streak</div>
          </Card>
          
          <Card className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {coinStats.pendingRewards}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">Pending</div>
          </Card>
        </div>
      )}

      {/* Daily Challenges */}
      <Card className="p-6">
        <div className="flex items-center gap-2 mb-4">
          <Calendar className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Daily Challenges
          </h3>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {dailyChallenges.map(challenge => (
            <div
              key={challenge.id}
              className={`p-4 rounded-lg border-2 transition-all ${
                challenge.isCompleted
                  ? 'border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900/20'
                  : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800'
              }`}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-2">
                  {getChallengeIcon(challenge.type)}
                  <h4 className="font-medium text-gray-900 dark:text-white">
                    {challenge.title}
                  </h4>
                </div>
                {challenge.isCompleted && (
                  <CheckCircle className="w-5 h-5 text-green-500" />
                )}
              </div>
              
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {challenge.description}
              </p>
              
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-1 text-yellow-600">
                  <Coins className="w-4 h-4" />
                  <span className="text-sm font-medium">{challenge.coinReward} coins</span>
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Expires: {formatTimeRemaining(challenge.expiresAt)}
                </div>
              </div>
              
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-2">
                <div
                  className={`h-2 rounded-full transition-all duration-300 ${
                    challenge.isCompleted ? 'bg-green-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min((challenge.current / challenge.target) * 100, 100)}%` }}
                ></div>
              </div>
              
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
                {challenge.current} / {challenge.target}
              </div>
            </div>
          ))}
        </div>
      </Card>

      {/* Available Rewards */}
      {availableRewards.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Gift className="w-5 h-5 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Available Rewards
            </h3>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {availableRewards.map(reward => (
              <div
                key={reward.id}
                className={`p-4 rounded-lg border-2 bg-gradient-to-br ${
                  reward.rarity === 'legendary' ? 'from-yellow-50 to-orange-50 border-yellow-200 dark:from-yellow-900/20 dark:to-orange-900/20 dark:border-yellow-800' :
                  reward.rarity === 'epic' ? 'from-purple-50 to-pink-50 border-purple-200 dark:from-purple-900/20 dark:to-pink-900/20 dark:border-purple-800' :
                  reward.rarity === 'rare' ? 'from-blue-50 to-indigo-50 border-blue-200 dark:from-blue-900/20 dark:to-indigo-900/20 dark:border-blue-800' :
                  'from-gray-50 to-slate-50 border-gray-200 dark:from-gray-800 dark:to-slate-800 dark:border-gray-700'
                }`}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getRewardIcon(reward)}
                    <div className={`px-2 py-1 rounded text-xs font-medium bg-${rarityColors[reward.rarity]}-100 text-${rarityColors[reward.rarity]}-800 dark:bg-${rarityColors[reward.rarity]}-900 dark:text-${rarityColors[reward.rarity]}-200`}>
                      {reward.rarity}
                    </div>
                  </div>
                  {reward.expiresAt && (
                    <div className="flex items-center gap-1 text-xs text-red-600">
                      <Clock className="w-3 h-3" />
                      {formatTimeRemaining(reward.expiresAt)}
                    </div>
                  )}
                </div>
                
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  {reward.title}
                </h4>
                
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  {reward.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-yellow-600">
                    <Coins className="w-4 h-4" />
                    <span className="font-medium">
                      {reward.coinAmount}
                      {reward.bonusMultiplier && (
                        <span className="text-xs ml-1">
                          (x{reward.bonusMultiplier})
                        </span>
                      )}
                    </span>
                  </div>
                  
                  <Button
                    size="sm"
                    onClick={() => claimReward(reward.id)}
                    disabled={claimingReward === reward.id}
                    className="bg-green-600 hover:bg-green-700 text-white"
                  >
                    {claimingReward === reward.id ? 'Claiming...' : 'Claim'}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Recent Claims */}
      {claimedRewards.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <CheckCircle className="w-5 h-5 text-gray-600" />
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
              Recently Claimed
            </h3>
          </div>
          
          <div className="space-y-3">
            {claimedRewards.slice(0, 5).map(reward => (
              <div
                key={reward.id}
                className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  {getRewardIcon(reward)}
                  <div>
                    <div className="font-medium text-gray-900 dark:text-white">
                      {reward.title}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      Claimed {reward.claimedAt && new Date(reward.claimedAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-yellow-600">
                  <Coins className="w-4 h-4" />
                  <span className="font-medium">+{reward.coinAmount}</span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}

      {loading && (
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading rewards...</p>
        </div>
      )}
    </div>
  );
}