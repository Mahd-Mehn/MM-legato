'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'

function ExploreLayoutSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="flex gap-6">
        <div className="w-64 space-y-4">
          <Skeleton className="h-6 w-20" />
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </div>
        <div className="flex-1">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 w-full" />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function ExploreLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ExploreLayoutSkeleton />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Explore Books</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Discover new stories and authors
            </p>
          </div>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}