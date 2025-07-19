"use client";

import { useNetworkStatus } from '@/hooks/useNetworkStatus';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { WifiOff, Wifi, Signal } from 'lucide-react';
import { useEffect, useState } from 'react';

export function NetworkStatusIndicator() {
  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [showOffline, setShowOffline] = useState(false);
  const [showSlow, setShowSlow] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setShowOffline(true);
      setShowSlow(false);
    } else {
      setShowOffline(false);
      if (isSlowConnection) {
        setShowSlow(true);
      } else {
        setShowSlow(false);
      }
    }
  }, [isOnline, isSlowConnection]);

  if (showOffline) {
    return (
      <Alert variant="destructive" className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto">
        <WifiOff className="h-4 w-4" />
        <AlertDescription>
          You're offline. Some features may not work properly.
        </AlertDescription>
      </Alert>
    );
  }

  if (showSlow) {
    return (
      <Alert variant="default" className="fixed top-4 left-4 right-4 z-50 max-w-md mx-auto bg-orange-50 border-orange-200">
        <Signal className="h-4 w-4 text-orange-600" />
        <AlertDescription className="text-orange-800">
          Slow connection detected. Some features may load slowly.
        </AlertDescription>
      </Alert>
    );
  }

  return null;
}

export function OfflineIndicator() {
  const { isOnline } = useNetworkStatus();

  if (isOnline) return null;

  return (
    <div className="bg-destructive text-destructive-foreground px-4 py-2 text-sm text-center">
      <div className="flex items-center justify-center gap-2">
        <WifiOff className="h-4 w-4" />
        You're currently offline
      </div>
    </div>
  );
}

export function ConnectionQualityBadge() {
  const { isOnline, isSlowConnection, effectiveType } = useNetworkStatus();

  if (!isOnline) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-destructive/10 text-destructive text-xs rounded-full">
        <WifiOff className="h-3 w-3" />
        Offline
      </div>
    );
  }

  if (isSlowConnection) {
    return (
      <div className="inline-flex items-center gap-1 px-2 py-1 bg-orange-100 text-orange-700 text-xs rounded-full">
        <Signal className="h-3 w-3" />
        Slow ({effectiveType})
      </div>
    );
  }

  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 text-green-700 text-xs rounded-full">
      <Wifi className="h-3 w-3" />
      Online
    </div>
  );
}