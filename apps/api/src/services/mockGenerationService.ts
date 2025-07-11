import path from 'path';
import fs from 'fs';
import { supabase } from '@/config/supabase';
import { GenerationJobData } from './generationQueue';

interface MockJob {
  id: string;
  generationId: string;
  type: string;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  progress: number;
  startTime: number;
  processingTime: number;
  resultUrl?: string;
  errorMessage?: string;
}

class MockGenerationService {
  private jobs: Map<string, MockJob> = new Map();
  private readonly demoAudioPath: string;

  constructor() {
    // Path to demo audio files
    this.demoAudioPath = path.join(process.cwd(), '../../assets/demo-audio');
  }

  /**
   * Start a mock generation job
   */
  async startGeneration(jobData: GenerationJobData): Promise<{ jobId: string; estimatedTime: number }> {
    const jobId = `mock_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    // Calculate realistic processing time
    const processingTime = this.calculateProcessingTime(jobData.type, jobData.parameters);
    const estimatedTime = Math.round(processingTime / 1000); // Convert to seconds

    const job: MockJob = {
      id: jobId,
      generationId: jobData.generationId,
      type: jobData.type,
      status: 'pending',
      progress: 0,
      startTime: Date.now(),
      processingTime,
    };

    this.jobs.set(jobId, job);

    // Start the mock processing
    this.processJob(jobId);

    return { jobId, estimatedTime };
  }

  /**
   * Get job status
   */
  getJobStatus(jobId: string): MockJob | null {
    return this.jobs.get(jobId) || null;
  }

  /**
   * Cancel a job
   */
  cancelJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (job && job.status !== 'completed' && job.status !== 'failed') {
      job.status = 'failed';
      job.errorMessage = 'Job cancelled by user';
      return true;
    }
    return false;
  }

  /**
   * Clean up completed jobs older than 1 hour
   */
  cleanupOldJobs(): void {
    const oneHourAgo = Date.now() - 60 * 60 * 1000;
    
    for (const [jobId, job] of this.jobs.entries()) {
      if (job.startTime < oneHourAgo && (job.status === 'completed' || job.status === 'failed')) {
        this.jobs.delete(jobId);
      }
    }
  }

  /**
   * Process a mock job with realistic timing and progress updates
   */
  private async processJob(jobId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    if (!job) return;

    try {
      // Update status to processing
      job.status = 'processing';
      await this.updateDatabaseStatus(job.generationId, 'processing', 0);

      // Simulate processing with progress updates
      const progressSteps = [10, 25, 40, 60, 75, 90, 100];
      const stepDuration = job.processingTime / progressSteps.length;

      for (let i = 0; i < progressSteps.length; i++) {
        await this.sleep(stepDuration);
        
        job.progress = progressSteps[i];
        
        // Update database with progress (optional, for real-time updates)
        if (job.progress < 100) {
          await this.updateDatabaseStatus(job.generationId, 'processing', job.progress);
        }
      }

      // Generate result
      const resultUrl = await this.generateResult(job.type, job.generationId);
      job.resultUrl = resultUrl;
      job.status = 'completed';

      // Final database update
      await this.updateDatabaseStatus(job.generationId, 'completed', 100, resultUrl);

    } catch (error) {
      job.status = 'failed';
      job.errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      await this.updateDatabaseStatus(
        job.generationId, 
        'failed', 
        job.progress, 
        undefined, 
        job.errorMessage
      );
    }
  }

  /**
   * Generate a mock result URL based on generation type
   */
  private async generateResult(type: string, generationId: string): Promise<string> {
    const demoFiles: Record<string, string> = {
      'sound_logo': 'sound-logo-demo.mp3',
      'social_clip': 'social-clip-demo.mp3', 
      'long_form': 'long-form-demo.mp3',
      'playlist': 'playlist-demo.m3u8',
    };

    const demoFile = demoFiles[type] || 'sound-logo-demo.mp3';
    const demoFilePath = path.join(this.demoAudioPath, demoFile);

    // Check if demo file exists
    if (!fs.existsSync(demoFilePath)) {
      throw new Error(`Demo file not found: ${demoFile}`);
    }

    // For a real implementation, you would upload this to your storage service
    // For now, return a mock URL that points to the demo file
    const baseUrl = process.env.API_BASE_URL || 'http://localhost:3001';
    return `${baseUrl}/api/demo-audio/${demoFile}?generation=${generationId}`;
  }

  /**
   * Update generation status in database
   */
  private async updateDatabaseStatus(
    generationId: string, 
    status: string, 
    progress: number,
    resultUrl?: string,
    errorMessage?: string
  ): Promise<void> {
    const updateData: any = {
      status,
      progress,
      updated_at: new Date().toISOString(),
    };

    if (resultUrl) {
      updateData.result_url = resultUrl;
    }

    if (errorMessage) {
      updateData.error_message = errorMessage;
    }

    if (status === 'completed') {
      const jobStartTime = this.jobs.get(generationId.split('_')[0])?.startTime || Date.now();
      updateData.processing_time = Math.round((Date.now() - jobStartTime) / 1000);
    }

    const { error } = await supabase
      .from('generations')
      .update(updateData)
      .eq('id', generationId);

    if (error) {
      console.error('Failed to update generation status:', error);
    }
  }

  /**
   * Calculate realistic processing time based on generation type and parameters
   */
  private calculateProcessingTime(type: string, parameters: any): number {
    const baseTime = 5000; // 5 seconds base
    const duration = parameters.duration || 30;
    
    const multipliers: Record<string, number> = {
      'sound_logo': 200,    // ~5-10 seconds
      'social_clip': 400,   // ~10-20 seconds  
      'playlist': 800,      // ~20-40 seconds (multiple tracks)
      'long_form': 600,     // ~15-30 seconds
    };

    const multiplier = multipliers[type] || 400;
    const timeVariance = Math.random() * 0.5 + 0.75; // 75%-125% variance
    
    return Math.round((baseTime + (duration * multiplier)) * timeVariance);
  }

  /**
   * Sleep utility for delays
   */
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Health check for mock service
   */
  healthCheck(): { status: string; version: string; mode: string } {
    return {
      status: 'healthy',
      version: '1.0.0-mock',
      mode: 'mock',
    };
  }
}

// Export singleton instance
export const mockGenerationService = new MockGenerationService();

// Cleanup old jobs every hour
setInterval(() => {
  mockGenerationService.cleanupOldJobs();
}, 60 * 60 * 1000);