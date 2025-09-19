'use client'

import { Suspense } from 'react'
import { ErrorBoundary } from '@/components/ui/error-boundary'
import { ProfilePageSkeleton } from '@/components/ui/loading-skeleton'

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <ErrorBoundary>
      <Suspense fallback={<ProfilePageSkeleton />}>
        <div className="space-y-6">
          <div>
            <h1 className="text-3xl font-bold text-slate-900 dark:text-white">Profile Settings</h1>
            <p className="text-slate-600 dark:text-slate-300 mt-2">
              Manage your account settings and preferences
            </p>
          </div>
          {children}
        </div>
      </Suspense>
    </ErrorBoundary>
  )
}