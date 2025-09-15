import { useState, useEffect } from 'react';

/**
 * Hook to handle mobile viewport height issues (address bar, etc.)
 * Returns both the window height and the visual viewport height
 */
export function useViewportHeight() {
  const [heights, setHeights] = useState({
    windowHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    visualViewportHeight: typeof window !== 'undefined' ? window.innerHeight : 0,
    isKeyboardOpen: false,
  });

  useEffect(() => {
    const updateHeights = () => {
      const windowHeight = window.innerHeight;
      const visualViewportHeight = window.visualViewport?.height || windowHeight;
      const isKeyboardOpen = visualViewportHeight < windowHeight * 0.75;

      setHeights({
        windowHeight,
        visualViewportHeight,
        isKeyboardOpen,
      });

      // Update CSS custom properties for use in styles
      document.documentElement.style.setProperty('--vh', `${windowHeight * 0.01}px`);
      document.documentElement.style.setProperty('--vvh', `${visualViewportHeight * 0.01}px`);
    };

    updateHeights();

    // Listen to both resize and visual viewport changes
    window.addEventListener('resize', updateHeights);
    window.visualViewport?.addEventListener('resize', updateHeights);

    return () => {
      window.removeEventListener('resize', updateHeights);
      window.visualViewport?.removeEventListener('resize', updateHeights);
    };
  }, []);

  return heights;
}