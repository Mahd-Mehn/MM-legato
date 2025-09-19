'use client'

import { Skeleton } from "./skeleton"
import { cn } from "@/lib/utils"

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Section Skeleton */}
      <div>
        <Skeleton className="h-8 w-64 mb-2" />
        <Skeleton className="h-4 w-96" />
      </div>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="p-6 border rounded-lg">
            <div className="flex items-center justify-between">
              <div>
                <Skeleton className="h-4 w-20 mb-2" />
                <Skeleton className="h-8 w-16" />
              </div>
              <Skeleton className="h-8 w-8 rounded" />
            </div>
            <Skeleton className="h-3 w-24 mt-2" />
          </div>
        ))}
      </div>

      {/* Continue Reading Section Skeleton */}
      <div>
        <Skeleton className="h-6 w-40 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>

      {/* Recommended Section Skeleton */}
      <div>
        <Skeleton className="h-6 w-48 mb-4" />
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <BookCardSkeleton key={i} />
          ))}
        </div>
      </div>
    </div>
  )
}

export function BookCardSkeleton() {
  return (
    <div className="border rounded-lg overflow-hidden">
      <Skeleton className="h-48 w-full" />
      <div className="p-4">
        <Skeleton className="h-5 w-3/4 mb-2" />
        <Skeleton className="h-4 w-1/2 mb-3" />
        <div className="flex items-center justify-between">
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-8 w-20" />
        </div>
      </div>
    </div>
  )
}

interface SidebarSkeletonProps {
  collapsed?: boolean
}

export function SidebarSkeleton({ collapsed = false }: SidebarSkeletonProps) {
  return (
    <div className={cn(
      "fixed left-0 top-0 h-full bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-700 flex flex-col z-30",
      collapsed ? "w-16" : "w-64"
    )}>
      {/* Logo Skeleton */}
      <div className="p-6 border-b border-slate-200 dark:border-slate-700">
        <div className="flex items-center space-x-2">
          <Skeleton className={cn(
            collapsed ? "h-10 w-10" : "h-8 w-8"
          )} />
          {!collapsed && <Skeleton className="h-6 w-20" />}
        </div>
      </div>

      {/* Navigation Skeleton */}
      <nav className="flex-1 p-4 space-y-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className={cn(
            "flex items-center px-3 py-2",
            collapsed && "justify-center"
          )}>
            <Skeleton className={cn(
              collapsed ? "h-7 w-7" : "h-5 w-5", 
              !collapsed && "mr-3"
            )} />
            {!collapsed && <Skeleton className="h-4 w-24" />}
          </div>
        ))}
        
        {/* Writer Section Skeleton */}
        <div className="pt-6">
          {!collapsed && <Skeleton className="h-3 w-20 mb-2 mx-3" />}
          <div className={cn(
            "flex items-center px-3 py-2",
            collapsed && "justify-center"
          )}>
            <Skeleton className={cn(
              collapsed ? "h-7 w-7" : "h-5 w-5", 
              !collapsed && "mr-3"
            )} />
            {!collapsed && <Skeleton className="h-4 w-28" />}
          </div>
        </div>

        {/* Special Section Skeleton */}
        <div className="pt-6">
          {!collapsed && <Skeleton className="h-3 w-16 mb-2 mx-3" />}
          <div className={cn(
            "flex items-center px-3 py-2",
            collapsed && "justify-center"
          )}>
            <Skeleton className={cn(
              collapsed ? "h-7 w-7" : "h-5 w-5", 
              !collapsed && "mr-3"
            )} />
            {!collapsed && <Skeleton className="h-4 w-24" />}
          </div>
        </div>
      </nav>
    </div>
  )
}

interface TopNavigationSkeletonProps {
  sidebarCollapsed?: boolean
}

export function TopNavigationSkeleton({ sidebarCollapsed = false }: TopNavigationSkeletonProps) {
  return (
    <header className={cn(
      "h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700 flex items-center justify-between px-6 fixed top-0 right-0 z-40 transition-all duration-200",
      sidebarCollapsed ? "left-16" : "left-64"
    )}>
      {/* Search Skeleton */}
      <div className="flex-1 max-w-md">
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Right Side Actions Skeleton */}
      <div className="flex items-center space-x-4">
        <Skeleton className="h-8 w-16 rounded-full" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-10 w-10" />
        <Skeleton className="h-8 w-8 rounded-full" />
      </div>
    </header>
  )
}

export function ProfilePageSkeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <Skeleton className="h-8 w-32 mb-2" />
        <Skeleton className="h-4 w-64" />
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-lg border p-6">
        <div className="flex items-center space-x-6 mb-6">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="flex-1">
            <Skeleton className="h-6 w-32 mb-2" />
            <Skeleton className="h-4 w-48" />
          </div>
        </div>

        <div className="space-y-4">
          <div>
            <Skeleton className="h-4 w-20 mb-2" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div>
            <Skeleton className="h-4 w-16 mb-2" />
            <Skeleton className="h-24 w-full" />
          </div>
          <div className="flex items-center space-x-2">
            <Skeleton className="h-5 w-5" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>

        <div className="flex justify-end mt-6">
          <Skeleton className="h-10 w-24" />
        </div>
      </div>
    </div>
  )
}