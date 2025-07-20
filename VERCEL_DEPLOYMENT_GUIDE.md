# Vercel Deployment Guide for Cultural Sound Lab

## Pre-Deployment Checklist

- [x] Production build passes locally
- [x] TypeScript errors fixed
- [x] Environment variables configured
- [x] Razorpay secrets added
- [x] Supabase Storage configured
- [x] vercel.json configured with security headers

## Step 1: Install Vercel CLI

```bash
npm i -g vercel
```

## Step 2: Deploy to Vercel

From the project root directory, run:

```bash
vercel --prod
```

During the first deployment, you'll be asked:
1. Set up and deploy: `Y`
2. Which scope: Choose your account
3. Link to existing project?: `N` (for first time)
4. Project name: `cultural-sound-lab`
5. In which directory is your code located?: `.` (current directory)
6. Want to modify settings?: `N`

## Step 3: Add Environment Variables

Go to your Vercel dashboard and add these environment variables:

### Frontend Environment Variables (Web App)

```env
# API Configuration
NEXT_PUBLIC_API_URL=https://api.culturalsoundlab.com
NEXT_PUBLIC_APP_URL=https://culturalsoundlab.com

# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://jzjysjyfsmopbtefxwme.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emlzanlmc21vcGJ0ZWZ4d21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzUyNzQsImV4cCI6MjA2ODUxMTI3NH0.UuNvBDyugvq5XUtry8TgekEyEh8uttChF10WJgzistQ

# Features
NEXT_PUBLIC_ENABLE_ANALYTICS=true
NEXT_PUBLIC_ENABLE_PAYMENTS=true
NEXT_PUBLIC_ENABLE_AI_GENERATION=true
NEXT_PUBLIC_ENABLE_DEMO_MODE=false

# Storage
NEXT_PUBLIC_STORAGE_URL=https://jzjysjyfsmopbtefxwme.supabase.co/storage/v1
NEXT_PUBLIC_STORAGE_BUCKET=cultural-audio

# App Info
NEXT_PUBLIC_APP_NAME=Cultural Sound Lab
NEXT_PUBLIC_APP_DESCRIPTION=AI-powered cultural music generation platform
NEXT_PUBLIC_APP_ENV=production
NEXT_PUBLIC_DEVELOPMENT_MODE=false

# Sentry (Optional - add your actual DSN)
SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project-id
NEXT_PUBLIC_SENTRY_DSN=https://your-sentry-dsn.ingest.sentry.io/project-id
```

### Backend Environment Variables (API)

You'll need to deploy the API separately or use Vercel Functions. For a separate API deployment, use these variables:

```env
# Core Configuration
NODE_ENV=production
PORT=3001
API_BASE_URL=https://api.culturalsoundlab.com
FRONTEND_URL=https://culturalsoundlab.com
APP_DOMAIN=culturalsoundlab.com

# Supabase
SUPABASE_URL=https://jzjysjyfsmopbtefxwme.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emlzanlmc21vcGJ0ZWZ4d21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5MzUyNzQsImV4cCI6MjA2ODUxMTI3NH0.UuNvBDyugvq5XUtry8TgekEyEh8uttChF10WJgzistQ
SUPABASE_SERVICE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imp6emlzanlmc21vcGJ0ZWZ4d21lIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1MjkzNTI3NCwiZXhwIjoyMDY4NTExMjc0fQ.yR20a4REEmaP7CfpWi0cXCd3Qv19J59fGRp5H5n2Lck
DATABASE_URL=postgresql://postgres:BuildCSL4ppl@db.jzjysjyfsmopbtefxwme.supabase.co:5432/postgres

# Redis
REDIS_URL=redis://default:AUdRAAIjcDE1ZGE0NTZmNDAyNDk0Y2FhOTQ2NTUwYTZkOGRhOWM1OXAxMA@picked-leech-18257.upstash.io:6379
UPSTASH_REDIS_REST_URL=https://picked-leech-18257.upstash.io
UPSTASH_REDIS_REST_TOKEN=AUdRAAIjcDE1ZGE0NTZmNDAyNDk0Y2FhOTQ2NTUwYTZkOGRhOWM1OXAxMA

# Session & JWT
SESSION_SECRET=B+Pue5uEVRxKlFJCAP/vAKjK7CCNK1f+T93abs+O1oQ=
JWT_SECRET=ws1jvC/8uNqWBZYLtIz4LcW5BhJox68uLF/GZtHg6HI=
JWT_REFRESH_SECRET=IWWla8z7+Lq+oOUUMobZ43Nzy9ZAgsMMy8cHMv4BXhU=

# Razorpay
RAZORPAY_KEY_ID=rzp_live_IkKLQEcs0DcLzW
RAZORPAY_KEY_SECRET=AvxAPL8Sw7sUDRgahTWhC1MZ
RAZORPAY_WEBHOOK_SECRET=BuildCSL4ppl

# Storage (Supabase)
STORAGE_TYPE=supabase
SUPABASE_STORAGE_ACCESS_KEY=e934b166765b23b495a5353ac6e900a1
SUPABASE_STORAGE_SECRET_KEY=4dc755d930989018a5a48e61739fc7273bddddc1f31718dbbc57d11aa51f5453
SUPABASE_STORAGE_ENDPOINT=https://jzjysjyfsmopbtefxwme.supabase.co/storage/v1/s3
SUPABASE_STORAGE_BUCKET=cultural-audio
SUPABASE_STORAGE_REGION=us-east-1

# CORS
CORS_ALLOWED_ORIGINS=https://culturalsoundlab.com,https://www.culturalsoundlab.com,https://api.culturalsoundlab.com

# Features
ENABLE_SWAGGER_DOCS=false
ENABLE_METRICS_ENDPOINT=false
ENABLE_HEALTH_CHECKS=true
ENABLE_CORS=true
ENABLE_RATE_LIMITING=true
ENABLE_AI_GENERATION=true
ENABLE_SECURITY_HEADERS=true
ENABLE_HTTPS_REDIRECT=true
TRUST_PROXY=true

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Performance
MAX_PAYLOAD_SIZE=50mb
REQUEST_TIMEOUT_MS=30000

# Logging
LOG_LEVEL=info
LOG_FORMAT=json

# Sentry (Optional)
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
SENTRY_ENVIRONMENT=production
SENTRY_TRACES_SAMPLE_RATE=0.1
SENTRY_PROFILES_SAMPLE_RATE=0.1
```

