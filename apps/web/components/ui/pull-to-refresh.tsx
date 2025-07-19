import React, { ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RefreshCw } from 'lucide-react';
import { usePullToRefresh } from '@/hooks/usePullToRefresh';
import { cn } from '@/lib/utils';

interface PullToRefreshProps {
  children: ReactNode;
  onRefresh: () => Promise<void>;
  enabled?: boolean;
  className?: string;
}

export function PullToRefresh({ 
  children, 
  onRefresh, 
  enabled = true,
  className 
}: PullToRefreshProps) {
  const {
    containerRef,
    isPulling,
    pullDistance,
    isRefreshing,
    progress
  } = usePullToRefresh({
    onRefresh,
    enabled
  });

  const rotation = progress * 180;
  const scale = 0.8 + (progress * 0.4);
  const opacity = Math.min(1, progress * 1.5);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      <AnimatePresence>
        {(isPulling || isRefreshing) && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ 
              opacity: opacity,
              scale: scale,
              y: pullDistance
            }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="absolute top-0 left-0 right-0 flex justify-center"
            style={{
              marginTop: `-${Math.min(60, pullDistance)}px`
            }}
          >
            <div className="bg-background/80 backdrop-blur-sm rounded-full p-3 shadow-lg">
              <motion.div
                animate={{ 
                  rotate: isRefreshing ? 360 : rotation 
                }}
                transition={
                  isRefreshing 
                    ? { duration: 1, repeat: Infinity, ease: "linear" }
                    : { duration: 0 }
                }
              >
                <RefreshCw 
                  className={cn(
                    "w-6 h-6 transition-colors",
                    progress >= 1 ? "text-primary" : "text-muted-foreground"
                  )}
                />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <motion.div
        animate={{
          y: isPulling && !isRefreshing ? pullDistance : 0
        }}
        transition={{ type: "spring", stiffness: 400, damping: 30 }}
      >
        {children}
      </motion.div>
    </div>
  );
}