import { z } from 'zod';

// Generation types
export const generationTypeSchema = z.enum([
  'sound-logo',
  'playlist',
  'social-clip',
  'long-form'
]);

// Generation status
export const generationStatusSchema = z.enum([
  'pending',
  'processing',
  'completed',
  'failed'
]);

// Base generation parameters schemas
export const soundLogoParametersSchema = z.object({
  duration: z.number().min(3).max(15).default(10),
  mood: z.enum(['professional', 'energetic', 'calm', 'mysterious', 'modern']).default('professional'),
  tempo: z.enum(['slow', 'medium', 'fast']).default('medium'),
  cultural_elements: z.array(z.string()).min(1).max(3),
  brand_values: z.array(z.string()).max(5).optional(),
});

export const playlistParametersSchema = z.object({
  target_duration: z.number().min(300).max(3600).default(1800), // 5 minutes to 1 hour
  track_count: z.number().min(3).max(20).default(8),
  mood: z.enum(['chill', 'energetic', 'ambient', 'ceremonial', 'uplifting']).default('chill'),
  cultural_mix: z.enum(['single', 'diverse']).default('diverse'),
  fade_transitions: z.boolean().default(true),
  cultural_origins: z.array(z.string()).min(1).max(5),
});

export const socialClipParametersSchema = z.object({
  duration: z.number().min(15).max(60).default(30),
  platform: z.enum(['instagram', 'tiktok', 'youtube-shorts', 'twitter']).default('instagram'),
  mood: z.enum(['viral', 'emotional', 'energetic', 'peaceful', 'dramatic']).default('viral'),
  hook_timing: z.number().min(0).max(5).default(2),
  cultural_authenticity: z.enum(['traditional', 'modern-fusion', 'contemporary']).default('modern-fusion'),
  source_samples: z.array(z.string().uuid()).min(1).max(3),
});

export const longFormParametersSchema = z.object({
  target_duration: z.number().min(120).max(1800).default(300), // 2 minutes to 30 minutes
  style: z.enum(['documentary', 'ambient', 'cinematic', 'meditation', 'background']).default('ambient'),
  narrative_arc: z.enum(['static', 'building', 'cyclical', 'journey']).default('building'),
  cultural_story: z.string().max(500).optional(),
  intensity_curve: z.enum(['flat', 'crescendo', 'wave', 'diminuendo']).default('wave'),
  source_samples: z.array(z.string().uuid()).min(1).max(5),
});

// Dynamic parameters schema based on type
export const generationParametersSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('sound-logo'),
    parameters: soundLogoParametersSchema,
  }),
  z.object({
    type: z.literal('playlist'),
    parameters: playlistParametersSchema,
  }),
  z.object({
    type: z.literal('social-clip'),
    parameters: socialClipParametersSchema,
  }),
  z.object({
    type: z.literal('long-form'),
    parameters: longFormParametersSchema,
  }),
]);

// Create generation request schema
export const createGenerationSchema = z.object({
  type: generationTypeSchema,
  parameters: z.record(z.any()),
  title: z.string().min(1).max(255).optional(),
  description: z.string().max(1000).optional(),
});

// Update generation status schema (for webhooks)
export const updateGenerationStatusSchema = z.object({
  status: generationStatusSchema,
  result_url: z.string().url().optional(),
  error_message: z.string().optional(),
  processing_time: z.number().positive('Processing time must be positive').optional(),
  metadata: z.record(z.any()).optional(),
});

// Generation response schemas
export const generationSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid(),
  type: generationTypeSchema,
  status: generationStatusSchema,
  title: z.string().optional(),
  description: z.string().optional(),
  parameters: z.record(z.any()),
  result_url: z.string().url().optional(),
  error_message: z.string().optional(),
  processing_time: z.number().positive('Processing time must be positive').optional(),
  metadata: z.record(z.any()).optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const generationsListResponseSchema = z.object({
  data: z.array(generationSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
});

// Query schemas
export const getGenerationsQuerySchema = z.object({
  type: generationTypeSchema.optional(),
  status: generationStatusSchema.optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['created_at', 'updated_at', 'status']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// Job status response schema
export const jobStatusResponseSchema = z.object({
  jobId: z.string(),
  status: z.enum(['active', 'waiting', 'completed', 'failed', 'delayed']),
  progress: z.number().min(0).max(100).optional(),
  data: z.record(z.any()).optional(),
  result: z.any().optional(),
  error: z.string().optional(),
  created_at: z.string().datetime(),
  processed_at: z.string().datetime().optional(),
  finished_at: z.string().datetime().optional(),
});

// Download response schema
export const downloadResponseSchema = z.object({
  download_url: z.string().url(),
  expires_at: z.string().datetime(),
  filename: z.string(),
  file_size: z.number().positive('File size must be positive').optional(),
  content_type: z.string(),
});

// UUID parameter validation
export const generationUuidParamSchema = z.object({
  id: z.string().uuid('Invalid generation ID format'),
});

export const jobIdParamSchema = z.object({
  jobId: z.string().min(1, 'Job ID is required'),
});

// Type exports
export type GenerationType = z.infer<typeof generationTypeSchema>;
export type GenerationStatus = z.infer<typeof generationStatusSchema>;
export type SoundLogoParameters = z.infer<typeof soundLogoParametersSchema>;
export type PlaylistParameters = z.infer<typeof playlistParametersSchema>;
export type SocialClipParameters = z.infer<typeof socialClipParametersSchema>;
export type LongFormParameters = z.infer<typeof longFormParametersSchema>;
export type CreateGenerationInput = z.infer<typeof createGenerationSchema>;
export type UpdateGenerationStatusInput = z.infer<typeof updateGenerationStatusSchema>;
export type Generation = z.infer<typeof generationSchema>;
export type GenerationsListResponse = z.infer<typeof generationsListResponseSchema>;
export type GetGenerationsQuery = z.infer<typeof getGenerationsQuerySchema>;
export type JobStatusResponse = z.infer<typeof jobStatusResponseSchema>;
export type DownloadResponse = z.infer<typeof downloadResponseSchema>;
export type GenerationUuidParam = z.infer<typeof generationUuidParamSchema>;
export type JobIdParam = z.infer<typeof jobIdParamSchema>;