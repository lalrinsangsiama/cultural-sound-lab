import Bull from 'bull';
import { queueRedis } from '@/config/redis';
import { supabase } from '@/config/supabase';
import axios from 'axios';

export interface GenerationJobData {
  generationId: string;
  userId: string;
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
  source_samples: string[];
  source_urls: string[];
}

export interface GenerationResult {
  success: boolean;
  result_url?: string;
  error_message?: string;
  processing_time: number;
  metadata?: {
    duration: number;
    format: string;
    file_size: number;
  };
}

class GenerationQueueService {
  private queue: Bull.Queue<GenerationJobData>;
  private readonly aiServiceUrl: string;
  private readonly maxConcurrency: number;
  private readonly defaultJobOptions: Bull.JobOptions;

  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.maxConcurrency = parseInt(process.env.GENERATION_CONCURRENCY || '2');
    
    this.defaultJobOptions = {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
      removeOnComplete: 50, // Keep last 50 completed jobs
      removeOnFail: 20,     // Keep last 20 failed jobs
    };

    // Initialize Bull queue
    // Check if Redis is properly configured
    const isRedisConfigured = process.env.REDIS_URL || process.env.REDIS_HOST;
    
    if (isRedisConfigured && queueRedis.options) {
      this.queue = new Bull('generation-queue', {
        redis: {
          host: queueRedis.options.host,
          port: queueRedis.options.port,
          password: queueRedis.options.password,
          db: queueRedis.options.db,
        },
        defaultJobOptions: this.defaultJobOptions,
      });
    } else {
      // Create a mock queue when Redis is not available
      console.warn('⚠️  Creating mock queue - Redis not configured');
      this.queue = {
        add: async (data: any) => ({ id: `mock_job_${Date.now()}` }),
        process: () => {},
        on: () => {},
        getJob: async () => null,
        getJobs: async () => [],
        removeJob: async () => {},
        close: async () => {},
      } as any;
    }

