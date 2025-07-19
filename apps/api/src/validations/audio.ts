import { z } from 'zod';

// Base audio sample schema
export const audioSampleSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(255),
  description: z.string().optional(),
  instrument_type: z.string().min(1).max(100),
  cultural_origin: z.string().min(1).max(100),
  usage_rights: z.enum(['commercial', 'non-commercial', 'attribution']),
  duration: z.number().positive('Duration must be positive').optional(),
  file_url: z.string().url().optional(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

// Schema for creating audio samples
export const createAudioSampleSchema = z.object({
  title: z.string().min(1, 'Title is required').max(255, 'Title must be less than 255 characters'),
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),
  instrument_type: z.string().min(1, 'Instrument type is required').max(100),
  cultural_origin: z.string().min(1, 'Cultural origin is required').max(100),
  usage_rights: z.enum(['commercial', 'non-commercial', 'attribution']),
});

// Schema for updating audio samples
export const updateAudioSampleSchema = createAudioSampleSchema.partial();

// Query parameters for getting audio samples
export const getAudioSamplesQuerySchema = z.object({
  cultural_origin: z.string().optional(),
  instrument_type: z.string().optional(),
  usage_rights: z.enum(['commercial', 'non-commercial', 'attribution']).optional(),
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  search: z.string().max(255).optional(),
  sort: z.enum(['created_at', 'title', 'duration']).default('created_at'),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// UUID parameter validation
export const uuidParamSchema = z.object({
  id: z.string().uuid('Invalid audio sample ID format'),
});

// File upload validation
export const fileUploadSchema = z.object({
  fieldname: z.string(),
  originalname: z.string(),
  encoding: z.string(),
  mimetype: z.string().refine(
    (type) => type.startsWith('audio/'),
    'File must be an audio file'
  ),
  size: z.number().max(50 * 1024 * 1024, 'File size must be less than 50MB'),
  buffer: z.any().optional(),
});

// Response schemas
export const audioSampleResponseSchema = audioSampleSchema;

export const audioSamplesListResponseSchema = z.object({
  data: z.array(audioSampleSchema),
  total: z.number().int().min(0),
  limit: z.number().int().min(1),
  offset: z.number().int().min(0),
  hasMore: z.boolean(),
});

export const audioPreviewResponseSchema = z.object({
  preview_url: z.string().url(),
  expires_at: z.string().datetime(),
  duration: z.number().positive('Duration must be positive').optional(),
});

// Error response schema
export const errorResponseSchema = z.object({
  error: z.string(),
  message: z.string(),
  statusCode: z.number().int(),
  timestamp: z.string(),
  details: z.record(z.string(), z.any()).optional(),
});

// Type exports
export type AudioSample = z.infer<typeof audioSampleSchema>;
export type CreateAudioSampleInput = z.infer<typeof createAudioSampleSchema>;
export type UpdateAudioSampleInput = z.infer<typeof updateAudioSampleSchema>;
export type GetAudioSamplesQuery = z.infer<typeof getAudioSamplesQuerySchema>;
export type UuidParam = z.infer<typeof uuidParamSchema>;
export type FileUpload = z.infer<typeof fileUploadSchema>;
export type AudioSampleResponse = z.infer<typeof audioSampleResponseSchema>;
export type AudioSamplesListResponse = z.infer<typeof audioSamplesListResponseSchema>;
export type AudioPreviewResponse = z.infer<typeof audioPreviewResponseSchema>;
export type ErrorResponse = z.infer<typeof errorResponseSchema>;