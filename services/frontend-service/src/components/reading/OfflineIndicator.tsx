'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Wifi, WifiOff, Download, AlertCircle, CheckCircle, Cloud, CloudOff } from 'lucide-react';
import { useOfflineContent } from '@/hooks/useOfflineContent';

interface OfflineIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export default function OfflineIndicator({ className = '', showDetails = false }: OfflineIndicatorProps) {
  const [isOffline, setIsOffline] = useState(false);
  const [showNotification, setShowNotification] = useState(false);
  const [connectionQuality, setConnectionQuality] = useState<'good' | 'poor' | 'offline'>('good');
  
  const { getStorageInfo, cachedContent } = useOfflineContent();
  const storageInfo = getStorageInfo();

  useEffect(() => {
    const handleOnline = () => {
      setIsOffline(false);
      setConnectionQuality('good');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 3000);
    };
    
    const handleOffline = () => {
      setIsOffline(true);
      setConnectionQuality('offline');
      setShowNotification(true);
      setTimeout(() => setShowNotification(false), 5000);
    };

    // Check initial connection status
    setIsOffline(!navigator.onLine);
    setConnectionQuality(navigator.onLine ? 'good' : 'offline');
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Monitor connection quality (simplified)
    const checkConnectionQuality = () => {
      if (navigator.onLine) {
        // Simple connection quality check based on connection type
        const connection = (navigator as any).connection;
        if (connection) {
          const effectiveType = connection.effectiveType;
          if (effectiveType === 'slow-2g' || effectiveType === '2g') {
            setConnectionQuality('poor');
          } else {
            setConnectionQuality('good');
          }
        }
      }
    };

    checkConnectionQuality();
    const interval = setInterval(checkConnectionQuality, 30000); // Check every 30 seconds

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(interval);
    };
  }, []);

  const getStatusColor = () => {
    switch (connectionQuality) {
      case 'good': return 'text-green-600';
      case 'poor': return 'text-yellow-600';
      case 'offline': return 'text-orange-600';
      default: return 'text-gray-600';
    }
  };

  const getStatusIcon = () => {
    switch (connectionQuality) {
      case 'good': return <Wifi className="w-4 h-4" />;
      case 'poor': return <Wifi className="w-4 h-4" />;
      case 'offline': return <WifiOff className="w-4 h-4" />;
      default: return <WifiOff className="w-4 h-4" />;
    }
  };

  const getStatusText = () => {
    switch (connectionQuality) {
      case 'good': return 'Online';
      case 'poor': return 'Slow Connection';
      case 'offline': return 'Offline';
      default: return 'Unknown';
    }
  };

  return (
    <>
      {/* Status Indicator */}
      <div className={`flex items-center gap-2 ${className}`}>
        <div className={getStatusColor()}>
          {getStatusIcon()}
        </div>
        <div className="flex flex-col">
          <span className={`text-sm font-medium ${getStatusColor()}`}>
            {getStatusText()}
          </span>
          {showDetails && (
            <span className="text-xs text-gray-500">
              {storageInfo.itemCount} chapters cached
            </span>
          )}
        </div>
      </div>

      {/* Enhanced Connection Status Notification */}
      <AnimatePresence>
        {showNotification && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -50, scale: 0.95 }}
            className={`fixed top-4 right-4 z-50 p-4 rounded-2xl shadow-lg border max-w-sm ${
              isOffline 
                ? 'bg-orange-50 border-orange-200' 
                : 'bg-green-50 border-green-200'
            }`}
          >
            <div className="flex items-start gap-3">
              <div className={`p-2 rounded-full ${
                isOffline ? 'bg-orange-100' : 'bg-green-100'
              }`}>
                {isOffline ? (
                  <CloudOff className="w-5 h-5 text-orange-600" />
                ) : (
                  <Cloud className="w-5 h-5 text-green-600" />
                )}
              </div>
              
              <div className="flex-1">
                <div className={`font-semibold ${
                  isOffline ? 'text-orange-800' : 'text-green-800'
                }`}>
                  {isOffline ? 'You are now offline' : 'Connection restored'}
                </div>
                <div className={`text-sm mt-1 ${
                  isOffline ? 'text-orange-700' : 'text-green-700'
                }`}>
                  {isOffline 
                    ? `You can still read ${storageInfo.itemCount} downloaded chapters` 
                    : 'All features are now available'
                  }
                </div>
                
                {isOffline && storageInfo.itemCount === 0 && (
                  <div className="mt-2 p-2 bg-orange-100 rounded-lg">
                    <div className="flex items-center gap-2 text-orange-800">
                      <AlertCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">No offline content available</span>
                    </div>
                    <p className="text-xs text-orange-700 mt-1">
                      Download stories while online to read them offline
                    </p>
                  </div>
                )}
                
                {!isOffline && storageInfo.itemCount > 0 && (
                  <div className="mt-2 p-2 bg-green-100 rounded-lg">
                    <div className="flex items-center gap-2 text-green-800">
                      <CheckCircle className="w-4 h-4" />
                      <span className="text-xs font-medium">
                        {storageInfo.itemCount} chapters ready for offline reading
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Persistent Offline Banner */}
      <AnimatePresence>
        {isOffline && (
          <motion.div
            initial={{ opacity: 0, y: -100 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -100 }}
            className="fixed top-0 left-0 right-0 z-40 bg-orange-500 text-white py-2 px-4"
          >
            <div className="max-w-7xl mx-auto flex items-center justify-center gap-2 text-sm">
              <WifiOff className="w-4 h-4" />
              <span>
                You're offline. {storageInfo.itemCount > 0 
                  ? `${storageInfo.itemCount} chapters available for reading.`
                  : 'Download content while online to read offline.'
                }
              </span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}