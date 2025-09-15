import { renderHook, act } from '@testing-library/react';
import { useReadingProgress } from '../useReadingProgress';

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

describe('useReadingProgress', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('initializes with progress 0 when no saved progress exists', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useReadingProgress('chapter-1'));
    
    expect(result.current.progress).toBe(0);
  });

  it('loads saved progress from localStorage', () => {
    localStorageMock.getItem.mockReturnValue('75');
    
    const { result } = renderHook(() => useReadingProgress('chapter-1'));
    
    expect(result.current.progress).toBe(75);
    expect(localStorageMock.getItem).toHaveBeenCalledWith('reading_progress_chapter-1');
  });

  it('updates progress and saves to localStorage', () => {
    localStorageMock.getItem.mockReturnValue(null);
    
    const { result } = renderHook(() => useReadingProgress('chapter-1'));
    
    act(() => {
      result.current.updateProgress(50);
    });
    
    expect(result.current.progress).toBe(50);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('reading_progress_chapter-1', '50');
  });

  it('saves bookmark correctly', () => {
    localStorageMock.getItem.mockReturnValue('[]');
    
    const { result } = renderHook(() => useReadingProgress('chapter-1'));
    
    const bookmark = {
      chapterId: 'chapter-1',
      progress: 50,
      scrollPosition: 1000,
      timestamp: Date.now(),
    };
    
    act(() => {
      result.current.saveBookmark(bookmark);
    });
    
    expect(localStorageMock.setItem).toHaveBeenCalledWith(
      'bookmarks',
      JSON.stringify([bookmark])
    );
  });

  it('loads existing bookmark', () => {
    const existingBookmark = {
      chapterId: 'chapter-1',
      progress: 75,
      scrollPosition: 1500,
      timestamp: Date.now(),
    };
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify([existingBookmark]));
    
    const { result } = renderHook(() => useReadingProgress('chapter-1'));
    
    const loadedBookmark = result.current.loadBookmark();
    
    expect(loadedBookmark).toEqual(existingBookmark);
  });

  it('completes chapter and updates stats', () => {
    const mockStats = {
      totalReadingTime: 0,
      chaptersRead: 0,
      wordsRead: 0,
      averageReadingSpeed: 200,
    };
    
    localStorageMock.getItem.mockImplementation((key) => {
      if (key === 'reading_stats') return JSON.stringify(mockStats);
      if (key === 'reading_session_chapter-1') return Date.now().toString();
      return null;
    });
    
    const { result } = renderHook(() => useReadingProgress('chapter-1'));
    
    act(() => {
      result.current.completeChapter(1000);
    });
    
    expect(result.current.progress).toBe(100);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('reading_progress_chapter-1', '100');
  });

  it('maintains bookmark limit of 50', () => {
    // Create 51 bookmarks
    const existingBookmarks = Array.from({ length: 51 }, (_, i) => ({
      chapterId: `chapter-${i}`,
      progress: 50,
      scrollPosition: 1000,
      timestamp: Date.now() - i * 1000, // Different timestamps
    }));
    
    localStorageMock.getItem.mockReturnValue(JSON.stringify(existingBookmarks));
    
    const { result } = renderHook(() => useReadingProgress('new-chapter'));
    
    const newBookmark = {
      chapterId: 'new-chapter',
      progress: 25,
      scrollPosition: 500,
      timestamp: Date.now(),
    };
    
    act(() => {
      result.current.saveBookmark(newBookmark);
    });
    
    // Should save only 50 bookmarks (newest ones)
    const savedCall = localStorageMock.setItem.mock.calls.find(
      call => call[0] === 'bookmarks'
    );
    
    expect(savedCall).toBeDefined();
    const savedBookmarks = JSON.parse(savedCall[1]);
    expect(savedBookmarks).toHaveLength(50);
  });
});