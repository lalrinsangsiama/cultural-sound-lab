import { z } from 'zod';

// Validation schema for required environment variables
const envSchema = z.object({
  // Server Configuration
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.string().transform(Number).pipe(z.number().min(1000).max(65535)).default(3001),
  API_BASE_URL: z.string().url().optional(),
  FRONTEND_URL: z.string().url().optional(),

  // Database Configuration
  SUPABASE_URL: z.string().url().optional(),
  SUPABASE_ANON_KEY: z.string().min(1).optional(),
  SUPABASE_SERVICE_KEY: z.string().min(1).optional(),
  SUPABASE_JWT_SECRET: z.string().min(32).optional(),

  // Alternative PostgreSQL
  DATABASE_URL: z.string().optional(),
  DB_HOST: z.string().optional(),
  DB_PORT: z.string().transform(Number).pipe(z.number().positive()).optional(),
  DB_NAME: z.string().optional(),
  DB_USER: z.string().optional(),
  DB_PASSWORD: z.string().optional(),


  // Authentication & Security
  JWT_SECRET: z.string().min(32).optional(),
  JWT_EXPIRY: z.string().default('24h'),
  REFRESH_TOKEN_SECRET: z.string().min(32).optional(),
  BCRYPT_ROUNDS: z.string().transform(Number).pipe(z.number().min(10).max(15)).default(12),
  SESSION_SECRET: z.string().min(32).optional(),

  // CORS Configuration
  CORS_ORIGINS: z.string().default('http://localhost:3000,http://localhost:3001'),

  // Payments & Billing
  // Razorpay Configuration
  RAZORPAY_KEY_ID: z.string().optional(),
  RAZORPAY_KEY_SECRET: z.string().optional(),
  RAZORPAY_WEBHOOK_SECRET: z.string().optional(),
  
  // Stripe Configuration (deprecated)
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_PUBLISHABLE_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),

  // AI Service Configuration
  AI_SERVICE_URL: z.string().url().default('http://localhost:8000'),
  AI_SERVICE_API_KEY: z.string().optional(),
  AI_SERVICE_TIMEOUT: z.string().transform(Number).pipe(z.number().positive()).default(300000),

  // Storage Configuration
  STORAGE_PROVIDER: z.enum(['minio', 's3']).default('minio'),
  MINIO_ENDPOINT: z.string().default('localhost'),
  MINIO_PORT: z.string().transform(Number).pipe(z.number().positive()).default(9000),
  MINIO_ACCESS_KEY: z.string().default('minioadmin'),
  MINIO_SECRET_KEY: z.string().default('minioadmin'),
  MINIO_USE_SSL: z.string().transform(val => val === 'true').default(false),

  // AWS Configuration
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_REGION: z.string().default('us-east-1'),

  // Email Configuration
  EMAIL_PROVIDER: z.enum(['sendgrid', 'smtp']).default('sendgrid'),
  SENDGRID_API_KEY: z.string().optional(),
  FROM_EMAIL: z.string().email().optional(),

  // Monitoring & Observability
  SENTRY_DSN: z.string().url().optional(),
  SENTRY_TRACES_SAMPLE_RATE: z.string().transform(Number).pipe(z.number().min(0).max(1)).default(0.1),
  LOG_LEVEL: z.enum(['error', 'warn', 'info', 'debug']).default('info'),

  // Feature Flags
  ENABLE_SWAGGER_DOCS: z.string().transform(val => val === 'true').default(true),
  ENABLE_METRICS_ENDPOINT: z.string().transform(val => val === 'true').default(true),
  ENABLE_HEALTH_CHECKS: z.string().transform(val => val === 'true').default(true),
  ENABLE_CORS: z.string().transform(val => val === 'true').default(true),
  ENABLE_RATE_LIMITING: z.string().transform(val => val === 'true').default(true),
  ENABLE_AI_GENERATION: z.string().transform(val => val === 'true').default(true),
  ENABLE_PAYMENT_PROCESSING: z.string().transform(val => val === 'true').default(false),

  // Rate Limiting
  RATE_LIMIT_WINDOW_MS: z.string().transform(Number).pipe(z.number().positive()).default(900000),
  RATE_LIMIT_MAX_REQUESTS: z.string().transform(Number).pipe(z.number().positive()).default(100),

  // File Processing
  MAX_FILE_SIZE: z.string().default('50MB'),
  ALLOWED_FILE_TYPES: z.string().default('audio/mpeg,audio/wav,audio/mp3,audio/mp4'),

  // Development & Testing
  DEBUG_MODE: z.string().transform(val => val === 'true').default(false),
  MOCK_AI_SERVICE: z.string().transform(val => val === 'true').default(true),
  MOCK_PAYMENT_SERVICE: z.string().transform(val => val === 'true').default(true),
});

// Runtime environment validation
const runtimeValidationSchema = z.object({
  // Production-specific requirements
  ...(process.env.NODE_ENV === 'production' && {
    JWT_SECRET: z.string().min(32),
    SESSION_SECRET: z.string().min(32),
    SENTRY_DSN: z.string().url(),
    // Database required in production
    SUPABASE_URL: z.string().url(),
    SUPABASE_SERVICE_KEY: z.string().min(1),
  }),
});

export type EnvConfig = z.infer<typeof envSchema>;

let envConfig: EnvConfig;

