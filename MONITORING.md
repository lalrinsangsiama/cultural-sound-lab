# Cultural Sound Lab Monitoring & Logging

This document describes the monitoring and logging setup for the Cultural Sound Lab platform.

## Overview

The monitoring stack includes:
- **Sentry**: Error tracking and performance monitoring
- **Pino**: Structured logging with JSON output
- **OpenTelemetry**: Distributed tracing and metrics collection
- **Grafana**: Dashboards and alerting
- **Prometheus**: Metrics storage and querying

## Features Implemented

### ✅ Sentry Error Tracking
- **Frontend**: Integrated with Next.js app
- **Backend**: Integrated with Express.js API
- **Features**:
  - Error tracking with stack traces
  - Performance monitoring
  - Session replay (frontend)
  - Release tracking
  - User context tracking

### ✅ Structured Logging (Pino)
- **JSON-formatted logs** for easy parsing
- **Sensitive data redaction** (passwords, tokens, etc.)
- **Request/response logging** with correlation IDs
- **Log levels**: debug, info, warn, error
- **Pretty printing** in development mode

### ✅ Distributed Tracing (OpenTelemetry)
- **HTTP request tracing**
- **Database query tracing**
- **Redis operation tracing**
- **Custom application spans**
- **Metrics collection**:
  - Request rates and durations
  - Audio generation metrics
  - Database query performance
  - System resource usage

### ✅ Grafana Alerting Rules
- **High API error rate** (>5%)
- **High response time** (>2 seconds)
- **Database connection failures**
- **Redis connection failures**
- **Audio generation failure rate** (>20%)
- **High memory usage** (>1GB)

## Environment Variables

```bash
# Sentry
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id

# OpenTelemetry
OTEL_SERVICE_NAME=cultural-sound-lab-api
OTEL_EXPORTER_OTLP_ENDPOINT=http://localhost:4318
OTEL_EXPORTER_OTLP_HEADERS={}
JAEGER_ENDPOINT=http://localhost:14268/api/traces

# Logging
LOG_LEVEL=info

# Grafana
GRAFANA_URL=http://localhost:3000
GRAFANA_API_KEY=your-grafana-api-key

# Notification channels
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@culturalsoundlab.com
```

## Setup Instructions

### 1. Development Setup

```bash
# The monitoring is already integrated into the application
# Just set the environment variables and start the services

# Start the API (monitoring is automatically initialized)
npm run dev:api

# The logs will show structured JSON in production, pretty format in development
```

### 2. Production Setup

#### Sentry Setup
1. Create a Sentry project at https://sentry.io
2. Get your DSN from the project settings
3. Set `SENTRY_DSN` and `NEXT_PUBLIC_SENTRY_DSN` environment variables

#### OpenTelemetry Setup
1. **Option A: Jaeger (Simple)**
   ```bash
   # Run Jaeger locally
   docker run -d --name jaeger \
     -p 16686:16686 \
     -p 14268:14268 \
     jaegertracing/all-in-one:latest
   
   # Set environment variable
   export JAEGER_ENDPOINT=http://localhost:14268/api/traces
   ```

2. **Option B: OTLP Endpoint (Production)**
   ```bash
   # For Grafana Cloud, Datadog, or other OTLP-compatible services
   export OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otlp-endpoint
   export OTEL_EXPORTER_OTLP_HEADERS='{"Authorization":"Bearer your-token"}'
   ```

