import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import compression from 'compression';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';
import dotenv from 'dotenv';

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
  max: process.env.NODE_ENV === 'production' ? 100 : 1000,
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', limiter);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    environment: process.env.NODE_ENV || 'development',
    services: {
      redis: 'checking...',
      supabase: 'checking...',
      ai_service: 'not connected'
    }
  });
});

// Simple API routes for testing
app.get('/api/audio', (req, res) => {
  res.json({
    message: 'Audio API endpoint - coming soon',
    samples: [
      {
        id: '1',
        title: 'Mizo Traditional Drum',
        cultural_origin: 'Mizo',
        instrument_type: 'percussion',
        approved: true,
        file_url: 'https://example.com/sample1.mp3'
      },
      {
        id: '2', 
        title: 'Mizo Flute Melody',
        cultural_origin: 'Mizo',
        instrument_type: 'wind',
        approved: true,
        file_url: 'https://example.com/sample2.mp3'
      }
    ]
  });
});

app.post('/api/generate', (req, res) => {
  res.json({
    message: 'Generation API endpoint - coming soon',
    generation_id: 'gen_' + Date.now(),
    status: 'pending',
    estimated_completion_time: 60
  });
});

app.get('/api/license', (req, res) => {
  res.json({
    message: 'License API endpoint - coming soon',
    licenses: []
  });
});

// Welcome route
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to Cultural Sound Lab API',
    version: '1.0.0',
    status: 'development',
    endpoints: {
      health: '/health',
      audio: '/api/audio',
      generate: '/api/generate',  
      license: '/api/license'
    },
    docs: 'https://docs.culturalsoundlab.com/api'
  });
});

// Handle 404 errors
app.use((req, res) => {
  res.status(404).json({
    error: 'Route not found',
    path: req.originalUrl,
    method: req.method
  });
});

// Global error handler
app.use((error: any, req: any, res: any, next: any) => {
  console.error('Error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'development' ? error.message : 'Something went wrong'
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Cultural Sound Lab API server running on port ${PORT}`);
  console.log(`📍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  console.log(`📝 API Base URL: http://localhost:${PORT}/api`);
  console.log(`🎵 Audio endpoints: http://localhost:${PORT}/api/audio`);
  console.log(`🤖 Generate endpoints: http://localhost:${PORT}/api/generate`);
  console.log(`📄 License endpoints: http://localhost:${PORT}/api/license`);
});

export default app;