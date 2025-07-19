'use client';

import { useState, useEffect } from 'react';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { cn } from '@/lib/utils';
import { Wifi, WifiOff, Clock, AlertCircle, CheckCircle2 } from 'lucide-react';

interface NetworkStatusIndicatorProps {
  className?: string;
  showDetails?: boolean;
}

export function NetworkStatusIndicator({ 
  className, 
  showDetails = false 
}: NetworkStatusIndicatorProps) {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();
  const { pendingOperations, hasPendingOperations, retryAllOperations } = useOfflineStorage();
  const [showRetrySuccess, setShowRetrySuccess] = useState(false);

  const handleRetryAll = async () => {
    await retryAllOperations();
    setShowRetrySuccess(true);
    setTimeout(() => setShowRetrySuccess(false), 3000);
  };

  // Auto-hide success message
  useEffect(() => {
    if (showRetrySuccess && !hasPendingOperations) {
      const timer = setTimeout(() => setShowRetrySuccess(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showRetrySuccess, hasPendingOperations]);

  if (!showDetails && isOnline && !hasPendingOperations) {
    return null; // Hide when everything is normal
  }

  return (
    <div className={cn(
      "fixed top-4 right-4 z-50 max-w-sm",
      className
    )}>
      {/* Connection Status */}
      <div className={cn(
        "flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium shadow-lg",
        isOnline
          ? isSlowConnection
            ? "bg-yellow-100 text-yellow-800 border border-yellow-200"
            : "bg-green-100 text-green-800 border border-green-200"
          : "bg-red-100 text-red-800 border border-red-200"
      )}>
        {isOnline ? (
          <Wifi className="h-4 w-4" />
        ) : (
          <WifiOff className="h-4 w-4" />
        )}
        
        <span>
          {isOnline 
            ? isSlowConnection 
              ? `Slow connection (${effectiveType})` 
              : 'Online'
            : 'Offline'
          }
        </span>
      </div>

      {/* Pending Operations */}
      {hasPendingOperations && (
        <div className="mt-2 bg-blue-50 border border-blue-200 rounded-lg p-3">
          <div className="flex items-start gap-2 mb-2">
            <Clock className="h-4 w-4 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">
                {pendingOperations.length} operation{pendingOperations.length !== 1 ? 's' : ''} pending
              </p>
              <p className="text-xs text-blue-600 mt-1">
                {isOnline 
                  ? 'Retrying automatically...' 
                  : 'Will retry when you\'re back online'
                }
              </p>
            </div>
          </div>

          {isOnline && (
            <button
              onClick={handleRetryAll}
              className="w-full text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700 transition-colors"
            >
              Retry Now
            </button>
          )}

          {showDetails && (
            <div className="mt-2 space-y-1">
              {pendingOperations.slice(0, 3).map((op) => (
                <div key={op.id} className="text-xs text-blue-600 flex items-center gap-1">
                  <span className="font-mono">{op.type}</span>
                  <span>{op.endpoint}</span>
                  {op.retryCount > 0 && (
                    <span className="text-orange-600">
                      (retry {op.retryCount})
                    </span>
                  )}
                </div>
              ))}
              {pendingOperations.length > 3 && (
                <div className="text-xs text-blue-500">
                  +{pendingOperations.length - 3} more...
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Success Message */}
      {showRetrySuccess && (
        <div className="mt-2 bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-green-600" />
          <span className="text-sm text-green-800">
            All operations completed successfully!
          </span>
        </div>
      )}
    </div>
  );
}

export function NetworkStatusBadge() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const { hasPendingOperations } = useOfflineStorage();

  if (isOnline && !hasPendingOperations && !isSlowConnection) {
    return null;
  }

  return (
    <div className={cn(
      "inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium",
      !isOnline
        ? "bg-red-100 text-red-700"
        : isSlowConnection
        ? "bg-yellow-100 text-yellow-700"
        : hasPendingOperations
        ? "bg-blue-100 text-blue-700"
        : "bg-green-100 text-green-700"
    )}>
      {!isOnline ? (
        <>
          <WifiOff className="h-3 w-3" />
          <span>Offline</span>
        </>
      ) : isSlowConnection ? (
        <>
          <AlertCircle className="h-3 w-3" />
          <span>Slow</span>
        </>
      ) : hasPendingOperations ? (
        <>
          <Clock className="h-3 w-3" />
          <span>Syncing</span>
        </>
      ) : (
        <>
          <Wifi className="h-3 w-3" />
          <span>Online</span>
        </>
      )}
    </div>
  );
}