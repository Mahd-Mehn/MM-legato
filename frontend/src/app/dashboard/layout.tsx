'use client'

import { Suspense } from 'react'
import { Sidebar } from '@/components/dashboard/sidebar'
import { TopNavigation } from '@/components/dashboard/top-navigation'
import { MobileNavigation } from '@/components/dashboard/mobile-navigation'
import { ErrorBoundary, NavigationErrorFallback } from '@/components/ui/error-boundary'
import { SidebarSkeleton, TopNavigationSkeleton } from '@/components/ui/loading-skeleton'
import { useLayoutPreferences } from '@/hooks/useLayoutPreferences'
import { useIsMobile } from '@/hooks/use-mobile'
import { LayoutProvider } from '@/contexts/LayoutContext'
import { cn } from '@/lib/utils'

function DashboardContent({ children }: { children: React.ReactNode }) {
  const { preferences, isLoading } = useLayoutPreferences()
  const isMobile = useIsMobile()
  
  console.log('Dashboard layout preferences:', preferences)

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        {!isMobile && <SidebarSkeleton />}
        <TopNavigationSkeleton sidebarCollapsed={preferences.sidebarCollapsed} />
        <div className={cn(
          "flex flex-col min-h-screen pt-16",
          !isMobile && (preferences.sidebarCollapsed ? "ml-16" : "ml-64"),
          isMobile && "pb-16" // Add bottom padding for mobile nav
        )}>
          <main className="flex-1 p-6 overflow-auto">
            <div className="animate-pulse space-y-4">
              <div className="h-8 bg-slate-200 dark:bg-slate-700 rounded w-1/4"></div>
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded w-1/2"></div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="h-32 bg-slate-200 dark:bg-slate-700 rounded"></div>
                ))}
              </div>
            </div>
          </main>
        </div>
        {isMobile && <MobileNavigation />}
      </div>
    )
  }

  return (
    <div className={cn(
      "min-h-screen bg-background transition-all duration-200",
      preferences.compactMode && "text-sm"
    )}>
      {/* Desktop Sidebar - Hidden on mobile */}
      {!isMobile && (
        <ErrorBoundary fallback={NavigationErrorFallback}>
          <Suspense fallback={<SidebarSkeleton collapsed={preferences.sidebarCollapsed} />}>
            <Sidebar collapsed={preferences.sidebarCollapsed} />
          </Suspense>
        </ErrorBoundary>
      )}

      {/* Fixed Top Navigation */}
      <ErrorBoundary fallback={NavigationErrorFallback}>
        <Suspense fallback={<TopNavigationSkeleton sidebarCollapsed={preferences.sidebarCollapsed} />}>
          <TopNavigation />
        </Suspense>
      </ErrorBoundary>
      
      {/* Main Content with responsive margins */}
      <div className={cn(
        "flex flex-col min-h-screen transition-all duration-200 pt-24 px-6",
        // Desktop margins based on sidebar state
        !isMobile && (preferences.sidebarCollapsed ? "ml-16" : "ml-64"),
        // Mobile bottom padding for bottom navigation
        isMobile && "pb-16"
      )}>
        {/* Page Content */}
        <main className={cn(
          "flex-1 transition-all duration-200 overflow-auto",
          preferences.compactMode ? "p-4" : "p-6"
        )}>
          <ErrorBoundary>
            {children}
          </ErrorBoundary>
        </main>
      </div>

      {/* Mobile Bottom Navigation - Hidden on desktop */}
      {isMobile && <MobileNavigation />}
    </div>
  )
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <LayoutProvider>
      <DashboardContent>{children}</DashboardContent>
    </LayoutProvider>
  )
}