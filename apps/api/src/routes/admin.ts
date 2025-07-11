import { Router } from 'express';
import { authenticateUser, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/error';
import { generationQueue } from '@/services/generationQueue';
import { aiService } from '@/services/aiService';

const router = Router();

// All routes require admin authentication
router.use(authenticateUser);
router.use(requireAdmin);

// Queue management endpoints
router.get('/queue/stats', asyncHandler(async (req, res) => {
  const stats = await generationQueue.getQueueStats();
  res.json(stats);
}));

router.post('/queue/clean', asyncHandler(async (req, res) => {
  const { olderThan = 24 * 60 * 60 * 1000 } = req.body; // Default 24 hours
  await generationQueue.cleanQueue(olderThan);
  res.json({ message: 'Queue cleaned successfully' });
}));

router.delete('/queue/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  await generationQueue.cancelJob(jobId);
  res.json({ message: 'Job cancelled successfully' });
}));

router.get('/queue/job/:jobId', asyncHandler(async (req, res) => {
  const { jobId } = req.params;
  const status = await generationQueue.getJobStatus(jobId);
  res.json(status);
}));

// AI service management endpoints
router.get('/ai-service/health', asyncHandler(async (req, res) => {
  const health = await aiService.healthCheck();
  res.json(health);
}));

router.get('/ai-service/models', asyncHandler(async (req, res) => {
  const models = await aiService.getAvailableModels();
  res.json({ models });
}));

router.delete('/ai-service/generation/:generationId', asyncHandler(async (req, res) => {
  const { generationId } = req.params;
  await aiService.cancelGeneration(generationId);
  res.json({ message: 'Generation cancelled successfully' });
}));

export default router;