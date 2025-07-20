# Sentry DSN Configuration Guide for Cultural Sound Lab

## Overview
Sentry is an error tracking and performance monitoring platform that helps you monitor and fix crashes in real time. This guide will help you configure Sentry DSN (Data Source Name) for both the web application and API backend.

## Prerequisites
1. A Sentry account (sign up at https://sentry.io)
2. A Sentry organization and project created

## Getting Your Sentry DSN

1. **Log in to Sentry** at https://sentry.io

2. **Create Projects** (if not already created):
   - Create a project for the **Web Application** (Next.js)
   - Create a project for the **API Backend** (Node.js/Express)

3. **Find Your DSN**:
   - Go to **Settings** → **Projects** → Select your project
   - Navigate to **Client Keys (DSN)**
   - Copy the DSN URL (format: `https://[key]@[organization].ingest.sentry.io/[project-id]`)

## Configuration Steps

### 1. Web Application (Next.js)

Add the following to your environment files:

#### Development (`apps/web/.env.local`):
```env
# Client-side Sentry DSN (publicly visible)
NEXT_PUBLIC_SENTRY_DSN=https://your-web-dsn@o12345.ingest.sentry.io/1234567

# Server-side Sentry DSN (same as client for Next.js)
SENTRY_DSN=https://your-web-dsn@o12345.ingest.sentry.io/1234567

# Optional: Sentry organization and project names
SENTRY_ORG=your-organization-slug
SENTRY_PROJECT=cultural-sound-lab-web

# Suppress instrumentation warnings in development
SENTRY_SUPPRESS_INSTRUMENTATION_FILE_WARNING=1
SENTRY_SUPPRESS_GLOBAL_ERROR_HANDLER_FILE_WARNING=1
```

#### Production (`apps/web/.env.production`):
```env
# Use your production DSN
NEXT_PUBLIC_SENTRY_DSN=https://your-production-web-dsn@o12345.ingest.sentry.io/1234567
SENTRY_DSN=https://your-production-web-dsn@o12345.ingest.sentry.io/1234567
```

### 2. API Backend (Express)

Add the following to your environment files:

#### Development (`apps/api/.env`):
```env
# Sentry configuration for API
SENTRY_DSN=https://your-api-dsn@o12345.ingest.sentry.io/7654321
SENTRY_ENVIRONMENT=development
SENTRY_TRACES_SAMPLE_RATE=1.0  # 100% in development
SENTRY_PROFILES_SAMPLE_RATE=1.0  # 100% in development
```

#### Production (`apps/api/.env.production`):
```env
# Production Sentry configuration
SENTRY_DSN=https://your-production-api-dsn@o12345.ingest.sentry.io/7654321
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1  # 10% in production
SENTRY_PROFILES_SAMPLE_RATE=0.1  # 10% in production
```

## Environment-Specific Settings

### Sample Rates Explained

- **Traces Sample Rate**: Percentage of transactions to capture for performance monitoring
  - Development: 1.0 (100%) - capture all transactions
  - Production: 0.1 (10%) - reduce volume and costs

- **Profiles Sample Rate**: Percentage of transactions to profile
  - Development: 1.0 (100%) - profile everything for debugging
  - Production: 0.1 (10%) - profile subset to manage costs

### Replay Configuration (Web Only)

The web application is configured with session replay:
- `replaysSessionSampleRate`: 0.1 (10% of sessions)
- `replaysOnErrorSampleRate`: 1.0 (100% of error sessions)

## Verification

### 1. Test Web Application Sentry
```bash
cd apps/web
npm run dev

# Visit http://localhost:3001 and trigger an error
# Check Sentry dashboard for the error
```

### 2. Test API Sentry
```bash
cd apps/api
npm run dev

# Make a request that triggers an error
# Check Sentry dashboard for the error
```

## Best Practices

1. **Use Different Projects**: Keep web and API errors separate for better organization
2. **Environment Naming**: Use consistent environment names (development, staging, production)
3. **Sensitive Data**: Configure Sentry to scrub sensitive data:
   ```javascript
   beforeSend(event, hint) {
     // Remove sensitive data
     if (event.request) {
       delete event.request.cookies;
       delete event.request.headers['authorization'];
     }
     return event;
   }
   ```

4. **Source Maps**: For production, upload source maps to Sentry for better error debugging
5. **Release Tracking**: Tag releases in Sentry to track which version introduced errors

## Troubleshooting

### Common Issues

1. **DSN Not Working**:
   - Verify the DSN format is correct
   - Check if the project exists in Sentry
   - Ensure you're using the correct DSN for each environment

2. **No Errors Appearing**:
   - Check if Sentry is initialized properly in instrumentation files
   - Verify environment variables are loaded
   - Test with a manual error: `Sentry.captureException(new Error('Test error'))`

3. **Performance Issues**:
   - Reduce sample rates in production
   - Disable session replay if not needed
   - Use `beforeSend` to filter unnecessary errors

## Security Considerations

1. **Client-Side DSN**: The `NEXT_PUBLIC_SENTRY_DSN` is visible to users. This is safe as Sentry DSNs are designed to be public
2. **Rate Limiting**: Sentry automatically rate limits to prevent abuse
3. **Data Scrubbing**: Configure Sentry to remove PII and sensitive data
4. **IP Anonymization**: Enable in Sentry project settings for GDPR compliance

## Next Steps

After configuring Sentry:

1. **Set Up Alerts**: Configure email/Slack alerts for critical errors
2. **Create Dashboards**: Monitor error rates and performance metrics
3. **Integrate with CI/CD**: Add Sentry release tracking to your deployment pipeline
4. **Configure Issue Grouping**: Customize how similar errors are grouped

## Additional Resources

- [Sentry Next.js Documentation](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [Sentry Express Documentation](https://docs.sentry.io/platforms/node/guides/express/)
- [Sentry Best Practices](https://docs.sentry.io/product/best-practices/)
- [Data Security & Privacy](https://docs.sentry.io/security-legal/security/)