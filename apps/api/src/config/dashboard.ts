import { createBullBoard } from '@bull-board/api';
import { BullAdapter } from '@bull-board/api/bullAdapter';
import { ExpressAdapter } from '@bull-board/express';
import { Express } from 'express';
import { generationQueue } from '@/services/generationQueue';

export interface DashboardConfig {
  username?: string;
  password?: string;
  enabled: boolean;
  path: string;
}

class DashboardService {
  private serverAdapter: ExpressAdapter;
  private bullBoard: any;
  private config: DashboardConfig;

  constructor() {
    this.config = {
      username: process.env.BULL_DASHBOARD_USERNAME || 'admin',
      password: process.env.BULL_DASHBOARD_PASSWORD || 'admin123',
      enabled: process.env.NODE_ENV !== 'production' || process.env.BULL_DASHBOARD_ENABLED === 'true',
      path: process.env.BULL_DASHBOARD_PATH || '/admin/queues'
    };

    this.serverAdapter = new ExpressAdapter();
    this.serverAdapter.setBasePath(this.config.path);
  }

  /**
   * Initialize Bull Dashboard
   */
  public init(): void {
    if (!this.config.enabled) {
      console.log('📊 Bull Dashboard disabled');
      return;
    }

    try {
      // Get the queue instance from generationQueue service
      const queueInstance = (generationQueue as any).queue;
      
      if (!queueInstance || typeof queueInstance.add !== 'function') {
        console.warn('⚠️  Bull Dashboard not initialized - queue not available');
        return;
      }

      this.bullBoard = createBullBoard({
        queues: [new BullAdapter(queueInstance)],
        serverAdapter: this.serverAdapter,
      });

      console.log(`📊 Bull Dashboard initialized at ${this.config.path}`);
    } catch (error) {
      console.error('❌ Failed to initialize Bull Dashboard:', error);
    }
  }

  /**
   * Setup Bull Dashboard routes with authentication
   */
  public setupRoutes(app: Express): void {
    if (!this.config.enabled || !this.serverAdapter) {
      return;
    }

    // Basic authentication middleware for dashboard
    const basicAuth = (req: any, res: any, next: any) => {
      const authHeader = req.headers.authorization;

      if (!authHeader || !authHeader.startsWith('Basic ')) {
        res.setHeader('WWW-Authenticate', 'Basic realm="Bull Dashboard"');
        return res.status(401).json({ error: 'Authentication required' });
      }

      const credentials = Buffer.from(authHeader.slice(6), 'base64').toString('utf-8');
      const [username, password] = credentials.split(':');

      if (username !== this.config.username || password !== this.config.password) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      next();
    };

    // Apply basic auth to dashboard routes
    app.use(this.config.path, basicAuth, this.serverAdapter.getRouter());

    console.log(`📊 Bull Dashboard routes configured at ${this.config.path}`);
    console.log(`📊 Dashboard credentials: ${this.config.username}/${this.config.password}`);
  }

  /**
   * Get queue statistics for API endpoints
   */
  public async getQueueMetrics(): Promise<{
    queues: Array<{
      name: string;
      waiting: number;
      active: number;
      completed: number;
      failed: number;
      delayed: number;
      totalJobs: number;
    }>;
    system: {
      memory: NodeJS.MemoryUsage;
      uptime: number;
      pid: number;
    };
  }> {
    try {
      const queueInstance = (generationQueue as any).queue;
      
      if (!queueInstance) {
        throw new Error('Queue not available');
      }

      const [waiting, active, completed, failed, delayed] = await Promise.all([
        queueInstance.getWaiting(),
        queueInstance.getActive(),
        queueInstance.getCompleted(),
        queueInstance.getFailed(),
        queueInstance.getDelayed(),
      ]);

      const queueStats = {
        name: 'generation-queue',
        waiting: waiting.length,
        active: active.length,
        completed: completed.length,
        failed: failed.length,
        delayed: delayed.length,
        totalJobs: waiting.length + active.length + completed.length + failed.length + delayed.length,
      };

      return {
        queues: [queueStats],
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          pid: process.pid,
        },
      };
    } catch (error) {
      console.error('Failed to get queue metrics:', error);
      return {
        queues: [],
        system: {
          memory: process.memoryUsage(),
          uptime: process.uptime(),
          pid: process.pid,
        },
      };
    }
  }

  /**
   * Get detailed job information
   */
  public async getJobDetails(jobId: string): Promise<any> {
    try {
      const queueInstance = (generationQueue as any).queue;
      
      if (!queueInstance) {
        throw new Error('Queue not available');
      }

      const job = await queueInstance.getJob(jobId);
      
      if (!job) {
        throw new Error('Job not found');
      }

      const state = await job.getState();
      const progress = job.progress();
      const logs = await queueInstance.getJobLogs(jobId);

      return {
        id: job.id,
        name: job.name,
        data: job.data,
        state,
        progress: typeof progress === 'number' ? progress : 0,
        createdAt: job.timestamp,
        processedAt: job.processedOn,
        finishedAt: job.finishedOn,
        failedReason: job.failedReason,
        returnValue: job.returnvalue,
        attemptsMade: job.attemptsMade,
        logs: logs.logs,
      };
    } catch (error) {
      console.error('Failed to get job details:', error);
      throw error;
    }
  }

  /**
   * Clean old jobs from queues
   */
  public async cleanOldJobs(olderThan: number = 24 * 60 * 60 * 1000): Promise<{
    completed: number;
    failed: number;
  }> {
    try {
      const queueInstance = (generationQueue as any).queue;
      
      if (!queueInstance) {
        throw new Error('Queue not available');
      }

      const [completedCount, failedCount] = await Promise.all([
        queueInstance.clean(olderThan, 'completed'),
        queueInstance.clean(olderThan, 'failed'),
      ]);

      console.log(`🧹 Cleaned ${completedCount} completed and ${failedCount} failed jobs`);
      
      return {
        completed: completedCount,
        failed: failedCount,
      };
    } catch (error) {
      console.error('Failed to clean jobs:', error);
      throw error;
    }
  }
}

export const dashboardService = new DashboardService();