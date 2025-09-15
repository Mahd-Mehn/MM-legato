'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { motion } from 'framer-motion';

interface VirtualizedStoryGridProps {
  stories: any[];
  renderItem: (story: any, index: number) => React.ReactNode;
  itemHeight?: number;
  containerHeight?: number;
  overscan?: number;
  className?: string;
}

export default function VirtualizedStoryGrid({
  stories,
  renderItem,
  itemHeight = 400,
  containerHeight = 600,
  overscan = 5,
  className = '',
}: VirtualizedStoryGridProps) {
  const [scrollTop, setScrollTop] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 0, height: containerHeight });
  const containerRef = useRef<HTMLDivElement>(null);

  // Calculate grid dimensions
  const itemsPerRow = useMemo(() => {
    const minItemWidth = 280; // Minimum card width
    const gap = 32; // Gap between items
    return Math.max(1, Math.floor((containerSize.width + gap) / (minItemWidth + gap)));
  }, [containerSize.width]);

  const totalRows = Math.ceil(stories.length / itemsPerRow);
  const totalHeight = totalRows * (itemHeight + 32); // 32px gap

  // Calculate visible range
  const startRow = Math.max(0, Math.floor(scrollTop / (itemHeight + 32)) - overscan);
  const endRow = Math.min(
    totalRows - 1,
    Math.ceil((scrollTop + containerSize.height) / (itemHeight + 32)) + overscan
  );

  const visibleItems = useMemo(() => {
    const items = [];
    for (let row = startRow; row <= endRow; row++) {
      for (let col = 0; col < itemsPerRow; col++) {
        const index = row * itemsPerRow + col;
        if (index < stories.length) {
          items.push({
            story: stories[index],
            index,
            row,
            col,
            top: row * (itemHeight + 32),
            left: col * (100 / itemsPerRow),
          });
        }
      }
    }
    return items;
  }, [stories, startRow, endRow, itemsPerRow, itemHeight]);

  // Handle scroll
  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    setScrollTop(e.currentTarget.scrollTop);
  };

  // Handle resize
  useEffect(() => {
    const handleResize = () => {
      if (containerRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        setContainerSize({ width: rect.width, height: rect.height });
      }
    };

    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // For small lists, use regular grid
  if (stories.length < 20) {
    return (
      <div className={`grid md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 ${className}`}>
        {stories.map((story, index) => renderItem(story, index))}
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className={`relative overflow-auto ${className}`}
      style={{ height: containerHeight }}
      onScroll={handleScroll}
    >
      <div style={{ height: totalHeight, position: 'relative' }}>
        {visibleItems.map(({ story, index, top, left }) => (
          <div
            key={story.id}
            className="absolute"
            style={{
              top: `${top}px`,
              left: `${left}%`,
              width: `${100 / itemsPerRow}%`,
              paddingRight: '16px',
              paddingBottom: '32px',
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              {renderItem(story, index)}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}