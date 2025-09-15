'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  Image, 
  Video, 
  FileText, 
  Wifi, 
  WifiOff,
  Settings,
  BarChart3,
  Download,
  Upload,
  Clock,
  CheckCircle,
  AlertTriangle
} from 'lucide-react';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { useDataSaver } from '@/hooks/useDataSaver';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface DataUsageStats {
  totalSaved: number;
  imagesSaved: number;
  videosSaved: number;
  textSaved: number;
  currentSession: number;
  thisMonth: number;
}

interface NetworkQuality {
  type: string;
  speed: number;
  latency: number;
  quality: 'excellent' | 'good' | 'fair' | 'poor';
}

export function DataSavingManager() {
  const {
    isDataSaverEnabled,
    compressionLevel,
    imageQuality,
    preloadContent,
    autoDownloadChapters,
    networkInfo,
    toggleDataSaver,
    updateCompressionLevel,
    updateImageQuality,
    togglePreloadContent,
    toggleAutoDownload,
    getDataSavings,
    applyRecommendedSettings
  } = useDataSaver();

  const { isMobile, screenSize } = useMobileDetection();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [dataUsageStats, setDataUsageStats] = useState<DataUsageStats>({
    totalSaved: 0,
    imagesSaved: 0,
    videosSaved: 0,
    textSaved: 0,
    currentSession: 0,
    thisMonth: 0
  });
  const [networkQuality, setNetworkQuality] = useState<NetworkQuality>({
    type: networkInfo.effectiveType,
    speed: networkInfo.downlink,
    latency: networkInfo.rtt,
    quality: 'good'
  });

  useEffect(() => {
    // Load data usage stats from localStorage
    const savedStats = localStorage.getItem('dataUsageStats');
    if (savedStats) {
      setDataUsageStats(JSON.parse(savedStats));
    }

    // Calculate network quality
    const quality = calculateNetworkQuality(networkInfo);
    setNetworkQuality({
      type: networkInfo.effectiveType,
      speed: networkInfo.downlink,
      latency: networkInfo.rtt,
      quality
    });
  }, [networkInfo]);

  const calculateNetworkQuality = (info: typeof networkInfo): 'excellent' | 'good' | 'fair' | 'poor' => {
    if (info.effectiveType === '4g' && info.downlink > 10) return 'excellent';
    if (info.effectiveType === '4g' || (info.effectiveType === '3g' && info.downlink > 5)) return 'good';
    if (info.effectiveType === '3g' || info.effectiveType === '2g') return 'fair';
    return 'poor';
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const getQualityColor = (quality: string) => {
    switch (quality) {
      case 'excellent': return 'text-green-600 bg-green-100';
      case 'good': return 'text-blue-600 bg-blue-100';
      case 'fair': return 'text-yellow-600 bg-yellow-100';
      case 'poor': return 'text-red-600 bg-red-100';
      default: return 'text-gray-600 bg-gray-100';
    }
  };

  const dataSavings = getDataSavings();

  return (
    <div className="p-4 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${isDataSaverEnabled ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-600'}`}>
            <Zap size={20} />
          </div>
          <div>
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              Data Saver
            </h2>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">
              {isDataSaverEnabled ? 'Active' : 'Inactive'} • {dataSavings.estimatedSaving}% savings
            </p>
          </div>
        </div>
        
        <TouchOptimizedButton
          variant={isDataSaverEnabled ? 'primary' : 'outline'}
          size="sm"
          onClick={toggleDataSaver}
        >
          {isDataSaverEnabled ? 'Disable' : 'Enable'}
        </TouchOptimizedButton>
      </div>

      {/* Network Status */}
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-neutral-200 dark:border-dark-700 p-4">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Network Status</h3>
          <div className={`px-2 py-1 rounded-full text-xs font-medium ${getQualityColor(networkQuality.quality)}`}>
            {networkQuality.quality}
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <p className="text-neutral-600 dark:text-neutral-400">Type</p>
            <p className="font-medium uppercase">{networkQuality.type}</p>
          </div>
          <div>
            <p className="text-neutral-600 dark:text-neutral-400">Speed</p>
            <p className="font-medium">{networkQuality.speed} Mbps</p>
          </div>
          <div>
            <p className="text-neutral-600 dark:text-neutral-400">Latency</p>
            <p className="font-medium">{networkQuality.latency}ms</p>
          </div>
        </div>

        {networkQuality.quality === 'poor' && (
          <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg">
            <div className="flex items-center space-x-2">
              <AlertTriangle size={16} className="text-yellow-600" />
              <p className="text-sm text-yellow-800 dark:text-yellow-200">
                Slow connection detected. Consider enabling data saver mode.
              </p>
            </div>
            <TouchOptimizedButton
              variant="outline"
              size="sm"
              onClick={applyRecommendedSettings}
              className="mt-2 text-yellow-700 border-yellow-300"
            >
              Apply Recommended Settings
            </TouchOptimizedButton>
          </div>
        )}
      </div>

      {/* Data Usage Stats */}
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-neutral-200 dark:border-dark-700 p-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100">Data Savings</h3>
          <BarChart3 size={16} className="text-neutral-600" />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mb-4">
          <div className="text-center">
            <p className="text-2xl font-bold text-green-600">{formatBytes(dataUsageStats.totalSaved)}</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Total Saved</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-blue-600">{dataSavings.estimatedSaving}%</p>
            <p className="text-sm text-neutral-600 dark:text-neutral-400">Efficiency</p>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Image size={14} className="text-purple-600" />
              <span>Images</span>
            </div>
            <span className="font-medium">{formatBytes(dataUsageStats.imagesSaved)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <Video size={14} className="text-red-600" />
              <span>Videos</span>
            </div>
            <span className="font-medium">{formatBytes(dataUsageStats.videosSaved)}</span>
          </div>
          <div className="flex items-center justify-between text-sm">
            <div className="flex items-center space-x-2">
              <FileText size={14} className="text-blue-600" />
              <span>Text</span>
            </div>
            <span className="font-medium">{formatBytes(dataUsageStats.textSaved)}</span>
          </div>
        </div>
      </div>

      {/* Quick Settings */}
      {isDataSaverEnabled && (
        <div className="bg-white dark:bg-dark-800 rounded-lg border border-neutral-200 dark:border-dark-700 p-4">
          <h3 className="font-medium text-neutral-900 dark:text-neutral-100 mb-4">Quick Settings</h3>
          
          <div className="space-y-4">
            {/* Image Quality */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Image Quality</label>
                <span className="text-sm text-neutral-600 capitalize">{imageQuality}</span>
              </div>
              <div className="flex space-x-2">
                {(['low', 'medium', 'high'] as const).map((quality) => (
                  <TouchOptimizedButton
                    key={quality}
                    variant={imageQuality === quality ? 'primary' : 'outline'}
                    size="sm"
                    onClick={() => updateImageQuality(quality)}
                    className="flex-1 capitalize"
                  >
                    {quality}
                  </TouchOptimizedButton>
                ))}
              </div>
            </div>

            {/* Compression Level */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-medium">Compression</label>
                <span className="text-sm text-neutral-600">{compressionLevel}%</span>
              </div>
              <input
                type="range"
                min="10"
                max="90"
                value={compressionLevel}
                onChange={(e) => updateCompressionLevel(parseInt(e.target.value))}
                className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
              />
              <div className="flex justify-between text-xs text-neutral-500 mt-1">
                <span>Less</span>
                <span>More</span>
              </div>
            </div>

            {/* Toggle Settings */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Download size={16} className="text-neutral-600" />
                  <span className="text-sm">Preload content</span>
                </div>
                <button
                  onClick={togglePreloadContent}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    preloadContent ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      preloadContent ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Upload size={16} className="text-neutral-600" />
                  <span className="text-sm">Auto-download chapters</span>
                </div>
                <button
                  onClick={toggleAutoDownload}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                    autoDownloadChapters ? 'bg-primary-600' : 'bg-neutral-200'
                  }`}
                >
                  <span
                    className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                      autoDownloadChapters ? 'translate-x-6' : 'translate-x-1'
                    }`}
                  />
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Advanced Settings */}
      <div className="bg-white dark:bg-dark-800 rounded-lg border border-neutral-200 dark:border-dark-700">
        <button
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="w-full p-4 flex items-center justify-between text-left"
        >
          <div className="flex items-center space-x-2">
            <Settings size={16} className="text-neutral-600" />
            <span className="font-medium">Advanced Settings</span>
          </div>
          <motion.div
            animate={{ rotate: showAdvanced ? 180 : 0 }}
            transition={{ duration: 0.2 }}
          >
            ▼
          </motion.div>
        </button>

        <AnimatePresence>
          {showAdvanced && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="border-t border-neutral-200 dark:border-dark-700 p-4 space-y-4"
            >
              {/* Adaptive Quality */}
              <div>
                <h4 className="font-medium mb-2">Adaptive Quality</h4>
                <p className="text-sm text-neutral-600 dark:text-neutral-400 mb-3">
                  Automatically adjust quality based on network conditions
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Enable adaptive quality</span>
                  <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                    <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                  </button>
                </div>
              </div>

              {/* Lazy Loading */}
              <div>
                <h4 className="font-medium mb-2">Lazy Loading</h4>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Images</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Videos</span>
                    <button className="relative inline-flex h-6 w-11 items-center rounded-full bg-primary-600">
                      <span className="inline-block h-4 w-4 transform rounded-full bg-white translate-x-6" />
                    </button>
                  </div>
                </div>
              </div>

              {/* Cache Management */}
              <div>
                <h4 className="font-medium mb-2">Cache Management</h4>
                <div className="space-y-2">
                  <TouchOptimizedButton
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="justify-start"
                  >
                    Clear Image Cache
                  </TouchOptimizedButton>
                  <TouchOptimizedButton
                    variant="outline"
                    size="sm"
                    fullWidth
                    className="justify-start"
                  >
                    Clear All Cache
                  </TouchOptimizedButton>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recommendations */}
      {networkQuality.quality !== 'excellent' && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div className="flex items-start space-x-3">
            <CheckCircle size={20} className="text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-1">
                Optimization Recommendations
              </h4>
              <ul className="text-sm text-blue-800 dark:text-blue-200 space-y-1">
                {networkQuality.quality === 'poor' && (
                  <>
                    <li>• Enable data saver mode for better performance</li>
                    <li>• Use low image quality to reduce data usage</li>
                    <li>• Disable auto-download features</li>
                  </>
                )}
                {networkQuality.quality === 'fair' && (
                  <>
                    <li>• Consider medium image quality</li>
                    <li>• Enable selective preloading</li>
                  </>
                )}
                {networkQuality.quality === 'good' && (
                  <>
                    <li>• You can use higher quality settings</li>
                    <li>• Preloading is recommended</li>
                  </>
                )}
              </ul>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}