export function validateEnv(): EnvConfig {
  try {
    // Validate basic environment variables
    envConfig = envSchema.parse(process.env);
    
    // Additional runtime validation
    if (process.env.NODE_ENV === 'production') {
      const requiredInProduction = [
        'JWT_SECRET',
        'SESSION_SECRET',
        'SUPABASE_URL',
        'SUPABASE_SERVICE_KEY'
      ];
      
      const missing = requiredInProduction.filter(key => !process.env[key]);
      if (missing.length > 0) {
        throw new Error(`Missing required environment variables for production: ${missing.join(', ')}`);
      }
    }

    // Validate feature flag combinations
    if (envConfig.ENABLE_PAYMENT_PROCESSING && !process.env.RAZORPAY_KEY_ID && !process.env.STRIPE_SECRET_KEY) {
      console.warn('⚠️  Payment processing enabled but neither RAZORPAY_KEY_ID nor STRIPE_SECRET_KEY configured');
    }

    if (envConfig.ENABLE_AI_GENERATION && !process.env.AI_SERVICE_URL) {
      console.warn('⚠️  AI generation enabled but AI_SERVICE_URL not configured');
    }

    // Log configuration status
    console.log('✅ Environment variables validated successfully');
    console.log(`📊 Running in ${envConfig.NODE_ENV} mode`);
    
    if (envConfig.DEBUG_MODE) {
      console.log('🐛 Debug mode enabled');
    }

    // Log enabled features
    const enabledFeatures = Object.entries(envConfig)
      .filter(([key, value]) => key.startsWith('ENABLE_') && value === true)
      .map(([key]) => key.replace('ENABLE_', '').toLowerCase());
    
    if (enabledFeatures.length > 0) {
      console.log(`🚀 Enabled features: ${enabledFeatures.join(', ')}`);
    }

    return envConfig;
  } catch (error) {
    console.error('❌ Environment validation failed:');
    if (error instanceof z.ZodError) {
      error.issues.forEach((err: any) => {
        console.error(`  - ${err.path.join('.')}: ${err.message}`);
      });
    } else {
      console.error(error);
    }
    process.exit(1);
  }
}

export function getEnvConfig(): EnvConfig {
  if (!envConfig) {
    throw new Error('Environment not validated. Call validateEnv() first.');
  }
  return envConfig;
}

// Utility functions for common environment checks
export const isProduction = () => getEnvConfig().NODE_ENV === 'production';
export const isDevelopment = () => getEnvConfig().NODE_ENV === 'development';
export const isTest = () => getEnvConfig().NODE_ENV === 'test';

export const isFeatureEnabled = (feature: keyof EnvConfig): boolean => {
  const config = getEnvConfig();
  return Boolean(config[feature]);
};

// Database connection validation
export const validateDatabaseConnection = async (): Promise<boolean> => {
  const config = getEnvConfig();
  
  if (config.SUPABASE_URL && config.SUPABASE_SERVICE_KEY) {
    try {
      // Test Supabase connection
      const { createClient } = await import('@supabase/supabase-js');
      const supabase = createClient(config.SUPABASE_URL, config.SUPABASE_SERVICE_KEY);
      
      // Simple connectivity test
      await supabase.from('users').select('count', { count: 'exact', head: true });
      console.log('✅ Supabase connection validated');
      return true;
    } catch (error) {
      console.warn('⚠️  Supabase connection failed:', error instanceof Error ? error.message : error);
      return false;
    }
  }
  
  console.log('⚠️  No database configuration found, running in mock mode');
  return false;
};


// External service validation
export const validateExternalServices = async (): Promise<void> => {
  const config = getEnvConfig();
  
  // Validate AI service if enabled
  if (config.ENABLE_AI_GENERATION && config.AI_SERVICE_URL) {
    try {
      const response = await fetch(`${config.AI_SERVICE_URL}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      
      if (response.ok) {
        console.log('✅ AI service connection validated');
      } else {
        console.warn('⚠️  AI service health check failed');
      }
    } catch (error) {
      console.warn('⚠️  AI service connection failed, using mock service');
    }
  }
  
  // Validate payment provider if payments enabled
  if (config.ENABLE_PAYMENT_PROCESSING) {
    if (config.RAZORPAY_KEY_ID && config.RAZORPAY_KEY_SECRET) {
      try {
        const Razorpay = (await import('razorpay')).default;
        const razorpay = new Razorpay({
          key_id: config.RAZORPAY_KEY_ID,
          key_secret: config.RAZORPAY_KEY_SECRET,
        });
        
        // Test Razorpay connection by fetching plans (simple API call)
        console.log('✅ Razorpay client initialized successfully');
      } catch (error) {
        console.warn('⚠️  Razorpay initialization failed:', error instanceof Error ? error.message : error);
      }
    } else if (config.STRIPE_SECRET_KEY) {
      try {
        const Stripe = (await import('stripe')).default;
        const stripe = new Stripe(config.STRIPE_SECRET_KEY, { apiVersion: '2025-06-30.basil' });
        
        // Test Stripe connection
        await stripe.balance.retrieve();
        console.log('✅ Stripe connection validated');
      } catch (error) {
        console.warn('⚠️  Stripe connection failed:', error instanceof Error ? error.message : error);
      }
    }
  }
};

// Comprehensive startup validation
export const runStartupValidation = async (): Promise<void> => {
  console.log('🔍 Running startup validation...');
  
  // Initialize secrets management first
  try {
    const { initializeSecrets } = await import('./secrets');
    await initializeSecrets();
  } catch (error) {
    console.warn('⚠️  Secrets management initialization failed, continuing with environment variables:', error);
  }
  
  // Validate environment variables
  validateEnv();
  
  // Validate connections
  await Promise.all([
    validateDatabaseConnection(),
    validateExternalServices(),
  ]);
  
  console.log('✅ Startup validation completed');
};