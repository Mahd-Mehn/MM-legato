'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { Skeleton } from '@/components/ui/skeleton'
import { useUserPermissions } from '@/hooks/useUserRole'
import { AlertTriangle } from 'lucide-react'

function WriterLayoutSkeleton() {
  return (
    <div className="space-y-6">
      <div>
        <Skeleton className="h-8 w-48 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} className="h-64 w-full" />
        ))}
      </div>
    </div>
  )
}

function WriterAccessDenied() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <AlertTriangle className="h-16 w-16 text-amber-500 mb-4" />
      <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
        Writer Access Required
      </h2>
      <p className="text-slate-600 dark:text-slate-300 text-center max-w-md">
        You need writer permissions to access this section. Please contact support if you believe this is an error.
      </p>
    </div>
  )
}

export default function WriterLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { isWriter, isLoading } = useUserPermissions()

  if (isLoading) {
    return <WriterLayoutSkeleton />
  }

  if (!isWriter) {
    return <WriterAccessDenied />
  }

  return (
    <ErrorBoundary>
      <Suspense fallback={<WriterLayoutSkeleton />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Writer Dashboard</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Manage your stories, characters, and analytics
            </p>
          </div>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}