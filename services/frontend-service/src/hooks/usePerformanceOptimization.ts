import { useState, useEffect, useCallback } from 'react';
import { useMobileDetection } from './useMobileDetection';
import { useDataSaver } from './useDataSaver';

interface PerformanceMetrics {
  fps: number;
  memoryUsage: number;
  loadTime: number;
  renderTime: number;
  networkLatency: number;
}

interface OptimizationSettings {
  enableVirtualization: boolean;
  enableImageLazyLoading: boolean;
  enableCodeSplitting: boolean;
  enablePrefetching: boolean;
  maxConcurrentRequests: number;
  cacheStrategy: 'aggressive' | 'moderate' | 'minimal';
}

interface PerformanceRecommendation {
  type: 'critical' | 'warning' | 'info';
  title: string;
  description: string;
  action?: () => void;
  actionLabel?: string;
}

export function usePerformanceOptimization() {
  const { isMobile, screenSize } = useMobileDetection();
  const { isDataSaverEnabled, networkInfo } = useDataSaver();
  
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fps: 60,
    memoryUsage: 0,
    loadTime: 0,
    renderTime: 0,
    networkLatency: 0,
  });

  const [settings, setSettings] = useState<OptimizationSettings>({
    enableVirtualization: true,
    enableImageLazyLoading: true,
    enableCodeSplitting: true,
    enablePrefetching: !isDataSaverEnabled,
    maxConcurrentRequests: isMobile ? 4 : 8,
    cacheStrategy: isDataSaverEnabled ? 'aggressive' : 'moderate',
  });

  const [recommendations, setRecommendations] = useState<PerformanceRecommendation[]>([]);

  // Monitor performance metrics
  useEffect(() => {
    let frameCount = 0;
    let lastTime = performance.now();
    let animationId: number;

    const measureFPS = () => {
      frameCount++;
      const currentTime = performance.now();
      
      if (currentTime >= lastTime + 1000) {
        const fps = Math.round((frameCount * 1000) / (currentTime - lastTime));
        setMetrics(prev => ({ ...prev, fps }));
        frameCount = 0;
        lastTime = currentTime;
      }
      
      animationId = requestAnimationFrame(measureFPS);
    };

    // Start FPS monitoring
    animationId = requestAnimationFrame(measureFPS);

    // Monitor memory usage
    const memoryInterval = setInterval(() => {
      if ('memory' in performance) {
        const memory = (performance as any).memory;
        const memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        setMetrics(prev => ({ ...prev, memoryUsage }));
      }
    }, 5000);

    // Monitor network latency
    const measureLatency = async () => {
      try {
        const start = performance.now();
        await fetch('/api/ping', { method: 'HEAD' });
        const latency = performance.now() - start;
        setMetrics(prev => ({ ...prev, networkLatency: latency }));
      } catch (error) {
        // Fallback to connection RTT if available
        setMetrics(prev => ({ 
          ...prev, 
          networkLatency: networkInfo.rtt || 100 
        }));
      }
    };

    measureLatency();
    const latencyInterval = setInterval(measureLatency, 30000);

    return () => {
      cancelAnimationFrame(animationId);
      clearInterval(memoryInterval);
      clearInterval(latencyInterval);
    };
  }, [networkInfo.rtt]);

  // Update settings based on device and network conditions
  useEffect(() => {
    const newSettings: OptimizationSettings = {
      enableVirtualization: true,
      enableImageLazyLoading: true,
      enableCodeSplitting: true,
      enablePrefetching: !isDataSaverEnabled && networkInfo.effectiveType !== 'slow-2g',
      maxConcurrentRequests: isMobile ? 4 : 8,
      cacheStrategy: isDataSaverEnabled ? 'aggressive' : 'moderate',
    };

    // Adjust based on network quality
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      newSettings.maxConcurrentRequests = 2;
      newSettings.cacheStrategy = 'aggressive';
      newSettings.enablePrefetching = false;
    } else if (networkInfo.effectiveType === '3g') {
      newSettings.maxConcurrentRequests = isMobile ? 3 : 6;
      newSettings.cacheStrategy = 'moderate';
    }

    // Adjust based on device performance
    if (metrics.memoryUsage > 100) { // High memory usage
      newSettings.enableVirtualization = true;
      newSettings.maxConcurrentRequests = Math.max(2, newSettings.maxConcurrentRequests - 2);
    }

    if (metrics.fps < 30) { // Low FPS
      newSettings.enableVirtualization = true;
      newSettings.cacheStrategy = 'aggressive';
    }

    setSettings(newSettings);
  }, [isMobile, isDataSaverEnabled, networkInfo, metrics.memoryUsage, metrics.fps]);

  // Generate performance recommendations
  useEffect(() => {
    const newRecommendations: PerformanceRecommendation[] = [];

    // FPS recommendations
    if (metrics.fps < 30) {
      newRecommendations.push({
        type: 'critical',
        title: 'Low Frame Rate Detected',
        description: 'Your device is experiencing performance issues. Consider enabling performance mode.',
        action: () => enablePerformanceMode(),
        actionLabel: 'Enable Performance Mode'
      });
    } else if (metrics.fps < 45) {
      newRecommendations.push({
        type: 'warning',
        title: 'Reduced Performance',
        description: 'Frame rate is below optimal. Some optimizations may help.',
        action: () => optimizeForPerformance(),
        actionLabel: 'Optimize'
      });
    }

    // Memory recommendations
    if (metrics.memoryUsage > 150) {
      newRecommendations.push({
        type: 'critical',
        title: 'High Memory Usage',
        description: 'Memory usage is high. Consider clearing cache or reducing quality settings.',
        action: () => clearMemoryCache(),
        actionLabel: 'Clear Cache'
      });
    } else if (metrics.memoryUsage > 100) {
      newRecommendations.push({
        type: 'warning',
        title: 'Elevated Memory Usage',
        description: 'Memory usage is above normal. Monitor for potential issues.',
      });
    }

    // Network recommendations
    if (metrics.networkLatency > 1000) {
      newRecommendations.push({
        type: 'warning',
        title: 'Slow Network Connection',
        description: 'High latency detected. Enable data saver mode for better experience.',
        action: () => enableDataSaverMode(),
        actionLabel: 'Enable Data Saver'
      });
    }

    // Device-specific recommendations
    if (isMobile && screenSize === 'sm') {
      newRecommendations.push({
        type: 'info',
        title: 'Mobile Optimization',
        description: 'Enable mobile-specific optimizations for better performance on small screens.',
        action: () => enableMobileOptimizations(),
        actionLabel: 'Optimize for Mobile'
      });
    }

    setRecommendations(newRecommendations);
  }, [metrics, isMobile, screenSize]);

  const enablePerformanceMode = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enableVirtualization: true,
      enableImageLazyLoading: true,
      enablePrefetching: false,
      maxConcurrentRequests: 2,
      cacheStrategy: 'aggressive'
    }));
  }, []);

  const optimizeForPerformance = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enableVirtualization: true,
      maxConcurrentRequests: Math.max(2, prev.maxConcurrentRequests - 1),
      cacheStrategy: 'aggressive'
    }));
  }, []);

  const clearMemoryCache = useCallback(() => {
    // Clear various caches
    if ('caches' in window) {
      caches.keys().then(names => {
        names.forEach(name => {
          if (name.includes('images') || name.includes('assets')) {
            caches.delete(name);
          }
        });
      });
    }

    // Clear component cache (if using React.memo or similar)
    // This would be implementation-specific
    
    // Force garbage collection if available
    if ('gc' in window) {
      (window as any).gc();
    }
  }, []);

  const enableDataSaverMode = useCallback(() => {
    // This would trigger the data saver hook
    // Implementation depends on the data saver context
  }, []);

  const enableMobileOptimizations = useCallback(() => {
    setSettings(prev => ({
      ...prev,
      enableVirtualization: true,
      enableImageLazyLoading: true,
      maxConcurrentRequests: 3,
      cacheStrategy: 'moderate'
    }));
  }, []);

  const getOptimalImageSize = useCallback((originalWidth: number, originalHeight: number) => {
    const devicePixelRatio = window.devicePixelRatio || 1;
    const screenWidth = window.innerWidth;
    
    // Calculate optimal size based on screen and performance
    let targetWidth = Math.min(originalWidth, screenWidth * devicePixelRatio);
    
    // Reduce size for low-end devices
    if (metrics.memoryUsage > 100 || metrics.fps < 45) {
      targetWidth *= 0.8;
    }
    
    // Further reduce for data saver mode
    if (isDataSaverEnabled) {
      targetWidth *= 0.7;
    }
    
    const aspectRatio = originalHeight / originalWidth;
    const targetHeight = targetWidth * aspectRatio;
    
    return {
      width: Math.round(targetWidth),
      height: Math.round(targetHeight)
    };
  }, [metrics.memoryUsage, metrics.fps, isDataSaverEnabled]);

  const shouldPreloadResource = useCallback((resourceType: 'image' | 'video' | 'audio' | 'script') => {
    if (!settings.enablePrefetching) return false;
    
    // Don't preload on slow connections
    if (networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      return false;
    }
    
    // Don't preload if memory usage is high
    if (metrics.memoryUsage > 100) {
      return resourceType === 'script'; // Only preload critical scripts
    }
    
    // Don't preload large resources on mobile with data saver
    if (isMobile && isDataSaverEnabled && (resourceType === 'video' || resourceType === 'audio')) {
      return false;
    }
    
    return true;
  }, [settings.enablePrefetching, networkInfo.effectiveType, metrics.memoryUsage, isMobile, isDataSaverEnabled]);

  const getPerformanceScore = useCallback(() => {
    let score = 100;
    
    // FPS scoring (30%)
    if (metrics.fps < 30) score -= 30;
    else if (metrics.fps < 45) score -= 15;
    else if (metrics.fps < 55) score -= 5;
    
    // Memory scoring (25%)
    if (metrics.memoryUsage > 150) score -= 25;
    else if (metrics.memoryUsage > 100) score -= 15;
    else if (metrics.memoryUsage > 75) score -= 5;
    
    // Network scoring (25%)
    if (metrics.networkLatency > 1000) score -= 25;
    else if (metrics.networkLatency > 500) score -= 15;
    else if (metrics.networkLatency > 200) score -= 5;
    
    // Load time scoring (20%)
    if (metrics.loadTime > 5000) score -= 20;
    else if (metrics.loadTime > 3000) score -= 10;
    else if (metrics.loadTime > 1000) score -= 5;
    
    return Math.max(0, Math.round(score));
  }, [metrics]);

  return {
    metrics,
    settings,
    recommendations,
    enablePerformanceMode,
    optimizeForPerformance,
    clearMemoryCache,
    getOptimalImageSize,
    shouldPreloadResource,
    getPerformanceScore,
    updateSettings: setSettings,
  };
}