## Step 4: Configure Custom Domain

1. Go to your Vercel project settings
2. Navigate to "Domains"
3. Add your custom domain: `culturalsoundlab.com`
4. Add www subdomain: `www.culturalsoundlab.com`
5. Follow the DNS configuration instructions provided by Vercel

### DNS Configuration (Add to your domain provider):

```
# A Records (for apex domain)
A     culturalsoundlab.com     76.76.21.21

# CNAME Records
CNAME www                      cname.vercel-dns.com.
CNAME api                      cname.vercel-dns.com.
```

## Step 5: Deploy API Separately

Since your API is a separate Express app, you have options:

### Option A: Deploy API to Vercel (Serverless Functions)
Create a separate Vercel project for the API or use API routes in Next.js.

### Option B: Deploy API to Railway/Render
1. Create a new project on Railway/Render
2. Connect your GitHub repository
3. Set the root directory to `apps/api`
4. Add all the backend environment variables
5. Deploy

### Option C: Use a VPS (DigitalOcean, AWS EC2)
Deploy the Express API to a traditional server.

## Step 6: Configure Razorpay Webhook

After your API is deployed:

1. Log in to your Razorpay Dashboard
2. Go to Settings → Webhooks
3. Add a new webhook:
   - URL: `https://api.culturalsoundlab.com/api/webhooks/razorpay`
   - Secret: `BuildCSL4ppl` (already in your env)
   - Events: Select all payment-related events

## Step 7: Test Production Deployment

1. **Health Check**:
   ```bash
   curl https://api.culturalsoundlab.com/health
   ```

2. **Frontend**:
   - Visit https://culturalsoundlab.com
   - Test authentication flow
   - Test audio playback
   - Test generation features

3. **Payment Flow**:
   - Create a test payment
   - Verify webhook receives events

## Monitoring and Maintenance

1. **Vercel Dashboard**:
   - Monitor deployments
   - Check function logs
   - Review analytics

2. **Error Tracking** (if Sentry configured):
   - Monitor error rates
   - Set up alerts

3. **Performance**:
   - Use Vercel Analytics
   - Monitor Core Web Vitals

## Troubleshooting

### Common Issues:

1. **Environment Variables Not Loading**:
   - Ensure all variables are added in Vercel dashboard
   - Redeploy after adding variables

2. **CORS Errors**:
   - Verify CORS_ALLOWED_ORIGINS includes all domains
   - Check API headers configuration

3. **API Connection Issues**:
   - Ensure API is deployed and accessible
   - Check NEXT_PUBLIC_API_URL is correct

4. **Payment Webhook Failures**:
   - Verify webhook secret matches
   - Check API logs for errors
   - Ensure webhook endpoint is accessible

## Next Steps

1. Set up monitoring (Sentry, LogRocket, etc.)
2. Configure backup strategy
3. Set up CI/CD pipeline
4. Implement staging environment
5. Configure email service for notifications

## Support

For issues:
- Check Vercel deployment logs
- Review API error logs
- Test in development first
- Contact support@culturalsoundlab.com