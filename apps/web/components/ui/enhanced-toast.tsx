'use client';

import { useState, useEffect, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { X, AlertCircle, CheckCircle2, Info, AlertTriangle, RefreshCw, Wifi } from 'lucide-react';
import { Button } from './button';

export interface ToastAction {
  label: string;
  onClick: () => void;
  variant?: 'default' | 'destructive' | 'outline';
}

export interface ToastData {
  id: string;
  title?: string;
  description?: string;
  type?: 'success' | 'error' | 'warning' | 'info' | 'loading';
  duration?: number;
  persistent?: boolean;
  actions?: ToastAction[];
  onDismiss?: () => void;
  showRetry?: boolean;
  onRetry?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

const TOAST_ICONS = {
  success: CheckCircle2,
  error: AlertCircle,
  warning: AlertTriangle,
  info: Info,
  loading: RefreshCw,
};

const TOAST_STYLES = {
  success: 'bg-green-50 border-green-200 text-green-800',
  error: 'bg-red-50 border-red-200 text-red-800',
  warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
  info: 'bg-blue-50 border-blue-200 text-blue-800',
  loading: 'bg-gray-50 border-gray-200 text-gray-800',
};

interface ToastProps {
  toast: ToastData;
  onDismiss: (id: string) => void;
}

function Toast({ toast, onDismiss }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [timeLeft, setTimeLeft] = useState(toast.duration || 0);

  const handleDismiss = useCallback(() => {
    setIsExiting(true);
    setTimeout(() => {
      onDismiss(toast.id);
      toast.onDismiss?.();
    }, 150);
  }, [toast.id, toast.onDismiss, onDismiss]);

  useEffect(() => {
    if (!toast.persistent && toast.duration && toast.duration > 0) {
      setTimeLeft(toast.duration);
      
      const interval = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 100) {
            handleDismiss();
            return 0;
          }
          return prev - 100;
        });
      }, 100);

      return () => clearInterval(interval);
    }
  }, [toast.duration, toast.persistent, handleDismiss]);

  const Icon = TOAST_ICONS[toast.type || 'info'];
  const isLoading = toast.type === 'loading';
  const showProgress = !toast.persistent && toast.duration && toast.duration > 0;

  const handleRetry = () => {
    if (toast.onRetry) {
      toast.onRetry();
    }
  };

  return (
    <div
      className={cn(
        "relative flex items-start gap-3 p-4 rounded-lg border shadow-lg transition-all duration-150 ease-out",
        TOAST_STYLES[toast.type || 'info'],
        isExiting ? "opacity-0 scale-95 translate-x-full" : "opacity-100 scale-100 translate-x-0"
      )}
    >
      {/* Progress bar */}
      {showProgress && (
        <div className="absolute bottom-0 left-0 h-1 bg-current opacity-20 rounded-b-lg transition-all duration-100 ease-linear"
             style={{ width: `${(timeLeft / (toast.duration || 1)) * 100}%` }} />
      )}

      {/* Icon */}
      <div className="flex-shrink-0 mt-0.5">
        <Icon 
          className={cn(
            "h-5 w-5",
            isLoading && "animate-spin"
          )} 
        />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        {toast.title && (
          <p className="font-medium text-sm">{toast.title}</p>
        )}
        {toast.description && (
          <p className={cn(
            "text-sm",
            toast.title ? "mt-1 opacity-90" : ""
          )}>
            {toast.description}
          </p>
        )}

        {/* Retry info */}
        {toast.showRetry && toast.retryCount !== undefined && toast.maxRetries !== undefined && (
          <p className="text-xs mt-2 opacity-75">
            Retry {toast.retryCount} of {toast.maxRetries}
          </p>
        )}

        {/* Actions */}
        {(toast.actions || toast.showRetry) && (
          <div className="flex gap-2 mt-3">
            {toast.showRetry && toast.onRetry && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleRetry}
                className="h-7 px-2 text-xs"
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                Retry
              </Button>
            )}
            {toast.actions?.map((action, index) => (
              <Button
                key={index}
                size="sm"
                variant={action.variant || "outline"}
                onClick={action.onClick}
                className="h-7 px-2 text-xs"
              >
                {action.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Dismiss button */}
      {!toast.persistent && (
        <button
          onClick={handleDismiss}
          className="flex-shrink-0 p-1 rounded hover:bg-black/10 transition-colors"
          aria-label="Dismiss"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

// Toast container
interface ToastContainerProps {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
}

export function ToastContainer({ 
  toasts, 
  onDismiss, 
  position = 'top-right' 
}: ToastContainerProps) {
  const positionClasses = {
    'top-right': 'top-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-right': 'bottom-4 right-4',
    'bottom-left': 'bottom-4 left-4',
    'top-center': 'top-4 left-1/2 -translate-x-1/2',
    'bottom-center': 'bottom-4 left-1/2 -translate-x-1/2',
  };

  if (toasts.length === 0) return null;

  return (
    <div className={cn(
      "fixed z-50 max-w-sm w-full space-y-2",
      positionClasses[position]
    )}>
      {toasts.map((toast) => (
        <Toast
          key={toast.id}
          toast={toast}
          onDismiss={onDismiss}
        />
      ))}
    </div>
  );
}

// Enhanced toast manager
class EnhancedToastManager {
  private toasts: ToastData[] = [];
  private listeners: Array<(toasts: ToastData[]) => void> = [];
  private idCounter = 0;

  subscribe(listener: (toasts: ToastData[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private emit() {
    this.listeners.forEach(listener => listener([...this.toasts]));
  }

  private generateId() {
    return `toast-${++this.idCounter}-${Date.now()}`;
  }

  add(toast: Omit<ToastData, 'id'>) {
    const id = this.generateId();
    const newToast: ToastData = {
      duration: 5000,
      ...toast,
      id,
    };

    this.toasts.push(newToast);
    this.emit();

    return id;
  }

  dismiss(id: string) {
    this.toasts = this.toasts.filter(toast => toast.id !== id);
    this.emit();
  }

  dismissAll() {
    this.toasts = [];
    this.emit();
  }

  // Enhanced methods for common use cases
  error(description: string, options?: Partial<ToastData>) {
    return this.add({
      type: 'error',
      title: 'Error',
      description,
      duration: 7000,
      persistent: false,
      ...options,
    });
  }

  networkError(description?: string, onRetry?: () => void) {
    return this.add({
      type: 'error',
      title: 'Connection Error',
      description: description || 'Please check your internet connection',
      persistent: true,
      showRetry: !!onRetry,
      onRetry,
      actions: [
        {
          label: 'Check Network',
          onClick: () => {
            // Open network settings or run network diagnostic
            if (navigator.onLine) {
              window.open('https://www.google.com', '_blank');
            }
          },
        },
      ],
    });
  }

  retryableError(description: string, onRetry: () => void, retryCount = 0, maxRetries = 3) {
    return this.add({
      type: 'error',
      title: retryCount > 0 ? `Retry ${retryCount}/${maxRetries}` : 'Error',
      description,
      persistent: retryCount >= maxRetries,
      duration: retryCount >= maxRetries ? undefined : 5000,
      showRetry: retryCount < maxRetries,
      onRetry,
      retryCount,
      maxRetries,
    });
  }

  offlineQueue(description?: string) {
    return this.add({
      type: 'info',
      title: 'Saved for Later',
      description: description || 'Your changes will be synced when you\'re back online',
      duration: 4000,
      actions: [
        {
          label: 'View Queue',
          onClick: () => {
            // Navigate to offline queue view
            console.log('Navigate to offline queue');
          },
        },
      ],
    });
  }

  success(description: string, options?: Partial<ToastData>) {
    return this.add({
      type: 'success',
      title: 'Success',
      description,
      duration: 3000,
      ...options,
    });
  }

  loading(description: string, options?: Partial<ToastData>) {
    return this.add({
      type: 'loading',
      description,
      persistent: true,
      ...options,
    });
  }
}

export const enhancedToast = new EnhancedToastManager();

// Hook for using enhanced toasts
export function useEnhancedToast() {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  useEffect(() => {
    return enhancedToast.subscribe(setToasts);
  }, []);

  return {
    toasts,
    toast: enhancedToast,
    dismissToast: (id: string) => enhancedToast.dismiss(id),
    dismissAll: () => enhancedToast.dismissAll(),
  };
}