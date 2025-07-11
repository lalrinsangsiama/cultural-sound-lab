import { Router } from 'express';
import { authenticateUser, requireAdmin } from '@/middleware/auth';
import { asyncHandler } from '@/middleware/error';
import {
  createLicense,
  getUserLicenses,
  getLicense,
  verifyLicense,
  updatePaymentStatus,
  recordDownload
} from '@/controllers/license';

const router = Router();

// All routes require authentication
router.use(authenticateUser);

// User routes
router.post('/', asyncHandler(createLicense));
router.get('/', asyncHandler(getUserLicenses));
router.get('/:id', asyncHandler(getLicense));
router.get('/:id/verify', asyncHandler(verifyLicense));
router.post('/:id/download', asyncHandler(recordDownload));

// Payment webhook routes (admin only for security)
router.patch('/:id/payment', requireAdmin, asyncHandler(updatePaymentStatus));

export default router;