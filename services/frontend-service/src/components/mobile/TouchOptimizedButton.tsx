'use client';

import React, { forwardRef } from 'react';
import { motion } from 'framer-motion';
import { useTouchGestures } from '@/hooks/useTouchGestures';

interface TouchOptimizedButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  fullWidth?: boolean;
  loading?: boolean;
  hapticFeedback?: boolean;
  children: React.ReactNode;
}

export const TouchOptimizedButton = forwardRef<HTMLButtonElement, TouchOptimizedButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    fullWidth = false,
    loading = false,
    hapticFeedback = true,
    className = '',
    onClick,
    children,
    disabled,
    ...props 
  }, ref) => {
    const touchRef = useTouchGestures({
      onLongPress: () => {
        // Provide haptic feedback on long press
        if (hapticFeedback && 'vibrate' in navigator) {
          navigator.vibrate(50);
        }
      },
    });

    const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
      // Provide haptic feedback on tap
      if (hapticFeedback && 'vibrate' in navigator) {
        navigator.vibrate(25);
      }
      
      if (onClick && !disabled && !loading) {
        onClick(e);
      }
    };

    const baseClasses = `
      relative inline-flex items-center justify-center
      font-medium rounded-lg transition-all duration-200
      focus:outline-none focus:ring-2 focus:ring-offset-2
      disabled:opacity-50 disabled:cursor-not-allowed
      active:scale-95 touch-manipulation
      ${fullWidth ? 'w-full' : ''}
    `;

    const variantClasses = {
      primary: `
        bg-primary-600 hover:bg-primary-700 text-white
        focus:ring-primary-500 shadow-sm hover:shadow-md
        dark:bg-primary-500 dark:hover:bg-primary-600
      `,
      secondary: `
        bg-neutral-100 hover:bg-neutral-200 text-neutral-900
        focus:ring-neutral-500 shadow-sm hover:shadow-md
        dark:bg-dark-700 dark:hover:bg-dark-600 dark:text-neutral-100
      `,
      outline: `
        border-2 border-primary-600 text-primary-600 hover:bg-primary-50
        focus:ring-primary-500 hover:border-primary-700
        dark:border-primary-400 dark:text-primary-400 dark:hover:bg-primary-900/20
      `,
      ghost: `
        text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900
        focus:ring-neutral-500
        dark:text-neutral-300 dark:hover:bg-dark-700 dark:hover:text-neutral-100
      `,
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[36px]',
      md: 'px-4 py-3 text-base min-h-[44px]',
      lg: 'px-6 py-4 text-lg min-h-[52px]',
      xl: 'px-8 py-5 text-xl min-h-[60px]',
    };

    const { 
      onAnimationStart, 
      onAnimationEnd, 
      onDragStart,
      onDragEnd,
      onDrag,
      ...buttonProps 
    } = props;

    return (
      <motion.button
        ref={(node) => {
          if (typeof ref === 'function') {
            ref(node);
          } else if (ref) {
            ref.current = node;
          }
          // Also assign to touch gesture ref
          if (node) {
            (touchRef as any).current = node;
          }
        }}
        whileTap={{ scale: 0.95 }}
        whileHover={{ scale: 1.02 }}
        className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${className}`}
        onClick={handleClick}
        disabled={disabled || loading}
        {...buttonProps}
      >
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" />
          </div>
        )}
        
        <span className={loading ? 'opacity-0' : 'opacity-100'}>
          {children}
        </span>
      </motion.button>
    );
  }
);

TouchOptimizedButton.displayName = 'TouchOptimizedButton';