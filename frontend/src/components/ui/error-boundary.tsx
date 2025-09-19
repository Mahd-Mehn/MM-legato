'use client'

import React from 'react'
import { AlertTriangle, RefreshCw } from 'lucide-react'
import { Button } from './button'

interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface ErrorBoundaryProps {
  children: React.ReactNode
  fallback?: React.ComponentType<{ error?: Error; retry: () => void }>
}

export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Error caught by boundary:', error, errorInfo)
  }

  retry = () => {
    this.setState({ hasError: false, error: undefined })
  }

  render() {
    if (this.state.hasError) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback
      return <FallbackComponent error={this.state.error} retry={this.retry} />
    }

    return this.props.children
  }
}

interface ErrorFallbackProps {
  error?: Error
  retry: () => void
}

export function DefaultErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[400px] p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-slate-900 dark:text-white mb-2">
          Something went wrong
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-4">
          {error?.message || 'An unexpected error occurred. Please try again.'}
        </p>
        <Button onClick={retry} className="flex items-center space-x-2">
          <RefreshCw className="h-4 w-4" />
          <span>Try again</span>
        </Button>
      </div>
    </div>
  )
}

export function NavigationErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center p-6 border border-red-200 dark:border-red-800 rounded-lg bg-red-50 dark:bg-red-900/20">
      <AlertTriangle className="h-8 w-8 text-red-500 mb-2" />
      <p className="text-sm text-red-700 dark:text-red-300 text-center mb-3">
        Failed to load navigation
      </p>
      <Button size="sm" variant="outline" onClick={retry}>
        Retry
      </Button>
    </div>
  )
}

export function DashboardErrorFallback({ error, retry }: ErrorFallbackProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[500px] p-6">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-16 w-16 text-red-500 mx-auto mb-4" />
        <h2 className="text-2xl font-semibold text-slate-900 dark:text-white mb-2">
          Dashboard Error
        </h2>
        <p className="text-slate-600 dark:text-slate-300 mb-6">
          We couldn't load your dashboard. This might be a temporary issue.
        </p>
        <div className="space-y-3">
          <Button onClick={retry} className="w-full">
            <RefreshCw className="h-4 w-4 mr-2" />
            Reload Dashboard
          </Button>
          <Button variant="outline" onClick={() => window.location.reload()} className="w-full">
            Refresh Page
          </Button>
        </div>
      </div>
    </div>
  )
}