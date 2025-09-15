'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Menu,
  X,
  PenTool,
  Search,
  User,
  Heart,
  Globe,
  Sparkles,
  LogOut,
  Settings,
  Bell
} from 'lucide-react';
import ThemeToggle from './ThemeToggle';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth } from '@/contexts/AuthContext';

interface HeaderProps {
  className?: string;
}

export default function Header({ className = '' }: HeaderProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const { resolvedTheme } = useTheme();
  const { user, isAuthenticated, logout } = useAuth();

  // Handle scroll effect
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMenuOpen(false);
  }, [pathname]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMenuOpen]);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isUserMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setIsUserMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isUserMenuOpen]);

  const handleLogout = async () => {
    try {
      await logout();
      router.push('/');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const navigationItems = [
    { href: '/stories', label: 'Discover', icon: Search },
    { href: '/write', label: 'Write', icon: PenTool },
    { href: '/community', label: 'Community', icon: Heart },
    // Removed /about since it doesn't exist yet
  ];

  return (
    <>
      <motion.header
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${isScrolled
          ? resolvedTheme === 'dark'
            ? 'bg-gray-900/95 backdrop-blur-md shadow-lg border-b border-gray-700'
            : 'backdrop-blur-md shadow-lg border-b border-reading-border'
          : 'bg-transparent'
          } ${className}`}
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <Link
              href="/"
              className="flex items-center space-x-3 group"
              aria-label="Legato Home"
            >
              <motion.div
                className="relative"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-10 h-10 md:w-12 md:h-12 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-shadow duration-300">
                  <Sparkles className="w-5 h-5 md:w-6 md:h-6 text-white" />
                </div>
                <motion.div
                  className="absolute -top-1 -right-1 w-3 h-3 bg-accent-rose rounded-full"
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{ duration: 2, repeat: Infinity }}
                />
              </motion.div>
              <div className="hidden sm:block">
                <h1 className={`text-2xl md:text-3xl font-bold font-display transition-colors duration-300 ${resolvedTheme === 'dark'
                  ? 'text-white group-hover:text-primary-400'
                  : 'text-reading-text group-hover:text-primary-600'
                  }`}>
                  Legato
                </h1>
                <p className={`text-xs -mt-1 ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-reading-muted'
                  }`}>
                  Where Stories Become IP
                </p>
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex items-center space-x-8">
              {navigationItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;

                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl font-medium transition-all duration-300 group ${isActive
                      ? resolvedTheme === 'dark'
                        ? 'text-primary-400 bg-primary-900/50'
                        : 'text-primary-600 bg-primary-50'
                      : resolvedTheme === 'dark'
                        ? 'text-gray-300 hover:text-primary-400 hover:bg-primary-900/30'
                        : 'text-reading-muted hover:text-primary-600 hover:bg-primary-50/50'
                      }`}
                  >
                    <Icon className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" />
                    <span>{item.label}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Theme Toggle & Auth Section */}
            <div className="hidden md:flex items-center space-x-3">
              <ThemeToggle className="mr-1" />
              <div className="w-px h-6 bg-neutral-300 dark:bg-neutral-600"></div>
              
              {isAuthenticated && user ? (
                <div className="flex items-center space-x-3">
                  {/* Notifications */}
                  <button
                    className={`p-2 rounded-lg transition-all duration-300 ${resolvedTheme === 'dark'
                      ? 'text-gray-300 hover:text-primary-400 hover:bg-gray-800/50'
                      : 'text-reading-muted hover:text-primary-600 hover:bg-primary-50/50'
                      }`}
                  >
                    <Bell className="w-5 h-5" />
                  </button>

                  {/* User Menu */}
                  <div className="relative user-menu">
                    <button
                      onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                      className={`flex items-center space-x-2 p-2 rounded-lg transition-all duration-300 ${resolvedTheme === 'dark'
                        ? 'text-gray-300 hover:text-primary-400 hover:bg-gray-800/50'
                        : 'text-reading-text hover:text-primary-600 hover:bg-primary-50/50'
                        }`}
                    >
                      {user.avatar ? (
                        <img
                          src={user.avatar}
                          alt={user.name}
                          className="w-8 h-8 rounded-full object-cover"
                        />
                      ) : (
                        <div className="w-8 h-8 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm font-medium">
                            {user.name.charAt(0).toUpperCase()}
                          </span>
                        </div>
                      )}
                      <span className="font-medium">{user.name}</span>
                    </button>

                    {/* User Dropdown Menu */}
                    <AnimatePresence>
                      {isUserMenuOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -10 }}
                          transition={{ duration: 0.2 }}
                          className={`absolute right-0 mt-2 w-64 rounded-xl shadow-lg border z-50 ${resolvedTheme === 'dark'
                            ? 'bg-gray-800 border-gray-700'
                            : 'bg-white border-gray-200'
                            }`}
                        >
                          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
                            <div className="flex items-center space-x-3">
                              {user.avatar ? (
                                <img
                                  src={user.avatar}
                                  alt={user.name}
                                  className="w-10 h-10 rounded-full object-cover"
                                />
                              ) : (
                                <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                                  <span className="text-white font-medium">
                                    {user.name.charAt(0).toUpperCase()}
                                  </span>
                                </div>
                              )}
                              <div>
                                <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                                  {user.name}
                                </p>
                                <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                                  @{user.username}
                                </p>
                                <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium mt-1 ${
                                  user.verified 
                                    ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' 
                                    : 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200'
                                }`}>
                                  {user.verified ? 'Verified' : 'Pending'}
                                </span>
                              </div>
                            </div>
                          </div>
                          
                          <div className="py-2">
                            <Link
                              href="/dashboard"
                              onClick={() => setIsUserMenuOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${resolvedTheme === 'dark'
                                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                              <User className="w-4 h-4" />
                              <span>Dashboard</span>
                            </Link>
                            <Link
                              href="/profile/settings"
                              onClick={() => setIsUserMenuOpen(false)}
                              className={`flex items-center space-x-3 px-4 py-2 text-sm transition-colors ${resolvedTheme === 'dark'
                                ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                                : 'text-gray-700 hover:text-gray-900 hover:bg-gray-50'
                                }`}
                            >
                              <Settings className="w-4 h-4" />
                              <span>Settings</span>
                            </Link>
                          </div>
                          
                          <div className="border-t border-gray-200 dark:border-gray-700 py-2">
                            <button
                              onClick={() => {
                                setIsUserMenuOpen(false);
                                handleLogout();
                              }}
                              className={`flex items-center space-x-3 px-4 py-2 text-sm w-full text-left transition-colors ${resolvedTheme === 'dark'
                                ? 'text-red-400 hover:text-red-300 hover:bg-gray-700'
                                : 'text-red-600 hover:text-red-700 hover:bg-gray-50'
                                }`}
                            >
                              <LogOut className="w-4 h-4" />
                              <span>Sign Out</span>
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className={`font-medium px-3 py-2 rounded-lg transition-all duration-300 ${resolvedTheme === 'dark'
                      ? 'text-gray-300 hover:text-primary-400 hover:bg-gray-800/50'
                      : 'text-reading-text hover:text-primary-600 hover:bg-primary-50/50'
                      }`}
                  >
                    Sign In
                  </Link>
                  <Link
                    href="/auth/register"
                    className="bg-gradient-to-r from-primary-500 to-primary-600 text-white px-6 py-2.5 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md hover:shadow-lg transform hover:-translate-y-0.5"
                  >
                    Get Started
                  </Link>
                </>
              )}
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className={`lg:hidden p-2 rounded-xl transition-all duration-300 ${resolvedTheme === 'dark'
                ? 'text-gray-300 hover:text-white hover:bg-gray-800'
                : 'text-reading-text hover:text-primary-600 hover:bg-primary-50'
                }`}
              aria-label="Toggle menu"
            >
              <AnimatePresence mode="wait">
                {isMenuOpen ? (
                  <motion.div
                    key="close"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <X className="w-6 h-6" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="menu"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Menu className="w-6 h-6" />
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          </div>
        </div>
      </motion.header>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.3 }}
              onClick={() => setIsMenuOpen(false)}
            />

            {/* Mobile Menu */}
            <motion.div
              className={`fixed top-0 right-0 h-full w-80 max-w-[85vw] shadow-2xl z-50 lg:hidden ${resolvedTheme === 'dark' ? 'bg-gray-900' : 'bg-white'
                }`}
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            >
              <div className="flex flex-col h-full">
                {/* Mobile Menu Header */}
                <div className={`flex items-center justify-between p-6 border-b ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-reading-border'
                  }`}>
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-2xl flex items-center justify-center">
                      <Sparkles className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h2 className={`text-xl font-bold font-display ${resolvedTheme === 'dark' ? 'text-white' : 'text-reading-text'
                        }`}>
                        Legato
                      </h2>
                      <p className={`text-xs ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-reading-muted'
                        }`}>
                        Where Stories Become IP
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => setIsMenuOpen(false)}
                    className={`p-2 rounded-xl transition-all duration-300 ${resolvedTheme === 'dark'
                      ? 'text-gray-400 hover:text-white hover:bg-gray-800'
                      : 'text-reading-muted hover:text-reading-text hover:bg-neutral-100'
                      }`}
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>

                {/* Mobile Navigation */}
                <nav className="flex-1 px-6 py-8">
                  <div className="space-y-4">
                    {navigationItems.map((item, index) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;

                      return (
                        <motion.div
                          key={item.href}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Link
                            href={item.href}
                            className={`flex items-center space-x-4 p-4 rounded-2xl font-medium transition-all duration-300 ${isActive
                              ? resolvedTheme === 'dark'
                                ? 'text-primary-400 bg-primary-900/50 shadow-md'
                                : 'text-primary-600 bg-primary-50 shadow-md'
                              : resolvedTheme === 'dark'
                                ? 'text-gray-300 hover:text-primary-400 hover:bg-primary-900/30'
                                : 'text-reading-text hover:text-primary-600 hover:bg-primary-50/50'
                              }`}
                          >
                            <Icon className="w-5 h-5" />
                            <span className="text-lg">{item.label}</span>
                          </Link>
                        </motion.div>
                      );
                    })}
                  </div>
                </nav>

                {/* Mobile Theme Toggle & Auth Section */}
                <div className={`p-6 border-t space-y-4 ${resolvedTheme === 'dark' ? 'border-gray-700' : 'border-reading-border'
                  }`}>
                  <div className="flex items-center justify-between">
                    <span className={`text-sm font-medium ${resolvedTheme === 'dark' ? 'text-gray-300' : 'text-reading-text'
                      }`}>
                      Theme
                    </span>
                    <ThemeToggle showLabel />
                  </div>
                  
                  {isAuthenticated && user ? (
                    <>
                      {/* User Info */}
                      <div className={`p-4 rounded-xl ${resolvedTheme === 'dark' ? 'bg-gray-800' : 'bg-gray-50'}`}>
                        <div className="flex items-center space-x-3">
                          {user.avatar ? (
                            <img
                              src={user.avatar}
                              alt={user.name}
                              className="w-10 h-10 rounded-full object-cover"
                            />
                          ) : (
                            <div className="w-10 h-10 bg-gradient-to-br from-primary-400 to-primary-600 rounded-full flex items-center justify-center">
                              <span className="text-white font-medium">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                          <div>
                            <p className={`font-medium ${resolvedTheme === 'dark' ? 'text-white' : 'text-gray-900'}`}>
                              {user.name}
                            </p>
                            <p className={`text-sm ${resolvedTheme === 'dark' ? 'text-gray-400' : 'text-gray-600'}`}>
                              @{user.username}
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <Link
                        href="/dashboard"
                        className={`block w-full text-center py-3 px-6 rounded-xl font-medium transition-all duration-300 ${resolvedTheme === 'dark'
                          ? 'text-gray-300 hover:text-primary-400 hover:bg-primary-900/30'
                          : 'text-reading-text hover:text-primary-600 hover:bg-primary-50'
                          }`}
                      >
                        Dashboard
                      </Link>
                      
                      <button
                        onClick={handleLogout}
                        className={`block w-full text-center py-3 px-6 rounded-xl font-medium transition-all duration-300 ${resolvedTheme === 'dark'
                          ? 'text-red-400 hover:text-red-300 hover:bg-red-900/30'
                          : 'text-red-600 hover:text-red-700 hover:bg-red-50'
                          }`}
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <Link
                        href="/auth/login"
                        className={`block w-full text-center py-3 px-6 rounded-xl font-medium transition-all duration-300 ${resolvedTheme === 'dark'
                          ? 'text-gray-300 hover:text-primary-400 hover:bg-primary-900/30'
                          : 'text-reading-text hover:text-primary-600 hover:bg-primary-50'
                          }`}
                      >
                        Sign In
                      </Link>
                      <Link
                        href="/auth/register"
                        className="block w-full text-center bg-gradient-to-r from-primary-500 to-primary-600 text-white py-3 px-6 rounded-xl font-semibold hover:from-primary-600 hover:to-primary-700 transition-all duration-300 shadow-md"
                      >
                        Get Started
                      </Link>
                    </>
                  )}
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}