'use client';

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, 
  Cpu, 
  HardDrive, 
  Wifi, 
  Zap, 
  AlertTriangle, 
  CheckCircle, 
  Info,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Settings,
  RefreshCw
} from 'lucide-react';
import { TouchOptimizedButton } from './TouchOptimizedButton';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useDataSaver } from '@/hooks/useDataSaver';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface PerformanceDashboardProps {
  isOpen: boolean;
  onClose: () => void;
}

export function PerformanceDashboard({ isOpen, onClose }: PerformanceDashboardProps) {
  const {
    metrics,
    settings,
    recommendations,
    enablePerformanceMode,
    optimizeForPerformance,
    clearMemoryCache,
    getPerformanceScore,
  } = usePerformanceOptimization();

  const { networkInfo } = useDataSaver();
  const { isMobile, screenSize } = useMobileDetection();
  const [activeTab, setActiveTab] = useState<'overview' | 'metrics' | 'settings'>('overview');

  const performanceScore = getPerformanceScore();

  const getScoreColor = (score: number) => {
    if (score >= 90) return 'text-green-600 bg-green-100';
    if (score >= 70) return 'text-yellow-600 bg-yellow-100';
    return 'text-red-600 bg-red-100';
  };

  const getMetricStatus = (value: number, thresholds: { good: number; fair: number }) => {
    if (value <= thresholds.good) return { status: 'good', icon: CheckCircle, color: 'text-green-600' };
    if (value <= thresholds.fair) return { status: 'fair', icon: AlertTriangle, color: 'text-yellow-600' };
    return { status: 'poor', icon: AlertTriangle, color: 'text-red-600' };
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
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
          className="bg-white dark:bg-dark-800 rounded-xl w-full max-w-2xl max-h-[90vh] overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-6 border-b border-neutral-200 dark:border-dark-700">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className={`p-2 rounded-lg ${getScoreColor(performanceScore)}`}>
                  <Activity size={20} />
                </div>
                <div>
                  <h2 className="text-xl font-semibold text-neutral-900 dark:text-neutral-100">
                    Performance Dashboard
                  </h2>
                  <p className="text-sm text-neutral-600 dark:text-neutral-400">
                    Overall Score: {performanceScore}/100
                  </p>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="p-2 rounded-lg hover:bg-neutral-100 dark:hover:bg-dark-700 transition-colors"
              >
                ×
              </button>
            </div>

            {/* Tabs */}
            <div className="flex space-x-1 bg-neutral-100 dark:bg-dark-700 rounded-lg p-1">
              {[
                { key: 'overview', label: 'Overview', icon: BarChart3 },
                { key: 'metrics', label: 'Metrics', icon: Activity },
                { key: 'settings', label: 'Settings', icon: Settings },
              ].map(tab => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex-1 flex items-center justify-center space-x-2 py-2 px-4 rounded-lg font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'bg-white dark:bg-dark-600 text-primary-600 shadow-sm'
                      : 'text-neutral-600 hover:text-neutral-800'
                  }`}
                >
                  <tab.icon size={16} />
                  <span>{tab.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {activeTab === 'overview' && (
              <div className="space-y-6">
                {/* Performance Score */}
                <div className="text-center">
                  <div className={`inline-flex items-center justify-center w-20 h-20 rounded-full text-2xl font-bold ${getScoreColor(performanceScore)}`}>
                    {performanceScore}
                  </div>
                  <p className="mt-2 text-sm text-neutral-600 dark:text-neutral-400">
                    Performance Score
                  </p>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Cpu size={16} className="text-blue-600" />
                      <span className="text-sm font-medium">FPS</span>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(metrics.fps)}</p>
                    <p className="text-xs text-neutral-600">frames/sec</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <HardDrive size={16} className="text-purple-600" />
                      <span className="text-sm font-medium">Memory</span>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(metrics.memoryUsage)}</p>
                    <p className="text-xs text-neutral-600">MB used</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Wifi size={16} className="text-green-600" />
                      <span className="text-sm font-medium">Network</span>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(metrics.networkLatency)}</p>
                    <p className="text-xs text-neutral-600">ms latency</p>
                  </div>

                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <Activity size={16} className="text-orange-600" />
                      <span className="text-sm font-medium">Load Time</span>
                    </div>
                    <p className="text-2xl font-bold">{Math.round(metrics.loadTime)}</p>
                    <p className="text-xs text-neutral-600">ms</p>
                  </div>
                </div>

                {/* Recommendations */}
                {recommendations.length > 0 && (
                  <div>
                    <h3 className="font-medium mb-3">Recommendations</h3>
                    <div className="space-y-3">
                      {recommendations.slice(0, 3).map((rec, index) => {
                        const Icon = rec.type === 'critical' ? AlertTriangle : 
                                   rec.type === 'warning' ? AlertTriangle : Info;
                        const colorClass = rec.type === 'critical' ? 'text-red-600 bg-red-50 border-red-200' :
                                          rec.type === 'warning' ? 'text-yellow-600 bg-yellow-50 border-yellow-200' :
                                          'text-blue-600 bg-blue-50 border-blue-200';
                        
                        return (
                          <div key={index} className={`p-3 rounded-lg border ${colorClass}`}>
                            <div className="flex items-start space-x-3">
                              <Icon size={16} className="mt-0.5" />
                              <div className="flex-1">
                                <h4 className="font-medium text-sm">{rec.title}</h4>
                                <p className="text-xs mt-1 opacity-80">{rec.description}</p>
                                {rec.action && (
                                  <TouchOptimizedButton
                                    variant="outline"
                                    size="sm"
                                    onClick={rec.action}
                                    className="mt-2 text-xs"
                                  >
                                    {rec.actionLabel}
                                  </TouchOptimizedButton>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Quick Actions */}
                <div>
                  <h3 className="font-medium mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <TouchOptimizedButton
                      variant="outline"
                      size="sm"
                      onClick={enablePerformanceMode}
                      className="flex items-center space-x-2"
                    >
                      <Zap size={16} />
                      <span>Performance Mode</span>
                    </TouchOptimizedButton>
                    
                    <TouchOptimizedButton
                      variant="outline"
                      size="sm"
                      onClick={clearMemoryCache}
                      className="flex items-center space-x-2"
                    >
                      <RefreshCw size={16} />
                      <span>Clear Cache</span>
                    </TouchOptimizedButton>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'metrics' && (
              <div className="space-y-6">
                {/* Detailed Metrics */}
                <div className="space-y-4">
                  {/* FPS */}
                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Cpu size={16} className="text-blue-600" />
                        <span className="font-medium">Frame Rate</span>
                      </div>
                      <span className="text-2xl font-bold">{Math.round(metrics.fps)} FPS</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-dark-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metrics.fps >= 55 ? 'bg-green-500' :
                          metrics.fps >= 30 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((metrics.fps / 60) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-600 mt-1">
                      <span>0</span>
                      <span>60 FPS</span>
                    </div>
                  </div>

                  {/* Memory Usage */}
                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <HardDrive size={16} className="text-purple-600" />
                        <span className="font-medium">Memory Usage</span>
                      </div>
                      <span className="text-2xl font-bold">{Math.round(metrics.memoryUsage)} MB</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-dark-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metrics.memoryUsage <= 75 ? 'bg-green-500' :
                          metrics.memoryUsage <= 150 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((metrics.memoryUsage / 200) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-600 mt-1">
                      <span>0 MB</span>
                      <span>200 MB</span>
                    </div>
                  </div>

                  {/* Network Latency */}
                  <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-2">
                        <Wifi size={16} className="text-green-600" />
                        <span className="font-medium">Network Latency</span>
                      </div>
                      <span className="text-2xl font-bold">{Math.round(metrics.networkLatency)} ms</span>
                    </div>
                    <div className="w-full bg-neutral-200 dark:bg-dark-600 rounded-full h-2">
                      <div 
                        className={`h-2 rounded-full transition-all duration-300 ${
                          metrics.networkLatency <= 100 ? 'bg-green-500' :
                          metrics.networkLatency <= 500 ? 'bg-yellow-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${Math.min((metrics.networkLatency / 1000) * 100, 100)}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs text-neutral-600 mt-1">
                      <span>0 ms</span>
                      <span>1000 ms</span>
                    </div>
                  </div>
                </div>

                {/* Device Info */}
                <div className="bg-neutral-50 dark:bg-dark-700 rounded-lg p-4">
                  <h3 className="font-medium mb-3">Device Information</h3>
                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span>Device Type:</span>
                      <span className="font-medium">{isMobile ? 'Mobile' : 'Desktop'}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Screen Size:</span>
                      <span className="font-medium uppercase">{screenSize}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Connection:</span>
                      <span className="font-medium uppercase">{networkInfo.effectiveType}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Bandwidth:</span>
                      <span className="font-medium">{networkInfo.downlink} Mbps</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'settings' && (
              <div className="space-y-6">
                {/* Optimization Settings */}
                <div>
                  <h3 className="font-medium mb-4">Optimization Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Virtualization</span>
                        <p className="text-sm text-neutral-600">Enable virtual scrolling for large lists</p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.enableVirtualization ? 'bg-primary-600' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enableVirtualization ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Image Lazy Loading</span>
                        <p className="text-sm text-neutral-600">Load images only when needed</p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.enableImageLazyLoading ? 'bg-primary-600' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enableImageLazyLoading ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <span className="font-medium">Prefetching</span>
                        <p className="text-sm text-neutral-600">Preload content for faster navigation</p>
                      </div>
                      <button
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                          settings.enablePrefetching ? 'bg-primary-600' : 'bg-neutral-200'
                        }`}
                      >
                        <span
                          className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                            settings.enablePrefetching ? 'translate-x-6' : 'translate-x-1'
                          }`}
                        />
                      </button>
                    </div>
                  </div>
                </div>

                {/* Cache Strategy */}
                <div>
                  <h3 className="font-medium mb-4">Cache Strategy</h3>
                  <div className="space-y-2">
                    {(['aggressive', 'moderate', 'minimal'] as const).map((strategy) => (
                      <label key={strategy} className="flex items-center space-x-3">
                        <input
                          type="radio"
                          name="cacheStrategy"
                          value={strategy}
                          checked={settings.cacheStrategy === strategy}
                          className="w-4 h-4 text-primary-600"
                          readOnly
                        />
                        <div>
                          <span className="font-medium capitalize">{strategy}</span>
                          <p className="text-sm text-neutral-600">
                            {strategy === 'aggressive' && 'Maximum caching for best performance'}
                            {strategy === 'moderate' && 'Balanced caching and storage usage'}
                            {strategy === 'minimal' && 'Minimal caching to save storage'}
                          </p>
                        </div>
                      </label>
                    ))}
                  </div>
                </div>

                {/* Concurrent Requests */}
                <div>
                  <h3 className="font-medium mb-4">Network Settings</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">
                      Max Concurrent Requests: {settings.maxConcurrentRequests}
                    </label>
                    <input
                      type="range"
                      min="1"
                      max="10"
                      value={settings.maxConcurrentRequests}
                      className="w-full h-2 bg-neutral-200 rounded-lg appearance-none cursor-pointer"
                      readOnly
                    />
                    <div className="flex justify-between text-xs text-neutral-500 mt-1">
                      <span>1</span>
                      <span>10</span>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}