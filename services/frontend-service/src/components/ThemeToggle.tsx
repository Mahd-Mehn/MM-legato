'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sun, Moon, Monitor, ChevronDown } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = '', showLabel = false }: ThemeToggleProps) {
  const { theme, setTheme, resolvedTheme } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const themes = [
    { value: 'light' as const, label: 'Light', icon: Sun },
    { value: 'dark' as const, label: 'Dark', icon: Moon },
    { value: 'system' as const, label: 'System', icon: Monitor },
  ];

  const currentTheme = themes.find(t => t.value === theme) || themes[0];
  const CurrentIcon = currentTheme.icon;

  // Simple toggle for mobile/compact view
  const handleSimpleToggle = () => {
    if (theme === 'light') {
      setTheme('dark');
    } else if (theme === 'dark') {
      setTheme('system');
    } else {
      setTheme('light');
    }
  };

  return (
    <div className={`relative ${className}`}>
      {showLabel ? (
        // Full dropdown for mobile/labeled version
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center space-x-2 p-2 rounded-xl transition-all duration-300 ${
            resolvedTheme === 'dark'
              ? 'text-gray-300 hover:text-white hover:bg-gray-800'
              : 'text-reading-muted hover:text-primary-600 hover:bg-primary-50'
          }`}
          aria-label="Toggle theme"
        >
          <CurrentIcon className="w-5 h-5" />
          <span className="text-sm font-medium">{currentTheme.label}</span>
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      ) : (
        // Simple toggle button for desktop header
        <button
          onClick={handleSimpleToggle}
          className={`p-2.5 rounded-xl transition-all duration-300 border-2 ${
            resolvedTheme === 'dark'
              ? 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 hover:border-yellow-400/50'
              : 'text-primary-600 border-primary-200 bg-primary-50 hover:bg-primary-100 hover:border-primary-300'
          }`}
          aria-label={`Switch to ${theme === 'light' ? 'dark' : theme === 'dark' ? 'system' : 'light'} theme`}
          title={`Current: ${currentTheme.label} theme`}
        >
          <motion.div
            key={theme}
            initial={{ rotate: -180, opacity: 0 }}
            animate={{ rotate: 0, opacity: 1 }}
            transition={{ duration: 0.3 }}
          >
            <CurrentIcon className="w-5 h-5" />
          </motion.div>
        </button>
      )}

      {/* Only show dropdown for labeled version */}
      <AnimatePresence>
        {isOpen && showLabel && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />
            
            {/* Dropdown */}
            <motion.div
              className={`absolute right-0 top-full mt-2 w-40 rounded-2xl shadow-lg border z-20 ${
                resolvedTheme === 'dark'
                  ? 'bg-gray-800 border-gray-700'
                  : 'bg-white border-reading-border'
              }`}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
              <div className="p-2">
                {themes.map((themeOption) => {
                  const Icon = themeOption.icon;
                  const isSelected = theme === themeOption.value;
                  
                  return (
                    <button
                      key={themeOption.value}
                      onClick={() => {
                        setTheme(themeOption.value);
                        setIsOpen(false);
                      }}
                      className={`w-full flex items-center space-x-3 px-3 py-2.5 rounded-xl text-left transition-all duration-200 ${
                        isSelected
                          ? resolvedTheme === 'dark'
                            ? 'bg-primary-600 text-white'
                            : 'bg-primary-50 text-primary-600'
                          : resolvedTheme === 'dark'
                            ? 'text-gray-300 hover:text-white hover:bg-gray-700'
                            : 'text-reading-text hover:text-primary-600 hover:bg-primary-50/50'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{themeOption.label}</span>
                      {isSelected && (
                        <motion.div
                          className="ml-auto w-2 h-2 rounded-full bg-current"
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ duration: 0.2 }}
                        />
                      )}
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}