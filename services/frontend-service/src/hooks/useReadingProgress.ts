'use client';

import { useState, useCallback, useEffect } from 'react';

interface Bookmark {
  chapterId: string;
  progress: number;
  scrollPosition: number;
  timestamp: number;
}

interface ReadingStats {
  totalReadingTime: number;
  chaptersRead: number;
  wordsRead: number;
  averageReadingSpeed: number;
}

export function useReadingProgress(chapterId: string) {
  const [progress, setProgress] = useState(0);
  const [readingStats, setReadingStats] = useState<ReadingStats>({
    totalReadingTime: 0,
    chaptersRead: 0,
    wordsRead: 0,
    averageReadingSpeed: 200
  });

  // Load progress from localStorage on mount
  useEffect(() => {
    const savedProgress = localStorage.getItem(`reading_progress_${chapterId}`);
    if (savedProgress) {
      setProgress(parseInt(savedProgress, 10));
    }

    const savedStats = localStorage.getItem('reading_stats');
    if (savedStats) {
      setReadingStats(JSON.parse(savedStats));
    }
  }, [chapterId]);

  const updateProgress = useCallback((newProgress: number) => {
    setProgress(newProgress);
    localStorage.setItem(`reading_progress_${chapterId}`, newProgress.toString());
    
    // Update reading stats
    const now = Date.now();
    const sessionKey = `reading_session_${chapterId}`;
    const sessionStart = localStorage.getItem(sessionKey);
    
    if (!sessionStart) {
      localStorage.setItem(sessionKey, now.toString());
    }
  }, [chapterId]);

  const saveBookmark = useCallback((bookmark: Bookmark) => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    const existingIndex = bookmarks.findIndex((b: Bookmark) => b.chapterId === bookmark.chapterId);
    
    if (existingIndex >= 0) {
      bookmarks[existingIndex] = bookmark;
    } else {
      bookmarks.push(bookmark);
    }
    
    // Keep only the last 50 bookmarks
    if (bookmarks.length > 50) {
      bookmarks.sort((a: Bookmark, b: Bookmark) => b.timestamp - a.timestamp);
      bookmarks.splice(50);
    }
    
    localStorage.setItem('bookmarks', JSON.stringify(bookmarks));
  }, []);

  const loadBookmark = useCallback(() => {
    const bookmarks = JSON.parse(localStorage.getItem('bookmarks') || '[]');
    return bookmarks.find((b: Bookmark) => b.chapterId === chapterId);
  }, [chapterId]);

  const getBookmarks = useCallback(() => {
    return JSON.parse(localStorage.getItem('bookmarks') || '[]');
  }, []);

  const completeChapter = useCallback((wordCount: number) => {
    const sessionKey = `reading_session_${chapterId}`;
    const sessionStart = localStorage.getItem(sessionKey);
    
    if (sessionStart) {
      const readingTime = Date.now() - parseInt(sessionStart, 10);
      const newStats = {
        ...readingStats,
        totalReadingTime: readingStats.totalReadingTime + readingTime,
        chaptersRead: readingStats.chaptersRead + 1,
        wordsRead: readingStats.wordsRead + wordCount,
        averageReadingSpeed: Math.round((readingStats.wordsRead + wordCount) / ((readingStats.totalReadingTime + readingTime) / 60000))
      };
      
      setReadingStats(newStats);
      localStorage.setItem('reading_stats', JSON.stringify(newStats));
      localStorage.removeItem(sessionKey);
    }
    
    setProgress(100);
    localStorage.setItem(`reading_progress_${chapterId}`, '100');
  }, [chapterId, readingStats]);

  return {
    progress,
    readingStats,
    updateProgress,
    saveBookmark,
    loadBookmark,
    getBookmarks,
    completeChapter
  };
}