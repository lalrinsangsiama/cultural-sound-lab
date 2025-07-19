import { useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { enhancedToast } from '@/components/ui/enhanced-toast';
import { ApiError } from '@/lib/api-client';
import { captureApiError } from '@/lib/api/error-handling';

interface ErrorOptions {
  title?: string;
  description?: string;
  action?: () => void;
  actionLabel?: string;
  showToast?: boolean;
  toastMessage?: string;
  toastType?: 'error' | 'warning' | 'info';
  retryAction?: () => void;
  retryCount?: number;
  maxRetries?: number;
}

export function useErrorHandler() {
  const { toast } = useToast();

  const handleError = useCallback((error: unknown, options: ErrorOptions = {}) => {
    console.error('Error:', error);

    // Capture error for monitoring
    captureApiError(error, {
      userAction: true,
      options,
    });

    let message = 'An unexpected error occurred';
    let isNetworkError = false;
    let isRetryable = false;
    
    if (error instanceof ApiError) {
      message = error.message;
      isNetworkError = error.code === 'NETWORK_ERROR';
      isRetryable = [408, 429, 500, 502, 503, 504].includes(error.status);
    } else if (error instanceof Error) {
      message = error.message;
      isNetworkError = error.name === 'NetworkError' || message.includes('Network');
    } else if (typeof error === 'string') {
      message = error;
    } else if (error && typeof error === 'object' && 'message' in error) {
      message = String(error.message);
    }

    // Handle specific error types with enhanced toasts
    if (options.showToast !== false) {
      if (isNetworkError) {
        enhancedToast.networkError(
          options.toastMessage || message,
          options.retryAction
        );
      } else if (isRetryable && options.retryAction) {
        enhancedToast.retryableError(
          options.toastMessage || message,
          options.retryAction,
          options.retryCount || 0,
          options.maxRetries || 3
        );
      } else {
        // Use enhanced toast for better error experience
        enhancedToast.error(
          options.toastMessage || message,
          {
            title: options.title,
            actions: options.action && options.actionLabel ? [{
              label: options.actionLabel,
              onClick: options.action,
            }] : undefined,
          }
        );
      }
    } else {
      // Fallback to standard toast if requested
      toast({
        title: options?.title || 'Error',
        description: options?.description || message,
        variant: 'destructive',
      });
    }
  }, [toast]);

  return { handleError };
}

// Export a singleton instance for global use
let globalErrorHandler: ((error: unknown, options?: ErrorOptions) => void) | null = null;

export function setGlobalErrorHandler(handler: (error: unknown, options?: ErrorOptions) => void) {
  globalErrorHandler = handler;
}

export function handleGlobalError(error: unknown, options?: ErrorOptions) {
  if (globalErrorHandler) {
    globalErrorHandler(error, options);
  } else {
    console.error('Global error handler not set:', error);
  }
}