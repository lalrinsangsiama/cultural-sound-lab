import { Router } from 'express';
import { authenticateUser, requireContributor } from '@/middleware/auth';
import { uploadAudio } from '@/middleware/upload';
import { asyncHandler } from '@/middleware/error';
import { validate, validateFile, sanitizeRequest } from '@/middleware/validation';
import { createSecureMulterConfig, validateUploadedFile, cleanupTempFile } from '@/middleware/fileValidation';
import {
  getAudioSamplesQuerySchema,
  uuidParamSchema,
  createAudioSampleSchema,
  updateAudioSampleSchema,
  fileUploadSchema,
  audioSamplesListResponseSchema,
  audioSampleResponseSchema,
  audioPreviewResponseSchema
} from '@/validations/audio';
import {
  getAudioSamples,
  getAudioSample,
  uploadAudioSample,
  updateAudioSample,
  deleteAudioSample,
  previewAudio,
  streamAudio
} from '@/controllers/audio';

const router = Router();

/**
 * @swagger
 * /api/audio:
 *   get:
 *     summary: Get all audio samples
 *     description: Retrieve a list of all available audio samples with optional filtering
 *     tags: [Audio]
 *     parameters:
 *       - in: query
 *         name: cultural_origin
 *         schema:
 *           type: string
 *         description: Filter by cultural origin
 *       - in: query
 *         name: instrument_type
 *         schema:
 *           type: string
 *         description: Filter by instrument type
 *       - in: query
 *         name: usage_rights
 *         schema:
 *           type: string
 *           enum: [commercial, non-commercial, attribution]
 *         description: Filter by usage rights
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           minimum: 1
 *           maximum: 100
 *           default: 20
 *         description: Number of items to return
 *       - in: query
 *         name: offset
 *         schema:
 *           type: integer
 *           minimum: 0
 *           default: 0
 *         description: Number of items to skip
 *     responses:
 *       200:
 *         description: List of audio samples retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 data:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/AudioSample'
 *                 total:
 *                   type: integer
 *                 limit:
 *                   type: integer
 *                 offset:
 *                   type: integer
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/audio/{id}:
 *   get:
 *     summary: Get audio sample by ID
 *     description: Retrieve a specific audio sample by its unique identifier
 *     tags: [Audio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the audio sample
 *     responses:
 *       200:
 *         description: Audio sample retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AudioSample'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/audio/{id}/preview:
 *   get:
 *     summary: Preview audio sample
 *     description: Get a preview URL or stream for an audio sample
 *     tags: [Audio]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the audio sample
 *     responses:
 *       200:
 *         description: Preview URL retrieved successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 preview_url:
 *                   type: string
 *                   format: uri
 *                   description: URL for previewing the audio sample
 *                 expires_at:
 *                   type: string
 *                   format: date-time
 *                   description: When the preview URL expires
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/audio:
 *   post:
 *     summary: Upload new audio sample
 *     description: Upload a new audio sample to the platform (requires contributor role)
 *     tags: [Audio]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               audio:
 *                 type: string
 *                 format: binary
 *                 description: Audio file to upload
 *               title:
 *                 type: string
 *                 description: Title of the audio sample
 *               description:
 *                 type: string
 *                 description: Description of the audio sample
 *               instrument_type:
 *                 type: string
 *                 description: Type of instrument
 *               cultural_origin:
 *                 type: string
 *                 description: Cultural origin of the sample
 *               usage_rights:
 *                 type: string
 *                 enum: [commercial, non-commercial, attribution]
 *                 description: Usage rights for the sample
 *             required:
 *               - audio
 *               - title
 *               - instrument_type
 *               - cultural_origin
 *               - usage_rights
 *     responses:
 *       201:
 *         description: Audio sample uploaded successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AudioSample'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       403:
 *         $ref: '#/components/responses/ForbiddenError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/audio/{id}:
 *   put:
 *     summary: Update audio sample
 *     description: Update metadata for an existing audio sample
 *     tags: [Audio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the audio sample
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               title:
 *                 type: string
 *                 description: Title of the audio sample
 *               description:
 *                 type: string
 *                 description: Description of the audio sample
 *               instrument_type:
 *                 type: string
 *                 description: Type of instrument
 *               cultural_origin:
 *                 type: string
 *                 description: Cultural origin of the sample
 *               usage_rights:
 *                 type: string
 *                 enum: [commercial, non-commercial, attribution]
 *                 description: Usage rights for the sample
 *     responses:
 *       200:
 *         description: Audio sample updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/AudioSample'
 *       400:
 *         $ref: '#/components/responses/ValidationError'
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

/**
 * @swagger
 * /api/audio/{id}:
 *   delete:
 *     summary: Delete audio sample
 *     description: Delete an audio sample and its associated files
 *     tags: [Audio]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *         description: Unique identifier of the audio sample
 *     responses:
 *       204:
 *         description: Audio sample deleted successfully
 *       401:
 *         $ref: '#/components/responses/UnauthorizedError'
 *       404:
 *         $ref: '#/components/responses/NotFoundError'
 *       500:
 *         $ref: '#/components/responses/InternalServerError'
 */

// Apply sanitization to all routes
router.use(sanitizeRequest);

// Public routes
router.get(
  '/',
  validate({ query: getAudioSamplesQuerySchema }),
  asyncHandler(getAudioSamples)
);

router.get(
  '/:id',
  validate({ params: uuidParamSchema }),
  asyncHandler(getAudioSample)
);

router.get(
  '/:id/preview',
  validate({ params: uuidParamSchema }),
  asyncHandler(previewAudio)
);

router.get(
  '/:id/stream',
  validate({ params: uuidParamSchema }),
  asyncHandler(streamAudio)
);

// Create secure multer configuration for audio uploads
const secureAudioUpload = createSecureMulterConfig({
  allowedMimeTypes: [
    'audio/mpeg',
    'audio/wav', 
    'audio/mp4',
    'audio/x-m4a',
    'audio/ogg',
    'audio/flac',
    'audio/webm'
  ],
  maxFileSize: 50 * 1024 * 1024, // 50MB
  allowedExtensions: ['.mp3', '.wav', '.mp4', '.m4a', '.ogg', '.flac', '.webm'],
  virusScanEnabled: process.env.NODE_ENV === 'production',
  checkMagicBytes: true,
  requireAudioMetadata: true
});

// Protected routes
router.post(
  '/',
  authenticateUser,
  requireContributor,
  secureAudioUpload.single('audio'),
  validateUploadedFile(),
  validate({ body: createAudioSampleSchema }),
  cleanupTempFile(),
  asyncHandler(uploadAudioSample)
);

router.put(
  '/:id',
  authenticateUser,
  validate({ 
    params: uuidParamSchema, 
    body: updateAudioSampleSchema 
  }),
  asyncHandler(updateAudioSample)
);

router.delete(
  '/:id',
  authenticateUser,
  validate({ params: uuidParamSchema }),
  asyncHandler(deleteAudioSample)
);

export default router;