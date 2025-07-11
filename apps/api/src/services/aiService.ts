import axios, { AxiosInstance } from 'axios';
import { generationQueue, GenerationJobData } from './generationQueue';
import { audioService } from './audioService';
import { mockGenerationService } from './mockGenerationService';

export interface AIGenerationRequest {
  generation_id: string;
  type: 'sound_logo' | 'playlist' | 'social_clip' | 'long_form';
  parameters: {
    duration?: number;
    mood?: string;
    energy_level?: number;
    instruments?: string[];
    cultural_style?: string;
    tempo?: number;
    key?: string;
    description?: string;
    brand_name?: string;
    playlist_size?: number;
    video_description?: string;
  };
  source_samples: string[]; // URLs to audio files
}

export interface AIGenerationResponse {
  success: boolean;
  generation_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  message?: string;
  estimated_completion?: number; // seconds
}

export interface AIStatusResponse {
  generation_id: string;
  status: 'queued' | 'processing' | 'completed' | 'failed';
  progress?: number; // 0-100
  result_url?: string;
  error_message?: string;
  processing_time?: number;
  metadata?: {
    duration: number;
    format: string;
    file_size: number;
    sample_rate: number;
  };
}

class AIService {
  private client: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiKey: string;
  private readonly timeout: number;

  constructor() {
    this.baseUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.apiKey = process.env.AI_SERVICE_API_KEY || '';
    this.timeout = parseInt(process.env.AI_SERVICE_TIMEOUT || '300000'); // 5 minutes

    this.client = axios.create({
      baseURL: this.baseUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${this.apiKey}`,
        'User-Agent': 'Cultural-Sound-Lab-API/1.0.0',
      },
    });

    this.setupInterceptors();
  }

  /**
   * Submit generation request to AI service via queue
   */
  async submitGeneration(generationData: GenerationJobData): Promise<{ jobId: string; estimatedTime: number }> {
    try {
      // Check if AI service is available
      const healthStatus = await this.healthCheck();
      
      if (healthStatus.status === 'unavailable') {
        console.log('🎭 AI service unavailable, using mock generation service');
        return await mockGenerationService.startGeneration(generationData);
      }

      // Get signed URLs for source samples
      const sourceUrls = await this.getSourceSampleUrls(generationData.source_samples);
      
      // Add source URLs to generation data
      const jobData: GenerationJobData = {
        ...generationData,
        source_urls: sourceUrls,
      };

      // Submit to queue
      const job = await generationQueue.addGenerationJob(jobData);
      
      // Estimate completion time based on generation type
      const estimatedTime = this.estimateCompletionTime(generationData.type, generationData.parameters);

      return {
        jobId: job.id!.toString(),
        estimatedTime,
      };
    } catch (error) {
      console.error('Failed to submit generation, falling back to mock service:', error);
      // Fallback to mock service
      return await mockGenerationService.startGeneration(generationData);
    }
  }

  /**
   * Get generation status from AI service
   */
  async getGenerationStatus(generationId: string): Promise<AIStatusResponse> {
    try {
      const response = await this.client.get(`/generate/${generationId}/status`);
      return response.data;
    } catch (error) {
      console.error('Failed to get generation status:', error);
      
      // If AI service is unavailable, return a default response
      if (axios.isAxiosError(error) && (error.code === 'ECONNREFUSED' || error.response?.status === 503)) {
        return {
          generation_id: generationId,
          status: 'processing',
          progress: 0,
          error_message: 'AI service temporarily unavailable',
        };
      }
      
      throw new Error(`Failed to get generation status: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Get mock job status by job ID
   */
  getMockJobStatus(jobId: string): AIStatusResponse | null {
    const job = mockGenerationService.getJobStatus(jobId);
    if (!job) return null;

    return {
      generation_id: job.generationId,
      status: job.status as any,
      progress: job.progress,
      result_url: job.resultUrl,
      error_message: job.errorMessage,
      processing_time: Math.round((Date.now() - job.startTime) / 1000),
      metadata: job.resultUrl ? {
        duration: job.type === 'sound_logo' ? 10 : job.type === 'social_clip' ? 30 : 120,
        format: job.type === 'playlist' ? 'm3u8' : 'mp3',
        file_size: 1024 * 1024, // 1MB mock
        sample_rate: 44100,
      } : undefined,
    };
  }

  /**
   * Cancel generation request
   */
  async cancelGeneration(generationId: string): Promise<void> {
    try {
      await this.client.delete(`/generate/${generationId}`);
    } catch (error) {
      console.error('Failed to cancel generation:', error);
      // Don't throw error for cancellation failures
    }
  }

  /**
   * Health check for AI service
   */
  async healthCheck(): Promise<{ status: string; version?: string; models?: string[] }> {
    try {
      const response = await this.client.get('/health');
      return response.data;
    } catch (error) {
      console.error('AI service health check failed:', error);
      return {
        status: 'unavailable',
      };
    }
  }

  /**
   * Get available AI models
   */
  async getAvailableModels(): Promise<string[]> {
    try {
      const response = await this.client.get('/models');
      return response.data.models || [];
    } catch (error) {
      console.error('Failed to get available models:', error);
      return [];
    }
  }

  /**
   * Validate generation parameters
   */
  validateGenerationParameters(type: string, parameters: any): { valid: boolean; errors: string[] } {
    const errors: string[] = [];

    // Common validation
    if (parameters.duration && (parameters.duration < 1 || parameters.duration > 600)) {
      errors.push('Duration must be between 1 and 600 seconds');
    }

    if (parameters.energy_level && (parameters.energy_level < 0 || parameters.energy_level > 1)) {
      errors.push('Energy level must be between 0 and 1');
    }

    if (parameters.tempo && (parameters.tempo < 60 || parameters.tempo > 200)) {
      errors.push('Tempo must be between 60 and 200 BPM');
    }

    // Type-specific validation
    switch (type) {
      case 'sound_logo':
        if (!parameters.brand_name || parameters.brand_name.length < 2) {
          errors.push('Brand name is required for sound logos');
        }
        if (parameters.duration && parameters.duration > 15) {
          errors.push('Sound logos must be 15 seconds or less');
        }
        break;

      case 'social_clip':
        if (parameters.duration && (parameters.duration < 15 || parameters.duration > 60)) {
          errors.push('Social clips must be between 15 and 60 seconds');
        }
        break;

      case 'playlist':
        if (parameters.playlist_size && (parameters.playlist_size < 3 || parameters.playlist_size > 20)) {
          errors.push('Playlist size must be between 3 and 20 tracks');
        }
        break;

      case 'long_form':
        if (parameters.duration && parameters.duration < 60) {
          errors.push('Long-form content must be at least 60 seconds');
        }
        break;
    }

    return {
      valid: errors.length === 0,
      errors,
    };
  }

  /**
   * Get signed URLs for source samples
   */
  private async getSourceSampleUrls(sampleIds: string[]): Promise<string[]> {
    try {
      const urls: string[] = [];
      
      for (const sampleId of sampleIds) {
        // Get sample file path from database
        const { data, error } = await require('@/config/supabase').supabase
          .from('audio_samples')
          .select('file_url')
          .eq('id', sampleId)
          .single();

        if (error || !data) {
          throw new Error(`Sample ${sampleId} not found`);
        }

        // Extract file path from URL and generate signed URL
        const url = new URL(data.file_url);
        const filePath = url.pathname.replace('/storage/v1/object/public/audio-samples/', '');
        const signedUrl = await audioService.generateSignedUrl(filePath, 7200); // 2 hours
        
        urls.push(signedUrl);
      }

      return urls;
    } catch (error) {
      console.error('Failed to get source sample URLs:', error);
      throw new Error('Failed to get source sample URLs');
    }
  }

  /**
   * Estimate completion time based on generation type and parameters
   */
  private estimateCompletionTime(type: string, parameters: any): number {
    const baseTime = 30; // Base time in seconds
    const duration = parameters.duration || 30;
    
    const multipliers: Record<string, number> = {
      'sound_logo': 1.0,    // Fastest
      'social_clip': 1.5,   // Medium
      'playlist': 3.0,      // Slower (multiple tracks)
      'long_form': 2.0,     // Medium-slow
    };

    const multiplier = multipliers[type] || 2.0;
    return Math.round(baseTime + (duration * multiplier));
  }

  /**
   * Setup axios interceptors for logging and error handling
   */
  private setupInterceptors(): void {
    // Request interceptor
    this.client.interceptors.request.use(
      (config) => {
        console.log(`🤖 AI Service Request: ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        console.error('AI Service Request Error:', error);
        return Promise.reject(error);
      }
    );

    // Response interceptor
    this.client.interceptors.response.use(
      (response) => {
        console.log(`✅ AI Service Response: ${response.status} ${response.config.url}`);
        return response;
      },
      (error) => {
        if (axios.isAxiosError(error)) {
          console.error(`❌ AI Service Error: ${error.response?.status} ${error.config?.url}`, {
            message: error.message,
            response: error.response?.data,
          });
        } else {
          console.error('AI Service Unknown Error:', error);
        }
        return Promise.reject(error);
      }
    );
  }
}

// Export singleton instance
export const aiService = new AIService();