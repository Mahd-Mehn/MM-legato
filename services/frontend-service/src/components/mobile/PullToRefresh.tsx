'use client';

import React, { useState, useRef, useCallback } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { RefreshCw } from 'lucide-react';

interface PullToRefreshProps {
  children: React.ReactNode;
  onRefresh: () => Promise<void>;
  refreshThreshold?: number;
  maxPullDistance?: number;
  disabled?: boolean;
  className?: string;
}

export function PullToRefresh({
  children,
  onRefresh,
  refreshThreshold = 80,
  maxPullDistance = 120,
  disabled = false,
  className = '',
}: PullToRefreshProps) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [canRefresh, setCanRefresh] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleDrag = useCallback((event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    const container = containerRef.current;
    if (!container) return;

    // Only allow pull to refresh when scrolled to top
    if (container.scrollTop > 0) return;

    const dragY = Math.max(0, info.offset.y);
    const distance = Math.min(dragY, maxPullDistance);
    
    setPullDistance(distance);
    setCanRefresh(distance >= refreshThreshold);
  }, [disabled, isRefreshing, maxPullDistance, refreshThreshold]);

  const handleDragEnd = useCallback(async (event: any, info: PanInfo) => {
    if (disabled || isRefreshing) return;

    if (canRefresh && pullDistance >= refreshThreshold) {
      setIsRefreshing(true);
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Refresh failed:', error);
      } finally {
        setIsRefreshing(false);
      }
    }

    setPullDistance(0);
    setCanRefresh(false);
  }, [disabled, isRefreshing, canRefresh, pullDistance, refreshThreshold, onRefresh]);

  const pullProgress = Math.min(pullDistance / refreshThreshold, 1);
  const iconRotation = pullProgress * 180;

  return (
    <div className={`relative overflow-hidden ${className}`}>
      {/* Pull indicator */}
      <motion.div
        className="absolute top-0 left-0 right-0 z-10 flex items-center justify-center bg-white dark:bg-dark-800 border-b border-neutral-200 dark:border-dark-700"
        initial={{ height: 0, opacity: 0 }}
        animate={{
          height: pullDistance > 0 ? Math.min(pullDistance, 60) : 0,
          opacity: pullDistance > 0 ? 1 : 0,
        }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
      >
        <div className="flex items-center space-x-2 text-neutral-600 dark:text-neutral-400">
          <motion.div
            animate={{ rotate: isRefreshing ? 360 : iconRotation }}
            transition={{
              duration: isRefreshing ? 1 : 0,
              repeat: isRefreshing ? Infinity : 0,
              ease: 'linear',
            }}
          >
            <RefreshCw 
              size={20} 
              className={canRefresh ? 'text-primary-600 dark:text-primary-400' : ''} 
            />
          </motion.div>
          <span className="text-sm">
            {isRefreshing 
              ? 'Refreshing...' 
              : canRefresh 
                ? 'Release to refresh' 
                : 'Pull to refresh'
            }
          </span>
        </div>
      </motion.div>

      {/* Content container */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.2}
        onDrag={handleDrag}
        onDragEnd={handleDragEnd}
        animate={{ y: isRefreshing ? 60 : pullDistance }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="h-full overflow-auto"
        style={{
          WebkitOverflowScrolling: 'touch',
        }}
      >
        {children}
      </motion.div>
    </div>
  );
}