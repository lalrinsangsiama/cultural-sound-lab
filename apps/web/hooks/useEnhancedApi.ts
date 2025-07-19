import { useState, useCallback, useEffect, useRef } from 'react';
import { enhancedApiClient } from '@/lib/api/enhanced-client';
import { useOfflineStorage } from './useOfflineStorage';
import { useNetworkStatus } from './useNetworkStatus';
import { useErrorHandler } from './useErrorHandler';
import { ApiError } from '@/lib/api/error-handling';

interface UseEnhancedApiOptions {
  onSuccess?: (data: any) => void;
  onError?: (error: Error) => void;
  offlineSupport?: boolean;
  retryConfig?: {
    maxRetries?: number;
    initialDelay?: number;
    maxDelay?: number;
    backoffFactor?: number;
  };
}

export function useEnhancedApi() {
  const offlineStorage = useOfflineStorage();
  const networkStatus = useNetworkStatus();
  const { handleError } = useErrorHandler();

  // Set up the enhanced client with offline storage and network status
  useEffect(() => {
    enhancedApiClient.setOfflineStorage(offlineStorage);
    enhancedApiClient.setNetworkStatus(networkStatus);
  }, [offlineStorage, networkStatus]);

  return enhancedApiClient;
}

export function useEnhancedMutation<TData = any, TVariables = any>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options: UseEnhancedApiOptions = {}
) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { handleError } = useErrorHandler();

  const mutate = useCallback(async (variables: TVariables) => {
    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();
    
    setIsLoading(true);
    setError(null);

    try {
      const result = await mutationFn(variables);
      setData(result);
      options.onSuccess?.(result);
      return result;
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // Check if this was queued offline
      if (error instanceof ApiError && error.code === 'OFFLINE_QUEUED') {
        handleError(error, {
          showToast: true,
          toastMessage: 'Your changes will be saved when you\'re back online',
          toastType: 'info',
        });
      } else {
        setError(error);
        handleError(error);
        options.onError?.(error);
      }
      
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [mutationFn, handleError, options]);

  const reset = useCallback(() => {
    setIsLoading(false);
    setError(null);
    setData(null);
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return {
    mutate,
    mutateAsync: mutate,
    isLoading,
    error,
    data,
    reset,
    isError: error !== null,
    isSuccess: data !== null && !error,
  };
}

export function useEnhancedQuery<TData = any>(
  queryKey: string[],
  queryFn: () => Promise<TData>,
  options: UseEnhancedApiOptions & {
    enabled?: boolean;
    refetchInterval?: number;
    refetchOnWindowFocus?: boolean;
    staleTime?: number;
  } = {}
) {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [data, setData] = useState<TData | null>(null);
  const [isRefetching, setIsRefetching] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { handleError } = useErrorHandler();
  const lastFetchTime = useRef<number>(0);

  const { enabled = true, refetchInterval, refetchOnWindowFocus = true, staleTime = 0 } = options;

  const fetchData = useCallback(async (isRefetch = false) => {
    if (!enabled) return;

    // Check if data is still fresh
    if (staleTime > 0 && Date.now() - lastFetchTime.current < staleTime && data !== null) {
      return;
    }

    // Cancel any in-flight requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    if (isRefetch) {
      setIsRefetching(true);
    } else {
      setIsLoading(true);
    }
    
    setError(null);

    try {
      const result = await queryFn();
      setData(result);
      lastFetchTime.current = Date.now();
      options.onSuccess?.(result);
    } catch (err) {
      const error = err instanceof Error ? err : new Error('Unknown error');
      
      // Don't show error if request was cancelled
      if (error.name !== 'AbortError') {
        setError(error);
        handleError(error);
        options.onError?.(error);
      }
    } finally {
      setIsLoading(false);
      setIsRefetching(false);
    }
  }, [enabled, queryFn, handleError, options, staleTime, data]);

  // Initial fetch
  useEffect(() => {
    fetchData();
  }, [queryKey.join(','), enabled]);

  // Refetch interval
  useEffect(() => {
    if (!refetchInterval || !enabled) return;

    const interval = setInterval(() => {
      fetchData(true);
    }, refetchInterval);

    return () => clearInterval(interval);
  }, [refetchInterval, enabled, fetchData]);

  // Refetch on window focus
  useEffect(() => {
    if (!refetchOnWindowFocus || !enabled) return;

    const handleFocus = () => {
      fetchData(true);
    };

    window.addEventListener('focus', handleFocus);
    return () => window.removeEventListener('focus', handleFocus);
  }, [refetchOnWindowFocus, enabled, fetchData]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const refetch = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  return {
    data,
    error,
    isLoading,
    isRefetching,
    refetch,
    isError: error !== null,
    isSuccess: data !== null && !error,
  };
}