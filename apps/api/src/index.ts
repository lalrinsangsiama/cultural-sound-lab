import express, { Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';
import pinoHttp from 'pino-http';

// Load environment variables first
dotenv.config();

// Initialize OpenTelemetry first (must be before other imports)
import { initTelemetry } from '@/config/telemetry';
initTelemetry();

// Initialize Sentry after OpenTelemetry
import { initSentry } from '@/config/sentry';
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import { requestHandler, errorHandler } from '@sentry/node';
initSentry();

import { globalErrorHandler, notFoundHandler, rateLimitErrorHandler } from '@/middleware/error';
import { versioningMiddleware, versionTransform } from '@/middleware/versioning';
import { databaseService } from '@/config/database';
import { redis } from '@/config/redis';
import { setupSwagger } from '@/config/swagger';
import { logger, httpLogger } from '@/config/logger';
import { dashboardService } from '@/config/dashboard';
import { webSocketService } from '@/config/websocket';
import { createServer } from 'http';
import audioRoutes from '@/routes/audio';
import generateRoutes from '@/routes/generate';
import licenseRoutes from '@/routes/license';
import adminRoutes from '@/routes/admin';
import demoAudioRoutes from '@/routes/demoAudio';
import paymentRoutes from '@/routes/payment';
import razorpayRoutes from '@/routes/razorpay';
import webhookRoutes from '@/routes/webhook';
import razorpayWebhookRoutes from '@/routes/razorpayWebhook';
import { csrfMiddleware, originValidation, getCsrfToken } from '@/middleware/csrf';
import { sanitizeRequest } from '@/middleware/validation';
import { metricsMiddleware } from '@/middleware/metrics';
import { createSessionMiddleware } from '@/config/session';

// Run environment validation before initializing app
import { runStartupValidation } from '@/config/env-validation';

const app = express();
const server = createServer(app);
const PORT = process.env.PORT || 3001;

// Request tracing
app.use(requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// Security middleware with comprehensive headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'", "https://js.stripe.com"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      fontSrc: ["'self'", "https:", "data:"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'self'", "https://js.stripe.com"],
    },
  },
  hsts: {
    maxAge: 31536000,
    includeSubDomains: true,
    preload: true
  },
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// Enhanced CORS configuration with strict production rules
const allowedOrigins = process.env.NODE_ENV === 'production'
  ? (process.env.ALLOWED_ORIGINS || 'https://culturalsoundlab.com,https://www.culturalsoundlab.com').split(',').map(origin => origin.trim())
  : ['http://localhost:3000', 'http://localhost:3001', 'http://127.0.0.1:3000', 'http://127.0.0.1:3001'];

// Additional security for production
const isProduction = process.env.NODE_ENV === 'production';
const strictOriginCheck = (origin: string | undefined, allowedOrigins: string[]): boolean => {
  if (!origin) {
    // In production, reject requests with no origin for enhanced security
    // Allow in development for testing tools like Postman
    return !isProduction;
  }
  
  // Check exact match
  if (allowedOrigins.includes(origin)) {
    return true;
  }
  
  // In production, only allow HTTPS origins and validate domain
  if (isProduction) {
    try {
      const originUrl = new URL(origin);
      // Only allow HTTPS in production
      if (originUrl.protocol !== 'https:') {
        return false;
      }
      
      // Check against allowed domains with subdomain support
      return allowedOrigins.some(allowed => {
        try {
          const allowedUrl = new URL(allowed);
          return originUrl.hostname === allowedUrl.hostname || 
                 originUrl.hostname.endsWith('.' + allowedUrl.hostname);
        } catch {
          return false;
        }
      });
    } catch {
      return false;
    }
  }
  
  return false;
};

