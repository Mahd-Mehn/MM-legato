'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, Heart, Users, TrendingUp } from 'lucide-react'

function CommunitySkeleton() {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="border rounded-lg p-4">
            <div className="flex items-center space-x-3 mb-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1">
                <Skeleton className="h-4 w-32 mb-1" />
                <Skeleton className="h-3 w-24" />
              </div>
            </div>
            <Skeleton className="h-16 w-full" />
          </div>
        ))}
      </div>
    </div>
  )
}

export default function CommunityPage() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<CommunitySkeleton />}>
        <div className="space-y-6">

          {/* Community Stats */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Comments Made</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">156</p>
                </div>
                <MessageCircle className="h-8 w-8 text-blue-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">+12 this week</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Likes Received</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">342</p>
                </div>
                <Heart className="h-8 w-8 text-red-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">+28 this week</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Following</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">89</p>
                </div>
                <Users className="h-8 w-8 text-green-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">+5 this month</p>
            </div>

            <div className="bg-white dark:bg-slate-800 rounded-lg border p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600 dark:text-slate-300">Reputation</p>
                  <p className="text-2xl font-bold text-slate-900 dark:text-white">1,247</p>
                </div>
                <TrendingUp className="h-8 w-8 text-purple-500" />
              </div>
              <p className="text-xs text-slate-500 mt-2">+45 this week</p>
            </div>
          </div>

          {/* Recent Activity */}
          <div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-4">Recent Activity</h2>
            <div className="space-y-4">
              {/* Activity items would go here */}
              <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                    <MessageCircle className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      You commented on "The Digital Frontier"
                    </p>
                    <p className="text-xs text-slate-500">2 hours ago</p>
                  </div>
                </div>
                <p className="text-sm text-slate-600 dark:text-slate-300 ml-13">
                  "This chapter was absolutely amazing! The character development is incredible."
                </p>
              </div>

              <div className="bg-white dark:bg-slate-800 rounded-lg border p-4">
                <div className="flex items-center space-x-3 mb-3">
                  <div className="h-10 w-10 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                    <Heart className="h-5 w-5 text-red-600 dark:text-red-400" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-900 dark:text-white">
                      Sarah Chen liked your comment
                    </p>
                    <p className="text-xs text-slate-500">5 hours ago</p>
                  </div>
                </div>
              </div>

              <div className="text-center py-8">
                <p className="text-slate-500 dark:text-slate-400">
                  Community features are coming soon! Stay tuned for discussions, forums, and more.
                </p>
              </div>
            </div>
          </div>
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}