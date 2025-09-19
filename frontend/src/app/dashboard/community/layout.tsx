'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'

function CommunityLayoutSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
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

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<CommunityLayoutSkeleton />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Community</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Connect with other readers and writers
            </p>
          </div>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}