app.use(cors({
  origin: (origin, callback) => {
    if (strictOriginCheck(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      const error = new Error(`CORS policy violation: Origin '${origin}' not allowed`);
      logger.warn({ origin, allowedOrigins, isProduction }, 'CORS request blocked');
      callback(error);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Content-Type', 
    'Authorization', 
    'X-Requested-With', 
    'X-CSRF-Token',
    'X-Request-ID',
    'Cache-Control'
  ],
  exposedHeaders: ['X-CSRF-Token', 'X-Request-ID'],
  maxAge: isProduction ? 86400 : 300, // 24 hours in production, 5 minutes in development
  optionsSuccessStatus: 200
}));

// Webhook routes need raw body parsing - mount before JSON parsing middleware
app.use('/api/webhooks', express.raw({ type: 'application/json' }), webhookRoutes);
app.use('/api/webhooks', express.raw({ type: 'application/json' }), razorpayWebhookRoutes);

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Session middleware (before CSRF and other auth middlewares)
app.use(createSessionMiddleware());

// Structured logging middleware
app.use(pinoHttp({ logger }));

// Metrics collection middleware
app.use(metricsMiddleware);

// Input sanitization middleware
app.use('/api', sanitizeRequest);

// CSRF protection middleware
app.use('/api', csrfMiddleware());

// Origin validation for state-changing requests
app.use('/api', originValidation(allowedOrigins));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: process.env.NODE_ENV === 'production' ? 100 : 1000, // limit each IP to 100 requests per windowMs in production
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
  handler: rateLimitErrorHandler
});

app.use('/api', limiter);

// API versioning middleware
app.use('/api', versioningMiddleware);
app.use('/api', versionTransform);

// Setup API documentation
setupSwagger(app);

// Initialize and setup Bull Dashboard
dashboardService.init();
dashboardService.setupRoutes(app);

// Initialize WebSocket server
webSocketService.init(server);

/**
 * @swagger
 * /health:
 *   get:
 *     summary: Health check endpoint
 *     description: Returns the current health status of the API and its dependencies
 *     tags: [Health]
 *     responses:
 *       200:
 *         description: Service is healthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/HealthCheck'
 *       503:
 *         description: Service is unhealthy
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Error'
 */

// Health check handler
const healthCheckHandler = async (req: Request, res: Response) => {
  let redisHealthy = false;

  // Check database connections (main and replica)
  const dbHealth = await databaseService.checkHealth();

  // Check Redis connection
  try {
    await redis.ping();
    redisHealthy = true;
  } catch (error) {
    logger.error({ err: error }, 'Redis health check failed');
    redisHealthy = false;
  }

  // Overall health status
  const isHealthy = dbHealth.main && redisHealthy;

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'unhealthy',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      database: {
        main: dbHealth.main,
        replica: dbHealth.replica,
        replicaEnabled: dbHealth.replicaEnabled,
      },
      redis: redisHealthy,
      websocket: webSocketService.getConnectedUsersCount(),
    },
    performance: {
      memory: process.memoryUsage(),
      connections: webSocketService.getConnectedSocketsCount(),
    }
  });
};

// Health check endpoints
app.get('/health', healthCheckHandler);
app.get('/api/health', healthCheckHandler);

// CSRF token endpoint
app.get('/api/csrf-token', getCsrfToken);

// Metrics endpoint (before rate limiting for Prometheus)
import metricsRoutes from '@/routes/metrics';
app.use('/', metricsRoutes);

// API routes
app.use('/api/audio', audioRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo-audio', demoAudioRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/razorpay', razorpayRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Cultural Sound Lab API',
    version: '1.0.0',
    endpoints: {
      audio: '/api/audio',
      generate: '/api/generate',
      license: '/api/license',
      payments: '/api/payments',
      razorpay: '/api/razorpay',
      webhooks: '/api/webhooks'
    },
    docs: '/api/docs'
  });
});

// Handle 404 errors
app.use(notFoundHandler);

// Sentry error handler
app.use(errorHandler());

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received. Shutting down gracefully...');
  await webSocketService.shutdown();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received. Shutting down gracefully...');
  await webSocketService.shutdown();
  process.exit(0);
});

process.on('uncaughtException', (error) => {
  logger.error({ err: error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.error({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

// Start server
server.listen(PORT, async () => {
  // Run startup validation
  await runStartupValidation();
  logger.info({
    port: PORT,
    environment: process.env.NODE_ENV || 'development',
    healthCheck: `http://localhost:${PORT}/health`,
    websocket: `ws://localhost:${PORT}/socket.io`,
    dashboard: process.env.NODE_ENV !== 'production' ? `http://localhost:${PORT}/admin/queues` : undefined,
    endpoints: process.env.NODE_ENV !== 'production' ? {
      api: `http://localhost:${PORT}/api`,
      audio: `http://localhost:${PORT}/api/audio`,
      generate: `http://localhost:${PORT}/api/generate`,
      license: `http://localhost:${PORT}/api/license`
    } : undefined
  }, 'Cultural Sound Lab API server started');
});

export default app;