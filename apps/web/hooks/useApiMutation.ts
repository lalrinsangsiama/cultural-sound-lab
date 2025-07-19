import { useState, useCallback, useRef } from 'react';
import { apiClient } from '@/lib/api/client';
import { ApiError, getUserFriendlyErrorMessage } from '@/lib/api/error-handling';

export interface UseApiMutationOptions<TData, TVariables> {
  onSuccess?: (data: TData, variables: TVariables) => void;
  onError?: (error: ApiError, variables: TVariables) => void;
  onSettled?: (data: TData | null, error: ApiError | null, variables: TVariables) => void;
}

export interface ApiMutationResult<TData, TVariables> {
  data: TData | null;
  error: ApiError | null;
  isLoading: boolean;
  isError: boolean;
  isSuccess: boolean;
  mutate: (variables: TVariables) => Promise<TData>;
  mutateAsync: (variables: TVariables) => Promise<TData>;
  reset: () => void;
}

type MutationFn<TData, TVariables> = (variables: TVariables) => Promise<TData>;

export function useApiMutation<TData = unknown, TVariables = void>(
  mutationFn: MutationFn<TData, TVariables>,
  options: UseApiMutationOptions<TData, TVariables> = {}
): ApiMutationResult<TData, TVariables> {
  const { onSuccess, onError, onSettled } = options;

  const [data, setData] = useState<TData | null>(null);
  const [error, setError] = useState<ApiError | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const abortControllerRef = useRef<AbortController>();

  const reset = useCallback(() => {
    setData(null);
    setError(null);
    setIsLoading(false);
    abortControllerRef.current?.abort();
  }, []);

  const mutateAsync = useCallback(
    async (variables: TVariables): Promise<TData> => {
      abortControllerRef.current?.abort();
      abortControllerRef.current = new AbortController();

      setIsLoading(true);
      setError(null);

      try {
        const result = await mutationFn(variables);

        if (abortControllerRef.current.signal.aborted) {
          throw new Error('Operation was cancelled');
        }

        setData(result);
        setError(null);
        
        onSuccess?.(result, variables);
        onSettled?.(result, null, variables);

        return result;
      } catch (err: unknown) {
        if (err instanceof Error && err.name === 'AbortError') {
          throw err;
        }

        const apiError = err instanceof ApiError ? err : new ApiError(
          getUserFriendlyErrorMessage(err),
          500
        );

        setError(apiError);
        setData(null);

        onError?.(apiError, variables);
        onSettled?.(null, apiError, variables);

        throw apiError;
      } finally {
        setIsLoading(false);
      }
    },
    [mutationFn, onSuccess, onError, onSettled]
  );

  const mutate = useCallback(
    (variables: TVariables) => {
      return mutateAsync(variables).catch(() => {
        // Silence the error since it's already handled in state
      });
    },
    [mutateAsync]
  );

  return {
    data,
    error,
    isLoading,
    isError: !!error,
    isSuccess: !!data && !error,
    mutate,
    mutateAsync,
    reset,
  };
}

export function useApiPost<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    (variables) => apiClient.post<TData>(endpoint, variables),
    options
  );
}

export function useApiPut<TData = unknown, TVariables = unknown>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, TVariables>
) {
  return useApiMutation<TData, TVariables>(
    (variables) => apiClient.put<TData>(endpoint, variables),
    options
  );
}

export function useApiDelete<TData = unknown>(
  endpoint: string,
  options?: UseApiMutationOptions<TData, void>
) {
  return useApiMutation<TData, void>(
    () => apiClient.delete<TData>(endpoint),
    options
  );
}