'use client';

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Wifi, WifiOff, Signal } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NetworkStatusIndicator() {
  const networkStatus = useNetworkStatus();
  const [showIndicator, setShowIndicator] = useState(false);

  useEffect(() => {
    // Show indicator when offline or on slow connection
    setShowIndicator(!networkStatus.isOnline || networkStatus.isSlowConnection);
  }, [networkStatus.isOnline, networkStatus.isSlowConnection]);

  if (!showIndicator) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50">
      <div className={`
        flex items-center px-4 py-2 rounded-full shadow-lg text-sm font-medium
        ${!networkStatus.isOnline 
          ? 'bg-red-500 text-white' 
          : 'bg-yellow-500 text-white'
        }
      `}>
        {!networkStatus.isOnline ? (
          <>
            <WifiOff className="h-4 w-4 mr-2" />
            You're offline
          </>
        ) : networkStatus.isSlowConnection ? (
          <>
            <Signal className="h-4 w-4 mr-2" />
            Slow connection detected
          </>
        ) : (
          <>
            <Wifi className="h-4 w-4 mr-2" />
            Back online
          </>
        )}
      </div>
    </div>
  );
}

export function NetworkStatusBanner() {
  const networkStatus = useNetworkStatus();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Reset dismissed state when coming back online
    if (networkStatus.isOnline && !networkStatus.isSlowConnection) {
      setDismissed(false);
    }
  }, [networkStatus.isOnline, networkStatus.isSlowConnection]);

  if (networkStatus.isOnline && !networkStatus.isSlowConnection) {
    return null;
  }

  if (dismissed) {
    return null;
  }

  return (
    <div className={`
      w-full px-4 py-3 text-center text-sm font-medium
      ${!networkStatus.isOnline 
        ? 'bg-red-100 text-red-800 border-b border-red-200 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' 
        : 'bg-yellow-100 text-yellow-800 border-b border-yellow-200 dark:bg-yellow-900/20 dark:text-yellow-300 dark:border-yellow-800'
      }
    `}>
      <div className="flex items-center justify-center">
        {!networkStatus.isOnline ? (
          <>
            <WifiOff className="h-4 w-4 mr-2" />
            You're currently offline. Some features may not be available.
          </>
        ) : (
          <>
            <Signal className="h-4 w-4 mr-2" />
            Slow connection detected. Content may load slowly.
          </>
        )}
        <button
          onClick={() => setDismissed(true)}
          className="ml-4 text-xs underline hover:no-underline"
        >
          Dismiss
        </button>
      </div>
    </div>
  );
}