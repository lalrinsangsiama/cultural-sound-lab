import { useState, useEffect, useCallback } from 'react';
import { useNetworkStatus } from './useNetworkStatus';

interface OfflineOperation {
  id: string;
  type: 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  endpoint: string;
  data?: unknown;
  timestamp: number;
  retryCount: number;
}

const OFFLINE_STORAGE_KEY = 'csl_offline_operations';
const MAX_RETRY_COUNT = 3;

export function useOfflineStorage() {
  const { isOnline } = useNetworkStatus();
  const [pendingOperations, setPendingOperations] = useState<OfflineOperation[]>([]);

  useEffect(() => {
    // Load pending operations from localStorage
    const stored = localStorage.getItem(OFFLINE_STORAGE_KEY);
    if (stored) {
      try {
        const operations = JSON.parse(stored);
        setPendingOperations(operations);
      } catch (error) {
        console.error('Failed to parse offline operations:', error);
        localStorage.removeItem(OFFLINE_STORAGE_KEY);
      }
    }
  }, []);

  useEffect(() => {
    // Save pending operations to localStorage
    localStorage.setItem(OFFLINE_STORAGE_KEY, JSON.stringify(pendingOperations));
  }, [pendingOperations]);

  const addOfflineOperation = useCallback((
    type: OfflineOperation['type'],
    endpoint: string,
    data?: unknown
  ) => {
    const operation: OfflineOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      endpoint,
      data,
      timestamp: Date.now(),
      retryCount: 0,
    };

    setPendingOperations(prev => [...prev, operation]);
    return operation.id;
  }, []);

  const removeOfflineOperation = useCallback((id: string) => {
    setPendingOperations(prev => prev.filter(op => op.id !== id));
  }, []);

  const retryOperation = useCallback(async (operation: OfflineOperation) => {
    if (operation.retryCount >= MAX_RETRY_COUNT) {
      removeOfflineOperation(operation.id);
      return { success: false, error: 'Max retry count reached' };
    }

    try {
      const response = await fetch(`/api${operation.endpoint}`, {
        method: operation.type,
        headers: {
          'Content-Type': 'application/json',
        },
        body: operation.data ? JSON.stringify(operation.data) : undefined,
      });

      if (response.ok) {
        removeOfflineOperation(operation.id);
        return { success: true, data: await response.json() };
      } else {
        // Increment retry count
        setPendingOperations(prev =>
          prev.map(op =>
            op.id === operation.id
              ? { ...op, retryCount: op.retryCount + 1 }
              : op
          )
        );
        return { success: false, error: `HTTP ${response.status}` };
      }
    } catch (error) {
      setPendingOperations(prev =>
        prev.map(op =>
          op.id === operation.id
            ? { ...op, retryCount: op.retryCount + 1 }
            : op
        )
      );
      return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }, [removeOfflineOperation]);

  const retryAllOperations = useCallback(async () => {
    if (!isOnline || pendingOperations.length === 0) return;

    const results = await Promise.allSettled(
      pendingOperations.map(operation => retryOperation(operation))
    );

    return results;
  }, [isOnline, pendingOperations, retryOperation]);

  // Auto-retry when coming back online
  useEffect(() => {
    if (isOnline && pendingOperations.length > 0) {
      retryAllOperations();
    }
  }, [isOnline, retryAllOperations]);

  const clearAllOperations = useCallback(() => {
    setPendingOperations([]);
    localStorage.removeItem(OFFLINE_STORAGE_KEY);
  }, []);

  return {
    pendingOperations,
    addOfflineOperation,
    removeOfflineOperation,
    retryOperation,
    retryAllOperations,
    clearAllOperations,
    hasPendingOperations: pendingOperations.length > 0,
  };
}