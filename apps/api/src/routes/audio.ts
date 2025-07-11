import { Router } from 'express';
import { authenticateUser, requireContributor } from '@/middleware/auth';
import { uploadAudio } from '@/middleware/upload';
import { asyncHandler } from '@/middleware/error';
import {
  getAudioSamples,
  getAudioSample,
  uploadAudioSample,
  updateAudioSample,
  deleteAudioSample,
  previewAudio
} from '@/controllers/audio';

const router = Router();

// Public routes
router.get('/', asyncHandler(getAudioSamples));
router.get('/:id', asyncHandler(getAudioSample));
router.get('/:id/preview', asyncHandler(previewAudio));

// Protected routes
router.post(
  '/',
  authenticateUser,
  requireContributor,
  uploadAudio.single('audio'),
  asyncHandler(uploadAudioSample)
);

router.put(
  '/:id',
  authenticateUser,
  asyncHandler(updateAudioSample)
);

router.delete(
  '/:id',
  authenticateUser,
  asyncHandler(deleteAudioSample)
);

export default router;