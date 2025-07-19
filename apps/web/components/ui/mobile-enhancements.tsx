import React, { ReactNode, useEffect } from 'react';
import { motion } from 'framer-motion';
import { PullToRefresh } from './pull-to-refresh';
import { useHapticFeedback } from '@/hooks/useHapticFeedback';
import { useOrientation } from '@/hooks/useOrientation';
import { cn } from '@/lib/utils';

interface MobileEnhancementsProps {
  children: ReactNode;
  enablePullToRefresh?: boolean;
  enableHapticFeedback?: boolean;
  enableOrientationHandling?: boolean;
  onRefresh?: () => Promise<void>;
  className?: string;
}

export function MobileEnhancements({
  children,
  enablePullToRefresh = true,
  enableHapticFeedback = true,
  enableOrientationHandling = true,
  onRefresh,
  className
}: MobileEnhancementsProps) {
  const { triggerSelection } = useHapticFeedback({ enabled: enableHapticFeedback });
  const { orientation, isLandscape } = useOrientation();

  useEffect(() => {
    if (!enableHapticFeedback) return;

    const handleClick = (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (
        target.tagName === 'BUTTON' ||
        target.closest('button') ||
        target.role === 'button' ||
        target.classList.contains('cursor-pointer')
      ) {
        triggerSelection();
      }
    };

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [enableHapticFeedback, triggerSelection]);

  const content = (
    <motion.div
      className={cn(
        "transition-all duration-300 ease-in-out",
        enableOrientationHandling && isLandscape && "landscape-mode",
        className
      )}
      layout
    >
      {children}
    </motion.div>
  );

  if (enablePullToRefresh && onRefresh) {
    return (
      <PullToRefresh onRefresh={onRefresh}>
        {content}
      </PullToRefresh>
    );
  }

  return content;
}

export function withMobileEnhancements<P extends object>(
  Component: React.ComponentType<P>,
  options: Partial<MobileEnhancementsProps> = {}
) {
  return function EnhancedComponent(props: P) {
    return (
      <MobileEnhancements {...options}>
        <Component {...props} />
      </MobileEnhancements>
    );
  };
}