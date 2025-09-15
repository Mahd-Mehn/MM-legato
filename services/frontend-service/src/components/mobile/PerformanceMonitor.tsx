'use client';

import React, { useEffect, useState } from 'react';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useDataSaver } from '@/hooks/useDataSaver';

interface PerformanceMetrics {
  fcp: number; // First Contentful Paint
  lcp: number; // Largest Contentful Paint
  fid: number; // First Input Delay
  cls: number; // Cumulative Layout Shift
  ttfb: number; // Time to First Byte
  memoryUsage?: number;
  connectionSpeed?: string;
}

interface PerformanceMonitorProps {
  onMetricsUpdate?: (metrics: PerformanceMetrics) => void;
  showDebugInfo?: boolean;
}

export function PerformanceMonitor({ 
  onMetricsUpdate, 
  showDebugInfo = false 
}: PerformanceMonitorProps) {
  const [metrics, setMetrics] = useState<PerformanceMetrics>({
    fcp: 0,
    lcp: 0,
    fid: 0,
    cls: 0,
    ttfb: 0,
  });
  const { isMobile, screenSize } = useMobileDetection();
  const { networkInfo } = useDataSaver();

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const observer = new PerformanceObserver((list) => {
      const entries = list.getEntries();
      
      entries.forEach((entry) => {
        const newMetrics = { ...metrics };
        
        switch (entry.entryType) {
          case 'paint':
            if (entry.name === 'first-contentful-paint') {
              newMetrics.fcp = entry.startTime;
            }
            break;
            
          case 'largest-contentful-paint':
            newMetrics.lcp = entry.startTime;
            break;
            
          case 'first-input':
            newMetrics.fid = (entry as any).processingStart - entry.startTime;
            break;
            
          case 'layout-shift':
            if (!(entry as any).hadRecentInput) {
              newMetrics.cls += (entry as any).value;
            }
            break;
            
          case 'navigation':
            const navEntry = entry as PerformanceNavigationTiming;
            newMetrics.ttfb = navEntry.responseStart - navEntry.requestStart;
            break;
        }
        
        // Add memory usage if available
        if ('memory' in performance) {
          const memory = (performance as any).memory;
          newMetrics.memoryUsage = memory.usedJSHeapSize / 1024 / 1024; // MB
        }
        
        newMetrics.connectionSpeed = networkInfo.effectiveType;
        
        setMetrics(newMetrics);
        onMetricsUpdate?.(newMetrics);
      });
    });

    // Observe different performance entry types
    try {
      observer.observe({ entryTypes: ['paint', 'largest-contentful-paint', 'first-input', 'layout-shift', 'navigation'] });
    } catch (error) {
      console.warn('Performance Observer not fully supported:', error);
    }

    // Cleanup
    return () => observer.disconnect();
  }, [onMetricsUpdate, networkInfo.effectiveType]);

  // Performance recommendations based on metrics
  const getPerformanceRecommendations = (): string[] => {
    const recommendations: string[] = [];
    
    if (metrics.fcp > 2500) {
      recommendations.push('First Contentful Paint is slow. Consider optimizing critical resources.');
    }
    
    if (metrics.lcp > 4000) {
      recommendations.push('Largest Contentful Paint is slow. Optimize images and critical content.');
    }
    
    if (metrics.fid > 300) {
      recommendations.push('First Input Delay is high. Reduce JavaScript execution time.');
    }
    
    if (metrics.cls > 0.25) {
      recommendations.push('Cumulative Layout Shift is high. Ensure stable layouts.');
    }
    
    if (metrics.memoryUsage && metrics.memoryUsage > 50) {
      recommendations.push('High memory usage detected. Consider optimizing components.');
    }
    
    if (isMobile && networkInfo.effectiveType === 'slow-2g') {
      recommendations.push('Slow network detected. Enable data saver mode.');
    }
    
    return recommendations;
  };

  // Performance score calculation
  const getPerformanceScore = (): number => {
    let score = 100;
    
    // FCP scoring
    if (metrics.fcp > 3000) score -= 20;
    else if (metrics.fcp > 1800) score -= 10;
    
    // LCP scoring
    if (metrics.lcp > 4000) score -= 25;
    else if (metrics.lcp > 2500) score -= 15;
    
    // FID scoring
    if (metrics.fid > 300) score -= 20;
    else if (metrics.fid > 100) score -= 10;
    
    // CLS scoring
    if (metrics.cls > 0.25) score -= 15;
    else if (metrics.cls > 0.1) score -= 5;
    
    return Math.max(0, score);
  };

  if (!showDebugInfo) {
    return null;
  }

  const score = getPerformanceScore();
  const recommendations = getPerformanceRecommendations();

  return (
    <div className="fixed bottom-20 right-4 z-50 bg-white dark:bg-dark-800 border border-neutral-200 dark:border-dark-700 rounded-lg shadow-lg p-4 max-w-sm">
      <div className="text-sm font-semibold mb-2 flex items-center justify-between">
        <span>Performance Monitor</span>
        <span className={`px-2 py-1 rounded text-xs ${
          score >= 90 ? 'bg-green-100 text-green-800' :
          score >= 70 ? 'bg-yellow-100 text-yellow-800' :
          'bg-red-100 text-red-800'
        }`}>
          {score}/100
        </span>
      </div>
      
      <div className="space-y-1 text-xs text-neutral-600 dark:text-neutral-400">
        <div>FCP: {metrics.fcp.toFixed(0)}ms</div>
        <div>LCP: {metrics.lcp.toFixed(0)}ms</div>
        <div>FID: {metrics.fid.toFixed(0)}ms</div>
        <div>CLS: {metrics.cls.toFixed(3)}</div>
        <div>TTFB: {metrics.ttfb.toFixed(0)}ms</div>
        {metrics.memoryUsage && (
          <div>Memory: {metrics.memoryUsage.toFixed(1)}MB</div>
        )}
        <div>Network: {networkInfo.effectiveType}</div>
        <div>Device: {isMobile ? 'Mobile' : 'Desktop'} ({screenSize})</div>
      </div>
      
      {recommendations.length > 0 && (
        <div className="mt-3 pt-2 border-t border-neutral-200 dark:border-dark-700">
          <div className="text-xs font-medium mb-1">Recommendations:</div>
          <ul className="text-xs text-neutral-600 dark:text-neutral-400 space-y-1">
            {recommendations.slice(0, 3).map((rec, index) => (
              <li key={index} className="flex items-start">
                <span className="text-yellow-500 mr-1">•</span>
                <span>{rec}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}