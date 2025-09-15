'use client';

import { QueryErrorResetBoundary } from '@tanstack/react-query';
import { ErrorBoundary } from './ErrorBoundary';
import { ReactNode } from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface QueryErrorBoundaryProps {
  children: ReactNode;
}

export function QueryErrorBoundary({ children }: QueryErrorBoundaryProps) {
  return (
    <QueryErrorResetBoundary>
      {({ reset }) => (
        <ErrorBoundary
          onError={(error, errorInfo) => {
            console.error('Query error boundary caught error:', error, errorInfo);
          }}
          fallback={
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                Failed to load data
              </h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                There was an error loading the requested data. Please try again.
              </p>
              <button
                onClick={reset}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Try Again
              </button>
            </div>
          }
        >
          {children}
        </ErrorBoundary>
      )}
    </QueryErrorResetBoundary>
  );
}