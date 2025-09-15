'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Download, 
  Pause, 
  Play, 
  X, 
  CheckCircle, 
  AlertCircle, 
  RotateCcw,
  Wifi,
  WifiOff
} from 'lucide-react';
import { useOfflineContent } from '@/hooks/useOfflineContent';

interface DownloadItem {
  id: string;
  storyId: string;
  chapterId: string;
  title: string;
  storyTitle: string;
  status: 'pending' | 'downloading' | 'completed' | 'failed' | 'paused';
  progress: number;
  size: number;
  downloadedSize: number;
  error?: string;
}

interface DownloadManagerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DownloadManager({ isOpen, onClose }: DownloadManagerProps) {
  const [downloads, setDownloads] = useState<DownloadItem[]>([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadSpeed, setDownloadSpeed] = useState(0);
  const [totalProgress, setTotalProgress] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  const { saveForOffline, getStorageInfo } = useOfflineContent();
  const storageInfo = getStorageInfo();

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Calculate total progress
  useEffect(() => {
    if (downloads.length === 0) {
      setTotalProgress(0);
      return;
    }

    const totalSize = downloads.reduce((acc, item) => acc + item.size, 0);
    const totalDownloaded = downloads.reduce((acc, item) => acc + item.downloadedSize, 0);
    setTotalProgress(totalSize > 0 ? (totalDownloaded / totalSize) * 100 : 0);
  }, [downloads]);

  // Mock download simulation
  const simulateDownload = async (item: DownloadItem) => {
    const updateProgress = (progress: number, downloadedSize: number) => {
      setDownloads(prev => prev.map(d => 
        d.id === item.id 
          ? { ...d, progress, downloadedSize, status: 'downloading' }
          : d
      ));
    };

    try {
      // Simulate download progress
      for (let progress = 0; progress <= 100; progress += 10) {
        if (!isOnline) {
          setDownloads(prev => prev.map(d => 
            d.id === item.id 
              ? { ...d, status: 'paused', error: 'Connection lost' }
              : d
          ));
          return;
        }

        const downloadedSize = (progress / 100) * item.size;
        updateProgress(progress, downloadedSize);
        
        // Simulate network delay
        await new Promise(resolve => setTimeout(resolve, 200));
      }

      // Mark as completed
      setDownloads(prev => prev.map(d => 
        d.id === item.id 
          ? { ...d, status: 'completed', progress: 100, downloadedSize: item.size }
          : d
      ));

      // Save to offline storage
      const mockChapter = {
        id: item.chapterId,
        title: item.title,
        content: `<p>Mock content for ${item.title}</p>`,
        storyId: item.storyId,
        chapterNumber: 1,
        wordCount: 1000
      };
      await saveForOffline(mockChapter);

    } catch (error) {
      setDownloads(prev => prev.map(d => 
        d.id === item.id 
          ? { ...d, status: 'failed', error: 'Download failed' }
          : d
      ));
    }
  };

  const addDownload = (storyId: string, chapterId: string, title: string, storyTitle: string) => {
    const newDownload: DownloadItem = {
      id: `${storyId}-${chapterId}`,
      storyId,
      chapterId,
      title,
      storyTitle,
      status: 'pending',
      progress: 0,
      size: Math.floor(Math.random() * 1000000) + 500000, // Random size between 500KB-1.5MB
      downloadedSize: 0
    };

    setDownloads(prev => [...prev, newDownload]);
    
    if (isOnline) {
      simulateDownload(newDownload);
    }
  };

  const pauseDownload = (id: string) => {
    setDownloads(prev => prev.map(d => 
      d.id === id ? { ...d, status: 'paused' } : d
    ));
  };

  const resumeDownload = (id: string) => {
    const download = downloads.find(d => d.id === id);
    if (download && isOnline) {
      simulateDownload(download);
    }
  };

  const retryDownload = (id: string) => {
    const download = downloads.find(d => d.id === id);
    if (download && isOnline) {
      setDownloads(prev => prev.map(d => 
        d.id === id ? { ...d, status: 'pending', progress: 0, downloadedSize: 0, error: undefined } : d
      ));
      simulateDownload(download);
    }
  };

  const removeDownload = (id: string) => {
    setDownloads(prev => prev.filter(d => d.id !== id));
  };

  const clearCompleted = () => {
    setDownloads(prev => prev.filter(d => d.status !== 'completed'));
  };

  const pauseAll = () => {
    setDownloads(prev => prev.map(d => 
      d.status === 'downloading' ? { ...d, status: 'paused' } : d
    ));
  };

  const resumeAll = () => {
    if (!isOnline) return;
    
    downloads.forEach(download => {
      if (download.status === 'paused' || download.status === 'failed') {
        simulateDownload(download);
      }
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const activeDownloads = downloads.filter(d => d.status === 'downloading').length;
  const completedDownloads = downloads.filter(d => d.status === 'completed').length;
  const failedDownloads = downloads.filter(d => d.status === 'failed').length;

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
          className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-2xl max-h-[80vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-xl ${isOnline ? 'bg-green-100 text-green-600' : 'bg-orange-100 text-orange-600'}`}>
                  {isOnline ? <Download className="w-6 h-6" /> : <WifiOff className="w-6 h-6" />}
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-reading-text font-crimson">Download Manager</h2>
                  <p className="text-reading-muted">
                    {isOnline ? 'Managing your downloads' : 'Offline - downloads paused'}
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

            {/* Stats */}
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{activeDownloads}</div>
                <div className="text-sm text-gray-600">Active</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{completedDownloads}</div>
                <div className="text-sm text-gray-600">Completed</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600">{failedDownloads}</div>
                <div className="text-sm text-gray-600">Failed</div>
              </div>
            </div>

            {/* Overall Progress */}
            {downloads.length > 0 && (
              <div className="mb-4">
                <div className="flex justify-between text-sm text-gray-600 mb-2">
                  <span>Overall Progress</span>
                  <span>{Math.round(totalProgress)}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-primary-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${totalProgress}%` }}
                  />
                </div>
              </div>
            )}

            {/* Controls */}
            <div className="flex gap-2">
              <button
                onClick={resumeAll}
                disabled={!isOnline || activeDownloads === downloads.length}
                className="flex items-center gap-2 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                <Play className="w-4 h-4" />
                Resume All
              </button>
              <button
                onClick={pauseAll}
                disabled={activeDownloads === 0}
                className="flex items-center gap-2 px-4 py-2 bg-gray-500 text-white rounded-xl hover:bg-gray-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                <Pause className="w-4 h-4" />
                Pause All
              </button>
              <button
                onClick={clearCompleted}
                disabled={completedDownloads === 0}
                className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded-xl hover:bg-green-600 disabled:bg-gray-300 disabled:text-gray-500 transition-colors"
              >
                <CheckCircle className="w-4 h-4" />
                Clear Completed
              </button>
            </div>
          </div>

          {/* Downloads List */}
          <div className="p-6 overflow-y-auto max-h-[50vh]">
            {downloads.length === 0 ? (
              <div className="text-center py-12">
                <Download className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-600 mb-2">No Downloads</h3>
                <p className="text-gray-500">Your downloads will appear here.</p>
                
                {/* Demo button */}
                <button
                  onClick={() => addDownload('story1', 'ch1', 'Chapter 1: The Beginning', 'Sample Story')}
                  className="mt-4 px-4 py-2 bg-primary-500 text-white rounded-xl hover:bg-primary-600 transition-colors"
                >
                  Add Demo Download
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                {downloads.map(download => (
                  <motion.div
                    key={download.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-gray-50 dark:bg-gray-700 rounded-2xl p-4"
                  >
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-reading-text">{download.title}</h4>
                        <p className="text-sm text-reading-muted">{download.storyTitle}</p>
                      </div>
                      
                      <div className="flex items-center gap-2">
                        {download.status === 'downloading' && (
                          <button
                            onClick={() => pauseDownload(download.id)}
                            className="p-2 text-gray-600 hover:bg-gray-200 rounded-lg transition-colors"
                          >
                            <Pause className="w-4 h-4" />
                          </button>
                        )}
                        
                        {(download.status === 'paused' || download.status === 'failed') && (
                          <button
                            onClick={() => download.status === 'failed' ? retryDownload(download.id) : resumeDownload(download.id)}
                            disabled={!isOnline}
                            className="p-2 text-primary-600 hover:bg-primary-50 rounded-lg transition-colors disabled:text-gray-400"
                          >
                            {download.status === 'failed' ? <RotateCcw className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                          </button>
                        )}
                        
                        {download.status === 'completed' && (
                          <div className="p-2 text-green-600">
                            <CheckCircle className="w-4 h-4" />
                          </div>
                        )}
                        
                        <button
                          onClick={() => removeDownload(download.id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-2">
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>
                          {download.status === 'completed' ? 'Completed' :
                           download.status === 'failed' ? 'Failed' :
                           download.status === 'paused' ? 'Paused' :
                           download.status === 'downloading' ? 'Downloading...' :
                           'Pending'}
                        </span>
                        <span>{formatBytes(download.downloadedSize)} / {formatBytes(download.size)}</span>
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                        <div 
                          className={`h-1.5 rounded-full transition-all duration-300 ${
                            download.status === 'completed' ? 'bg-green-500' :
                            download.status === 'failed' ? 'bg-red-500' :
                            download.status === 'paused' ? 'bg-yellow-500' :
                            'bg-primary-500'
                          }`}
                          style={{ width: `${download.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Error Message */}
                    {download.error && (
                      <div className="flex items-center gap-2 text-red-600 text-sm">
                        <AlertCircle className="w-4 h-4" />
                        {download.error}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}