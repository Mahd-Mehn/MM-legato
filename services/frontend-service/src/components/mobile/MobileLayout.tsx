'use client';

import React from 'react';
import { MobileNavigation } from './MobileNavigation';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useViewportHeight } from '@/hooks/useViewportHeight';

interface MobileLayoutProps {
  children: React.ReactNode;
  showNavigation?: boolean;
  className?: string;
}

export function MobileLayout({ 
  children, 
  showNavigation = true, 
  className = '' 
}: MobileLayoutProps) {
  const { isMobile } = useMobileDetection();
  const { visualViewportHeight, isKeyboardOpen } = useViewportHeight();

  if (!isMobile) {
    return <>{children}</>;
  }

  return (
    <div 
      className={`flex flex-col min-h-screen bg-white dark:bg-dark-900 ${className}`}
      style={{
        // Use visual viewport height to handle mobile browser UI
        minHeight: `${visualViewportHeight}px`,
      }}
    >
      {/* Safe area top padding */}
      <div className="pt-safe-top" />

      {/* Main content area */}
      <main 
        className={`flex-1 overflow-hidden ${showNavigation ? 'pb-16' : ''}`}
        style={{
          // Adjust for keyboard when open
          paddingBottom: isKeyboardOpen ? '0' : showNavigation ? '4rem' : '0',
        }}
      >
        {children}
      </main>

      {/* Bottom navigation */}
      {showNavigation && !isKeyboardOpen && <MobileNavigation />}
    </div>
  );
}