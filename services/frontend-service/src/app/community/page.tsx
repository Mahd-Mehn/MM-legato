'use client';

import { useState } from 'react';
import { Trophy, MessageSquare, Award, Target } from 'lucide-react';
import { CommunityDiscussionPlatform } from '@/components/community/CommunityDiscussionPlatform';
import AppLayout from '@/components/AppLayout';
import Card from '@/components/Card';
import Button from '@/components/Button';
import Link from 'next/link';

export default function CommunityPage() {
  return (
    <AppLayout>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Community Hub
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Connect with fellow writers and readers, compete in challenges, and earn rewards
            </p>
          </div>

          {/* Quick Access Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <Card className="p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center gap-3 mb-3">
                <MessageSquare className="w-6 h-6 text-blue-600" />
                <h3 className="font-semibold text-gray-900 dark:text-white">Discussions</h3>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                Join conversations with writers and readers
              </p>
              <div className="text-xs text-gray-500 dark:text-gray-400">
                Active discussions below
              </div>
            </Card>

            <Link href="/community/gamification">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <Trophy className="w-6 h-6 text-yellow-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Leaderboards</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  See top writers, readers, and community members
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  View Rankings →
                </div>
              </Card>
            </Link>

            <Link href="/community/gamification">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <Award className="w-6 h-6 text-purple-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Achievements</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Unlock badges and earn points for activities
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  View Badges →
                </div>
              </Card>
            </Link>

            <Link href="/community/gamification">
              <Card className="p-4 hover:shadow-md transition-shadow cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800">
                <div className="flex items-center gap-3 mb-3">
                  <Target className="w-6 h-6 text-green-600" />
                  <h3 className="font-semibold text-gray-900 dark:text-white">Contests</h3>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                  Join writing competitions and challenges
                </p>
                <div className="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  Join Contest →
                </div>
              </Card>
            </Link>
          </div>

          {/* Gamification Quick Access */}
          <Card className="p-6 mb-8 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border-blue-200 dark:border-blue-800">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between">
              <div className="mb-4 md:mb-0">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                  🎮 Community Gamification
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Compete with other writers, earn achievements, and climb the leaderboards. 
                  Join contests and earn coins for your activities!
                </p>
              </div>
              <Link href="/community/gamification">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white">
                  Explore Gamification
                </Button>
              </Link>
            </div>
          </Card>
          
          <CommunityDiscussionPlatform />
        </div>
      </div>
    </AppLayout>
  );
}