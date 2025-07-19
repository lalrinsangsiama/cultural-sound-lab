/**
 * Cultural Sound Lab API Client SDK
 * Auto-generated TypeScript client for the Cultural Sound Lab API
 */

// Types from API validation schemas
export interface AudioSample {
  id: string;
  title: string;
  description?: string;
  instrument_type: string;
  cultural_origin: string;
  usage_rights: 'commercial' | 'non-commercial' | 'attribution';
  duration?: number;
  file_url?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateAudioSampleInput {
  title: string;
  description?: string;
  instrument_type: string;
  cultural_origin: string;
  usage_rights: 'commercial' | 'non-commercial' | 'attribution';
}

export interface UpdateAudioSampleInput {
  title?: string;
  description?: string;
  instrument_type?: string;
  cultural_origin?: string;
  usage_rights?: 'commercial' | 'non-commercial' | 'attribution';
}

export interface GetAudioSamplesQuery {
  cultural_origin?: string;
  instrument_type?: string;
  usage_rights?: 'commercial' | 'non-commercial' | 'attribution';
  limit?: number;
  offset?: number;
  search?: string;
  sort?: 'created_at' | 'title' | 'duration';
  order?: 'asc' | 'desc';
}

export interface AudioSamplesListResponse {
  data: AudioSample[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface AudioPreviewResponse {
  preview_url: string;
  expires_at: string;
  duration?: number;
}

export interface Generation {
  id: string;
  user_id: string;
  type: 'sound-logo' | 'playlist' | 'social-clip' | 'long-form';
  status: 'pending' | 'processing' | 'completed' | 'failed';
  title?: string;
  description?: string;
  parameters: Record<string, any>;
  result_url?: string;
  error_message?: string;
  processing_time?: number;
  metadata?: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface CreateGenerationInput {
  type: 'sound-logo' | 'playlist' | 'social-clip' | 'long-form';
  parameters: Record<string, any>;
  title?: string;
  description?: string;
}

export interface GenerationsListResponse {
  data: Generation[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

export interface JobStatusResponse {
  jobId: string;
  status: 'active' | 'waiting' | 'completed' | 'failed' | 'delayed';
  progress?: number;
  data?: Record<string, any>;
  result?: any;
  error?: string;
  created_at: string;
  processed_at?: string;
  finished_at?: string;
}

export interface DownloadResponse {
  download_url: string;
  expires_at: string;
  filename: string;
  file_size?: number;
  content_type: string;
}

export interface PaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  client_secret: string;
}

export interface HealthCheck {
  status: 'ok' | 'degraded' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  database: boolean;
  redis: boolean;
}

export interface ApiError {
  error: string;
  message: string;
  statusCode: number;
  timestamp: string;
  details?: Record<string, any>;
}

// Configuration interface
export interface ApiClientConfig {
  baseUrl?: string;
  apiVersion?: string;
  timeout?: number;
  retries?: number;
  retryDelay?: number;
  headers?: Record<string, string>;
  onError?: (error: ApiError) => void;
  onRetry?: (attempt: number, error: Error) => void;
}

// API Client class
export class CulturalSoundLabApi {
  private baseUrl: string;
  private apiVersion: string;
  private timeout: number;
  private retries: number;
  private retryDelay: number;
  private headers: Record<string, string>;
  private onError?: (error: ApiError) => void;
  private onRetry?: (attempt: number, error: Error) => void;

  constructor(config: ApiClientConfig = {}) {
    this.baseUrl = config.baseUrl || 'http://localhost:3001';
    this.apiVersion = config.apiVersion || 'v1';
    this.timeout = config.timeout || 30000;
    this.retries = config.retries || 3;
    this.retryDelay = config.retryDelay || 1000;
    this.headers = {
      'Content-Type': 'application/json',
      'API-Version': this.apiVersion,
      ...config.headers,
    };
    this.onError = config.onError;
    this.onRetry = config.onRetry;
  }

  // Set authentication token
  setAuthToken(token: string): void {
    this.headers['Authorization'] = `Bearer ${token}`;
  }

  // Remove authentication token
  clearAuthToken(): void {
    delete this.headers['Authorization'];
  }

  // Generic request method with retry logic
  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}/api${endpoint}`;
    
    const requestOptions: RequestInit = {
      ...options,
      headers: {
        ...this.headers,
        ...options.headers,
      },
    };

    let lastError: Error;

    for (let attempt = 0; attempt <= this.retries; attempt++) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), this.timeout);

        const response = await fetch(url, {
          ...requestOptions,
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!response.ok) {
          const errorData: ApiError = await response.json().catch(() => ({
            error: 'Unknown Error',
            message: `HTTP ${response.status}: ${response.statusText}`,
            statusCode: response.status,
            timestamp: new Date().toISOString(),
          }));

          if (this.onError) {
            this.onError(errorData);
          }

          throw new Error(`API Error: ${errorData.message}`);
        }

        const data: T = await response.json();
        return data;
      } catch (error) {
        lastError = error as Error;

        if (attempt < this.retries) {
          if (this.onRetry) {
            this.onRetry(attempt + 1, lastError);
          }
          await new Promise(resolve => setTimeout(resolve, this.retryDelay * Math.pow(2, attempt)));
        }
      }
    }

    throw lastError!;
  }

  // Health check
  async health(): Promise<HealthCheck> {
    return this.request<HealthCheck>('/health');
  }

  // Audio API methods
  async getAudioSamples(query?: GetAudioSamplesQuery): Promise<AudioSamplesListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/audio${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<AudioSamplesListResponse>(endpoint);
  }

  async getAudioSample(id: string): Promise<AudioSample> {
    return this.request<AudioSample>(`/audio/${id}`);
  }

  async getAudioPreview(id: string): Promise<AudioPreviewResponse> {
    return this.request<AudioPreviewResponse>(`/audio/${id}/preview`);
  }

  async uploadAudioSample(
    audioFile: File,
    metadata: CreateAudioSampleInput
  ): Promise<AudioSample> {
    const formData = new FormData();
    formData.append('audio', audioFile);
    Object.entries(metadata).forEach(([key, value]) => {
      if (value !== undefined) {
        formData.append(key, value);
      }
    });

    return this.request<AudioSample>('/audio', {
      method: 'POST',
      body: formData,
      headers: {
        // Remove Content-Type to let browser set multipart boundary
        ...Object.fromEntries(
          Object.entries(this.headers).filter(([key]) => key !== 'Content-Type')
        ),
      },
    });
  }

  async updateAudioSample(
    id: string,
    updates: UpdateAudioSampleInput
  ): Promise<AudioSample> {
    return this.request<AudioSample>(`/audio/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    });
  }

