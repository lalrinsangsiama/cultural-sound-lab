import { useState, useEffect, useCallback, useRef } from 'react';
import { useRouter } from 'next/navigation';

interface SessionTimeoutOptions {
  timeoutMs?: number;
  warningMs?: number;
  checkIntervalMs?: number;
  onWarning?: () => void;
  onTimeout?: () => void;
  autoRedirect?: string;
}

export function useSessionTimeout(options: SessionTimeoutOptions = {}) {
  const {
    timeoutMs = 30 * 60 * 1000, // 30 minutes
    warningMs = 5 * 60 * 1000,  // 5 minutes before timeout
    checkIntervalMs = 60 * 1000, // Check every minute
    onWarning,
    onTimeout,
    autoRedirect = '/login',
  } = options;

  const router = useRouter();
  const [timeRemaining, setTimeRemaining] = useState(timeoutMs);
  const [showWarning, setShowWarning] = useState(false);
  const [isActive, setIsActive] = useState(true);

  const lastActivityRef = useRef(Date.now());
  const warningShownRef = useRef(false);
  const timeoutIdRef = useRef<NodeJS.Timeout>();
  const intervalIdRef = useRef<NodeJS.Timeout>();

  const updateActivity = useCallback(() => {
    lastActivityRef.current = Date.now();
    setTimeRemaining(timeoutMs);
    setShowWarning(false);
    warningShownRef.current = false;
  }, [timeoutMs]);

  const handleTimeout = useCallback(() => {
    setIsActive(false);
    onTimeout?.();
    
    if (autoRedirect) {
      router.push(autoRedirect);
    }
  }, [onTimeout, autoRedirect, router]);

  const handleWarning = useCallback(() => {
    if (!warningShownRef.current) {
      setShowWarning(true);
      warningShownRef.current = true;
      onWarning?.();
    }
  }, [onWarning]);

  const extendSession = useCallback(() => {
    updateActivity();
  }, [updateActivity]);

  const endSession = useCallback(() => {
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
    }
    if (intervalIdRef.current) {
      clearInterval(intervalIdRef.current);
    }
    handleTimeout();
  }, [handleTimeout]);

  useEffect(() => {
    const activityEvents = [
      'mousedown',
      'mousemove',
      'keypress',
      'scroll',
      'touchstart',
      'click',
    ];

    const handleActivity = () => updateActivity();

    // Add event listeners for user activity
    activityEvents.forEach(event => {
      document.addEventListener(event, handleActivity, true);
    });

    // Set up interval to check session timeout
    intervalIdRef.current = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastActivityRef.current;
      const remaining = timeoutMs - elapsed;

      setTimeRemaining(remaining);

      if (remaining <= 0) {
        handleTimeout();
      } else if (remaining <= warningMs && !warningShownRef.current) {
        handleWarning();
      }
    }, checkIntervalMs);

    return () => {
      activityEvents.forEach(event => {
        document.removeEventListener(event, handleActivity, true);
      });
      
      if (intervalIdRef.current) {
        clearInterval(intervalIdRef.current);
      }
      
      if (timeoutIdRef.current) {
        clearTimeout(timeoutIdRef.current);
      }
    };
  }, [timeoutMs, warningMs, checkIntervalMs, handleTimeout, handleWarning, updateActivity]);

  const formatTimeRemaining = useCallback((ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  }, []);

  return {
    timeRemaining,
    timeRemainingFormatted: formatTimeRemaining(timeRemaining),
    showWarning,
    isActive,
    extendSession,
    endSession,
    isExpiringSoon: timeRemaining <= warningMs,
  };
}