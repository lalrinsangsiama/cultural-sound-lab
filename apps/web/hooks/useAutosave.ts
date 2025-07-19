import { useState, useEffect, useCallback, useRef } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

export interface AutosaveOptions<T> {
  key: string;
  data: T;
  saveInterval?: number;
  enabled?: boolean;
  onSave?: (data: T) => Promise<void> | void;
  onError?: (error: Error) => void;
  skipEmptyData?: boolean;
}

export interface AutosaveState {
  lastSaved: Date | null;
  isSaving: boolean;
  hasUnsavedChanges: boolean;
  error: Error | null;
}

export function useAutosave<T>({
  key,
  data,
  saveInterval = 30000, // 30 seconds
  enabled = true,
  onSave,
  onError,
  skipEmptyData = true,
}: AutosaveOptions<T>) {
  const { isOnline } = useNetworkStatus();
  const [state, setState] = useState<AutosaveState>({
    lastSaved: null,
    isSaving: false,
    hasUnsavedChanges: false,
    error: null,
  });

  const timeoutRef = useRef<NodeJS.Timeout>();
  const lastDataRef = useRef<string>();
  const lastSaveDataRef = useRef<string>();

  const saveToLocalStorage = useCallback((dataToSave: T) => {
    try {
      const serialized = JSON.stringify({
        data: dataToSave,
        timestamp: Date.now(),
        version: '1.0',
      });
      localStorage.setItem(`autosave_${key}`, serialized);
      return true;
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      return false;
    }
  }, [key]);

  const loadFromLocalStorage = useCallback((): T | null => {
    try {
      const stored = localStorage.getItem(`autosave_${key}`);
      if (!stored) return null;

      const parsed = JSON.parse(stored);
      return parsed.data;
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      return null;
    }
  }, [key]);

  const clearLocalStorage = useCallback(() => {
    try {
      localStorage.removeItem(`autosave_${key}`);
    } catch (error) {
      console.error('Failed to clear localStorage:', error);
    }
  }, [key]);

  const performSave = useCallback(async () => {
    if (!enabled || state.isSaving) return;

    const currentDataStr = JSON.stringify(data);
    
    // Skip if data hasn't changed since last save
    if (currentDataStr === lastSaveDataRef.current) {
      return;
    }

    // Skip empty data if configured
    if (skipEmptyData && (!data || (typeof data === 'object' && Object.keys(data).length === 0))) {
      return;
    }

    setState(prev => ({ ...prev, isSaving: true, error: null }));

    try {
      // Always save to localStorage first
      saveToLocalStorage(data);

      // Try to save to server if online and callback provided
      if (isOnline && onSave) {
        await onSave(data);
      }

      setState(prev => ({
        ...prev,
        lastSaved: new Date(),
        hasUnsavedChanges: false,
        isSaving: false,
      }));

      lastSaveDataRef.current = currentDataStr;

      // Clear localStorage after successful server save
      if (isOnline && onSave) {
        clearLocalStorage();
      }
    } catch (error) {
      const saveError = error instanceof Error ? error : new Error('Save failed');
      setState(prev => ({
        ...prev,
        error: saveError,
        isSaving: false,
      }));
      onError?.(saveError);
    }
  }, [data, enabled, state.isSaving, skipEmptyData, saveToLocalStorage, isOnline, onSave, clearLocalStorage, onError]);

  const forceSave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    return performSave();
  }, [performSave]);

  const resetAutosave = useCallback(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
    setState({
      lastSaved: null,
      isSaving: false,
      hasUnsavedChanges: false,
      error: null,
    });
    lastDataRef.current = undefined;
    lastSaveDataRef.current = undefined;
    clearLocalStorage();
  }, [clearLocalStorage]);

  // Track data changes
  useEffect(() => {
    const currentDataStr = JSON.stringify(data);
    
    if (lastDataRef.current !== undefined && lastDataRef.current !== currentDataStr) {
      setState(prev => ({ ...prev, hasUnsavedChanges: true }));
    }
    
    lastDataRef.current = currentDataStr;
  }, [data]);

  // Set up autosave interval
  useEffect(() => {
    if (!enabled || !state.hasUnsavedChanges) return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    timeoutRef.current = setTimeout(performSave, saveInterval);

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [enabled, state.hasUnsavedChanges, saveInterval, performSave]);

  // Save when coming back online
  useEffect(() => {
    if (isOnline && state.hasUnsavedChanges && onSave) {
      performSave();
    }
  }, [isOnline, state.hasUnsavedChanges, onSave, performSave]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    ...state,
    loadFromLocalStorage,
    forceSave,
    resetAutosave,
    hasDraft: !!loadFromLocalStorage(),
  };
}