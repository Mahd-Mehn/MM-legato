'use client';

import { useState, useEffect } from 'react';
import { Bookmark, Clock, ArrowRight, Trash2 } from 'lucide-react';
import { useReadingProgress } from '@/hooks/useReadingProgress';

interface Bookmark {
  chapterId: string;
  progress: number;
  scrollPosition: number;
  timestamp: number;
  chapterTitle?: string;
  storyTitle?: string;
}

interface BookmarksListProps {
  onBookmarkSelect?: (bookmark: Bookmark) => void;
  className?: string;
}

export function BookmarksList({ onBookmarkSelect, className = '' }: BookmarksListProps) {
  const [bookmarks, setBookmarks] = useState<Bookmark[]>([]);
  const { getBookmarks } = useReadingProgress('');

  useEffect(() => {
    loadBookmarks();
  }, []);

  const loadBookmarks = () => {
    const savedBookmarks = getBookmarks();
    // Sort by timestamp (most recent first)
    const sortedBookmarks = savedBookmarks.sort((a: Bookmark, b: Bookmark) => b.timestamp - a.timestamp);
    setBookmarks(sortedBookmarks);
  };

  const removeBookmark = (chapterId: string) => {
    const updatedBookmarks = bookmarks.filter(b => b.chapterId !== chapterId);
    setBookmarks(updatedBookmarks);
    localStorage.setItem('bookmarks', JSON.stringify(updatedBookmarks));
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 1) {
      return 'Just now';
    } else if (diffInHours < 24) {
      return `${Math.floor(diffInHours)}h ago`;
    } else if (diffInHours < 168) { // 7 days
      return `${Math.floor(diffInHours / 24)}d ago`;
    } else {
      return date.toLocaleDateString();
    }
  };

  if (bookmarks.length === 0) {
    return (
      <div className={`text-center py-12 ${className}`}>
        <Bookmark className="w-12 h-12 mx-auto mb-4 text-gray-300" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No bookmarks yet</h3>
        <p className="text-gray-500">
          Bookmarks are automatically saved as you read. Tap the bookmark icon while reading to save your current position.
        </p>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${className}`}>
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-gray-900">Your Bookmarks</h2>
        <span className="text-sm text-gray-500">{bookmarks.length} saved</span>
      </div>

      <div className="space-y-3">
        {bookmarks.map((bookmark) => (
          <div
            key={bookmark.chapterId}
            className="bg-white rounded-lg border border-gray-200 p-4 hover:shadow-md transition-shadow"
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-2">
                  <Bookmark className="w-4 h-4 text-primary-600 flex-shrink-0" />
                  <h3 className="font-medium text-gray-900 truncate">
                    {bookmark.chapterTitle || `Chapter ${bookmark.chapterId}`}
                  </h3>
                </div>
                
                {bookmark.storyTitle && (
                  <p className="text-sm text-gray-600 mb-2 truncate">
                    {bookmark.storyTitle}
                  </p>
                )}

                <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <Clock className="w-3 h-3" />
                    <span>{formatTimestamp(bookmark.timestamp)}</span>
                  </div>
                  <div>
                    {bookmark.progress}% complete
                  </div>
                </div>

                {/* Progress bar */}
                <div className="mt-3 w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${bookmark.progress}%` }}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 ml-4">
                <button
                  onClick={() => onBookmarkSelect?.(bookmark)}
                  className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors"
                  title="Continue reading"
                >
                  <ArrowRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => removeBookmark(bookmark.chapterId)}
                  className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                  title="Remove bookmark"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}