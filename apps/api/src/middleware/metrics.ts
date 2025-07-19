import { Request, Response, NextFunction } from 'express';
import { httpRequestsTotal, httpRequestDuration } from '@/routes/metrics';

// Middleware to collect HTTP metrics
export function metricsMiddleware(req: Request, res: Response, next: NextFunction) {
  const startTime = Date.now();
  
  // Override the res.end method to capture metrics when response is sent
  const originalEnd = res.end;
  
  res.end = function(chunk?: any, encoding?: any): any {
    const endTime = Date.now();
    const duration = (endTime - startTime) / 1000; // Convert to seconds
    
    // Get route pattern for better labeling
    const route = req.route?.path || req.path || 'unknown';
    const method = req.method;
    const statusCode = res.statusCode.toString();
    
    // Increment request counter
    httpRequestsTotal.inc({
      method,
      route,
      status_code: statusCode,
    });
    
    // Record request duration
    httpRequestDuration.observe({
      method,
      route,
      status_code: statusCode,
    }, duration);
    
    // Call the original end method
    return originalEnd.call(this, chunk, encoding);
  };
  
  next();
}

// Middleware to collect custom business metrics
export function createBusinessMetricsMiddleware(metricName: string, labels: Record<string, string> = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    // Add custom metric collection logic here
    res.locals.businessMetric = { name: metricName, labels };
    next();
  };
}

// Helper function to record audio generation metrics
export function recordAudioGenerationMetric(type: string, status: 'success' | 'failed', duration?: number) {
  // This will be imported and used in the audio generation controllers
  const { audioGenerationsTotal, audioGenerationDuration } = require('@/routes/metrics');
  
  audioGenerationsTotal.inc({ type, status });
  
  if (duration !== undefined) {
    audioGenerationDuration.observe({ type }, duration);
  }
}

// Helper function to record database query metrics
export function recordDatabaseMetric(operation: string, duration: number) {
  const { dbQueryDuration } = require('@/routes/metrics');
  dbQueryDuration.observe({ operation }, duration);
}

// Helper function to record Redis operation metrics
export function recordRedisMetric(operation: string, duration: number) {
  const { redisOperationDuration } = require('@/routes/metrics');
  redisOperationDuration.observe({ operation }, duration);
}