  async deleteAudioSample(id: string): Promise<void> {
    await this.request<void>(`/audio/${id}`, {
      method: 'DELETE',
    });
  }

  // Generation API methods
  async createGeneration(input: CreateGenerationInput): Promise<Generation> {
    return this.request<Generation>('/generate', {
      method: 'POST',
      body: JSON.stringify(input),
    });
  }

  async getGenerations(query?: {
    type?: Generation['type'];
    status?: Generation['status'];
    limit?: number;
    offset?: number;
    sort?: 'created_at' | 'updated_at' | 'status';
    order?: 'asc' | 'desc';
  }): Promise<GenerationsListResponse> {
    const params = new URLSearchParams();
    if (query) {
      Object.entries(query).forEach(([key, value]) => {
        if (value !== undefined) {
          params.append(key, value.toString());
        }
      });
    }
    
    const endpoint = `/generate${params.toString() ? `?${params.toString()}` : ''}`;
    return this.request<GenerationsListResponse>(endpoint);
  }

  async getGeneration(id: string): Promise<Generation> {
    return this.request<Generation>(`/generate/${id}`);
  }

  async getJobStatus(jobId: string): Promise<JobStatusResponse> {
    return this.request<JobStatusResponse>(`/generate/job/${jobId}/status`);
  }

  async downloadGeneration(id: string): Promise<DownloadResponse> {
    return this.request<DownloadResponse>(`/generate/${id}/download`);
  }

  async deleteGeneration(id: string): Promise<void> {
    await this.request<void>(`/generate/${id}`, {
      method: 'DELETE',
    });
  }

  // Payment API methods
  async createPaymentIntent(data: {
    amount: number;
    currency?: string;
    metadata?: Record<string, any>;
  }): Promise<PaymentIntent> {
    return this.request<PaymentIntent>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  }

  async confirmPayment(paymentIntentId: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({ payment_intent_id: paymentIntentId }),
    });
  }

  async cancelPayment(paymentIntentId: string): Promise<PaymentIntent> {
    return this.request<PaymentIntent>(`/payments/${paymentIntentId}/cancel`, {
      method: 'POST',
    });
  }

  // Utility methods
  getFileUrl(path: string): string {
    return `${this.baseUrl}${path}`;
  }

  // Stream audio sample
  getAudioStreamUrl(id: string): string {
    return `${this.baseUrl}/api/audio/${id}/stream`;
  }
}

// Create default instance
export const api = new CulturalSoundLabApi({
  baseUrl: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001',
  onError: (error) => {
    console.error('API Error:', error);
  },
  onRetry: (attempt, error) => {
    console.warn(`API retry attempt ${attempt}:`, error.message);
  },
});

// Export types for use in components
export type {
  AudioSample,
  CreateAudioSampleInput,
  UpdateAudioSampleInput,
  GetAudioSamplesQuery,
  AudioSamplesListResponse,
  AudioPreviewResponse,
  Generation,
  CreateGenerationInput,
  GenerationsListResponse,
  JobStatusResponse,
  DownloadResponse,
  PaymentIntent,
  HealthCheck,
  ApiError,
  ApiClientConfig,
};