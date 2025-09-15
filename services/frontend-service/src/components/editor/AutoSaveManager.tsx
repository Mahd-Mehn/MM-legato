'use client';

import { useState, useEffect, useRef } from 'react';
import { Save, Clock, CheckCircle, AlertCircle, Wifi, WifiOff } from 'lucide-react';

interface AutoSaveState {
  status: 'idle' | 'saving' | 'saved' | 'error' | 'offline';
  lastSaved: Date | null;
  hasUnsavedChanges: boolean;
  errorMessage?: string;
}

interface VersionHistory {
  id: string;
  content: string;
  timestamp: Date;
  wordCount: number;
  title?: string;
}

interface AutoSaveManagerProps {
  content: string;
  onSave: (content: string) => Promise<void>;
  autoSaveInterval?: number;
  maxVersions?: number;
  onVersionRestore?: (version: VersionHistory) => void;
  className?: string;
}

export default function AutoSaveManager({
  content,
  onSave,
  autoSaveInterval = 30000, // 30 seconds
  maxVersions = 20,
  onVersionRestore,
  className = "",
}: AutoSaveManagerProps) {
  const [saveState, setSaveState] = useState<AutoSaveState>({
    status: 'idle',
    lastSaved: null,
    hasUnsavedChanges: false,
  });

  const [versions, setVersions] = useState<VersionHistory[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  const lastContentRef = useRef(content);
  const saveTimeoutRef = useRef<NodeJS.Timeout>();
  const pendingSaveRef = useRef<string | null>(null);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setSaveState(prev => ({ ...prev, status: 'idle' }));
      
      // Try to save pending changes when coming back online
      if (pendingSaveRef.current) {
        performSave(pendingSaveRef.current);
      }
    };

    const handleOffline = () => {
      setIsOnline(false);
      setSaveState(prev => ({ ...prev, status: 'offline' }));
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (content !== lastContentRef.current) {
      lastContentRef.current = content;
      setSaveState(prev => ({ ...prev, hasUnsavedChanges: true }));

      // Clear existing timeout
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }

      // Set new timeout for auto-save
      saveTimeoutRef.current = setTimeout(() => {
        if (isOnline) {
          performSave(content);
        } else {
          pendingSaveRef.current = content;
        }
      }, autoSaveInterval);
    }

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [content, autoSaveInterval, isOnline]);

  const performSave = async (contentToSave: string) => {
    if (!contentToSave.trim()) return;

    setSaveState(prev => ({ ...prev, status: 'saving' }));

    try {
      await onSave(contentToSave);
      
      // Create version history entry
      const newVersion: VersionHistory = {
        id: Date.now().toString(),
        content: contentToSave,
        timestamp: new Date(),
        wordCount: contentToSave.replace(/<[^>]*>/g, '').trim().split(/\s+/).length,
      };

      setVersions(prev => {
        const updated = [newVersion, ...prev].slice(0, maxVersions);
        return updated;
      });

      setSaveState({
        status: 'saved',
        lastSaved: new Date(),
        hasUnsavedChanges: false,
      });

      pendingSaveRef.current = null;

      // Reset to idle after 2 seconds
      setTimeout(() => {
        setSaveState(prev => ({ ...prev, status: 'idle' }));
      }, 2000);

    } catch (error) {
      setSaveState({
        status: 'error',
        lastSaved: saveState.lastSaved,
        hasUnsavedChanges: true,
        errorMessage: error instanceof Error ? error.message : 'Save failed',
      });

      // Store for retry when online
      if (!isOnline) {
        pendingSaveRef.current = contentToSave;
      }
    }
  };

  const manualSave = () => {
    if (isOnline && content.trim()) {
      performSave(content);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatDate = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
    });
  };

  const getStatusIcon = () => {
    switch (saveState.status) {
      case 'saving':
        return <Clock className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'saved':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      case 'offline':
        return <WifiOff className="w-4 h-4 text-orange-500" />;
      default:
        return <Save className="w-4 h-4 text-gray-400" />;
    }
  };

  const getStatusText = () => {
    switch (saveState.status) {
      case 'saving':
        return 'Saving...';
      case 'saved':
        return `Saved ${saveState.lastSaved ? formatTime(saveState.lastSaved) : ''}`;
      case 'error':
        return saveState.errorMessage || 'Save failed';
      case 'offline':
        return 'Offline - changes will save when reconnected';
      default:
        return saveState.hasUnsavedChanges 
          ? 'Unsaved changes' 
          : saveState.lastSaved 
          ? `Last saved ${formatTime(saveState.lastSaved)}`
          : 'No changes';
    }
  };

  return (
    <div className={`flex items-center justify-between ${className}`}>
      {/* Save Status */}
      <div className="flex items-center space-x-2">
        {getStatusIcon()}
        <span className={`text-sm ${
          saveState.status === 'error' ? 'text-red-600' : 
          saveState.status === 'offline' ? 'text-orange-600' :
          'text-gray-600'
        }`}>
          {getStatusText()}
        </span>
        
        {!isOnline && (
          <div className="flex items-center space-x-1 text-orange-600">
            <WifiOff className="w-3 h-3" />
            <span className="text-xs">Offline</span>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex items-center space-x-2">
        {/* Manual Save Button */}
        <button
          onClick={manualSave}
          disabled={!isOnline || saveState.status === 'saving' || !saveState.hasUnsavedChanges}
          className="flex items-center space-x-1 px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Save className="w-3 h-3" />
          <span>Save Now</span>
        </button>

        {/* Version History Button */}
        {versions.length > 0 && (
          <button
            onClick={() => setShowVersionHistory(!showVersionHistory)}
            className="flex items-center space-x-1 px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
          >
            <Clock className="w-3 h-3" />
            <span>History</span>
          </button>
        )}
      </div>

      {/* Version History Modal */}
      {showVersionHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl max-h-96 overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Version History</h3>
              <button
                onClick={() => setShowVersionHistory(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-2 max-h-80 overflow-y-auto">
              {versions.map((version) => (
                <div
                  key={version.id}
                  className="flex items-center justify-between p-3 border border-gray-200 rounded hover:bg-gray-50"
                >
                  <div>
                    <div className="font-medium text-gray-900">
                      {formatDate(version.timestamp)}
                    </div>
                    <div className="text-sm text-gray-500">
                      {version.wordCount} words • {formatTime(version.timestamp)}
                    </div>
                  </div>
                  
                  {onVersionRestore && (
                    <button
                      onClick={() => {
                        onVersionRestore(version);
                        setShowVersionHistory(false);
                      }}
                      className="px-3 py-1 text-sm bg-primary-600 text-white rounded hover:bg-primary-700"
                    >
                      Restore
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}