/**
 * React hooks for Cultural Sound Lab API
 * Provides easy-to-use hooks for API interactions with proper state management
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { 
  api, 
  AudioSample, 
  AudioSamplesListResponse, 
  GetAudioSamplesQuery,
  Generation,
  GenerationsListResponse,
  CreateGenerationInput,
  JobStatusResponse,
  HealthCheck,
  ApiError 
} from './api-client';

// Generic hook state interface
interface UseApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
  retry: () => void;
}

// Generic hook for API calls
function useApi<T>(
  apiCall: () => Promise<T>,
  dependencies: any[] = []
): UseApiState<T> {
  const [data, setData] = useState<T | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const mountedRef = useRef(true);

  const fetchData = useCallback(async () => {
    if (!mountedRef.current) return;
    
    setLoading(true);
    setError(null);

    try {
      const result = await apiCall();
      if (mountedRef.current) {
        setData(result);
      }
    } catch (err) {
      if (mountedRef.current) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      }
    } finally {
      if (mountedRef.current) {
        setLoading(false);
      }
    }
  }, dependencies);

  useEffect(() => {
    fetchData();
    return () => {
      mountedRef.current = false;
    };
  }, [fetchData]);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  return {
    data,
    loading,
    error,
    retry: fetchData,
  };
}

// Audio samples hooks
export function useAudioSamples(query?: GetAudioSamplesQuery) {
  return useApi<AudioSamplesListResponse>(
    () => api.getAudioSamples(query),
    [JSON.stringify(query)]
  );
}

export function useAudioSample(id: string | null) {
  return useApi<AudioSample>(
    () => {
      if (!id) throw new Error('Audio sample ID is required');
      return api.getAudioSample(id);
    },
    [id]
  );
}

// Audio upload hook with progress
export function useAudioUpload() {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const upload = useCallback(async (
    audioFile: File,
    metadata: Parameters<typeof api.uploadAudioSample>[1]
  ) => {
    setUploading(true);
    setProgress(0);
    setError(null);

    try {
      // Simulate progress for now - in a real implementation, you'd use XMLHttpRequest
      const progressInterval = setInterval(() => {
        setProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      const result = await api.uploadAudioSample(audioFile, metadata);
      
      clearInterval(progressInterval);
      setProgress(100);
      
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Upload failed');
      throw err;
    } finally {
      setUploading(false);
    }
  }, []);

  return {
    upload,
    uploading,
    progress,
    error,
  };
}

// Generations hooks
export function useGenerations(query?: Parameters<typeof api.getGenerations>[0]) {
  return useApi<GenerationsListResponse>(
    () => api.getGenerations(query),
    [JSON.stringify(query)]
  );
}

export function useGeneration(id: string | null) {
  return useApi<Generation>(
    () => {
      if (!id) throw new Error('Generation ID is required');
      return api.getGeneration(id);
    },
    [id]
  );
}

// Generation creation hook
export function useCreateGeneration() {
  const [creating, setCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const create = useCallback(async (input: CreateGenerationInput) => {
    setCreating(true);
    setError(null);

    try {
      const result = await api.createGeneration(input);
      return result;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Creation failed');
      throw err;
    } finally {
      setCreating(false);
    }
  }, []);

  return {
    create,
    creating,
    error,
  };
}

// Job status polling hook
export function useJobStatus(jobId: string | null, pollInterval = 2000) {
  const [status, setStatus] = useState<JobStatusResponse | null>(null);
  const [polling, setPolling] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const startPolling = useCallback(() => {
    if (!jobId || polling) return;

    setPolling(true);
    setError(null);

    const poll = async () => {
      try {
        const result = await api.getJobStatus(jobId);
        setStatus(result);

        // Stop polling if job is completed or failed
        if (['completed', 'failed'].includes(result.status)) {
          setPolling(false);
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to fetch job status');
        setPolling(false);
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
      }
    };

    // Start immediate poll and then interval
    poll();
    intervalRef.current = setInterval(poll, pollInterval);
  }, [jobId, polling, pollInterval]);

  const stopPolling = useCallback(() => {
    setPolling(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, []);

  return {
    status,
    polling,
    error,
    startPolling,
    stopPolling,
  };
}

// Health check hook
export function useHealthCheck(pollInterval?: number) {
  const [health, setHealth] = useState<HealthCheck | null>(null);
  const [checking, setChecking] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const checkHealth = useCallback(async () => {
    setChecking(true);
    setError(null);

    try {
      const result = await api.health();
      setHealth(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Health check failed');
    } finally {
      setChecking(false);
    }
  }, []);

  useEffect(() => {
    checkHealth();

    if (pollInterval) {
      const interval = setInterval(checkHealth, pollInterval);
      return () => clearInterval(interval);
    }
  }, [checkHealth, pollInterval]);

  return {
    health,
    checking,
    error,
    checkHealth,
  };
}

// Authentication hook
export function useAuth() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  const login = useCallback((token: string) => {
    api.setAuthToken(token);
    setIsAuthenticated(true);
    // Store token in localStorage
    localStorage.setItem('auth_token', token);
  }, []);

  const logout = useCallback(() => {
    api.clearAuthToken();
    setIsAuthenticated(false);
    // Remove token from localStorage
    localStorage.removeItem('auth_token');
  }, []);

  // Check for existing token on mount
  useEffect(() => {
    const token = localStorage.getItem('auth_token');
    if (token) {
      api.setAuthToken(token);
      setIsAuthenticated(true);
    }
  }, []);

  return {
    isAuthenticated,
    login,
    logout,
  };
}

// Download hook
export function useDownload() {
  const [downloading, setDownloading] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const download = useCallback(async (generationId: string) => {
    setDownloading(prev => ({ ...prev, [generationId]: true }));
    setErrors(prev => ({ ...prev, [generationId]: '' }));

    try {
      const downloadInfo = await api.downloadGeneration(generationId);
      
      // Create download link
      const link = document.createElement('a');
      link.href = downloadInfo.download_url;
      link.download = downloadInfo.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      return downloadInfo;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Download failed';
      setErrors(prev => ({ ...prev, [generationId]: errorMessage }));
      throw err;
    } finally {
      setDownloading(prev => ({ ...prev, [generationId]: false }));
    }
  }, []);

  return {
    download,
    downloading,
    errors,
  };
}

// Infinite scroll hook for paginated data
export function useInfiniteAudioSamples(query?: GetAudioSamplesQuery, pageSize = 20) {
  const [data, setData] = useState<AudioSample[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [offset, setOffset] = useState(0);

  const loadMore = useCallback(async () => {
    if (loadingMore || !hasMore) return;

    const isInitialLoad = offset === 0;
    if (isInitialLoad) {
      setLoading(true);
    } else {
      setLoadingMore(true);
    }
    setError(null);

    try {
      const result = await api.getAudioSamples({
        ...query,
        limit: pageSize,
        offset,
      });

      if (isInitialLoad) {
        setData(result.data);
      } else {
        setData(prev => [...prev, ...result.data]);
      }

      setHasMore(result.hasMore);
      setOffset(prev => prev + pageSize);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data');
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [query, pageSize, offset, loadingMore, hasMore]);

  const reset = useCallback(() => {
    setData([]);
    setOffset(0);
    setHasMore(true);
    setError(null);
  }, []);

  // Load initial data
  useEffect(() => {
    reset();
    loadMore();
  }, [JSON.stringify(query), pageSize]);

  return {
    data,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    reset,
  };
}