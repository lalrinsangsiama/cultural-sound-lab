import { Router, Request, Response } from 'express';
import { authenticateUser, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/error';
import { generationQueue } from '@/services/generationQueue';
import { aiService } from '@/services/aiService';
import { dashboardService } from '@/config/dashboard';
import { circuitBreakerService } from '@/config/circuit-breaker';

const router = Router();

// All routes require admin authentication
router.use(authenticateUser);
router.use(requireAdmin);

// Queue management endpoints
router.get('/queue/stats', asyncHandler(async (req: Request, res: Response) => {
  const stats = await generationQueue.getQueueStats();
  res.json(stats);
}));

router.post('/queue/clean', asyncHandler(async (req: Request, res: Response) => {
  const { olderThan = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours
  await generationQueue.cleanQueue(olderThan);
  res.json({ message: 'Queue cleaned successfully' });
}));

router.delete('/queue/job/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  await generationQueue.cancelJob(jobId);
  res.json({ message: 'Job cancelled successfully' });
}));

router.get('/queue/job/:jobId', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const status = await generationQueue.getJobStatus(jobId);
  res.json(status);
}));

// Dashboard metrics endpoint
router.get('/queue/metrics', asyncHandler(async (req: Request, res: Response) => {
  const metrics = await dashboardService.getQueueMetrics();
  res.json(metrics);
}));

// Detailed job information
router.get('/queue/jobs/:jobId/details', asyncHandler(async (req: Request, res: Response) => {
  const { jobId } = req.params;
  const jobDetails = await dashboardService.getJobDetails(jobId);
  res.json(jobDetails);
}));

// System health endpoint
router.get('/system/health', asyncHandler(async (req: Request, res: Response) => {
  const queueMetrics = await dashboardService.getQueueMetrics();
  const memory = process.memoryUsage();
  const uptime = process.uptime();
  
  const memoryUsage = {
    used: Math.round((memory.heapUsed / 1024 / 1024) * 100) / 100,
    total: Math.round((memory.heapTotal / 1024 / 1024) * 100) / 100,
    external: Math.round((memory.external / 1024 / 1024) * 100) / 100,
    rss: Math.round((memory.rss / 1024 / 1024) * 100) / 100,
    usage_percentage: Math.round((memory.heapUsed / memory.heapTotal) * 100)
  };

  const health = {
    status: 'healthy',
    timestamp: new Date().toISOString(),
    uptime: Math.round(uptime),
    memory: memoryUsage,
    process: {
      pid: process.pid,
      version: process.version,
      platform: process.platform,
      arch: process.arch
    },
    queue: queueMetrics.queues[0] || {
      name: 'generation-queue',
      waiting: 0,
      active: 0,
      completed: 0,
      failed: 0,
      delayed: 0,
      totalJobs: 0
    },
    environment: process.env.NODE_ENV || 'development'
  };

  res.json(health);
}));

// Circuit breaker status endpoint
router.get('/circuit-breakers/status', asyncHandler(async (req: Request, res: Response) => {
  const statuses = circuitBreakerService.getServiceStatuses();
  const healthStatus = circuitBreakerService.getHealthStatus();
  const allMetrics = circuitBreakerService.getAllMetrics();

  res.json({
    services: statuses,
    health: healthStatus,
    metrics: allMetrics,
    timestamp: new Date().toISOString(),
  });
}));

// Force circuit breaker open
router.post('/circuit-breakers/:serviceName/open', asyncHandler(async (req: Request, res: Response) => {
  const { serviceName } = req.params;
  circuitBreakerService.forceOpen(serviceName);
  res.json({ 
    message: `Circuit breaker for ${serviceName} forced open`,
    serviceName 
  });
}));

// Force circuit breaker close
router.post('/circuit-breakers/:serviceName/close', asyncHandler(async (req: Request, res: Response) => {
  const { serviceName } = req.params;
  circuitBreakerService.forceClose(serviceName);
  res.json({ 
    message: `Circuit breaker for ${serviceName} forced closed`,
    serviceName 
  });
}));

// Reset circuit breaker metrics
router.post('/circuit-breakers/:serviceName/reset-metrics', asyncHandler(async (req: Request, res: Response) => {
  const { serviceName } = req.params;
  circuitBreakerService.resetMetrics(serviceName);
  res.json({ 
    message: `Metrics for ${serviceName} reset`,
    serviceName 
  });
}));

// AI service management endpoints
router.get('/ai-service/health', asyncHandler(async (req: Request, res: Response) => {
  const health = await aiService.healthCheck();
  res.json(health);
}));

router.get('/ai-service/models', asyncHandler(async (req: Request, res: Response) => {
  const models = await aiService.getAvailableModels();
  res.json({ models });
}));

router.delete('/ai-service/generation/:generationId', asyncHandler(async (req: Request, res: Response) => {
  const { generationId } = req.params;
  await aiService.cancelGeneration(generationId);
  res.json({ message: 'Generation cancelled successfully' });
}));

export default router;