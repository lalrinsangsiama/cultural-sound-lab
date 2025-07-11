import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

import { globalErrorHandler, notFoundHandler, rateLimitErrorHandler } from '@/middleware/error';
import { supabase } from '@/config/supabase';
import { redis } from '@/config/redis';
import audioRoutes from '@/routes/audio';
import generateRoutes from '@/routes/generate';
import licenseRoutes from '@/routes/license';
import adminRoutes from '@/routes/admin';
import demoAudioRoutes from '@/routes/demoAudio';

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Security middleware
app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));

// CORS configuration for Next.js frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Compression middleware
app.use(compression());

// Logging middleware
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));

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

// Health check endpoint (also accessible via /api/health through proxy)
app.get('/health', async (req, res) => {
  let databaseHealthy = false;
  let redisHealthy = false;

  // Check database connection
  try {
    const { error } = await supabase
      .from('audio_samples')
      .select('id')
      .limit(1);
    databaseHealthy = !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    databaseHealthy = false;
  }

  // Check Redis connection
  try {
    await redis.ping();
    redisHealthy = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    redisHealthy = false;
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseHealthy,
    redis: redisHealthy
  });
});

// Also make health check available at /api/health for frontend proxy
app.get('/api/health', async (req, res) => {
  let databaseHealthy = false;
  let redisHealthy = false;

  // Check database connection
  try {
    const { error } = await supabase
      .from('audio_samples')
      .select('id')
      .limit(1);
    databaseHealthy = !error;
  } catch (error) {
    console.error('Database health check failed:', error);
    databaseHealthy = false;
  }

  // Check Redis connection
  try {
    await redis.ping();
    redisHealthy = true;
  } catch (error) {
    console.error('Redis health check failed:', error);
    redisHealthy = false;
  }

  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    database: databaseHealthy,
    redis: redisHealthy
  });
});

// API routes
app.use('/api/audio', audioRoutes);
app.use('/api/generate', generateRoutes);
app.use('/api/license', licenseRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/demo-audio', demoAudioRoutes);

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Cultural Sound Lab API',
    version: '1.0.0',
    endpoints: {
      audio: '/api/audio',
      generate: '/api/generate',
      license: '/api/license'
    },
    docs: '/api/docs' // TODO: Add API documentation
  });
});

// Handle 404 errors
app.use(notFoundHandler);

// Global error handler
app.use(globalErrorHandler);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received. Shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT received. Shutting down gracefully...');
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cultural Sound Lab API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
    console.log(`🎵 Audio endpoints: http://localhost:${PORT}/api/audio`);
    console.log(`🤖 Generate endpoints: http://localhost:${PORT}/api/generate`);
    console.log(`📄 License endpoints: http://localhost:${PORT}/api/license`);
  }
});

export default app;