import { useState, useEffect, useCallback, useRef } from 'react';

interface UsePullToRefreshOptions {
  onRefresh: () => Promise<void>;
  threshold?: number;
  resistance?: number;
  maxPull?: number;
  enabled?: boolean;
}

interface PullToRefreshState {
  isPulling: boolean;
  pullDistance: number;
  isRefreshing: boolean;
}

export function usePullToRefresh({
  onRefresh,
  threshold = 80,
  resistance = 2.5,
  maxPull = 150,
  enabled = true
}: UsePullToRefreshOptions) {
  const [state, setState] = useState<PullToRefreshState>({
    isPulling: false,
    pullDistance: 0,
    isRefreshing: false
  });

  const startY = useRef(0);
  const currentY = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleTouchStart = useCallback((e: TouchEvent) => {
    if (!enabled || state.isRefreshing) return;

    const touch = e.touches[0];
    if (!touch) return;
    
    startY.current = touch.pageY;
    currentY.current = touch.pageY;

    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;
    
    if (scrollTop === 0) {
      setState(prev => ({ ...prev, isPulling: true }));
    }
  }, [enabled, state.isRefreshing]);

  const handleTouchMove = useCallback((e: TouchEvent) => {
    if (!state.isPulling || state.isRefreshing) return;

    const touch = e.touches[0];
    if (!touch) return;
    
    currentY.current = touch.pageY;
    
    const distance = Math.max(0, currentY.current - startY.current);
    const pullDistance = Math.min(maxPull, distance / resistance);

    if (pullDistance > 0) {
      e.preventDefault();
      setState(prev => ({ ...prev, pullDistance }));
    }
  }, [state.isPulling, state.isRefreshing, resistance, maxPull]);

  const handleTouchEnd = useCallback(async () => {
    if (!state.isPulling || state.isRefreshing) return;

    const shouldRefresh = state.pullDistance >= threshold;

    if (shouldRefresh) {
      setState(prev => ({ ...prev, isRefreshing: true }));
      
      try {
        await onRefresh();
      } catch (error) {
        console.error('Pull to refresh error:', error);
      } finally {
        setState({
          isPulling: false,
          pullDistance: 0,
          isRefreshing: false
        });
      }
    } else {
      setState({
        isPulling: false,
        pullDistance: 0,
        isRefreshing: false
      });
    }
  }, [state.isPulling, state.pullDistance, state.isRefreshing, threshold, onRefresh]);

  useEffect(() => {
    if (!enabled) return;

    document.addEventListener('touchstart', handleTouchStart, { passive: false });
    document.addEventListener('touchmove', handleTouchMove, { passive: false });
    document.addEventListener('touchend', handleTouchEnd);

    return () => {
      document.removeEventListener('touchstart', handleTouchStart);
      document.removeEventListener('touchmove', handleTouchMove);
      document.removeEventListener('touchend', handleTouchEnd);
    };
  }, [enabled, handleTouchStart, handleTouchMove, handleTouchEnd]);

  return {
    containerRef,
    ...state,
    progress: Math.min(1, state.pullDistance / threshold)
  };
}