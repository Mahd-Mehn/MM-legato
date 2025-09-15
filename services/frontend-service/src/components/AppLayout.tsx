'use client';

import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import Navigation from './Navigation';
import Header from './Header';
import PWAInstallPrompt from './PWAInstallPrompt';
import { MobileNavigation } from './mobile/MobileNavigation';
// import { PerformanceMonitor } from './mobile/PerformanceMonitor';
import { registerServiceWorker } from '@/lib/serviceWorker';
import { useAuth } from '@/contexts/AuthContext';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useViewportHeight } from '@/hooks/useViewportHeight';

interface AppLayoutProps {
  children: React.ReactNode;
}

export default function AppLayout({ children }: AppLayoutProps) {
  const { isAuthenticated, isLoading } = useAuth();
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();
  const { visualViewportHeight, isKeyboardOpen } = useViewportHeight();
  
  // Pages that should not show navigation even when authenticated
  const publicPages = ['/', '/auth/login', '/auth/register'];
  const isPublicPage = publicPages.includes(pathname);
  
  // Show navigation only if authenticated and not on public pages
  const showNavigation = isAuthenticated && !isPublicPage;

  useEffect(() => {
    // Register service worker on mount
    registerServiceWorker();
  }, []);

  // Mobile-optimized loading screen
  if (isLoading) {
    return (
      <div 
        className="min-h-screen-mobile bg-reading-bg flex items-center justify-center px-4"
        style={{ minHeight: isMobile ? `${visualViewportHeight}px` : '100vh' }}
      >
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-primary-300 border-t-primary-600 mx-auto mb-4"></div>
          <p className="text-reading-muted">Loading Legato...</p>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen-mobile bg-reading-bg"
      style={{ minHeight: isMobile ? `${visualViewportHeight}px` : '100vh' }}
    >
      {/* Desktop Navigation */}
      {!isMobile && (
        <>
          {isPublicPage ? <Header /> : showNavigation && <Navigation />}
        </>
      )}
      
      {/* Mobile Header for public pages */}
      {isMobile && isPublicPage && <Header />}
      
      <main 
        className={`
          ${!isMobile && showNavigation ? 'lg:pl-64' : ''}
          ${!isMobile && isPublicPage ? 'pt-16 md:pt-20' : ''}
          ${isMobile && isPublicPage ? 'pt-16' : ''}
          ${isMobile && showNavigation && !isKeyboardOpen ? 'pb-20' : ''}
          ${isMobile ? 'safe-area-inset-left safe-area-inset-right' : ''}
        `}
        style={{
          // Adjust for keyboard on mobile
          paddingBottom: isMobile && isKeyboardOpen ? '0' : undefined,
        }}
      >
        {children}
      </main>
      
      {/* Mobile Navigation */}
      {isMobile && showNavigation && !isKeyboardOpen && <MobileNavigation />}
      
      <PWAInstallPrompt />
      
      {/* Performance Monitor in development */}
      {/* {process.env.NODE_ENV === 'development' && (
        <PerformanceMonitor showDebugInfo={true} />
      )} */}
    </div>
  );
}