'use client';

import React, { useState, useEffect, useRef, useCallback } from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { ImageOff, Wifi, WifiOff, Zap } from 'lucide-react';
import { useDataSaver } from '@/hooks/useDataSaver';
import { usePerformanceOptimization } from '@/hooks/usePerformanceOptimization';
import { useMobileDetection } from '@/hooks/useMobileDetection';

interface NetworkAwareImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
  onLoad?: () => void;
  onError?: () => void;
  fallbackSrc?: string;
  showDataSaverBadge?: boolean;
  enableProgressiveLoading?: boolean;
}

export function NetworkAwareImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  onLoad,
  onError,
  fallbackSrc,
  showDataSaverBadge = true,
  enableProgressiveLoading = true,
  ...props
}: NetworkAwareImageProps) {
  const { isDataSaverEnabled, networkInfo, imageQuality, getOptimizedImageUrl } = useDataSaver();
  const { getOptimalImageSize, shouldPreloadResource } = usePerformanceOptimization();
  const { isMobile } = useMobileDetection();
  
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);
  const [loadProgress, setLoadProgress] = useState(0);
  const [currentSrc, setCurrentSrc] = useState<string>('');
  const [showPlaceholder, setShowPlaceholder] = useState(true);
  const imgRef = useRef<HTMLImageElement>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Calculate optimal image parameters
  const optimalSize = width && height ? getOptimalImageSize(width, height) : null;
  const optimalQuality = getQualityNumber(imageQuality);

  function getQualityNumber(quality: 'low' | 'medium' | 'high'): number {
    switch (quality) {
      case 'low': return 30;
      case 'medium': return 60;
      case 'high': return 85;
      default: return 60;
    }
  }
  
  // Generate optimized image URL using the hook's method
  const generateOptimizedUrl = useCallback((originalSrc: string, quality?: number) => {
    // Use the hook's method first, then add additional optimizations
    let optimizedUrl = getOptimizedImageUrl(originalSrc);
    
    try {
      const url = new URL(optimizedUrl, window.location.origin);
      
      // Add quality parameter if specified
      if (quality) {
        url.searchParams.set('q', quality.toString());
      }
      
      // Add size optimization
      if (optimalSize) {
        url.searchParams.set('w', optimalSize.width.toString());
        url.searchParams.set('h', optimalSize.height.toString());
      }
      
      return url.toString();
    } catch {
      return optimizedUrl;
    }
  }, [getOptimizedImageUrl, optimalSize]);

  // Progressive loading implementation
  useEffect(() => {
    if (!enableProgressiveLoading || !src) return;

    const loadImage = async () => {
      try {
        // Load low quality first if data saver is enabled
        if (isDataSaverEnabled) {
          const lowQualitySrc = generateOptimizedUrl(src, 20);
          setCurrentSrc(lowQualitySrc);
          
          // Simulate progressive loading
          const img = new window.Image();
          img.onload = () => {
            setLoadProgress(30);
            
            // Load medium quality
            const mediumQualitySrc = generateOptimizedUrl(src, 50);
            const mediumImg = new window.Image();
            mediumImg.onload = () => {
              setCurrentSrc(mediumQualitySrc);
              setLoadProgress(70);
              
              // Load full quality
              const fullImg = new window.Image();
              fullImg.onload = () => {
                setCurrentSrc(generateOptimizedUrl(src, optimalQuality));
                setLoadProgress(100);
                setIsLoaded(true);
                setShowPlaceholder(false);
                onLoad?.();
              };
              fullImg.src = generateOptimizedUrl(src, optimalQuality);
            };
            mediumImg.src = mediumQualitySrc;
          };
          img.src = lowQualitySrc;
        } else {
          // Load optimized image directly
          setCurrentSrc(generateOptimizedUrl(src, optimalQuality));
        }
      } catch (error) {
        console.error('Failed to load image:', error);
        handleImageError();
      }
    };

    loadImage();
  }, [src, isDataSaverEnabled, optimalQuality, generateOptimizedUrl, enableProgressiveLoading, onLoad]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading === 'eager' || priority) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting && !isLoaded && !imageError) {
            // Start loading when image comes into view
            setShowPlaceholder(false);
          }
        });
      },
      {
        rootMargin: '50px', // Start loading 50px before image is visible
        threshold: 0.1,
      }
    );

    if (imgRef.current) {
      observerRef.current.observe(imgRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, priority, isLoaded, imageError]);

  const handleImageError = () => {
    setImageError(true);
    setShowPlaceholder(false);
    onError?.();
    
    // Try fallback source if available
    if (fallbackSrc && currentSrc !== fallbackSrc) {
      setCurrentSrc(fallbackSrc);
      setImageError(false);
    }
  };

  const handleImageLoad = () => {
    setIsLoaded(true);
    setShowPlaceholder(false);
    setLoadProgress(100);
    onLoad?.();
  };

  // Generate blur placeholder
  const generateBlurDataURL = () => {
    if (blurDataURL) return blurDataURL;
    
    // Create a simple gradient blur placeholder
    const canvas = document.createElement('canvas');
    canvas.width = 10;
    canvas.height = 10;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      const gradient = ctx.createLinearGradient(0, 0, 10, 10);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, 10, 10);
    }
    
    return canvas.toDataURL();
  };

  // Don't load images in extreme data saver mode unless priority
  if (isDataSaverEnabled && networkInfo.effectiveType === 'slow-2g' && !priority && !isLoaded) {
    return (
      <div 
        className={`bg-neutral-200 dark:bg-dark-700 flex items-center justify-center ${className}`}
        style={{ width: optimalSize?.width || width, height: optimalSize?.height || height }}
      >
        <div className="text-center p-4">
          <WifiOff className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <div className="text-neutral-500 dark:text-neutral-400 text-sm mb-2">
            Image loading paused
          </div>
          <button
            onClick={() => setShowPlaceholder(false)}
            className="text-primary-600 dark:text-primary-400 text-sm underline"
          >
            Load image
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (imageError && !fallbackSrc) {
    return (
      <div 
        className={`bg-neutral-100 dark:bg-dark-700 flex items-center justify-center ${className}`}
        style={{ width: optimalSize?.width || width, height: optimalSize?.height || height }}
      >
        <div className="text-center p-4">
          <ImageOff className="w-8 h-8 text-neutral-400 mx-auto mb-2" />
          <div className="text-neutral-500 dark:text-neutral-400 text-sm">
            Failed to load image
          </div>
        </div>
      </div>
    );
  }

  const imageProps = {
    src: currentSrc || src,
    alt,
    className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    quality: optimalQuality,
    priority,
    loading: priority ? 'eager' as const : loading,
    onError: handleImageError,
    onLoad: handleImageLoad,
    placeholder: placeholder as any,
    blurDataURL: placeholder === 'blur' ? generateBlurDataURL() : undefined,
    ...props,
  };

  return (
    <div className="relative" ref={imgRef}>
      {/* Progressive loading indicator */}
      {enableProgressiveLoading && loadProgress > 0 && loadProgress < 100 && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-dark-700 flex items-center justify-center z-10">
          <div className="text-center">
            <div className="w-8 h-8 border-2 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            <div className="text-xs text-neutral-600 dark:text-neutral-400">
              {loadProgress}%
            </div>
          </div>
        </div>
      )}

      {/* Data saver badge */}
      {showDataSaverBadge && isDataSaverEnabled && isLoaded && (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-2 right-2 bg-green-600 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1 z-20"
        >
          <Zap size={10} />
          <span>Optimized</span>
        </motion.div>
      )}

      {/* Network status indicator */}
      {networkInfo.effectiveType === 'slow-2g' && (
        <div className="absolute top-2 left-2 bg-red-600 text-white px-2 py-1 rounded-full text-xs flex items-center space-x-1 z-20">
          <WifiOff size={10} />
          <span>Slow</span>
        </div>
      )}

      {/* Main image */}
      {fill ? (
        <Image
          {...imageProps}
          fill
          sizes={sizes || (isMobile ? '100vw' : '50vw')}
          style={{ objectFit }}
        />
      ) : (
        <Image
          {...imageProps}
          width={optimalSize?.width || width}
          height={optimalSize?.height || height}
          sizes={sizes || (isMobile ? '100vw' : '50vw')}
        />
      )}

      {/* Placeholder overlay */}
      {showPlaceholder && (
        <div className="absolute inset-0 bg-neutral-200 dark:bg-dark-700 animate-pulse" />
      )}
    </div>
  );
}