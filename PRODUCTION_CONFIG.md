# Production Configuration Guide for Cultural Sound Lab

## Current Production Setup Status

### ✅ Completed
1. **Supabase Database**
   - Production URL: `https://jzzjsjyfsmopbtefxwme.supabase.co`
   - Anon key configured in all environment files
   - Service key needs to be added securely (not in version control)

2. **Security Secrets**
   - JWT Secret: Generated and configured
   - JWT Refresh Secret: Generated and configured
   - Session Secret: Generated and configured

### 🔧 Required Before Production

#### 1. **Domain & Hosting Setup**
- Register domain: `culturalsoundlab.com`
- Set up SSL certificates
- Configure DNS for:
  - `culturalsoundlab.com` (frontend)
  - `api.culturalsoundlab.com` (backend API)
  - `cdn.culturalsoundlab.com` (static assets)

#### 2. **Infrastructure Services**

**Redis (Required for session management and caching)**
- Option 1: Use existing Upstash Redis (update tokens)
- Option 2: Set up Redis Cloud or AWS ElastiCache
- Update in `.env.production`:
  ```
  REDIS_URL=redis://your-production-redis-url
  UPSTASH_REDIS_REST_URL=https://your-production-upstash-url
  UPSTASH_REDIS_REST_TOKEN=your-production-token
  ```

**File Storage (Required for audio files)**
- Set up AWS S3 or MinIO
- Configure in `.env.production`:
  ```
  STORAGE_TYPE=s3
  AWS_ACCESS_KEY_ID=your-access-key
  AWS_SECRET_ACCESS_KEY=your-secret-key
  AWS_REGION=us-east-1
  AWS_S3_BUCKET=cultural-sound-lab-audio
  ```

**CDN (Recommended for performance)**
- Set up CloudFlare or AWS CloudFront
- Configure CDN_URL in environment

#### 3. **Payment Integration (Razorpay)**
- Get production API keys from Razorpay dashboard
- Configure webhook endpoint
- Update in `.env.production`:
  ```
  RAZORPAY_KEY_ID=rzp_live_your_key_id
  RAZORPAY_KEY_SECRET=your-live-secret
  RAZORPAY_WEBHOOK_SECRET=your-webhook-secret
  ```

#### 4. **Monitoring & Analytics**
- **Sentry** for error tracking:
  ```
  SENTRY_DSN=https://your-key@sentry.io/project-id
  ```
- **OpenTelemetry** for metrics (optional):
  ```
  OTEL_EXPORTER_OTLP_ENDPOINT=https://your-otel-endpoint
  ```

#### 5. **Email Service** (for notifications)
- Configure SendGrid, AWS SES, or similar
- Add credentials to `.env.production`

### 🚀 Deployment Steps

1. **Environment Preparation**
   ```bash
   # Copy production env files
   cp apps/api/.env.production apps/api/.env
   cp apps/web/.env.production apps/web/.env.local
   ```

2. **Build Applications**
   ```bash
   # From project root
   npm run build
   ```

3. **Database Setup**
   ```bash
   # Run migrations
   cd apps/api
   npm run db:migrate:prod
   ```

4. **Deploy Backend (API)**
   - Deploy to your hosting provider (Vercel, AWS, DigitalOcean, etc.)
   - Ensure environment variables are set
   - Health check endpoint: `https://api.culturalsoundlab.com/health`

5. **Deploy Frontend**
   - Deploy to Vercel or similar
   - Set environment variables
   - Configure custom domain

### 🔒 Security Checklist

- [ ] All secrets are stored securely (not in code)
- [ ] HTTPS enabled on all domains
- [ ] CORS configured for production domains only
- [ ] Rate limiting enabled
- [ ] Security headers configured
- [ ] Database connection using SSL
- [ ] Backup strategy in place
- [ ] DDoS protection enabled (CloudFlare)

### 📊 Production Environment Variables Summary

**API (.env.production)**
- ✅ Supabase credentials
- ✅ JWT secrets
- ✅ Session secret
- ✅ Security settings
- ❌ Redis configuration (needs production values)
- ❌ Payment credentials (needs production values)
- ❌ File storage credentials (needs setup)
- ❌ Monitoring services (optional but recommended)

**Frontend (.env.production)**
- ✅ Supabase public credentials
- ✅ Feature flags set for production
- ❌ Production API URL (update when deployed)
- ❌ Analytics configuration (optional)

### 🎯 Next Steps

1. **Immediate Priority**
   - Set up production Redis instance
   - Configure file storage (S3/MinIO)
   - Get production payment credentials

2. **Before Launch**
   - Set up monitoring (Sentry)
   - Configure email service
   - Set up CDN
   - Run security audit

3. **Nice to Have**
   - Set up CI/CD pipeline
   - Configure auto-scaling
   - Set up database read replicas
   - Implement backup automation

### 📝 Notes

- The AI service is currently mocked. Real AI service deployment will require:
  - GPU-enabled servers
  - Python environment setup
  - Model deployment
  - Significant infrastructure investment

- Current setup is suitable for MVP/demo with mock AI generation
- All core features work with mock data for demonstration purposes