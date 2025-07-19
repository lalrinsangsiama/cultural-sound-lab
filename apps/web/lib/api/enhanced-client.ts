import { ApiClient } from '../api-client';
import { withRetry, handleApiError, captureApiError, ApiError } from './error-handling';
import { useOfflineStorage } from '@/hooks/useOfflineStorage';
import { useNetworkStatus } from '@/hooks/useNetworkStatus';

export interface RequestOptions extends RequestInit {
  skipRetry?: boolean;
  offlineSupport?: boolean;
  retryConfig?: Parameters<typeof withRetry>[1];
}

export class EnhancedApiClient extends ApiClient {
  private offlineStorage?: ReturnType<typeof useOfflineStorage>;
  private networkStatus?: ReturnType<typeof useNetworkStatus>;

  setOfflineStorage(storage: ReturnType<typeof useOfflineStorage>) {
    this.offlineStorage = storage;
  }

  setNetworkStatus(status: ReturnType<typeof useNetworkStatus>) {
    this.networkStatus = status;
  }

  private async enhancedRequest<T>(
    endpoint: string,
    options: RequestOptions = {}
  ): Promise<T> {
    const { skipRetry = false, offlineSupport = false, retryConfig, ...fetchOptions } = options;

    // Check if we're offline and should queue the request
    if (this.networkStatus?.isOnline === false && offlineSupport && this.offlineStorage) {
      const method = fetchOptions.method as 'POST' | 'PUT' | 'PATCH' | 'DELETE';
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
        const operationId = this.offlineStorage.addOfflineOperation(
          method,
          endpoint,
          fetchOptions.body ? JSON.parse(fetchOptions.body as string) : undefined
        );
        
        throw new ApiError(
          'Request queued for when you\'re back online',
          0,
          'OFFLINE_QUEUED',
          { operationId }
        );
      }
    }

    // Warn about slow connection
    if (this.networkStatus?.isSlowConnection) {
      console.warn('Slow connection detected. This request may take longer than usual.');
    }

    const makeRequest = async () => {
      try {
        const url = `${this.baseUrl}${endpoint}`;
        const config: RequestInit = {
          headers: {
            'Content-Type': 'application/json',
            ...fetchOptions.headers,
          },
          ...fetchOptions,
        };

        const response = await fetch(url, config);

        if (!response.ok) {
          const error = await this.parseErrorResponse(response);
          throw error;
        }

        return await response.json();
      } catch (error) {
        if (error instanceof Error && error.name === 'AbortError') {
          throw new ApiError('Request was cancelled', 0, 'REQUEST_CANCELLED');
        }
        
        if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
          const networkError = new ApiError(
            'Network error. Please check your connection.',
            0,
            'NETWORK_ERROR'
          );
          networkError.name = 'NetworkError';
          throw networkError;
        }

        throw error;
      }
    };

    // Apply retry logic if not skipped
    if (skipRetry) {
      return makeRequest();
    }

    return withRetry(makeRequest, {
      ...retryConfig,
      onRetry: (attempt, error) => {
        console.log(`Retry attempt ${attempt} after error:`, error.message);
        retryConfig?.onRetry?.(attempt, error);
      },
    });
  }

  private async parseErrorResponse(response: Response): Promise<ApiError> {
    let errorData: any = {};
    
    try {
      errorData = await response.json();
    } catch {
      // Response body is not JSON
    }

    return new ApiError(
      errorData.message || errorData.error || `HTTP error! status: ${response.status}`,
      response.status,
      errorData.code,
      errorData.details
    );
  }

  // Override base methods to use enhanced request
  async login(email: string, password: string) {
    return this.enhancedRequest('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
      skipRetry: true, // Don't retry auth requests
    });
  }

  async register(userData: any) {
    return this.enhancedRequest('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
      skipRetry: true,
    });
  }

  async getAudioSamples(filters?: any) {
    const params = new URLSearchParams();
    if (filters?.culture) params.append('culture', filters.culture);
    if (filters?.instrument) params.append('instrument', filters.instrument);
    if (filters?.search) params.append('search', filters.search);

    const query = params.toString() ? `?${params.toString()}` : '';
    return this.enhancedRequest(`/api/audio/samples${query}`);
  }

  async generateAudio(params: any) {
    return this.enhancedRequest('/api/generate', {
      method: 'POST',
      body: JSON.stringify(params),
      offlineSupport: true, // Queue if offline
      retryConfig: {
        maxRetries: 5, // More retries for important operations
        initialDelay: 2000,
      },
    });
  }

  async deleteGeneration(id: string) {
    return this.enhancedRequest(`/api/generate/${id}`, {
      method: 'DELETE',
      offlineSupport: true,
    });
  }

  // Add more method overrides as needed...
}

// Create singleton instance
export const enhancedApiClient = new EnhancedApiClient();