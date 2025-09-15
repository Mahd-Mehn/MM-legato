'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Trash2, 
  Wifi, 
  WifiOff, 
  HardDrive, 
  BookOpen, 
  CheckCircle, 
  AlertCircle,
  X,
  Settings,
  Zap,
  Eye,
  EyeOff
} from 'lucide-react';
import { useOfflineContent } from '@/hooks/useOfflineContent';
import { useDataSaver } from '@/hooks/useDataSaver';

interface Story {
  id: string;
  title: string;
  author: { name: string };
  chapters: Array<{
    id: string;
    title: string;
    number: number;
    wordCount: number;
  }>;
  totalChapters: number;
}

interface OfflineManagerProps {
  isOpen: boolean;
  onClose: () => void;
  stories?: Story[];
}

export default function OfflineManager({ isOpen, onClose, stories = [] }: OfflineManagerProps) {
  const {
    isOffline,
    saveForOffline,
    getCachedChapter,
    isContentCached,
    removeCachedContent,
    getCachedContentByStory,
    getStorageInfo,
    cachedContent
  } = useOfflineContent();

  const { isDataSaverEnabled, compressionLevel } = useDataSaver();

  const [selectedStories, setSelectedStories] = useState<Set<string>>(new Set());
  const [downloadingStories, setDownloadingStories] = useState<Set<string>>(new Set());
  const [activeTab, setActiveTab] = useState<'download' | 'manage' | 'settings'>('download');
  const [showDataSaverSettings, setShowDataSaverSettings] = useState(false);

  const storageInfo = getStorageInfo();

  // Group cached content by story
  const cachedByStory = stories.reduce((acc, story) => {
    const cachedChapters = getCachedContentByStory(story.id);
    if (cachedChapters.length > 0) {
      acc[story.id] = {
        story,
        cachedChapters,
        totalCached: cachedChapters.length,
        totalChapters: story.totalChapters
      };
    }
    return acc;
  }, {} as Record<string, any>);

  const downloadStoryForOffline = async (story: Story) => {
    setDownloadingStories(prev => new Set(prev).add(story.id));
    
    try {
      // Download all chapters for the story
      for (const chapter of story.chapters) {
        if (!isContentCached(chapter.id)) {
          // Mock chapter content - in real app, fetch from API
          const fullChapter = {
            ...chapter,
            content: `<p>This is the content for ${chapter.title}...</p>`,
            storyId: story.id,
            chapterNumber: chapter.number
          };
          await saveForOffline(fullChapter);
        }
      }
    } catch (error) {
      console.error('Failed to download story:', error);
    } finally {
      setDownloadingStories(prev => {
        const newSet = new Set(prev);
        newSet.delete(story.id);
        return newSet;
      });
    }
  };

  const removeStoryFromOffline = async (storyId: string) => {
    const cachedChapters = getCachedContentByStory(storyId);
    for (const chapter of cachedChapters) {
      await removeCachedContent(chapter.id);
    }
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isOffline ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                  {isOffline ? <WifiOff className="w-6 h-6" /> : <Wifi className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-reading-text font-crimson">Offline Reading</h2>
                  <p className="text-reading-muted">
                    {isOffline ? 'You are currently offline' : 'Manage your offline content'}
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Storage Info */}
            <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <HardDrive className="w-5 h-5 text-gray-600" />
                  <span className="font-medium">Storage Usage</span>
                </div>
                <span className="text-sm text-gray-600">
                  {formatBytes(storageInfo.used)} / {formatBytes(storageInfo.max)}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2 mb-2">
                <div 
                  className={`h-2 rounded-full transition-all duration-300 ${
                    storageInfo.usagePercentage > 80 ? 'bg-red-500' :
                    storageInfo.usagePercentage > 60 ? 'bg-yellow-500' :
                    'bg-green-500'
                  }`}
                  style={{ width: `${storageInfo.usagePercentage}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-gray-500">
                <span>{storageInfo.itemCount} chapters cached</span>
                <span>{storageInfo.usagePercentage}% used</span>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 mt-4 bg-gray-100 dark:bg-gray-700 rounded-xl p-1">
              {[
                { key: 'download', label: 'Download', icon: Download },
                { key: 'manage', label: 'Manage', icon: BookOpen },
                { key: 'settings', label: 'Settings', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-gray-600 text-primary-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  <tab.icon className="w-4 h-4" />
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'download' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold">Download Stories for Offline Reading</h3>
                  {isDataSaverEnabled && (
                    <div className="flex items-center gap-2 text-sm text-orange-600 bg-orange-50 px-3 py-1 rounded-full">
                      <Zap className="w-4 h-4" />
                      Data Saver: {compressionLevel}% compression
                    </div>
                  )}
                </div>

                {stories.length === 0 ? (
                  <div className="text-center py-12">
                    <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Stories Available</h3>
                    <p className="text-gray-500">Browse stories to download them for offline reading.</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {stories.map(story => {
                      const cachedChapters = getCachedContentByStory(story.id);
                      const isFullyDownloaded = cachedChapters.length === story.totalChapters;
                      const isPartiallyDownloaded = cachedChapters.length > 0 && cachedChapters.length < story.totalChapters;
                      const isDownloading = downloadingStories.has(story.id);

                      return (
                        <div
                          key={story.id}
                          className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4 flex items-center justify-between"
                        >
                          <div className="flex-1">
                            <h4 className="font-semibold text-reading-text mb-1">{story.title}</h4>
                            <p className="text-sm text-reading-muted mb-2">by {story.author.name}</p>
                            <div className="flex items-center gap-4 text-xs text-reading-muted">
                              <span>{story.totalChapters} chapters</span>
                              {isPartiallyDownloaded && (
                                <span className="text-orange-600">
                                  {cachedChapters.length}/{story.totalChapters} downloaded
                                </span>
                              )}
                              {isFullyDownloaded && (
                                <span className="text-green-600 flex items-center gap-1">
                                  <CheckCircle className="w-3 h-3" />
                                  Fully downloaded
                                </span>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2">
                            {isDownloading ? (
                              <div className="flex items-center gap-2 text-primary-600">
                                <div className="w-4 h-4 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
                                <span className="text-sm">Downloading...</span>
                              </div>
                            ) : isFullyDownloaded ? (
                              <button
                                onClick={() => removeStoryFromOffline(story.id)}
                                className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                              >
                                <Trash2 className="w-4 h-4" />
                                Remove
                              </button>
                            ) : (
                              <button
                                onClick={() => downloadStoryForOffline(story)}
                                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                              >
                                <Download className="w-4 h-4" />
                                {isPartiallyDownloaded ? 'Complete' : 'Download'}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'manage' && (
              <div className="space-y-4">
                <h3 className="text-lg font-semibold mb-6">Manage Downloaded Content</h3>

                {Object.keys(cachedByStory).length === 0 ? (
                  <div className="text-center py-12">
                    <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-600 mb-2">No Offline Content</h3>
                    <p className="text-gray-500">Download stories to read them offline.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {Object.values(cachedByStory).map((item: any) => (
                      <div
                        key={item.story.id}
                        className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4"
                      >
                        <div className="flex items-center justify-between mb-3">
                          <div>
                            <h4 className="font-semibold text-reading-text">{item.story.title}</h4>
                            <p className="text-sm text-reading-muted">by {item.story.author.name}</p>
                          </div>
                          <button
                            onClick={() => removeStoryFromOffline(item.story.id)}
                            className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                            title="Remove from offline"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        <div className="flex items-center justify-between text-sm">
                          <span className="text-reading-muted">
                            {item.totalCached}/{item.totalChapters} chapters downloaded
                          </span>
                          <span className="text-reading-muted">
                            {formatBytes(item.cachedChapters.reduce((acc: number, ch: any) => acc + (ch.size || 1000), 0))}
                          </span>
                        </div>

                        <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5 mt-2">
                          <div 
                            className="bg-primary-500 h-1.5 rounded-full transition-all duration-300"
                            style={{ width: `${(item.totalCached / item.totalChapters) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                <h3 className="text-lg font-semibold mb-6">Offline Settings</h3>

                {/* Data Saver Settings */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center gap-3">
                      <Zap className="w-5 h-5 text-orange-600" />
                      <div>
                        <h4 className="font-semibold">Data Saver Mode</h4>
                        <p className="text-sm text-gray-600">Compress content to save storage space</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setShowDataSaverSettings(!showDataSaverSettings)}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      {showDataSaverSettings ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>

                  {showDataSaverSettings && (
                    <div className="space-y-4 pt-4 border-t border-gray-200 dark:border-gray-600">
                      <div className="flex items-center justify-between">
                        <span>Enable Data Saver</span>
                        <div className={`w-12 h-6 rounded-full transition-colors ${isDataSaverEnabled ? 'bg-primary-500' : 'bg-gray-300'}`}>
                          <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 ${isDataSaverEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
                        </div>
                      </div>
                      {isDataSaverEnabled && (
                        <div>
                          <label className="block text-sm font-medium mb-2">
                            Compression Level: {compressionLevel}%
                          </label>
                          <input
                            type="range"
                            min="10"
                            max="90"
                            value={compressionLevel}
                            className="w-full"
                            readOnly
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Storage Management */}
                <div className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4">
                  <h4 className="font-semibold mb-4 flex items-center gap-2">
                    <HardDrive className="w-5 h-5" />
                    Storage Management
                  </h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span>Auto-cleanup old content</span>
                      <div className="w-12 h-6 bg-primary-500 rounded-full">
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 translate-x-6" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Download over WiFi only</span>
                      <div className="w-12 h-6 bg-primary-500 rounded-full">
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 translate-x-6" />
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span>Sync reading progress</span>
                      <div className="w-12 h-6 bg-primary-500 rounded-full">
                        <div className="w-5 h-5 bg-white rounded-full shadow-sm transition-transform mt-0.5 translate-x-6" />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Clear All Data */}
                <div className="bg-red-50 border border-red-200 rounded-2xl p-4">
                  <div className="flex items-center gap-3 mb-3">
                    <AlertCircle className="w-5 h-5 text-red-600" />
                    <h4 className="font-semibold text-red-800">Danger Zone</h4>
                  </div>
                  <p className="text-sm text-red-700 mb-4">
                    This will permanently delete all offline content and cannot be undone.
                  </p>
                  <button className="px-4 py-2 bg-red-600 text-white rounded-xl hover:bg-red-700 transition-colors">
                    Clear All Offline Data
                  </button>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}