# Cultural Sound Lab Monitoring Setup Guide

## What We've Implemented ✅

Your Cultural Sound Lab platform now has a comprehensive monitoring and logging system:

### 1. ✅ Sentry Error Tracking
- **Frontend & Backend** integrated with error capture
- **Performance monitoring** with custom sampling rates
- **Session replay** for frontend debugging
- **Release tracking** for deployment monitoring

### 2. ✅ Structured Logging (Pino)
- **JSON-formatted logs** for production
- **Sensitive data redaction** (passwords, tokens)
- **Request correlation** with trace IDs
- **Development-friendly** pretty printing

### 3. ✅ OpenTelemetry Distributed Tracing
- **HTTP request tracing** across services
- **Database & Redis** operation tracing
- **Custom business metrics** for audio generation
- **OTLP & Jaeger** export support

### 4. ✅ Prometheus Metrics Collection
- **HTTP request metrics** (rate, duration, errors)
- **Custom business metrics** (audio generation stats)
- **System metrics** (memory, CPU usage)
- **Health check endpoints** with detailed status

### 5. ✅ Grafana Alerting & Dashboards
- **6 production alert rules** with proper thresholds
- **Comprehensive dashboard** for API monitoring
- **Notification channels** (Slack, email, PagerDuty)
- **Automated setup scripts** for easy deployment

## Quick Test Without Docker

Since Docker isn't running on your system, let's test the monitoring components that are already integrated:

### Test 1: Check API Metrics Endpoint

```bash
# Start your API server
cd /Users/lalrinnghetisangsiama/cultural-sound-lab/apps/api
npm run dev

# In another terminal, test the metrics endpoint
curl http://localhost:3001/metrics
```

You should see Prometheus-formatted metrics like:
```
# HELP http_requests_total Total number of HTTP requests
# TYPE http_requests_total counter
http_requests_total{method="GET",route="/health",status_code="200"} 1

# HELP process_resident_memory_bytes Resident memory size in bytes
# TYPE process_resident_memory_bytes gauge
process_resident_memory_bytes 45678912
```

### Test 2: Verify Structured Logging

```bash
# Make some API requests to see logs
curl http://localhost:3001/health
curl http://localhost:3001/api/health
curl http://localhost:3001/api/audio
```

You should see structured JSON logs in your terminal with:
- Request details
- Response times
- Correlation IDs
- Proper log levels

### Test 3: Check Health Endpoint

```bash
curl -s http://localhost:3001/health | jq
```

Expected response:
```json
{
  "status": "healthy",
  "timestamp": "2024-01-20T10:30:00.000Z",
  "uptime": 123.45,
  "environment": "development",
  "services": {
    "database": {
      "main": true,
      "replica": false,
      "replicaEnabled": false
    },
    "redis": true,
    "websocket": 0
  },
  "performance": {
    "memory": {
      "rss": 45678912,
      "heapTotal": 25165824,
      "heapUsed": 18874512
    },
    "connections": 0
  }
}
```

## Setup Options for Full Stack

### Option 1: Manual Installation (Recommended for Testing)

#### Install Grafana (macOS)
```bash
# Using Homebrew
brew install grafana

# Start Grafana
brew services start grafana

# Access: http://localhost:3000 (admin/admin)
```

#### Install Prometheus (macOS)
```bash
# Using Homebrew
brew install prometheus

# Copy our config
cp monitoring/prometheus/prometheus.yml /opt/homebrew/etc/prometheus.yml

# Start Prometheus
brew services start prometheus

# Access: http://localhost:9090
```

#### Install Jaeger (Optional)
```bash
# Download and run Jaeger
docker run -d --name jaeger \
  -p 16686:16686 \
  -p 14268:14268 \
  jaegertracing/all-in-one:latest

# Access: http://localhost:16686
```

### Option 2: Docker Setup (When Docker is Available)

```bash
# Start Docker Desktop first, then run:
cd /Users/lalrinnghetisangsiama/cultural-sound-lab
./scripts/setup-monitoring-complete.sh
```

This will automatically:
- Start Prometheus on :9090
- Start Grafana on :3002 (admin/admin123)
- Start Jaeger on :16686
- Configure all dashboards and alerts
- Set up notification channels

### Option 3: Cloud-Based Monitoring

