import { Router } from 'express';
import { authenticateUser, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/error';
import {
  createGeneration,
  getGeneration,
  getUserGenerations,
  downloadGeneration,
  deleteGeneration,
  getJobStatus,
  updateGenerationStatus
} from '@/controllers/generate';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// User routes
router.post('/', asyncHandler(createGeneration));
router.get('/', asyncHandler(getUserGenerations));
router.get('/:id', asyncHandler(getGeneration));
router.get('/:id/download', asyncHandler(downloadGeneration));
router.delete('/:id', asyncHandler(deleteGeneration));

// Job status polling
router.get('/job/:jobId/status', asyncHandler(getJobStatus));

// Webhook route for AI service (admin only for security)
router.patch('/:id/status', requireAdmin, asyncHandler(updateGenerationStatus));

export default router;