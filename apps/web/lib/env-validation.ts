import { z } from 'zod';

// Client-side environment validation schema
const envSchema = z.object({
  // Environment
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // API Configuration
  NEXT_PUBLIC_API_URL: z.string().url().default('http://localhost:3001'),
  NEXT_PUBLIC_STORAGE_URL: z.string().url().default('http://localhost:9000'),

  // Supabase Configuration (Public)
  NEXT_PUBLIC_SUPABASE_URL: z.string().url().optional(),
  NEXT_PUBLIC_SUPABASE_ANON_KEY: z.string().optional(),

  // Authentication (if using custom JWT)
  NEXT_PUBLIC_JWT_SECRET: z.string().min(32).optional(),

  // App Configuration
  NEXT_PUBLIC_APP_ENV: z.enum(['development', 'staging', 'production']).default('development'),
  NEXT_PUBLIC_APP_NAME: z.string().default('Cultural Sound Lab'),
  NEXT_PUBLIC_APP_DESCRIPTION: z.string().default('AI-powered cultural music generation platform'),

  // Features Flags
  NEXT_PUBLIC_ENABLE_ANALYTICS: z.string().transform(val => val === 'true').default(false),
  NEXT_PUBLIC_ENABLE_PAYMENTS: z.string().transform(val => val === 'true').default(false),
  NEXT_PUBLIC_ENABLE_AI_GENERATION: z.string().transform(val => val === 'true').default(true),
  NEXT_PUBLIC_ENABLE_DEMO_MODE: z.string().transform(val => val === 'true').default(true),

  // External Services
  // Razorpay Configuration
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().optional(),
  
  // Stripe Configuration (deprecated)
  NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  
  NEXT_PUBLIC_SENTRY_DSN: z.string().url().optional(),
  NEXT_PUBLIC_GOOGLE_ANALYTICS_ID: z.string().optional(),

  // File Upload & Storage
  NEXT_PUBLIC_MAX_FILE_SIZE: z.string().default('50MB'),
  NEXT_PUBLIC_ALLOWED_FILE_TYPES: z.string().default('audio/mpeg,audio/wav,audio/mp3,audio/mp4'),
  NEXT_PUBLIC_CDN_URL: z.string().url().optional(),

  // Rate Limiting (for client-side display)
  NEXT_PUBLIC_RATE_LIMIT_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default(100),
  NEXT_PUBLIC_RATE_LIMIT_WINDOW: z.string().transform(Number).pipe(z.number().positive()).default(3600),

  // Contact Information
  NEXT_PUBLIC_SUPPORT_EMAIL: z.string().email().default('support@culturalsoundlab.com'),
  NEXT_PUBLIC_TWITTER_HANDLE: z.string().optional(),
  NEXT_PUBLIC_LINKEDIN_URL: z.string().url().optional(),

  // Legal & Compliance
  NEXT_PUBLIC_PRIVACY_POLICY_URL: z.string().default('/privacy'),
  NEXT_PUBLIC_TERMS_OF_SERVICE_URL: z.string().default('/terms'),
  NEXT_PUBLIC_COOKIE_POLICY_URL: z.string().default('/cookies'),
});

// Server-side environment validation schema (for API routes, SSR)
const serverEnvSchema = z.object({
  // Include all client-side variables
  ...envSchema.shape,

  // Server-only environment variables
  SUPABASE_SERVICE_KEY: z.string().optional(),
  JWT_SECRET: z.string().min(32).optional(),
  
  // Razorpay Configuration (server-side)
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  
  // Stripe Configuration (deprecated)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_ORG: z.string().default('cultural-sound-lab'),
  SENTRY_PROJECT_WEB: z.string().default('web'),

  // Database connections (for server-side operations)
  DATABASE_URL: z.string().optional(),

  // Email configuration
  SENDGRID_API_KEY: z.string().optional(),
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),

  // Analytics & Monitoring
  GOOGLE_ANALYTICS_SECRET: z.string().optional(),
  MIXPANEL_SECRET: z.string().optional(),
});

export type ClientEnvConfig = z.infer<typeof envSchema>;
export type ServerEnvConfig = z.infer<typeof serverEnvSchema>;

let clientEnvConfig: ClientEnvConfig | null = null;
let serverEnvConfig: ServerEnvConfig | null = null;