    this.setupProcessors();
    this.setupEventHandlers();
  }

  /**
   * Add a generation job to the queue
   */
  async addGenerationJob(data: GenerationJobData, options: Partial<Bull.JobOptions> = {}): Promise<Bull.Job<GenerationJobData>> {
    try {
      // Update generation status to 'processing'
      await this.updateGenerationStatus(data.generationId, 'processing');

      // Add job to queue with priority based on type
      const priority = this.getJobPriority(data.type);
      const job = await this.queue.add('generate', data, {
        ...this.defaultJobOptions,
        ...options,
        priority,
      });

      console.log(`✅ Generation job added to queue: ${job.id} for generation ${data.generationId}`);
      return job;
    } catch (error) {
      console.error('Failed to add generation job:', error);
      await this.updateGenerationStatus(data.generationId, 'failed', 'Failed to queue generation job');
      throw error;
    }
  }

  /**
   * Get job status and progress
   */
  async getJobStatus(jobId: string): Promise<{
    status: string;
    progress: number;
    data?: GenerationJobData;
    result?: any;
    error?: string;
  }> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      const state = await job.getState();
      const progress = job.progress();

      return {
        status: state,
        progress: typeof progress === 'number' ? progress : 0,
        data: job.data,
        result: job.returnvalue,
        error: job.failedReason,
      };
    } catch (error) {
      console.error('Failed to get job status:', error);
      throw error;
    }
  }

  /**
   * Cancel a generation job
   */
  async cancelJob(jobId: string): Promise<void> {
    try {
      const job = await this.queue.getJob(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      await job.remove();
      
      // Update generation status to failed
      if (job.data?.generationId) {
        await this.updateGenerationStatus(job.data.generationId, 'failed', 'Job cancelled by user');
      }

      console.log(`❌ Generation job cancelled: ${jobId}`);
    } catch (error) {
      console.error('Failed to cancel job:', error);
      throw error;
    }
  }

  /**
   * Get queue statistics
   */
  async getQueueStats(): Promise<{
    waiting: number;
    active: number;
    completed: number;
    failed: number;
    delayed: number;
  }> {
    try {
      const [waiting, active, completed, failed, delayed] = await Promise.all([
        this.queue.getWaiting(),
        this.queue.getActive(),
        this.queue.getCompleted(),
        this.queue.getFailed(),
        this.queue.getDelayed(),
      ]);

      return {
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
      };
    } catch (error) {
      console.error('Failed to get queue stats:', error);
      throw error;
    }
  }

  /**
   * Clean old jobs from the queue
   */
  async cleanQueue(olderThan: number = 24 * 60 * 60 * 1000): Promise<void> {
    try {
      await this.queue.clean(olderThan, 'completed');
      await this.queue.clean(olderThan, 'failed');
      console.log('✅ Queue cleaned successfully');
    } catch (error) {
      console.error('Failed to clean queue:', error);
    }
  }

  /**
   * Setup job processors
   */
  private setupProcessors(): void {
    this.queue.process('generate', this.maxConcurrency, async (job) => {
      const { data } = job;
      const startTime = Date.now();

      try {
        console.log(`🎵 Starting generation job ${job.id} for generation ${data.generationId}`);
        
        // Update progress
        await job.progress(10);

        // Prepare AI service request
        const aiRequest = {
          generation_id: data.generationId,
          type: data.type,
          parameters: data.parameters,
          source_samples: data.source_urls,
        };

        // Call AI service
        await job.progress(20);
        const response = await axios.post(`${this.aiServiceUrl}/generate`, aiRequest, {
          timeout: 300000, // 5 minutes timeout
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || ''}`,
          },
        });

        await job.progress(50);

        if (!response.data.success) {
          throw new Error(response.data.error || 'AI service returned error');
        }

        // Poll for completion
        const result = await this.pollGenerationResult(data.generationId, job);
        
        const processingTime = Date.now() - startTime;
        
        // Update generation in database
        await this.updateGenerationStatus(
          data.generationId,
          'completed',
          undefined,
          result.result_url,
          processingTime
        );

        await job.progress(100);

        console.log(`✅ Generation job completed: ${job.id} in ${processingTime}ms`);
        return result;

      } catch (error) {
        const processingTime = Date.now() - startTime;
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        
        console.error(`❌ Generation job failed: ${job.id}`, error);
        
        // Update generation status to failed
        await this.updateGenerationStatus(
          data.generationId,
          'failed',
          errorMessage,
          undefined,
          processingTime
        );

        throw error;
      }
    });
  }

  /**
   * Setup event handlers for the queue
   */
  private setupEventHandlers(): void {
    this.queue.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed with result:`, result);
    });

    this.queue.on('failed', (job, error) => {
      console.error(`❌ Job ${job.id} failed:`, error.message);
    });

    this.queue.on('stalled', (job) => {
      console.warn(`⚠️ Job ${job.id} stalled`);
    });

    this.queue.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    });

    // Global error handler
    this.queue.on('error', (error) => {
      console.error('Queue error:', error);
    });
  }

  /**
   * Poll AI service for generation result
   */
  private async pollGenerationResult(generationId: string, job: Bull.Job): Promise<GenerationResult> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await axios.get(`${this.aiServiceUrl}/generate/${generationId}/status`, {
          headers: {
            'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || ''}`,
          },
        });

        const status = response.data.status;
        const progress = Math.min(50 + (attempt / maxAttempts) * 40, 90); // 50-90% progress
        
        await job.progress(progress);

        if (status === 'completed') {
          return {
            success: true,
            result_url: response.data.result_url,
            processing_time: response.data.processing_time || 0,
            metadata: response.data.metadata,
          };
        } else if (status === 'failed') {
          throw new Error(response.data.error_message || 'AI generation failed');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      } catch (error) {
        if (attempt === maxAttempts - 1) {
          throw error;
        }
        console.warn(`Polling attempt ${attempt + 1} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, pollInterval));
      }
    }

    throw new Error('Generation timeout - AI service did not complete within expected time');
  }

  /**
   * Update generation status in database
   */
  private async updateGenerationStatus(
    generationId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string,
    resultUrl?: string,
    processingTime?: number
  ): Promise<void> {
    try {
      const updateData: any = {
        status,
        updated_at: new Date().toISOString(),
      };

      if (errorMessage) updateData.error_message = errorMessage;
      if (resultUrl) updateData.result_url = resultUrl;
      if (processingTime) updateData.processing_time = processingTime;

      const { error } = await supabase
        .from('generations')
        .update(updateData)
        .eq('id', generationId);

      if (error) {
        console.error('Failed to update generation status:', error);
      }
    } catch (error) {
      console.error('Failed to update generation status:', error);
    }
  }

  /**
   * Get job priority based on generation type
   */
  private getJobPriority(type: string): number {
    const priorities: Record<string, number> = {
      'sound_logo': 1,     // Highest priority (shortest)
      'social_clip': 2,    // Medium-high priority
      'playlist': 3,       // Medium priority
      'long_form': 4,      // Lowest priority (longest)
    };

    return priorities[type] || 5;
  }

  /**
   * Graceful shutdown
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down generation queue...');
    await this.queue.close();
  }
}

// Export singleton instance
export const generationQueue = new GenerationQueueService();

// Graceful shutdown handling
process.on('SIGTERM', async () => {
  await generationQueue.shutdown();
});

process.on('SIGINT', async () => {
  await generationQueue.shutdown();
});