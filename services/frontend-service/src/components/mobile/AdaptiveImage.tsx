'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useMobileDetection } from '@/hooks/useMobileDetection';
import { useDataSaver } from '@/hooks/useDataSaver';

interface AdaptiveImageProps {
  src: string;
  alt: string;
  width?: number;
  height?: number;
  className?: string;
  priority?: boolean;
  quality?: number;
  placeholder?: 'blur' | 'empty';
  blurDataURL?: string;
  sizes?: string;
  fill?: boolean;
  objectFit?: 'contain' | 'cover' | 'fill' | 'none' | 'scale-down';
  loading?: 'lazy' | 'eager';
}

export function AdaptiveImage({
  src,
  alt,
  width,
  height,
  className = '',
  priority = false,
  quality,
  placeholder = 'blur',
  blurDataURL,
  sizes,
  fill = false,
  objectFit = 'cover',
  loading = 'lazy',
  ...props
}: AdaptiveImageProps) {
  const { isMobile, screenSize } = useMobileDetection();
  const { isDataSaverEnabled, networkInfo } = useDataSaver();
  const [imageError, setImageError] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Adaptive quality based on device and connection
  const getAdaptiveQuality = (): number => {
    if (quality) return quality;
    
    if (isDataSaverEnabled || networkInfo.effectiveType === 'slow-2g' || networkInfo.effectiveType === '2g') {
      return 30;
    }
    
    if (networkInfo.effectiveType === '3g' || isMobile) {
      return 60;
    }
    
    return 85;
  };

  // Adaptive sizes based on screen size
  const getAdaptiveSizes = (): string => {
    if (sizes) return sizes;
    
    switch (screenSize) {
      case 'sm':
        return '(max-width: 640px) 100vw, 640px';
      case 'md':
        return '(max-width: 768px) 100vw, 768px';
      case 'lg':
        return '(max-width: 1024px) 100vw, 1024px';
      default:
        return '(max-width: 1280px) 100vw, 1280px';
    }
  };

  // Generate blur placeholder for better UX
  const generateBlurDataURL = (w: number = 10, h: number = 10): string => {
    if (blurDataURL) return blurDataURL;
    
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    
    if (ctx) {
      // Create a simple gradient blur placeholder
      const gradient = ctx.createLinearGradient(0, 0, w, h);
      gradient.addColorStop(0, '#f3f4f6');
      gradient.addColorStop(1, '#e5e7eb');
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, w, h);
    }
    
    return canvas.toDataURL();
  };

  // Handle image load error
  const handleError = () => {
    setImageError(true);
  };

  // Handle image load success
  const handleLoad = () => {
    setIsLoaded(true);
  };

  // Don't load images in data saver mode unless priority
  if (isDataSaverEnabled && !priority && !isLoaded) {
    return (
      <div 
        className={`bg-neutral-200 dark:bg-dark-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-center p-4">
          <div className="text-neutral-500 dark:text-neutral-400 text-sm mb-2">
            Image loading disabled
          </div>
          <button
            onClick={() => setIsLoaded(true)}
            className="text-primary-600 dark:text-primary-400 text-sm underline"
          >
            Load image
          </button>
        </div>
      </div>
    );
  }

  // Error state
  if (imageError) {
    return (
      <div 
        className={`bg-neutral-100 dark:bg-dark-700 flex items-center justify-center ${className}`}
        style={{ width, height }}
      >
        <div className="text-neutral-500 dark:text-neutral-400 text-sm text-center p-4">
          Failed to load image
        </div>
      </div>
    );
  }

  const imageProps = {
    src,
    alt,
    className: `transition-opacity duration-300 ${isLoaded ? 'opacity-100' : 'opacity-0'} ${className}`,
    quality: getAdaptiveQuality(),
    priority,
    loading: priority ? 'eager' as const : loading,
    onError: handleError,
    onLoad: handleLoad,
    placeholder: placeholder as any,
    blurDataURL: placeholder === 'blur' ? generateBlurDataURL() : undefined,
    ...props,
  };

  if (fill) {
    return (
      <Image
        {...imageProps}
        fill
        sizes={getAdaptiveSizes()}
        style={{ objectFit }}
      />
    );
  }

  return (
    <Image
      {...imageProps}
      width={width}
      height={height}
      sizes={getAdaptiveSizes()}
    />
  );
}