// Client-side validation (safe for browser)
export function validateClientEnv(): ClientEnvConfig {
  if (typeof window === 'undefined') {
    throw new Error('validateClientEnv should only be called on the client side');
  }

  if (clientEnvConfig) {
    return clientEnvConfig;
  }

  try {
    // Only validate NEXT_PUBLIC_ variables on client
    const publicEnv = Object.fromEntries(
      Object.entries(process.env).filter(([key]) => key.startsWith('NEXT_PUBLIC_'))
    );

    clientEnvConfig = envSchema.parse({
      ...publicEnv,
      NODE_ENV: process.env.NODE_ENV,
    });

    console.log('✅ Client environment variables validated');
    
    // Log configuration in development
    if (clientEnvConfig.NODE_ENV === 'development') {
      console.log('🔧 Client configuration:', {
        apiUrl: clientEnvConfig.NEXT_PUBLIC_API_URL,
        storageUrl: clientEnvConfig.NEXT_PUBLIC_STORAGE_URL,
        features: {
          analytics: clientEnvConfig.NEXT_PUBLIC_ENABLE_ANALYTICS,
          payments: clientEnvConfig.NEXT_PUBLIC_ENABLE_PAYMENTS,
          aiGeneration: clientEnvConfig.NEXT_PUBLIC_ENABLE_AI_GENERATION,
          demoMode: clientEnvConfig.NEXT_PUBLIC_ENABLE_DEMO_MODE,
        },
      });
    }

    return clientEnvConfig;
  } catch (error) {
    console.error('❌ Client environment validation failed:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    throw error;
  }
}

// Server-side validation (includes sensitive variables)
export function validateServerEnv(): ServerEnvConfig {
  if (typeof window !== 'undefined') {
    throw new Error('validateServerEnv should only be called on the server side');
  }

  if (serverEnvConfig) {
    return serverEnvConfig;
  }

  try {
    serverEnvConfig = serverEnvSchema.parse(process.env);

    // Production-specific validation
    if (serverEnvConfig.NODE_ENV === 'production') {
      const requiredInProduction = [];
      
      if (serverEnvConfig.NEXT_PUBLIC_ENABLE_PAYMENTS) {
        requiredInProduction.push('RAZORPAY_KEY_SECRET', 'RAZORPAY_WEBHOOK_SECRET');
      }
      
      if (serverEnvConfig.NEXT_PUBLIC_ENABLE_ANALYTICS) {
        requiredInProduction.push('GOOGLE_ANALYTICS_SECRET');
      }

      const missing = requiredInProduction.filter(key => !process.env[key]);
      if (missing.length > 0) {
        console.warn(`⚠️  Missing recommended environment variables for production: ${missing.join(', ')}`);
      }
    }

    console.log('✅ Server environment variables validated');

    return serverEnvConfig;
  } catch (error) {
    console.error('❌ Server environment validation failed:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    throw error;
  }
}

// Universal getter that works on both client and server
export function getEnvConfig(): ClientEnvConfig | ServerEnvConfig {
  if (typeof window !== 'undefined') {
    return validateClientEnv();
  } else {
    return validateServerEnv();
  }
}

// Utility functions
export const isProduction = () => getEnvConfig().NODE_ENV === 'production';
export const isDevelopment = () => getEnvConfig().NODE_ENV === 'development';
export const isTest = () => getEnvConfig().NODE_ENV === 'test';

export const isFeatureEnabled = (feature: keyof ClientEnvConfig): boolean => {
  const config = getEnvConfig();
  return Boolean(config[feature]);
};

// Client-side API health check
export const validateApiConnection = async (): Promise<boolean> => {
  if (typeof window === 'undefined') return false;
  
  const config = validateClientEnv();
  
  try {
    const response = await fetch(`${config.NEXT_PUBLIC_API_URL}/api/health`, {
      method: 'GET',
      cache: 'no-cache',
    });
    
    if (response.ok) {
      console.log('✅ API connection validated');
      return true;
    } else {
      console.warn('⚠️  API health check failed');
      return false;
    }
  } catch (error) {
    console.warn('⚠️  API connection failed:', error instanceof Error ? error.message : error);
    return false;
  }
};

// File size parser utility
export const parseFileSize = (sizeStr: string): number => {
  const units: Record<string, number> = {
    B: 1,
    KB: 1024,
    MB: 1024 * 1024,
    GB: 1024 * 1024 * 1024,
  };

  const match = sizeStr.match(/^(\d+(?:\.\d+)?)\s*(B|KB|MB|GB)$/i);
  if (!match) {
    throw new Error(`Invalid file size format: ${sizeStr}`);
  }

  const [, size, unit] = match;
  return parseFloat(size || '0') * (units[unit?.toUpperCase()] || 1);
};

// Environment-specific configuration getters
export const getUploadConfig = () => {
  const config = getEnvConfig();
  return {
    maxFileSize: parseFileSize(config.NEXT_PUBLIC_MAX_FILE_SIZE),
    allowedTypes: config.NEXT_PUBLIC_ALLOWED_FILE_TYPES.split(',').map(type => type.trim()),
  };
};

export const getRateLimitConfig = () => {
  const config = getEnvConfig();
  return {
    requests: config.NEXT_PUBLIC_RATE_LIMIT_REQUESTS,
    windowSeconds: config.NEXT_PUBLIC_RATE_LIMIT_WINDOW,
  };
};

export const getContactInfo = () => {
  const config = getEnvConfig();
  return {
    supportEmail: config.NEXT_PUBLIC_SUPPORT_EMAIL,
    twitterHandle: config.NEXT_PUBLIC_TWITTER_HANDLE,
    linkedinUrl: config.NEXT_PUBLIC_LINKEDIN_URL,
  };
};

export const getLegalUrls = () => {
  const config = getEnvConfig();
  return {
    privacyPolicy: config.NEXT_PUBLIC_PRIVACY_POLICY_URL,
    termsOfService: config.NEXT_PUBLIC_TERMS_OF_SERVICE_URL,
    cookiePolicy: config.NEXT_PUBLIC_COOKIE_POLICY_URL,
  };
};

// Component-level environment validation hook
export const useEnvValidation = () => {
  if (typeof window === 'undefined') {
    throw new Error('useEnvValidation can only be used in client components');
  }

  const config = validateClientEnv();
  
  return {
    config,
    isProduction: isProduction(),
    isDevelopment: isDevelopment(),
    features: {
      analytics: config.NEXT_PUBLIC_ENABLE_ANALYTICS,
      payments: config.NEXT_PUBLIC_ENABLE_PAYMENTS,
      aiGeneration: config.NEXT_PUBLIC_ENABLE_AI_GENERATION,
      demoMode: config.NEXT_PUBLIC_ENABLE_DEMO_MODE,
    },
    api: {
      baseUrl: config.NEXT_PUBLIC_API_URL,
      storageUrl: config.NEXT_PUBLIC_STORAGE_URL,
    },
    upload: getUploadConfig(),
    rateLimit: getRateLimitConfig(),
    contact: getContactInfo(),
    legal: getLegalUrls(),
  };
};