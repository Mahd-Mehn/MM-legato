'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, 
  Bookmark, 
  Share2, 
  MessageCircle, 
  ChevronLeft, 
  ChevronRight,
  Sun,
  Moon,
  Type,
  Minus,
  Plus
} from 'lucide-react';
import { useTouchGestures } from '@/hooks/useTouchGestures';
import { useReadingProgress } from '@/hooks/useReadingProgress';
import { TouchOptimizedButton } from './TouchOptimizedButton';

interface MobileReadingInterfaceProps {
  content: string;
  title: string;
  author: string;
  chapterNumber: number;
  totalChapters: number;
  onPreviousChapter?: () => void;
  onNextChapter?: () => void;
  onBookmark?: () => void;
  onShare?: () => void;
  onComment?: () => void;
  isBookmarked?: boolean;
}

interface ReadingSettings {
  fontSize: number;
  fontFamily: 'serif' | 'sans';
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  margin: number;
}

export function MobileReadingInterface({
  content,
  title,
  author,
  chapterNumber,
  totalChapters,
  onPreviousChapter,
  onNextChapter,
  onBookmark,
  onShare,
  onComment,
  isBookmarked = false,
}: MobileReadingInterfaceProps) {
  const [showControls, setShowControls] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ReadingSettings>({
    fontSize: 18,
    fontFamily: 'serif',
    theme: 'light',
    lineHeight: 1.7,
    margin: 20,
  });

  const contentRef = useRef<HTMLDivElement>(null);
  const { progress, updateProgress } = useReadingProgress(`chapter-${chapterNumber}`);

  // Touch gestures for navigation
  const touchRef = useTouchGestures({
    onSwipeLeft: () => {
      if (onNextChapter && chapterNumber < totalChapters) {
        onNextChapter();
      }
    },
    onSwipeRight: () => {
      if (onPreviousChapter && chapterNumber > 1) {
        onPreviousChapter();
      }
    },
    onDoubleTap: () => {
      setShowControls(!showControls);
    },
  });

  // Auto-hide controls after 3 seconds
  useEffect(() => {
    if (showControls) {
      const timer = setTimeout(() => {
        setShowControls(false);
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [showControls]);

  // Update reading progress on scroll
  useEffect(() => {
    const handleScroll = () => {
      if (contentRef.current) {
        const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
        const progressPercent = (scrollTop / (scrollHeight - clientHeight)) * 100;
        updateProgress(Math.min(100, Math.max(0, progressPercent)));
      }
    };

    const element = contentRef.current;
    if (element) {
      element.addEventListener('scroll', handleScroll);
      return () => element.removeEventListener('scroll', handleScroll);
    }
  }, [updateProgress]);

  const themeClasses = {
    light: 'bg-white text-neutral-900',
    dark: 'bg-neutral-900 text-neutral-100',
    sepia: 'bg-amber-50 text-amber-900',
  };

  const fontFamilyClasses = {
    serif: 'font-reading',
    sans: 'font-sans',
  };

  return (
    <div 
      ref={touchRef as React.RefObject<HTMLDivElement>}
      className={`relative h-screen-mobile overflow-hidden ${themeClasses[settings.theme]}`}
    >
      {/* Progress Bar */}
      <div className="absolute top-0 left-0 right-0 h-1 bg-neutral-200 dark:bg-neutral-700 z-50">
        <motion.div
          className="h-full bg-primary-600"
          initial={{ width: 0 }}
          animate={{ width: `${progress}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>

      {/* Reading Content */}
      <div
        ref={contentRef}
        className="h-full overflow-y-auto scroll-smooth-mobile px-4 py-8"
        style={{
          fontSize: `${settings.fontSize}px`,
          lineHeight: settings.lineHeight,
          paddingLeft: `${settings.margin}px`,
          paddingRight: `${settings.margin}px`,
        }}
        onClick={() => setShowControls(!showControls)}
      >
        <div className={`max-w-none ${fontFamilyClasses[settings.fontFamily]}`}>
          {/* Chapter Header */}
          <div className="mb-8 text-center">
            <h1 className="text-2xl font-bold mb-2">{title}</h1>
            <p className="text-neutral-600 dark:text-neutral-400 mb-1">by {author}</p>
            <p className="text-sm text-neutral-500 dark:text-neutral-500">
              Chapter {chapterNumber} of {totalChapters}
            </p>
          </div>

          {/* Content */}
          <div 
            className="reading-content"
            dangerouslySetInnerHTML={{ __html: content }}
          />

          {/* Chapter Navigation */}
          <div className="flex justify-between items-center mt-12 pt-8 border-t border-neutral-200 dark:border-neutral-700">
            <TouchOptimizedButton
              variant="outline"
              size="md"
              onClick={onPreviousChapter}
              disabled={chapterNumber <= 1}
              className="flex items-center space-x-2"
            >
              <ChevronLeft size={20} />
              <span>Previous</span>
            </TouchOptimizedButton>

            <TouchOptimizedButton
              variant="outline"
              size="md"
              onClick={onNextChapter}
              disabled={chapterNumber >= totalChapters}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ChevronRight size={20} />
            </TouchOptimizedButton>
          </div>
        </div>
      </div>

      {/* Top Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: -100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -100, opacity: 0 }}
            className="absolute top-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-b border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center justify-between p-4 safe-area-inset-top">
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={() => window.history.back()}
              >
                <ChevronLeft size={20} />
              </TouchOptimizedButton>

              <div className="text-center">
                <h2 className="font-semibold text-sm truncate max-w-48">{title}</h2>
                <p className="text-xs text-neutral-600 dark:text-neutral-400">
                  {chapterNumber}/{totalChapters}
                </p>
              </div>

              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={() => setShowSettings(true)}
              >
                <Settings size={20} />
              </TouchOptimizedButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Bottom Controls */}
      <AnimatePresence>
        {showControls && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="absolute bottom-0 left-0 right-0 z-40 bg-white/90 dark:bg-neutral-900/90 backdrop-blur-sm border-t border-neutral-200 dark:border-neutral-700"
          >
            <div className="flex items-center justify-around p-4 safe-area-inset-bottom">
              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={onBookmark}
                className={isBookmarked ? 'text-primary-600' : ''}
              >
                <Bookmark size={20} fill={isBookmarked ? 'currentColor' : 'none'} />
              </TouchOptimizedButton>

              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={onShare}
              >
                <Share2 size={20} />
              </TouchOptimizedButton>

              <TouchOptimizedButton
                variant="ghost"
                size="sm"
                onClick={onComment}
              >
                <MessageCircle size={20} />
              </TouchOptimizedButton>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 z-50"
              onClick={() => setShowSettings(false)}
            />
            
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              className="absolute bottom-0 left-0 right-0 z-50 bg-white dark:bg-neutral-900 rounded-t-xl shadow-xl"
            >
              <div className="p-6 safe-area-inset-bottom">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Reading Settings</h3>
                  <TouchOptimizedButton
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowSettings(false)}
                  >
                    ×
                  </TouchOptimizedButton>
                </div>

                <div className="space-y-6">
                  {/* Theme */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Theme</label>
                    <div className="flex space-x-2">
                      {(['light', 'dark', 'sepia'] as const).map((theme) => (
                        <TouchOptimizedButton
                          key={theme}
                          variant={settings.theme === theme ? 'primary' : 'outline'}
                          size="sm"
                          onClick={() => setSettings(prev => ({ ...prev, theme }))}
                          className="flex items-center space-x-2"
                        >
                          {theme === 'light' && <Sun size={16} />}
                          {theme === 'dark' && <Moon size={16} />}
                          {theme === 'sepia' && <Type size={16} />}
                          <span className="capitalize">{theme}</span>
                        </TouchOptimizedButton>
                      ))}
                    </div>
                  </div>

                  {/* Font Size */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Font Size</label>
                    <div className="flex items-center space-x-4">
                      <TouchOptimizedButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings(prev => ({ 
                          ...prev, 
                          fontSize: Math.max(14, prev.fontSize - 2) 
                        }))}
                      >
                        <Minus size={16} />
                      </TouchOptimizedButton>
                      
                      <span className="text-sm font-medium min-w-[3rem] text-center">
                        {settings.fontSize}px
                      </span>
                      
                      <TouchOptimizedButton
                        variant="outline"
                        size="sm"
                        onClick={() => setSettings(prev => ({ 
                          ...prev, 
                          fontSize: Math.min(24, prev.fontSize + 2) 
                        }))}
                      >
                        <Plus size={16} />
                      </TouchOptimizedButton>
                    </div>
                  </div>

                  {/* Font Family */}
                  <div>
                    <label className="block text-sm font-medium mb-3">Font Family</label>
                    <div className="flex space-x-2">
                      <TouchOptimizedButton
                        variant={settings.fontFamily === 'serif' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, fontFamily: 'serif' }))}
                      >
                        Serif
                      </TouchOptimizedButton>
                      <TouchOptimizedButton
                        variant={settings.fontFamily === 'sans' ? 'primary' : 'outline'}
                        size="sm"
                        onClick={() => setSettings(prev => ({ ...prev, fontFamily: 'sans' }))}
                      >
                        Sans-serif
                      </TouchOptimizedButton>
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}