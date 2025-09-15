'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Home, 
  BookOpen, 
  PenTool, 
  User, 
  Menu, 
  X,
  Search,
  Bookmark,
  Settings
} from 'lucide-react';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface MobileNavigationProps {
  className?: string;
}

const navigationItems = [
  { href: '/', icon: Home, label: 'Home' },
  { href: '/stories', icon: BookOpen, label: 'Stories' },
  { href: '/write', icon: PenTool, label: 'Write' },
  { href: '/profile', icon: User, label: 'Profile' },
];

const menuItems = [
  { href: '/search', icon: Search, label: 'Search' },
  { href: '/bookmarks', icon: Bookmark, label: 'Bookmarks' },
  { href: '/settings', icon: Settings, label: 'Settings' },
];

export function MobileNavigation({ className = '' }: MobileNavigationProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const pathname = usePathname();
  const { isMobile } = useMobileDetection();

  // Close menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }

    return () => {
      document.body.style.overflow = '';
    };
  }, [isMenuOpen]);

  if (!isMobile) {
    return null;
  }

  return (
    <>
      {/* Bottom Navigation Bar */}
      <nav className={`fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-dark-800 border-t border-neutral-200 dark:border-dark-700 ${className}`}>
        <div className="flex items-center justify-around h-16 px-2 pb-safe-bottom">
          {navigationItems.map((item) => {
            const isActive = pathname === item.href;
            const Icon = item.icon;
            
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg transition-colors ${
                  isActive
                    ? 'text-primary-600 dark:text-primary-400'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100'
                }`}
              >
                <Icon size={20} className="mb-1" />
                <span className="text-xs font-medium">{item.label}</span>
              </Link>
            );
          })}
          
          {/* Menu Button */}
          <button
            onClick={() => setIsMenuOpen(true)}
            className="flex flex-col items-center justify-center flex-1 py-2 px-1 rounded-lg text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-neutral-100 transition-colors"
          >
            <Menu size={20} className="mb-1" />
            <span className="text-xs font-medium">Menu</span>
          </button>
        </div>
      </nav>

      {/* Slide-out Menu */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMenuOpen(false)}
              className="fixed inset-0 z-50 bg-black/50"
            />
            
            {/* Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 z-50 w-80 max-w-[85vw] bg-white dark:bg-dark-800 shadow-xl"
            >
              <div className="flex flex-col h-full">
                {/* Header */}
                <div className="flex items-center justify-between p-4 border-b border-neutral-200 dark:border-dark-700">
                  <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
                    Menu
                  </h2>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className="p-2 rounded-lg text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>

                {/* Menu Items */}
                <div className="flex-1 py-4">
                  {menuItems.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={`flex items-center px-4 py-3 text-sm font-medium transition-colors ${
                          isActive
                            ? 'text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20'
                            : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-dark-700'
                        }`}
                      >
                        <Icon size={20} className="mr-3" />
                        {item.label}
                      </Link>
                    );
                  })}
                </div>

                {/* Footer */}
                <div className="p-4 border-t border-neutral-200 dark:border-dark-700">
                  <div className="text-xs text-neutral-500 dark:text-neutral-400 text-center">
                    Legato v1.0.0
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}