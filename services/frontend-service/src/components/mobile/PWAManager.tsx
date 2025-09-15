'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Bell, 
  BellOff, 
  Wifi, 
  WifiOff,
  Smartphone,
  X
} from 'lucide-react';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { 
  subscribeToPushNotifications, 
  unsubscribeFromPushNotifications,
  scheduleBackgroundSync 
} from '@/lib/serviceWorker';

interface PWAManagerProps {
  className?: string;
}

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export function PWAManager({ className = '' }: PWAManagerProps) {
  const [isInstallable, setIsInstallable] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);
  const [showInstallPrompt, setShowInstallPrompt] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);

  useEffect(() => {
    // Check if app is already installed
    const checkInstalled = () => {
      const isStandalone = window.matchMedia('(display-mode: standalone)').matches;
      const isInWebAppiOS = (window.navigator as any).standalone === true;
      setIsInstalled(isStandalone || isInWebAppiOS);
    };

    // Listen for install prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setIsInstallable(true);
      
      // Show install prompt after a delay if not installed
      setTimeout(() => {
        if (!isInstalled) {
          setShowInstallPrompt(true);
        }
      }, 5000);
    };

    // Listen for app installed
    const handleAppInstalled = () => {
      setIsInstalled(true);
      setIsInstallable(false);
      setShowInstallPrompt(false);
      console.log('PWA was installed');
    };

    // Check online status
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    // Check notification permission
    const checkNotificationPermission = () => {
      if ('Notification' in window) {
        setNotificationsEnabled(Notification.permission === 'granted');
      }
    };

    checkInstalled();
    checkNotificationPermission();
    setIsOnline(navigator.onLine);

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [isInstalled]);

  const handleInstallApp = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      
      if (outcome === 'accepted') {
        console.log('User accepted the install prompt');
      } else {
        console.log('User dismissed the install prompt');
      }
      
      setDeferredPrompt(null);
      setShowInstallPrompt(false);
    }
  };

  const handleToggleNotifications = async () => {
    try {
      if (notificationsEnabled) {
        await unsubscribeFromPushNotifications();
        setNotificationsEnabled(false);
      } else {
        await subscribeToPushNotifications();
        setNotificationsEnabled(true);
      }
    } catch (error) {
      console.error('Failed to toggle notifications:', error);
    }
  };

  const handleSyncData = async () => {
    try {
      await scheduleBackgroundSync('user-data-sync', {
        timestamp: Date.now(),
        type: 'manual'
      });
      
      // Show success message
      const notification = document.createElement('div');
      notification.className = `
        fixed bottom-20 left-4 right-4 z-50 bg-blue-600 text-white p-3 rounded-lg shadow-lg
        animate-slide-up
      `;
      notification.innerHTML = `
        <p class="text-sm font-medium">✓ Data sync scheduled</p>
      `;
      document.body.appendChild(notification);
      
      setTimeout(() => {
        notification.remove();
      }, 3000);
    } catch (error) {
      console.error('Failed to schedule sync:', error);
    }
  };

  return (
    <div className={className}>
      {/* Install Prompt */}
      <AnimatePresence>
        {showInstallPrompt && !isInstalled && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-20 left-4 right-4 z-50 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-lg shadow-xl p-4"
          >
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-10 h-10 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-primary-600 dark:text-primary-400" />
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-neutral-900 dark:text-neutral-100 mb-1">
                  Install Legato App
                </h3>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  Get the full experience with offline reading, push notifications, and faster loading.
                </p>
                
                <div className="flex space-x-2">
                  <TouchOptimizedButton
                    variant="primary"
                    size="sm"
                    onClick={handleInstallApp}
                    className="flex items-center space-x-2"
                  >
                    <Download size={16} />
                    <span>Install</span>
                  </TouchOptimizedButton>
                  
                  <TouchOptimizedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowInstallPrompt(false)}
                  >
                    Later
                  </TouchOptimizedButton>
                </div>
              </div>
              
              <button
                onClick={() => setShowInstallPrompt(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200"
              >
                <X size={20} />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* PWA Status Indicators */}
      <div className="flex items-center space-x-2">
        {/* Online/Offline Status */}
        <div className={`flex items-center space-x-1 px-2 py-1 rounded-full text-xs ${
          isOnline 
            ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
            : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        }`}>
          {isOnline ? <Wifi size={12} /> : <WifiOff size={12} />}
          <span>{isOnline ? 'Online' : 'Offline'}</span>
        </div>

        {/* Notification Status */}
        {!isInstalled && (
          <TouchOptimizedButton
            variant="ghost"
            size="sm"
            onClick={handleToggleNotifications}
            className={`flex items-center space-x-1 ${
              notificationsEnabled 
                ? 'text-primary-600 dark:text-primary-400' 
                : 'text-neutral-600 dark:text-neutral-400'
            }`}
          >
            {notificationsEnabled ? <Bell size={16} /> : <BellOff size={16} />}
            <span className="text-xs">
              {notificationsEnabled ? 'Notifications On' : 'Enable Notifications'}
            </span>
          </TouchOptimizedButton>
        )}

        {/* Manual Sync Button */}
        {!isOnline && (
          <TouchOptimizedButton
            variant="outline"
            size="sm"
            onClick={handleSyncData}
            className="text-xs"
          >
            Sync when online
          </TouchOptimizedButton>
        )}
      </div>
    </div>
  );
}