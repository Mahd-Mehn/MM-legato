'use client';

import React, { useState, useRef } from 'react';
import { motion, PanInfo } from 'framer-motion';
import { useTouchGestures } from '@/hooks/useTouchGestures';

interface SwipeAction {
  icon: React.ReactNode;
  label: string;
  color: string;
  action: () => void;
}

interface SwipeableCardProps {
  children: React.ReactNode;
  leftAction?: SwipeAction;
  rightAction?: SwipeAction;
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
  className?: string;
  disabled?: boolean;
}

export function SwipeableCard({
  children,
  leftAction,
  rightAction,
  onSwipeLeft,
  onSwipeRight,
  className = '',
  disabled = false,
}: SwipeableCardProps) {
  const [dragX, setDragX] = useState(0);
  const [isRevealed, setIsRevealed] = useState<'left' | 'right' | null>(null);
  const constraintsRef = useRef<HTMLDivElement>(null);

  const swipeThreshold = 80;
  const maxDrag = 120;

  const handleDragEnd = (event: any, info: PanInfo) => {
    const { offset, velocity } = info;
    const swipe = Math.abs(offset.x) > swipeThreshold || Math.abs(velocity.x) > 500;

    if (swipe) {
      if (offset.x > 0 && rightAction) {
        // Swiped right, show left action
        setIsRevealed('left');
        setDragX(maxDrag);
      } else if (offset.x < 0 && leftAction) {
        // Swiped left, show right action
        setIsRevealed('right');
        setDragX(-maxDrag);
      } else {
        setDragX(0);
        setIsRevealed(null);
      }
    } else {
      setDragX(0);
      setIsRevealed(null);
    }
  };

  const handleActionClick = (action: SwipeAction) => {
    action.action();
    setDragX(0);
    setIsRevealed(null);
  };

  const resetCard = () => {
    setDragX(0);
    setIsRevealed(null);
  };

  const touchRef = useTouchGestures({
    onSwipeLeft: () => {
      if (!disabled && onSwipeLeft) {
        onSwipeLeft();
      }
    },
    onSwipeRight: () => {
      if (!disabled && onSwipeRight) {
        onSwipeRight();
      }
    },
  });

  return (
    <div 
      ref={constraintsRef}
      className={`relative overflow-hidden ${className}`}
    >
      {/* Background Actions */}
      {rightAction && (
        <div className="absolute left-0 top-0 bottom-0 flex items-center justify-start pl-4 w-32">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isRevealed === 'left' ? 1 : 0,
              opacity: isRevealed === 'left' ? 1 : 0
            }}
            onClick={() => handleActionClick(rightAction)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-full text-white ${rightAction.color}`}
          >
            {rightAction.icon}
            <span className="text-xs mt-1">{rightAction.label}</span>
          </motion.button>
        </div>
      )}

      {leftAction && (
        <div className="absolute right-0 top-0 bottom-0 flex items-center justify-end pr-4 w-32">
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ 
              scale: isRevealed === 'right' ? 1 : 0,
              opacity: isRevealed === 'right' ? 1 : 0
            }}
            onClick={() => handleActionClick(leftAction)}
            className={`flex flex-col items-center justify-center w-16 h-16 rounded-full text-white ${leftAction.color}`}
          >
            {leftAction.icon}
            <span className="text-xs mt-1">{leftAction.label}</span>
          </motion.button>
        </div>
      )}

      {/* Main Card Content */}
      <motion.div
        ref={touchRef as React.RefObject<HTMLDivElement>}
        drag={disabled ? false : 'x'}
        dragConstraints={constraintsRef}
        dragElastic={0.1}
        onDragEnd={handleDragEnd}
        animate={{ x: dragX }}
        transition={{ type: 'spring', damping: 25, stiffness: 200 }}
        className="relative z-10 bg-white dark:bg-dark-800 touch-manipulation"
        style={{
          cursor: disabled ? 'default' : 'grab',
        }}
        whileDrag={{ cursor: 'grabbing' }}
      >
        {children}
      </motion.div>

      {/* Tap to reset overlay */}
      {isRevealed && (
        <div 
          className="absolute inset-0 z-20 bg-transparent"
          onClick={resetCard}
        />
      )}
    </div>
  );
}