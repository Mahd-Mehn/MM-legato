'use client';

import { useState, useEffect, useCallback } from 'react';

interface Chapter {
  id: string;
  title: string;
  content: string;
  storyId: string;
  chapterNumber: number;
  wordCount: number;
}

interface CachedContent {
  chapter: Chapter;
  cachedAt: number;
  size: number;
}

export function useOfflineContent() {
  const [isOffline, setIsOffline] = useState(false);
  const [cachedContent, setCachedContent] = useState<Map<string, CachedContent>>(new Map());
  const [storageUsed, setStorageUsed] = useState(0);
  const maxStorageSize = 50 * 1024 * 1024; // 50MB limit

  // Monitor online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    setIsOffline(!navigator.onLine);
    
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Load cached content from IndexedDB on mount
  useEffect(() => {
    loadCachedContent();
  }, []);

  const loadCachedContent = async () => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['chapters'], 'readonly');
      const store = transaction.objectStore('chapters');
      const request = store.getAll();

      request.onsuccess = () => {
        const cached = new Map<string, CachedContent>();
        let totalSize = 0;

        request.result.forEach((item: CachedContent) => {
          cached.set(item.chapter.id, item);
          totalSize += item.size;
        });

        setCachedContent(cached);
        setStorageUsed(totalSize);
      };
    } catch (error) {
      console.error('Failed to load cached content:', error);
    }
  };

  const openDB = (): Promise<IDBDatabase> => {
    return new Promise((resolve, reject) => {
      const request = indexedDB.open('LegatoOfflineContent', 1);

      request.onerror = () => reject(request.error);
      request.onsuccess = () => resolve(request.result);

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        if (!db.objectStoreNames.contains('chapters')) {
          const store = db.createObjectStore('chapters', { keyPath: 'chapter.id' });
          store.createIndex('storyId', 'chapter.storyId', { unique: false });
          store.createIndex('cachedAt', 'cachedAt', { unique: false });
        }
      };
    });
  };

  const saveForOffline = useCallback(async (chapter: Chapter) => {
    try {
      const contentSize = new Blob([JSON.stringify(chapter)]).size;
      
      // Check if we have enough space
      if (storageUsed + contentSize > maxStorageSize) {
        await cleanupOldContent(contentSize);
      }

      const db = await openDB();
      const transaction = db.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');

      const cachedItem: CachedContent = {
        chapter,
        cachedAt: Date.now(),
        size: contentSize
      };

      await new Promise<void>((resolve, reject) => {
        const request = store.put(cachedItem);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      setCachedContent(prev => new Map(prev).set(chapter.id, cachedItem));
      setStorageUsed(prev => prev + contentSize);

    } catch (error) {
      console.error('Failed to save content for offline:', error);
    }
  }, [storageUsed, maxStorageSize]);

  const cleanupOldContent = async (requiredSpace: number) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');
      const index = store.index('cachedAt');

      // Get all items sorted by cache date (oldest first)
      const request = index.getAll();
      
      await new Promise<void>((resolve, reject) => {
        request.onsuccess = async () => {
          const items = request.result.sort((a, b) => a.cachedAt - b.cachedAt);
          let freedSpace = 0;

          for (const item of items) {
            if (freedSpace >= requiredSpace) break;

            await new Promise<void>((deleteResolve, deleteReject) => {
              const deleteRequest = store.delete(item.chapter.id);
              deleteRequest.onsuccess = () => {
                freedSpace += item.size;
                setCachedContent(prev => {
                  const newMap = new Map(prev);
                  newMap.delete(item.chapter.id);
                  return newMap;
                });
                setStorageUsed(prev => prev - item.size);
                deleteResolve();
              };
              deleteRequest.onerror = () => deleteReject(deleteRequest.error);
            });
          }
          resolve();
        };
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error('Failed to cleanup old content:', error);
    }
  };

  const getCachedChapter = useCallback((chapterId: string): Chapter | null => {
    const cached = cachedContent.get(chapterId);
    return cached ? cached.chapter : null;
  }, [cachedContent]);

  const isContentCached = useCallback((chapterId: string): boolean => {
    return cachedContent.has(chapterId);
  }, [cachedContent]);

  const removeCachedContent = useCallback(async (chapterId: string) => {
    try {
      const db = await openDB();
      const transaction = db.transaction(['chapters'], 'readwrite');
      const store = transaction.objectStore('chapters');

      await new Promise<void>((resolve, reject) => {
        const request = store.delete(chapterId);
        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });

      const cached = cachedContent.get(chapterId);
      if (cached) {
        setCachedContent(prev => {
          const newMap = new Map(prev);
          newMap.delete(chapterId);
          return newMap;
        });
        setStorageUsed(prev => prev - cached.size);
      }
    } catch (error) {
      console.error('Failed to remove cached content:', error);
    }
  }, [cachedContent]);

  const getCachedContentByStory = useCallback((storyId: string): Chapter[] => {
    return Array.from(cachedContent.values())
      .filter(cached => cached.chapter.storyId === storyId)
      .map(cached => cached.chapter)
      .sort((a, b) => a.chapterNumber - b.chapterNumber);
  }, [cachedContent]);

  const getStorageInfo = useCallback(() => {
    return {
      used: storageUsed,
      max: maxStorageSize,
      available: maxStorageSize - storageUsed,
      usagePercentage: Math.round((storageUsed / maxStorageSize) * 100),
      itemCount: cachedContent.size
    };
  }, [storageUsed, cachedContent.size]);

  return {
    isOffline,
    saveForOffline,
    getCachedChapter,
    isContentCached,
    removeCachedContent,
    getCachedContentByStory,
    getStorageInfo,
    cachedContent: Array.from(cachedContent.values())
  };
}