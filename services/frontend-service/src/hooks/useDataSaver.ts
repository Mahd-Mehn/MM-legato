'use client';

import { useState, useEffect, useCallback } from 'react';

interface DataSaverSettings {
  enabled: boolean;
  compressionLevel: number;
  imageQuality: 'low' | 'medium' | 'high';
  preloadContent: boolean;
  autoDownloadChapters: boolean;
}

export function useDataSaver() {
  const [settings, setSettings] = useState<DataSaverSettings>({
    enabled: false,
    compressionLevel: 70,
    imageQuality: 'medium',
    preloadContent: false,
    autoDownloadChapters: false
  });

  const [networkInfo, setNetworkInfo] = useState({
    effectiveType: '4g',
    downlink: 10,
    rtt: 100,
    saveData: false
  });

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('dataSaverSettings');
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    // Check for native data saver preference
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      if (connection) {
        setNetworkInfo({
          effectiveType: connection.effectiveType || '4g',
          downlink: connection.downlink || 10,
          rtt: connection.rtt || 100,
          saveData: connection.saveData || false
        });

        // Auto-enable data saver on slow connections or when saveData is true
        if (connection.saveData || connection.effectiveType === 'slow-2g' || connection.effectiveType === '2g') {
          setSettings(prev => ({ ...prev, enabled: true }));
        }
      }
    }
  }, []);

  // Save settings to localStorage when they change
  useEffect(() => {
    localStorage.setItem('dataSaverSettings', JSON.stringify(settings));
  }, [settings]);

  const toggleDataSaver = useCallback(() => {
    setSettings(prev => ({ ...prev, enabled: !prev.enabled }));
  }, []);

  const updateCompressionLevel = useCallback((level: number) => {
    setSettings(prev => ({ ...prev, compressionLevel: Math.max(10, Math.min(90, level)) }));
  }, []);

  const updateImageQuality = useCallback((quality: 'low' | 'medium' | 'high') => {
    setSettings(prev => ({ ...prev, imageQuality: quality }));
  }, []);

  const togglePreloadContent = useCallback(() => {
    setSettings(prev => ({ ...prev, preloadContent: !prev.preloadContent }));
  }, []);

  const toggleAutoDownload = useCallback(() => {
    setSettings(prev => ({ ...prev, autoDownloadChapters: !prev.autoDownloadChapters }));
  }, []);

  // Compress text content based on settings
  const compressContent = useCallback((content: string): string => {
    if (!settings.enabled) return content;

    // Simple compression: remove extra whitespace and line breaks
    let compressed = content
      .replace(/\s+/g, ' ')
      .replace(/\n\s*\n/g, '\n')
      .trim();

    // Apply compression level
    if (settings.compressionLevel > 50) {
      // More aggressive compression
      compressed = compressed
        .replace(/\s*([.!?])\s*/g, '$1 ')
        .replace(/\s*([,;:])\s*/g, '$1 ');
    }

    return compressed;
  }, [settings.enabled, settings.compressionLevel]);

  // Get optimized image URL based on settings
  const getOptimizedImageUrl = useCallback((originalUrl: string): string => {
    if (!settings.enabled) return originalUrl;

    const qualityMap = {
      low: 30,
      medium: 60,
      high: 80
    };

    const quality = qualityMap[settings.imageQuality];
    
    // Add compression parameters to URL (assuming CDN supports it)
    const url = new URL(originalUrl);
    url.searchParams.set('q', quality.toString());
    url.searchParams.set('f', 'webp'); // Use WebP format for better compression
    
    return url.toString();
  }, [settings.enabled, settings.imageQuality]);

  // Calculate data savings
  const getDataSavings = useCallback(() => {
    const baseCompressionSaving = settings.enabled ? settings.compressionLevel : 0;
    const imageCompressionSaving = settings.enabled ? {
      low: 70,
      medium: 50,
      high: 30
    }[settings.imageQuality] : 0;

    return {
      textCompression: baseCompressionSaving,
      imageCompression: imageCompressionSaving,
      estimatedSaving: Math.round((baseCompressionSaving + imageCompressionSaving) / 2)
    };
  }, [settings.enabled, settings.compressionLevel, settings.imageQuality]);

  // Check if content should be preloaded based on network conditions
  const shouldPreloadContent = useCallback((): boolean => {
    if (!settings.preloadContent) return false;
    if (settings.enabled && networkInfo.effectiveType === 'slow-2g') return false;
    if (networkInfo.saveData) return false;
    
    return true;
  }, [settings.preloadContent, settings.enabled, networkInfo]);

  // Get recommended settings based on network conditions
  const getRecommendedSettings = useCallback((): Partial<DataSaverSettings> => {
    const recommendations: Partial<DataSaverSettings> = {};

    if (networkInfo.saveData || networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      recommendations.enabled = true;
      recommendations.compressionLevel = 80;
      recommendations.imageQuality = 'low';
      recommendations.preloadContent = false;
      recommendations.autoDownloadChapters = false;
    } else if (networkInfo.effectiveType === '3g') {
      recommendations.enabled = true;
      recommendations.compressionLevel = 60;
      recommendations.imageQuality = 'medium';
      recommendations.preloadContent = false;
      recommendations.autoDownloadChapters = false;
    } else {
      recommendations.enabled = false;
      recommendations.compressionLevel = 30;
      recommendations.imageQuality = 'high';
      recommendations.preloadContent = true;
      recommendations.autoDownloadChapters = true;
    }

    return recommendations;
  }, [networkInfo]);

  const applyRecommendedSettings = useCallback(() => {
    const recommended = getRecommendedSettings();
    setSettings(prev => ({ ...prev, ...recommended }));
  }, [getRecommendedSettings]);

  return {
    isDataSaverEnabled: settings.enabled,
    compressionLevel: settings.compressionLevel,
    imageQuality: settings.imageQuality,
    preloadContent: settings.preloadContent,
    autoDownloadChapters: settings.autoDownloadChapters,
    networkInfo,
    toggleDataSaver,
    updateCompressionLevel,
    updateImageQuality,
    togglePreloadContent,
    toggleAutoDownload,
    compressContent,
    getOptimizedImageUrl,
    getDataSavings,
    shouldPreloadContent,
    getRecommendedSettings,
    applyRecommendedSettings
  };
}