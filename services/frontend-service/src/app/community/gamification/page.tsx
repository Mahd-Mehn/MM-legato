'use client';

import { useState } from 'react';
import { Trophy, Award, Coins, Target } from 'lucide-react';
import AppLayout from '@/components/AppLayout';
import { LeaderboardDisplay } from '@/components/community/LeaderboardDisplay';
import { AchievementSystem } from '@/components/community/AchievementSystem';
import { ContestPlatform } from '@/components/community/ContestPlatform';
import { RewardSystem } from '@/components/community/RewardSystem';
import Card from '@/components/Card';

export default function GamificationPage() {
  const [activeTab, setActiveTab] = useState('leaderboards');

  const tabs = [
    {
      id: 'leaderboards',
      name: 'Leaderboards',
      icon: Trophy,
      description: 'See top performers across different categories'
    },
    {
      id: 'achievements',
      name: 'Achievements',
      icon: Award,
      description: 'Unlock badges and earn points'
    },
    {
      id: 'contests',
      name: 'Contests',
      icon: Target,
      description: 'Join writing competitions and challenges'
    },
    {
      id: 'rewards',
      name: 'Rewards',
      icon: Coins,
      description: 'Earn coins through daily activities'
    }
  ];

  const renderActiveTab = () => {
    switch (activeTab) {
      case 'leaderboards':
        return <LeaderboardDisplay />;
      case 'achievements':
        return <AchievementSystem />;
      case 'contests':
        return <ContestPlatform />;
      case 'rewards':
        return <RewardSystem />;
      default:
        return <LeaderboardDisplay />;
    }
  };

  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Community Gamification
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Compete, achieve, and earn rewards in the Legato community
            </p>
          </div>

          {/* Tab Navigation */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            {tabs.map(tab => {
              const Icon = tab.icon;
              return (
                <Card
                  key={tab.id}
                  className={`p-4 cursor-pointer transition-all hover:shadow-md ${
                    activeTab === tab.id
                      ? 'ring-2 ring-blue-500 bg-blue-50 dark:bg-blue-900/20'
                      : 'hover:bg-gray-50 dark:hover:bg-gray-800'
                  }`}
                  onClick={() => setActiveTab(tab.id)}
                >
                  <div className="text-center">
                    <Icon className={`w-8 h-8 mx-auto mb-2 ${
                      activeTab === tab.id ? 'text-blue-600' : 'text-gray-600 dark:text-gray-400'
                    }`} />
                    <h3 className={`font-semibold mb-1 ${
                      activeTab === tab.id ? 'text-blue-900 dark:text-blue-100' : 'text-gray-900 dark:text-white'
                    }`}>
                      {tab.name}
                    </h3>
                    <p className="text-xs text-gray-600 dark:text-gray-400">
                      {tab.description}
                    </p>
                  </div>
                </Card>
              );
            })}
          </div>

          {/* Active Tab Content */}
          <div className="transition-all duration-300">
            {renderActiveTab()}
          </div>
        </div>
      </div>
    </AppLayout>
  );
}