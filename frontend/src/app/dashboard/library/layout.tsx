'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'

function LibraryLayoutSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-80" />
      </div>
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-40" />
        <Skeleton className="h-10 w-24" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  )
}

export default function LibraryLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<LibraryLayoutSkeleton />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">My Library</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Your personal collection of books
            </p>
          </div>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}