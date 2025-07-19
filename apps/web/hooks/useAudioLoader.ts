import { useState, useCallback, useRef, useEffect } from 'react';
import { useNetworkStatus } from './useNetworkStatus';
import { captureApiError } from '@/lib/api/error-handling';

export interface AudioLoadState {
  isLoading: boolean;
  isLoaded: boolean;
  error: Error | null;
  progress: number;
  duration: number | null;
  retryCount: number;
}

export interface AudioLoadOptions {
  preload?: 'none' | 'metadata' | 'auto';
  maxRetries?: number;
  retryDelay?: number;
  fallbackUrls?: string[];
  onProgress?: (progress: number) => void;
  onLoadStart?: () => void;
  onLoadEnd?: () => void;
  onError?: (error: Error) => void;
}

export function useAudioLoader(options: AudioLoadOptions = {}) {
  const {
    preload = 'metadata',
    maxRetries = 3,
    retryDelay = 1000,
    fallbackUrls = [],
    onProgress,
    onLoadStart,
    onLoadEnd,
    onError,
  } = options;

  const { isOnline, isSlowConnection } = useNetworkStatus();
  const [state, setState] = useState<AudioLoadState>({
    isLoading: false,
    isLoaded: false,
    error: null,
    progress: 0,
    duration: null,
    retryCount: 0,
  });

  const audioRef = useRef<HTMLAudioElement>();
  const currentUrlRef = useRef<string>();
  const fallbackIndexRef = useRef<number>(0);
  const abortControllerRef = useRef<AbortController>();

  const resetState = useCallback(() => {
    setState({
      isLoading: false,
      isLoaded: false,
      error: null,
      progress: 0,
      duration: null,
      retryCount: 0,
    });
    fallbackIndexRef.current = 0;
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  }, []);

  const createAudioElement = useCallback((url: string): HTMLAudioElement => {
    const audio = new Audio();
    audio.preload = preload;
    audio.crossOrigin = 'anonymous';
    
    // Optimize for slow connections
    if (isSlowConnection) {
      audio.preload = 'none';
    }

    return audio;
  }, [preload, isSlowConnection]);

  const setupAudioListeners = useCallback((audio: HTMLAudioElement, url: string) => {
    const handleLoadStart = () => {
      setState(prev => ({ ...prev, isLoading: true, error: null }));
      onLoadStart?.();
    };

    const handleProgress = () => {
      if (audio.buffered.length > 0) {
        const progress = (audio.buffered.end(0) / audio.duration) * 100;
        setState(prev => ({ ...prev, progress }));
        onProgress?.(progress);
      }
    };

    const handleLoadedMetadata = () => {
      setState(prev => ({ 
        ...prev, 
        duration: audio.duration,
        progress: preload === 'metadata' ? 100 : prev.progress 
      }));
    };

    const handleCanPlayThrough = () => {
      setState(prev => ({
        ...prev,
        isLoading: false,
        isLoaded: true,
        progress: 100,
        error: null,
      }));
      onLoadEnd?.();
    };

    const handleError = () => {
      const error = new Error(`Failed to load audio: ${url}`);
      setState(prev => ({ ...prev, error, isLoading: false }));
      onError?.(error);
      captureApiError(error, { url, userAgent: navigator.userAgent });
    };

    const handleAbort = () => {
      setState(prev => ({ ...prev, isLoading: false }));
    };

    audio.addEventListener('loadstart', handleLoadStart);
    audio.addEventListener('progress', handleProgress);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('canplaythrough', handleCanPlayThrough);
    audio.addEventListener('error', handleError);
    audio.addEventListener('abort', handleAbort);

    return () => {
      audio.removeEventListener('loadstart', handleLoadStart);
      audio.removeEventListener('progress', handleProgress);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('canplaythrough', handleCanPlayThrough);
      audio.removeEventListener('error', handleError);
      audio.removeEventListener('abort', handleAbort);
    };
  }, [preload, onProgress, onLoadStart, onLoadEnd, onError]);

  const tryLoadUrl = useCallback(async (url: string): Promise<HTMLAudioElement> => {
    return new Promise((resolve, reject) => {
      const audio = createAudioElement(url);
      audioRef.current = audio;

      const cleanup = setupAudioListeners(audio, url);

      const handleSuccess = () => {
        cleanup();
        resolve(audio);
      };

      const handleError = () => {
        cleanup();
        reject(new Error(`Failed to load: ${url}`));
      };

      audio.addEventListener('canplaythrough', handleSuccess, { once: true });
      audio.addEventListener('error', handleError, { once: true });

      audio.src = url;
      audio.load();
    });
  }, [createAudioElement, setupAudioListeners]);

  const loadAudio = useCallback(async (url: string): Promise<HTMLAudioElement | null> => {
    if (!isOnline) {
      const error = new Error('Cannot load audio while offline');
      setState(prev => ({ ...prev, error, isLoading: false }));
      return null;
    }

    currentUrlRef.current = url;
    resetState();

    const urlsToTry = [url, ...fallbackUrls];
    
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      for (let urlIndex = 0; urlIndex < urlsToTry.length; urlIndex++) {
        const currentUrl = urlsToTry[urlIndex];
        
        try {
          setState(prev => ({ ...prev, retryCount: attempt }));
          
          const audio = await tryLoadUrl(currentUrl);
          return audio;
        } catch (error) {
          console.warn(`Failed to load audio from ${currentUrl}:`, error);
          
          // If this is not the last URL or attempt, continue
          if (urlIndex < urlsToTry.length - 1 || attempt < maxRetries) {
            continue;
          }
        }
      }

      // Wait before retrying if this isn't the last attempt
      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, retryDelay * (attempt + 1)));
      }
    }

    // All attempts failed
    const error = new Error(`Failed to load audio after ${maxRetries + 1} attempts`);
    setState(prev => ({ ...prev, error, isLoading: false }));
    captureApiError(error, { 
      originalUrl: url, 
      fallbackUrls, 
      attempts: maxRetries + 1,
      connectionType: isSlowConnection ? 'slow' : 'normal'
    });
    
    return null;
  }, [isOnline, fallbackUrls, maxRetries, retryDelay, tryLoadUrl, resetState, isSlowConnection]);

  const retry = useCallback(() => {
    if (currentUrlRef.current) {
      return loadAudio(currentUrlRef.current);
    }
    return Promise.resolve(null);
  }, [loadAudio]);

  const abort = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.src = '';
      audioRef.current.load();
    }
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    setState(prev => ({ ...prev, isLoading: false }));
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      abort();
    };
  }, [abort]);

  return {
    ...state,
    loadAudio,
    retry,
    abort,
    resetState,
    audio: audioRef.current,
  };
}