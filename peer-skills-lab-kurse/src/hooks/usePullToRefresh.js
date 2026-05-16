import { useState, useRef, useCallback } from "react";

/**
 * usePullToRefresh – returns { pullDistance, isRefreshing, handlers }
 * Attach handlers to the scrollable container div.
 * threshold: px of pull needed to trigger refresh (default 80)
 */
export function usePullToRefresh(onRefresh, threshold = 80) {
  const [pullDistance, setPullDistance] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const startYRef = useRef(null);
  const containerRef = useRef(null);

  const onTouchStart = useCallback((e) => {
    const el = containerRef.current || e.currentTarget;
    if (el.scrollTop === 0) {
      startYRef.current = e.touches[0].clientY;
    }
  }, []);

  const onTouchMove = useCallback((e) => {
    if (startYRef.current === null || isRefreshing) return;
    const delta = e.touches[0].clientY - startYRef.current;
    if (delta > 0) {
      // Rubber-band: dampen pull distance
      setPullDistance(Math.min(delta * 0.5, threshold * 1.25));
    }
  }, [isRefreshing, threshold]);

  const onTouchEnd = useCallback(async () => {
    if (pullDistance >= threshold && !isRefreshing) {
      setIsRefreshing(true);
      setPullDistance(threshold);
      try {
        await onRefresh();
      } finally {
        setIsRefreshing(false);
        setPullDistance(0);
      }
    } else {
      setPullDistance(0);
    }
    startYRef.current = null;
  }, [pullDistance, threshold, isRefreshing, onRefresh]);

  return {
    pullDistance,
    isRefreshing,
    containerRef,
    handlers: { onTouchStart, onTouchMove, onTouchEnd },
  };
}