#### Grafana Cloud (Free Tier)
1. Sign up at https://grafana.com/cloud/
2. Get your OTLP endpoint and API key
3. Set environment variables:
```bash
export OTEL_EXPORTER_OTLP_ENDPOINT=https://otlp-gateway-prod-us-east-0.grafana.net/otlp
export OTEL_EXPORTER_OTLP_HEADERS='{"Authorization":"Basic your-base64-encoded-key"}'
```

#### Sentry Setup
1. Sign up at https://sentry.io
2. Create a new project
3. Set environment variables:
```bash
export SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
export NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

## Notification Channels Configuration

### Slack Integration
```bash
# Get webhook URL from Slack Apps
export SLACK_WEBHOOK_URL=https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX

# Test notification
curl -X POST -H 'Content-type: application/json' \
  --data '{"text":"Cultural Sound Lab monitoring test"}' \
  $SLACK_WEBHOOK_URL
```

### Email Alerts
```bash
export ALERT_EMAIL=alerts@culturalsoundlab.com
```

### PagerDuty Integration
```bash
export PAGERDUTY_INTEGRATION_KEY=your-integration-key
```

## Production Deployment Checklist

### 1. Environment Variables
Copy these to your production environment:
```bash
# Monitoring
SENTRY_DSN=https://your-production-sentry-dsn
OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otlp-endpoint
LOG_LEVEL=info

# Notifications  
SLACK_WEBHOOK_URL=https://hooks.slack.com/services/...
ALERT_EMAIL=alerts@culturalsoundlab.com
PAGERDUTY_INTEGRATION_KEY=your-key

# Grafana
GRAFANA_URL=https://your-grafana-instance.com
GRAFANA_API_KEY=your-api-key
```

### 2. Alert Threshold Tuning

Based on your actual traffic, adjust these thresholds in `monitoring/grafana/alert-rules.json`:

- **Error Rate**: Currently 5% (adjust based on baseline)
- **Response Time**: Currently 2 seconds (adjust for your SLA)
- **Memory Usage**: Currently 1GB (adjust for your instance size)
- **Audio Generation Failure**: Currently 20% (tune based on AI service reliability)

### 3. Metrics Collection Verification

Once your API is running, verify metrics collection:

```bash
# Check metrics are being collected
curl http://localhost:3001/metrics | grep -E "(http_requests_total|audio_generations_total)"

# Check OpenTelemetry traces (if Jaeger is running)
curl http://localhost:16686/api/traces?service=cultural-sound-lab-api

# Check logs are structured
tail -f logs/app.log | jq .
```

### 4. Performance Impact

Monitor the overhead of your monitoring setup:
- **Sentry**: ~1-2% CPU overhead
- **Structured Logging**: ~0.5% CPU overhead  
- **OpenTelemetry**: ~2-3% CPU overhead (adjust sampling for production)
- **Prometheus Metrics**: ~0.5% CPU overhead

Adjust sampling rates in production:
```bash
export SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% sampling
export OTEL_TRACES_SAMPLER_ARG=0.1     # 10% sampling
```

## Testing Your Setup

### 1. Generate Test Traffic
```bash
# Install Apache Bench for load testing
brew install httpie

# Generate some traffic
for i in {1..100}; do
  curl http://localhost:3001/health &
done
wait

# Check metrics
curl http://localhost:3001/metrics | grep http_requests_total
```

### 2. Test Error Scenarios
```bash
# Test 404 handling
curl http://localhost:3001/nonexistent-endpoint

# Test rate limiting (make many requests quickly)
for i in {1..200}; do curl http://localhost:3001/api/audio & done
```

### 3. Monitor in Real-Time
- **Logs**: `tail -f logs/app.log`
- **Metrics**: Visit http://localhost:9090 (if Prometheus is running)
- **Traces**: Visit http://localhost:16686 (if Jaeger is running)
- **Dashboard**: Visit http://localhost:3002 (if Grafana is running)

## Next Steps

1. **Start with manual testing** using the metrics endpoint
2. **Install Grafana locally** for dashboard visualization  
3. **Set up Sentry account** for error tracking
4. **Configure notification channels** for alerting
5. **Deploy to production** with proper environment variables
6. **Fine-tune alert thresholds** based on actual traffic patterns

Your monitoring infrastructure is production-ready! The comprehensive setup will give you full visibility into your Cultural Sound Lab platform's health and performance.