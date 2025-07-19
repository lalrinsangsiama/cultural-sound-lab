import { supabase } from '@/config/supabase';
import axios from 'axios';
import { webSocketService } from '@/config/websocket';
import { aiServiceBreaker } from '@/config/circuit-breaker';
import { EventEmitter } from 'events';

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

interface Job {
  id: string;
  data: GenerationJobData;
  status: 'waiting' | 'active' | 'completed' | 'failed';
  progress: number;
  result?: any;
  error?: string;
  attempts: number;
  maxAttempts: number;
  createdAt: Date;
  priority: number;
}

class GenerationQueueService extends EventEmitter {
  private jobs: Map<string, Job> = new Map();
  private queue: Job[] = [];
  private activeJobs: Set<string> = new Set();
  private readonly aiServiceUrl: string;
  private readonly maxConcurrency: number;
  private readonly maxAttempts: number;
  private jobIdCounter: number = 0;
  private processingInterval?: NodeJS.Timeout;

  constructor() {
    super();
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.maxConcurrency = parseInt(process.env.GENERATION_CONCURRENCY || '2');
    this.maxAttempts = 3;
    
    console.log('✅ Using in-memory generation queue');
    this.setupEventHandlers();
    this.startProcessing();
  }

  /**
   * Add a generation job to the queue
   */
  async addGenerationJob(data: GenerationJobData, options: any = {}): Promise<Job> {
    try {
      // Update generation status to 'processing'
      await this.updateGenerationStatus(data.generationId, 'processing', undefined, undefined, undefined, data.userId);

      // Create job
      const jobId = `job_${++this.jobIdCounter}_${Date.now()}`;
      const priority = this.getJobPriority(data.type);
      
      const job: Job = {
        id: jobId,
        data,
        status: 'waiting',
        progress: 0,
        attempts: 0,
        maxAttempts: this.maxAttempts,
        createdAt: new Date(),
        priority,
      };

      this.jobs.set(jobId, job);
      this.queue.push(job);
      
      // Sort queue by priority (lower number = higher priority)
      this.queue.sort((a, b) => a.priority - b.priority);

      console.log(`✅ Generation job added to queue: ${job.id} for generation ${data.generationId}`);
      return job;
    } catch (error) {
      console.error('Failed to add generation job:', error);
      await this.updateGenerationStatus(data.generationId, 'failed', 'Failed to queue generation job', undefined, undefined, data.userId);
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
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      return {
        status: job.status,
        progress: job.progress,
        data: job.data,
        result: job.result,
        error: job.error,
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
      const job = this.jobs.get(jobId);
      if (!job) {
        throw new Error('Job not found');
      }

      // Remove from queue if waiting
      const queueIndex = this.queue.findIndex(q => q.id === jobId);
      if (queueIndex !== -1) {
        this.queue.splice(queueIndex, 1);
      }

      // Update job status
      job.status = 'failed';
      job.error = 'Job cancelled by user';
      
      // Remove from active jobs
      this.activeJobs.delete(jobId);
      
      // Update generation status to failed
      await this.updateGenerationStatus(job.data.generationId, 'failed', 'Job cancelled by user', undefined, undefined, job.data.userId);

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
      const allJobs = Array.from(this.jobs.values());
      
      return {
        waiting: allJobs.filter(job => job.status === 'waiting').length,
        active: allJobs.filter(job => job.status === 'active').length,
        completed: allJobs.filter(job => job.status === 'completed').length,
        failed: allJobs.filter(job => job.status === 'failed').length,
        delayed: 0, // No delayed jobs in simple implementation
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
      const cutoffTime = new Date(Date.now() - olderThan);
      const jobsToRemove: string[] = [];
      
      for (const [jobId, job] of this.jobs.entries()) {
        if ((job.status === 'completed' || job.status === 'failed') && 
            job.createdAt < cutoffTime) {
          jobsToRemove.push(jobId);
        }
      }
      
      jobsToRemove.forEach(jobId => this.jobs.delete(jobId));
      console.log(`✅ Queue cleaned successfully - removed ${jobsToRemove.length} old jobs`);
    } catch (error) {
      console.error('Failed to clean queue:', error);
    }
  }

  /**
   * Start processing jobs
   */
  private startProcessing(): void {
    this.processingInterval = setInterval(() => {
      this.processQueue();
    }, 1000); // Check every second
  }

  /**
   * Process jobs in the queue
   */
  private async processQueue(): Promise<void> {
    // Don't exceed max concurrency
    if (this.activeJobs.size >= this.maxConcurrency) {
      return;
    }

    // Get next job from queue
    const nextJob = this.queue.find(job => job.status === 'waiting');
    if (!nextJob) {
      return;
    }

    // Move job to active
    nextJob.status = 'active';
    this.activeJobs.add(nextJob.id);
    
    // Remove from waiting queue
    const queueIndex = this.queue.findIndex(job => job.id === nextJob.id);
    if (queueIndex !== -1) {
      this.queue.splice(queueIndex, 1);
    }

    // Process the job
    this.processJob(nextJob).catch(error => {
      console.error(`Failed to process job ${nextJob.id}:`, error);
    });
  }

  /**
   * Process a single job
   */
  private async processJob(job: Job): Promise<void> {
    const { data } = job;
    const startTime = Date.now();

    try {
      console.log(`🎵 Starting generation job ${job.id} for generation ${data.generationId}`);
      
      // Update progress
      job.progress = 10;
      webSocketService.emitGenerationProgress(data.generationId, data.userId, {
        status: 'processing',
        progress: 10,
        message: 'Preparing audio generation...'
      });

      // Prepare AI service request
      const aiRequest = {
        generation_id: data.generationId,
        type: data.type,
        parameters: data.parameters,
        source_samples: data.source_urls,
      };

      // Call AI service
      job.progress = 20;
      webSocketService.emitGenerationProgress(data.generationId, data.userId, {
        status: 'processing',
        progress: 20,
        message: 'Sending request to AI service...'
      });
      const response = await aiServiceBreaker.fire({
        url: '/generate',
        method: 'POST',
        data: aiRequest,
        timeout: 300000, // 5 minutes timeout
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || ''}`,
        },
      });

      job.progress = 50;
      webSocketService.emitGenerationProgress(data.generationId, data.userId, {
        status: 'processing',
        progress: 50,
        message: 'AI is generating your audio...'
      });

      if (!(response as any).data.success) {
        throw new Error((response as any).data.error || 'AI service returned error');
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
        processingTime,
        data.userId
      );

      job.progress = 100;
      job.status = 'completed';
      job.result = result;
      this.activeJobs.delete(job.id);

      console.log(`✅ Generation job completed: ${job.id} in ${processingTime}ms`);
      this.emit('completed', job, result);

    } catch (error) {
      const processingTime = Date.now() - startTime;
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      console.error(`❌ Generation job failed: ${job.id}`, error);
      
      job.attempts++;
      if (job.attempts < job.maxAttempts) {
        // Retry job
        job.status = 'waiting';
        this.queue.push(job);
        this.queue.sort((a, b) => a.priority - b.priority);
        this.activeJobs.delete(job.id);
        console.log(`🔄 Retrying job ${job.id} (attempt ${job.attempts}/${job.maxAttempts})`);
        return;
      }
      
      // Update generation status to failed
      await this.updateGenerationStatus(
        data.generationId,
        'failed',
        errorMessage,
        undefined,
        processingTime,
        data.userId
      );

      job.status = 'failed';
      job.error = errorMessage;
      this.activeJobs.delete(job.id);
      this.emit('failed', job, error);
    }
  }

  /**
   * Setup event handlers for the queue
   */
  private setupEventHandlers(): void {
    this.on('completed', (job, result) => {
      console.log(`✅ Job ${job.id} completed with result:`, result);
    });

    this.on('failed', (job, error) => {
      console.error(`❌ Job ${job.id} failed:`, error.message);
    });

    this.on('progress', (job, progress) => {
      console.log(`📊 Job ${job.id} progress: ${progress}%`);
    });

    // Global error handler
    this.on('error', (error) => {
      console.error('Queue error:', error);
    });
  }

  /**
   * Poll AI service for generation result
   */
  private async pollGenerationResult(generationId: string, job: Job): Promise<GenerationResult> {
    const maxAttempts = 60; // 5 minutes with 5-second intervals
    const pollInterval = 5000; // 5 seconds

    for (let attempt = 0; attempt < maxAttempts; attempt++) {
      try {
        const response = await aiServiceBreaker.fire({
          url: `/generate/${generationId}/status`,
          method: 'GET',
          timeout: 15000, // 15 seconds for status checks
          headers: {
            'Authorization': `Bearer ${process.env.AI_SERVICE_API_KEY || ''}`,
          },
        });

        const status = (response as any).data.status;
        const progress = Math.min(50 + (attempt / maxAttempts) * 40, 90); // 50-90% progress
        
        job.progress = progress;

        if (status === 'completed') {
          return {
            success: true,
            result_url: (response as any).data.result_url,
            processing_time: (response as any).data.processing_time || 0,
            metadata: (response as any).data.metadata,
          };
        } else if (status === 'failed') {
          throw new Error((response as any).data.error_message || 'AI generation failed');
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
   * Update generation status in database and emit WebSocket event
   */
  private async updateGenerationStatus(
    generationId: string,
    status: 'pending' | 'processing' | 'completed' | 'failed',
    errorMessage?: string,
    resultUrl?: string,
    processingTime?: number,
    userId?: string
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
        return;
      }

      // Emit WebSocket event for real-time updates
      if (userId) {
        const progress = status === 'completed' ? 100 : 
                        status === 'failed' ? 0 : 
                        status === 'processing' ? 20 : 0;

        webSocketService.emitGenerationProgress(generationId, userId, {
          status,
          progress,
          message: this.getStatusMessage(status),
          result_url: resultUrl,
          error: errorMessage,
        });
      }
    } catch (error) {
      console.error('Failed to update generation status:', error);
    }
  }

  /**
   * Get user-friendly status message
   */
  private getStatusMessage(status: string): string {
    switch (status) {
      case 'pending': return 'Generation request queued';
      case 'processing': return 'AI is generating your audio...';
      case 'completed': return 'Generation completed successfully!';
      case 'failed': return 'Generation failed. Please try again.';
      default: return 'Unknown status';
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
    if (this.processingInterval) {
      clearInterval(this.processingInterval);
    }
    
    // Wait for active jobs to complete or timeout after 30 seconds
    const timeout = 30000;
    const startTime = Date.now();
    
    while (this.activeJobs.size > 0 && (Date.now() - startTime) < timeout) {
      await new Promise(resolve => setTimeout(resolve, 1000));
    }
    
    if (this.activeJobs.size > 0) {
      console.warn(`⚠️ Shutdown timeout - ${this.activeJobs.size} jobs still active`);
    }
    
    console.log('✅ Generation queue shutdown complete');
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