#### Grafana Setup
1. **Install Grafana**: Follow the [official installation guide](https://grafana.com/docs/grafana/latest/installation/)

2. **Configure Prometheus data source** in Grafana:
   - URL: `http://localhost:9090` (or your Prometheus URL)
   - Access: `Server (default)`

3. **Run the setup script**:
   ```bash
   export GRAFANA_API_KEY=your-grafana-api-key
   export GRAFANA_URL=http://localhost:3000
   ./scripts/setup-monitoring.sh
   ```

4. **Optional: Configure notification channels**:
   ```bash
   export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
   export ALERT_EMAIL=alerts@culturalsoundlab.com
   ./scripts/setup-monitoring.sh
   ```

## Monitoring Dashboards

### API Monitoring Dashboard
- **Request Rate**: Requests per second
- **Error Rate**: Percentage of 5xx responses
- **Response Time**: 95th and 50th percentile latencies
- **Audio Generation**: Success/failure rates and durations
- **System Resources**: Memory and CPU usage
- **Dependencies**: Database and Redis health status

### Key Metrics to Monitor

#### Application Metrics
- `http_requests_total`: Total HTTP requests
- `http_request_duration_seconds`: Request duration histogram
- `audio_generations_total`: Audio generation counter
- `audio_generation_duration_seconds`: Audio generation duration

#### System Metrics
- `process_resident_memory_bytes`: Memory usage
- `process_cpu_seconds_total`: CPU usage
- `nodejs_eventloop_lag_seconds`: Event loop lag

#### Custom Business Metrics
- Audio generation success/failure rates
- User registration rates
- License purchase rates
- Cultural sample usage statistics

## Alert Rules

### Critical Alerts
- **API Error Rate > 5%**: High error rate indicates system issues
- **Database Connection Failure**: Service will be completely down
- **High Memory Usage > 1GB**: Risk of out-of-memory crashes

### Warning Alerts
- **Response Time > 2s**: Poor user experience
- **Redis Connection Failure**: Degraded performance, cached data unavailable
- **Audio Generation Failure Rate > 20%**: Core feature degradation

## Log Analysis

### Log Structure
```json
{
  "level": "INFO",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "msg": "HTTP request completed",
  "req": {
    "method": "POST",
    "url": "/api/generate/sound-logo",
    "headers": { ... }
  },
  "res": {
    "statusCode": 200,
    "headers": { ... }
  },
  "responseTime": 1234,
  "service": "cultural-sound-lab-api",
  "version": "1.0.0"
}
```

### Common Log Queries

#### Error Analysis
```bash
# Find all errors in the last hour
grep '"level":"ERROR"' app.log | tail -100

# Find errors for a specific endpoint
grep '"url":"/api/generate"' app.log | grep '"level":"ERROR"'
```

#### Performance Analysis
```bash
# Find slow requests (>2 seconds)
grep '"responseTime":[2-9][0-9][0-9][0-9]' app.log

# Audio generation performance
grep '"msg":"Audio generation completed"' app.log
```

## Troubleshooting

### Common Issues

#### 1. Sentry Not Receiving Events
- Check DSN configuration
- Verify network connectivity
- Check Sentry project settings

#### 2. OpenTelemetry Traces Not Appearing
- Verify OTLP endpoint configuration
- Check if tracing is enabled (`tracesSampleRate > 0`)
- Ensure proper initialization order (OpenTelemetry before other imports)

#### 3. Grafana Alerts Not Firing
- Verify Prometheus is scraping metrics
- Check alert rule configuration
- Ensure notification channels are configured

#### 4. High Memory Usage
- Check for memory leaks in application code
- Monitor garbage collection metrics
- Consider implementing memory limits

### Health Checks

The API includes comprehensive health checks at `/health`:
```bash
curl http://localhost:3001/health
```

Response includes:
- Overall service status
- Database connectivity
- Redis connectivity
- System uptime
- Environment information

## Security Considerations

### Data Privacy
- **Log Redaction**: Sensitive data (passwords, tokens, PII) is automatically redacted
- **Trace Sampling**: Configure appropriate sampling rates for production
- **Error Context**: Be careful not to log sensitive user data in error contexts

### Access Control
- **Grafana**: Secure with authentication and appropriate permissions
- **Sentry**: Configure team access and project permissions
- **Log Files**: Ensure proper file permissions and log rotation

## Performance Impact

### Monitoring Overhead
- **Sentry**: ~1-2% CPU overhead
- **Structured Logging**: ~0.5% CPU overhead
- **OpenTelemetry**: ~2-3% CPU overhead (adjust sampling rates for production)

### Optimization Tips
- **Sampling**: Use lower sampling rates in production (10-20%)
- **Log Levels**: Use `info` or `warn` in production, `debug` only for troubleshooting
- **Metric Cardinality**: Be careful with high-cardinality labels

## Next Steps

1. **Set up log aggregation** (ELK stack, Grafana Loki, or cloud logging)
2. **Implement custom business metrics** for specific use cases
3. **Set up automated runbooks** for common alert scenarios
4. **Configure advanced alerting** with ML-based anomaly detection
5. **Implement distributed tracing** across microservices as the system scales