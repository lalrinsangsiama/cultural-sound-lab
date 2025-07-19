import { z } from 'zod';

// Audio generation schemas
export const soundLogoGenerationSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  sampleIds: z.array(z.string()).min(1).max(5),
  parameters: z.object({
    mood: z.string(),
    tempo: z.number().min(60).max(200),
    energy_level: z.number().min(1).max(10),
    duration: z.number().min(3).max(30),
    brand_name: z.string().optional(),
    cultural_style: z.string().optional()
  })
});

export const playlistGenerationSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  sampleIds: z.array(z.string()).min(1).max(10),
  parameters: z.object({
    mood: z.string(),
    duration: z.number().min(300).max(7200), // 5 min to 2 hours
    tempo_variation: z.boolean().optional(),
    smooth_transitions: z.boolean().optional(),
    cultural_style: z.string().optional()
  })
});

export const socialClipGenerationSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  sampleIds: z.array(z.string()).min(1).max(3),
  parameters: z.object({
    platform: z.enum(['instagram', 'tiktok', 'youtube_shorts']),
    mood: z.string(),
    tempo: z.number().min(80).max(180),
    energy_level: z.number().min(1).max(10),
    duration: z.number().min(15).max(60),
    cultural_style: z.string().optional()
  })
});

// Audio upload schema
export const audioUploadSchema = z.object({
  title: z.string().min(1).max(100),
  description: z.string().optional(),
  culturalOrigin: z.string().min(1),
  instrumentType: z.string().min(1),
  tags: z.array(z.string()).optional(),
  metadata: z.object({
    tempo: z.number().optional(),
    key: z.string().optional(),
    mood: z.string().optional()
  }).optional()
});

// License creation schema
export const licenseCreationSchema = z.object({
  audioId: z.string(),
  type: z.enum(['personal', 'commercial', 'enterprise']),
  usage: z.string().min(10).max(500),
  duration: z.enum(['single_use', '1_year', 'perpetual']).optional()
});

// User registration schema with enhanced security
export const userRegistrationSchema = z.object({
  email: z.string()
    .email('Invalid email format')
    .max(255, 'Email too long')
    .regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Invalid email format')
    .transform(s => s.toLowerCase().trim()),
  password: z.string()
    .min(8, 'Password must be at least 8 characters')
    .max(128, 'Password too long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character')
    .refine(
      (password) => !/(password|123456|qwerty|admin|letmein)/i.test(password),
      'Password contains common weak patterns'
    ),
  name: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name too long')
    .regex(/^[a-zA-Z\s\-'\.]+$/, 'Name contains invalid characters')
    .transform(s => s.trim()),
  role: z.enum(['user', 'cultural_contributor']).default('user')
});

// Query parameter schemas
export const paginationSchema = z.object({
  page: z.string().regex(/^\d+$/).transform(Number).optional(),
  limit: z.string().regex(/^\d+$/).transform(Number).optional(),
  sort: z.string().optional(),
  order: z.enum(['asc', 'desc']).optional()
});

export const audioFilterSchema = z.object({
  search: z.string()
    .max(200, 'Search query too long')
    .regex(/^[a-zA-Z0-9\s\-_.,!?]*$/, 'Search contains invalid characters')
    .optional(),
  instrumentType: z.string()
    .max(100, 'Instrument type too long')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'Instrument type contains invalid characters')
    .optional(),
  culturalOrigin: z.string()
    .max(100, 'Cultural origin too long')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'Cultural origin contains invalid characters')
    .optional(),
  mood: z.string()
    .max(50, 'Mood too long')
    .regex(/^[a-zA-Z0-9\s\-_]*$/, 'Mood contains invalid characters')
    .optional(),
  minDuration: z.string()
    .regex(/^\d+$/, 'Invalid duration format')
    .transform(Number)
    .refine(n => n >= 0 && n <= 3600, 'Duration out of range')
    .optional(),
  maxDuration: z.string()
    .regex(/^\d+$/, 'Invalid duration format')
    .transform(Number)
    .refine(n => n >= 0 && n <= 3600, 'Duration out of range')
    .optional(),
  tags: z.string()
    .max(500, 'Tags too long')
    .regex(/^[a-zA-Z0-9\s\-_,]*$/, 'Tags contain invalid characters')
    .optional()
});

// File upload validation schemas
export const audioFileSchema = z.object({
  fieldname: z.string(),
  originalname: z.string()
    .max(255, 'Filename too long')
    .regex(/^[a-zA-Z0-9\s\-_\.()]+\.(mp3|wav|mp4|m4a|ogg|flac)$/i, 'Invalid filename or file type'),
  encoding: z.string(),
  mimetype: z.string()
    .regex(/^audio\/(mpeg|wav|mp4|ogg|flac|x-m4a)$/, 'Invalid MIME type'),
  size: z.number()
    .min(1, 'File cannot be empty')
    .max(50 * 1024 * 1024, 'File size exceeds 50MB limit'),
  buffer: z.instanceof(Buffer).optional(),
  destination: z.string().optional(),
  filename: z.string().optional(),
  path: z.string().optional()
});

// ID parameter validation
export const idParamSchema = z.object({
  id: z.string()
    .uuid('Invalid ID format')
    .or(z.string().regex(/^[a-zA-Z0-9\-_]{1,50}$/, 'Invalid ID format'))
});

// Security headers validation
export const securityHeadersSchema = z.object({
  'x-csrf-token': z.string().optional(),
  'x-request-id': z.string().uuid().optional(),
  'user-agent': z.string().max(500).optional(),
  'x-forwarded-for': z.string().max(100).optional(),
  'x-real-ip': z.string().max(45).optional()
});

// Rate limiting bypass check
export const rateLimitBypassSchema = z.object({
  'x-bypass-rate-limit': z.literal('false').or(z.undefined()),
  'x-admin-override': z.literal('false').or(z.undefined()),
  'x-debug-mode': z.literal('false').or(z.undefined())
});