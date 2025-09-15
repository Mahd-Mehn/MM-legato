'use client';

import { Star, Award, Crown, Shield, Zap } from 'lucide-react';

interface UserReputationBadgeProps {
  reputation: number;
  badges: string[];
  size?: 'sm' | 'md' | 'lg';
}

export function UserReputationBadge({ reputation, badges, size = 'sm' }: UserReputationBadgeProps) {
  const getReputationLevel = (rep: number) => {
    if (rep >= 10000) return { level: 'Legend', color: 'text-purple-600 dark:text-purple-400', icon: Crown };
    if (rep >= 5000) return { level: 'Expert', color: 'text-yellow-600 dark:text-yellow-400', icon: Award };
    if (rep >= 1000) return { level: 'Veteran', color: 'text-blue-600 dark:text-blue-400', icon: Shield };
    if (rep >= 500) return { level: 'Active', color: 'text-green-600 dark:text-green-400', icon: Zap };
    if (rep >= 100) return { level: 'Member', color: 'text-gray-600 dark:text-gray-400', icon: Star };
    return { level: 'Newcomer', color: 'text-gray-500 dark:text-gray-500', icon: Star };
  };

  const getBadgeInfo = (badge: string) => {
    const badgeMap: Record<string, { name: string; color: string; icon: any }> = {
      'verified-writer': { name: 'Verified Writer', color: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200', icon: Shield },
      'top-contributor': { name: 'Top Contributor', color: 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-200', icon: Crown },
      'helpful': { name: 'Helpful', color: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200', icon: Star },
      'moderator': { name: 'Moderator', color: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-200', icon: Shield },
      'beta-tester': { name: 'Beta Tester', color: 'bg-orange-100 dark:bg-orange-900 text-orange-800 dark:text-orange-200', icon: Zap }
    };
    return badgeMap[badge] || { name: badge, color: 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400', icon: Star };
  };

  const reputationInfo = getReputationLevel(reputation);
  const ReputationIcon = reputationInfo.icon;

  const sizeClasses = {
    sm: {
      icon: 'w-3 h-3',
      text: 'text-xs',
      badge: 'px-1.5 py-0.5 text-xs',
      gap: 'gap-1'
    },
    md: {
      icon: 'w-4 h-4',
      text: 'text-sm',
      badge: 'px-2 py-1 text-xs',
      gap: 'gap-2'
    },
    lg: {
      icon: 'w-5 h-5',
      text: 'text-base',
      badge: 'px-2 py-1 text-sm',
      gap: 'gap-2'
    }
  };

  const classes = sizeClasses[size];

  return (
    <div className={`flex items-center ${classes.gap}`}>
      {/* Reputation Level */}
      <div className={`flex items-center gap-1 ${reputationInfo.color}`}>
        <ReputationIcon className={classes.icon} />
        <span className={`font-medium ${classes.text}`}>
          {reputationInfo.level}
        </span>
        <span className={`${classes.text} opacity-75`}>
          ({reputation.toLocaleString()})
        </span>
      </div>

      {/* Badges */}
      {badges.length > 0 && (
        <div className={`flex items-center ${classes.gap}`}>
          {badges.slice(0, 3).map(badge => {
            const badgeInfo = getBadgeInfo(badge);
            const BadgeIcon = badgeInfo.icon;
            return (
              <div
                key={badge}
                className={`inline-flex items-center gap-1 rounded-full ${badgeInfo.color} ${classes.badge}`}
                title={badgeInfo.name}
              >
                <BadgeIcon className={classes.icon} />
                {size !== 'sm' && <span>{badgeInfo.name}</span>}
              </div>
            );
          })}
          {badges.length > 3 && (
            <span className={`${classes.text} text-gray-500 dark:text-gray-400`}>
              +{badges.length - 3}
            </span>
          )}
        </div>
      )}
    </div>
  );
}