import { useState, useEffect, useRef, useCallback } from 'react';
import { apiClient } from '@/lib/api/client';
import { ApiError, getUserFriendlyErrorMessage } from '@/lib/api/error-handling';

export interface UseApiQueryOptions<T> {
  enabled?: boolean;
  refetchOnMount?: boolean;
  refetchOnWindowFocus?: boolean;
  staleTime?: number;
  cacheTime?: number;
  retryOnMount?: boolean;
  onSuccess?: (data: T) => void;
  onError?: (error: ApiError) => void;
}

export interface ApiQueryResult<T> {
  data: T | null;
  error: ApiError | null;
  isLoading: boolean;
  isFetching: boolean;
  isError: boolean;
  isSuccess: boolean;
  refetch: () => Promise<void>;
  reset: () => void;
}

export function useApiQuery<T>(
  endpoint: string,
  options: UseApiQueryOptions<T> = {}
): ApiQueryResult<T> {
  const {
    enabled = true,
    refetchOnMount = true,
    refetchOnWindowFocus = false,
    staleTime = 5 * 60 * 1000, // 5 minutes
    cacheTime = 10 * 60 * 1000, // 10 minutes
    retryOnMount = true,
    onSuccess,
    onError,
  } = options;

  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isFetching, setIsFetching] = useState(false);

  const abortControllerRef = useRef<AbortController>();
  const cacheRef = useRef<{
    data: T;
    timestamp: number;
  } | null>(null);

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    setIsFetching(false);
    cacheRef.current = null;
    abortControllerRef.current?.abort();
  }, []);

  const fetchData = useCallback(async (showLoading = true) => {
    if (!enabled) return;

    // Check cache
    if (cacheRef.current) {
      const age = Date.now() - cacheRef.current.timestamp;
      if (age < staleTime) {
        setData(cacheRef.current.data);
        setError(null);
        return;
      }
    }

    abortControllerRef.current?.abort();
    abortControllerRef.current = new AbortController();

    if (showLoading && !data) {
      setIsLoading(true);
    }
    setIsFetching(true);
    setError(null);

    try {
      const result = await apiClient.get<T>(endpoint, {
        signal: abortControllerRef.current.signal,
      });

      if (abortControllerRef.current.signal.aborted) return;

      setData(result);
      setError(null);
      cacheRef.current = {
        data: result,
        timestamp: Date.now(),
      };

      onSuccess?.(result);
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const apiError = err instanceof ApiError ? err : new ApiError(
        getUserFriendlyErrorMessage(err),
        500
      );

      setError(apiError);
      setData(null);
      onError?.(apiError);
    } finally {
      setIsLoading(false);
      setIsFetching(false);
    }
  }, [endpoint, enabled, staleTime, data, onSuccess, onError]);

  const refetch = useCallback(() => {
    cacheRef.current = null;
    return fetchData(false);
  }, [fetchData]);

  useEffect(() => {
    if (enabled && refetchOnMount) {
      fetchData();
    }

    return () => {
      abortControllerRef.current?.abort();
    };
  }, [enabled, refetchOnMount, fetchData]);

  useEffect(() => {
    if (!refetchOnWindowFocus) return;

    const handleFocus = () => {
      if (enabled && document.visibilityState === 'visible') {
        fetchData(false);
      }
    };

    window.addEventListener('visibilitychange', handleFocus);
    window.addEventListener('focus', handleFocus);

    return () => {
      window.removeEventListener('visibilitychange', handleFocus);
      window.removeEventListener('focus', handleFocus);
    };
  }, [enabled, refetchOnWindowFocus, fetchData]);

  return {
    data,
    error,
    isLoading,
    isFetching,
    isError: !!error,
    isSuccess: !!data && !error,
    refetch,
    reset,
  };
}