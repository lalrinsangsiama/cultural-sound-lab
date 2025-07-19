import { NodeSDK } from '@opentelemetry/sdk-node';
import { Instrumentation } from '@opentelemetry/instrumentation';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { RedisInstrumentation } from '@opentelemetry/instrumentation-redis';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { OTLPMetricExporter } from '@opentelemetry/exporter-metrics-otlp-http';
import { trace, metrics } from '@opentelemetry/api';

const serviceName = 'cultural-sound-lab-api';
const serviceVersion = process.env.npm_package_version || '1.0.0';

export function initTelemetry() {
  const isProduction = process.env.NODE_ENV === 'production';
  
  // Configure trace exporter
  let traceExporter;
  
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    // Use OTLP exporter for production (Grafana, Jaeger, etc.)
    traceExporter = new OTLPTraceExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/traces`,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS 
        ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
        : {},
    });
  } else if (process.env.JAEGER_ENDPOINT) {
    // Use Jaeger exporter for development
    traceExporter = new JaegerExporter({
      endpoint: process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
    });
  }

  // Configure metric exporter
  let metricExporter;
  if (process.env.OTEL_EXPORTER_OTLP_ENDPOINT) {
    metricExporter = new OTLPMetricExporter({
      url: `${process.env.OTEL_EXPORTER_OTLP_ENDPOINT}/v1/metrics`,
      headers: process.env.OTEL_EXPORTER_OTLP_HEADERS
        ? JSON.parse(process.env.OTEL_EXPORTER_OTLP_HEADERS)
        : {},
    });
  }

  const sdk = new NodeSDK({
    serviceName,
    // serviceVersion,
    traceExporter,
    metricExporter,
    instrumentations: [
      new HttpInstrumentation({
        ignoreIncomingRequestHook: (req: any) => {
          // Ignore health check requests
          return req.url?.includes('/health') || req.url?.includes('/metrics');
        },
        requestHook: (span: any, request: any) => {
          span.setAttributes({
            'http.user_agent': request.headers['user-agent'],
            'service.name': serviceName,
            'service.version': serviceVersion,
          });
        },
      }),
      new ExpressInstrumentation({
        ignoreLayers: [
          (layer: any) => layer.name === 'query' || layer.name === 'expressInit',
        ],
      }),
      new RedisInstrumentation({
        dbStatementSerializer: (cmdName: any, cmdArgs: any) => {
          // Redact sensitive data in Redis commands
          if (cmdName.toLowerCase().includes('auth')) {
            return `${cmdName} [REDACTED]`;
          }
          return `${cmdName} ${cmdArgs.join(' ')}`;
        },
      }),
    ],
  });

  // Initialize the SDK
  try {
    sdk.start();
    console.log('OpenTelemetry started successfully');
  } catch (error) {
    console.error('Error initializing OpenTelemetry:', error);
  }

  return sdk;
}

// Custom tracer for application-specific spans
export const tracer = trace.getTracer(serviceName, serviceVersion);

// Custom meter for application-specific metrics
export const meter = metrics.getMeter(serviceName, serviceVersion);

// Helper function to create custom spans
export function createSpan(name: string, attributes?: Record<string, string | number | boolean>) {
  const span = tracer.startSpan(name);
  if (attributes) {
    span.setAttributes(attributes);
  }
  return span;
}

// Helper function to add context to spans
export function addSpanEvent(span: any, name: string, attributes?: Record<string, any>) {
  span.addEvent(name, attributes);
}

// Helper function to record errors in spans
export function recordSpanError(span: any, error: Error) {
  span.recordException(error);
  span.setStatus({ code: 2, message: error.message }); // ERROR status
}

// Custom metrics
export const customMetrics = {
  // Request counter
  requestCounter: meter.createCounter('http_requests_total', {
    description: 'Total number of HTTP requests',
  }),
  
  // Request duration histogram
  requestDuration: meter.createHistogram('http_request_duration_seconds', {
    description: 'Duration of HTTP requests in seconds',
  }),
  
  // Audio generation counter
  audioGenerationCounter: meter.createCounter('audio_generations_total', {
    description: 'Total number of audio generations',
  }),
  
  // Audio generation duration
  audioGenerationDuration: meter.createHistogram('audio_generation_duration_seconds', {
    description: 'Duration of audio generation in seconds',
  }),
  
  // Database query duration
  dbQueryDuration: meter.createHistogram('db_query_duration_seconds', {
    description: 'Duration of database queries in seconds',
  }),
  
  // Redis operation duration
  redisOperationDuration: meter.createHistogram('redis_operation_duration_seconds', {
    description: 'Duration of Redis operations in seconds',
  }),
};