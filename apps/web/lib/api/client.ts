import { ApiError, withRetry, handleApiError, captureApiError } from './error-handling';

export interface RequestConfig {
  timeout?: number;
  retries?: number;
  headers?: Record<string, string>;
  signal?: AbortSignal;
}

class ApiClient {
  private baseUrl: string;
  private defaultTimeout = 30000;

  constructor(baseUrl: string = '/api') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit & RequestConfig = {}
  ): Promise<T> {
    const {
      timeout = this.defaultTimeout,
      retries = 3,
      signal,
      headers = {},
      ...fetchOptions
    } = options;

    const url = `${this.baseUrl}${endpoint}`;
    
    const controller = new AbortController();
    const combinedSignal = signal || controller.signal;
    
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    try {
      const response = await withRetry(
        async () => {
          const response = await fetch(url, {
            ...fetchOptions,
            headers: {
              'Content-Type': 'application/json',
              ...headers,
            },
            signal: combinedSignal,
          });

          if (!response.ok) {
            const errorData = await this.parseErrorResponse(response);
            throw new ApiError(
              errorData.message || 'Request failed',
              response.status,
              errorData.code,
              errorData.details
            );
          }

          return response;
        },
        { 
          maxRetries: retries,
          onRetry: (attempt, error) => {
            console.warn(`API request attempt ${attempt} failed:`, error);
          }
        }
      );

      clearTimeout(timeoutId);

      if (response.headers.get('content-type')?.includes('application/json')) {
        return await response.json();
      }

      return response as unknown as T;
    } catch (error: unknown) {
      clearTimeout(timeoutId);
      
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutError = new ApiError(
          'Request timed out. Please try again.',
          408,
          'TIMEOUT'
        );
        captureApiError(timeoutError, { endpoint, timeout });
        throw timeoutError;
      }

      const apiError = captureApiError(error, { endpoint });
      throw apiError;
    }
  }

  private async parseErrorResponse(response: Response) {
    try {
      return await response.json();
    } catch {
      return {
        message: response.statusText || 'Request failed',
        status: response.status,
      };
    }
  }

  async get<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'GET' });
  }

  async post<T, TData = unknown>(
    endpoint: string,
    data?: TData,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async put<T, TData = unknown>(
    endpoint: string,
    data?: TData,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async patch<T, TData = unknown>(
    endpoint: string,
    data?: TData,
    config?: RequestConfig
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...config,
      method: 'PATCH',
      body: data ? JSON.stringify(data) : undefined,
    });
  }

  async delete<T>(endpoint: string, config?: RequestConfig): Promise<T> {
    return this.request<T>(endpoint, { ...config, method: 'DELETE' });
  }

  async upload<T>(
    endpoint: string,
    formData: FormData,
    config?: RequestConfig & {
      onProgress?: (progress: number) => void;
    }
  ): Promise<T> {
    const { onProgress, headers = {}, ...restConfig } = config || {};

    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      
      if (onProgress) {
        xhr.upload.addEventListener('progress', (event) => {
          if (event.lengthComputable) {
            const progress = (event.loaded / event.total) * 100;
            onProgress(progress);
          }
        });
      }

      xhr.addEventListener('load', () => {
        try {
          if (xhr.status >= 200 && xhr.status < 300) {
            const result = xhr.responseText ? JSON.parse(xhr.responseText) : null;
            resolve(result);
          } else {
            const error = new ApiError(
              xhr.statusText || 'Upload failed',
              xhr.status
            );
            reject(captureApiError(error, { endpoint }));
          }
        } catch (error) {
          reject(captureApiError(error, { endpoint }));
        }
      });

      xhr.addEventListener('error', () => {
        const error = new ApiError('Upload failed', 0, 'UPLOAD_ERROR');
        reject(captureApiError(error, { endpoint }));
      });

      xhr.addEventListener('timeout', () => {
        const error = new ApiError('Upload timed out', 408, 'TIMEOUT');
        reject(captureApiError(error, { endpoint }));
      });

      xhr.open('POST', `${this.baseUrl}${endpoint}`);
      
      Object.entries(headers).forEach(([key, value]) => {
        xhr.setRequestHeader(key, value);
      });

      if (restConfig?.timeout) {
        xhr.timeout = restConfig.timeout;
      }

      xhr.send(formData);
    });
  }
}

export const apiClient = new ApiClient();