import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface ReadingSettings {
  fontSize: number;
  fontFamily: string;
  theme: 'light' | 'dark' | 'sepia';
  lineHeight: number;
  margin: number;
  autoScroll: boolean;
  audioEnabled: boolean;
  audioSpeed: number;
}

interface ReadingProgress {
  storyId: string;
  chapterId: string;
  progress: number; // 0-100
  position: number; // Character position
  timestamp: number;
}

interface BookmarkItem {
  id: string;
  storyId: string;
  chapterId: string;
  position: number;
  note?: string;
  timestamp: number;
}

interface ReadingState {
  settings: ReadingSettings;
  progress: Record<string, ReadingProgress>;
  bookmarks: BookmarkItem[];
  currentStory: string | null;
  currentChapter: string | null;
  isReading: boolean;
  offlineStories: string[];
}

interface ReadingActions {
  updateSettings: (settings: Partial<ReadingSettings>) => void;
  updateProgress: (storyId: string, chapterId: string, progress: number, position: number) => void;
  getProgress: (storyId: string) => ReadingProgress | null;
  addBookmark: (bookmark: Omit<BookmarkItem, 'id' | 'timestamp'>) => void;
  removeBookmark: (id: string) => void;
  getBookmarks: (storyId: string) => BookmarkItem[];
  setCurrentReading: (storyId: string | null, chapterId: string | null) => void;
  setIsReading: (reading: boolean) => void;
  addOfflineStory: (storyId: string) => void;
  removeOfflineStory: (storyId: string) => void;
  isStoryOffline: (storyId: string) => boolean;
}

type ReadingStore = ReadingState & ReadingActions;

const defaultSettings: ReadingSettings = {
  fontSize: 16,
  fontFamily: 'Inter',
  theme: 'light',
  lineHeight: 1.6,
  margin: 20,
  autoScroll: false,
  audioEnabled: false,
  audioSpeed: 1.0,
};

export const useReadingStore = create<ReadingStore>()(
  persist(
    (set, get) => ({
      // State
      settings: defaultSettings,
      progress: {},
      bookmarks: [],
      currentStory: null,
      currentChapter: null,
      isReading: false,
      offlineStories: [],

      // Actions
      updateSettings: (newSettings) => set((state) => ({
        settings: { ...state.settings, ...newSettings },
      })),

      updateProgress: (storyId, chapterId, progress, position) => set((state) => ({
        progress: {
          ...state.progress,
          [storyId]: {
            storyId,
            chapterId,
            progress,
            position,
            timestamp: Date.now(),
          },
        },
      })),

      getProgress: (storyId) => {
        const state = get();
        return state.progress[storyId] || null;
      },

      addBookmark: (bookmark) => set((state) => ({
        bookmarks: [
          ...state.bookmarks,
          {
            ...bookmark,
            id: `bookmark-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            timestamp: Date.now(),
          },
        ],
      })),

      removeBookmark: (id) => set((state) => ({
        bookmarks: state.bookmarks.filter(b => b.id !== id),
      })),

      getBookmarks: (storyId) => {
        const state = get();
        return state.bookmarks.filter(b => b.storyId === storyId);
      },

      setCurrentReading: (storyId, chapterId) => set({
        currentStory: storyId,
        currentChapter: chapterId,
      }),

      setIsReading: (reading) => set({ isReading: reading }),

      addOfflineStory: (storyId) => set((state) => ({
        offlineStories: state.offlineStories.includes(storyId) 
          ? state.offlineStories 
          : [...state.offlineStories, storyId],
      })),

      removeOfflineStory: (storyId) => set((state) => ({
        offlineStories: state.offlineStories.filter(id => id !== storyId),
      })),

      isStoryOffline: (storyId) => {
        const state = get();
        return state.offlineStories.includes(storyId);
      },
    }),
    {
      name: 'legato-reading',
      storage: createJSONStorage(() => localStorage),
    }
  )
);

// Selectors
export const useReadingSettings = () => useReadingStore((state) => ({
  settings: state.settings,
  updateSettings: state.updateSettings,
}));

export const useReadingProgress = () => useReadingStore((state) => ({
  progress: state.progress,
  updateProgress: state.updateProgress,
  getProgress: state.getProgress,
}));

export const useBookmarks = () => useReadingStore((state) => ({
  bookmarks: state.bookmarks,
  addBookmark: state.addBookmark,
  removeBookmark: state.removeBookmark,
  getBookmarks: state.getBookmarks,
}));

export const useCurrentReading = () => useReadingStore((state) => ({
  currentStory: state.currentStory,
  currentChapter: state.currentChapter,
  isReading: state.isReading,
  setCurrentReading: state.setCurrentReading,
  setIsReading: state.setIsReading,
}));

export const useOfflineStories = () => useReadingStore((state) => ({
  offlineStories: state.offlineStories,
  addOfflineStory: state.addOfflineStory,
  removeOfflineStory: state.removeOfflineStory,
  isStoryOffline: state.isStoryOffline,
}));