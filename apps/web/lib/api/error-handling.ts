import * as Sentry from '@sentry/nextjs';

export interface ApiErrorDetails {
  [key: string]: unknown;
}

export class ApiError extends Error {
  constructor(
    message: string,
    public status: number,
    public code?: string,
    public details?: ApiErrorDetails
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

export interface RetryConfig {
  maxRetries?: number;
  initialDelay?: number;
  maxDelay?: number;
  backoffFactor?: number;
  retryableStatuses?: number[];
  onRetry?: (attempt: number, error: Error) => void;
}

const DEFAULT_RETRY_CONFIG: Required<RetryConfig> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 30000,
  backoffFactor: 2,
  retryableStatuses: [408, 429, 500, 502, 503, 504],
  onRetry: () => {},
};

export async function withRetry<T>(
  fn: () => Promise<T>,
  config?: RetryConfig
): Promise<T> {
  const opts = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error = new Error('No attempts made');
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error: unknown) {
      lastError = error instanceof Error ? error : new Error(String(error));

      if (attempt === opts.maxRetries) {
        break;
      }

      const isRetryable = 
        error instanceof ApiError && 
        opts.retryableStatuses.includes(error.status);

      if (!isRetryable && lastError.name !== 'NetworkError') {
        throw lastError;
      }

      opts.onRetry(attempt + 1, lastError);

      await new Promise(resolve => setTimeout(resolve, delay));
      delay = Math.min(delay * opts.backoffFactor, opts.maxDelay);
    }
  }

  throw lastError;
}

export function handleApiError(error: unknown): ApiError {
  if (error instanceof ApiError) {
    return error;
  }

  if (error && typeof error === 'object' && 'response' in error) {
    const response = (error as { response: { status: number; data?: { message?: string; error?: string; code?: string; details?: ApiErrorDetails } } }).response;
    const { status, data } = response;
    const message = data?.message || data?.error || getStatusMessage(status);
    
    return new ApiError(
      message,
      status,
      data?.code,
      data?.details
    );
  }

  if (error && typeof error === 'object' && 'request' in error) {
    return new ApiError(
      'Network error. Please check your connection.',
      0,
      'NETWORK_ERROR'
    );
  }

  const message = error instanceof Error ? error.message : 'An unexpected error occurred';
  return new ApiError(
    message,
    500,
    'UNKNOWN_ERROR'
  );
}

function getStatusMessage(status: number): string {
  const messages: Record<number, string> = {
    400: 'Invalid request. Please check your input.',
    401: 'Please sign in to continue.',
    403: 'You don\'t have permission to access this resource.',
    404: 'The requested resource was not found.',
    408: 'Request timed out. Please try again.',
    409: 'A conflict occurred. Please refresh and try again.',
    413: 'The file is too large. Please choose a smaller file.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Server error. We\'re working on it.',
    502: 'Service temporarily unavailable. Please try again.',
    503: 'Service is currently unavailable. Please try again later.',
    504: 'Gateway timeout. Please try again.',
  };

  return messages[status] || 'An error occurred. Please try again.';
}

export function getUserFriendlyErrorMessage(error: unknown): string {
  if (error instanceof ApiError) {
    return error.message;
  }

  if (error instanceof Error && error.message?.includes('Network')) {
    return 'Connection error. Please check your internet connection.';
  }

  if (error instanceof Error && error.message?.includes('timeout')) {
    return 'Request timed out. Please try again.';
  }

  return 'Something went wrong. Please try again.';
}

export function captureApiError(error: unknown, context?: Record<string, unknown>) {
  const apiError = handleApiError(error);
  
  Sentry.captureException(apiError, {
    tags: {
      api_error: true,
      status_code: apiError.status,
      error_code: apiError.code,
    },
    extra: {
      ...context,
      details: apiError.details,
    },
  });

  return apiError;
}