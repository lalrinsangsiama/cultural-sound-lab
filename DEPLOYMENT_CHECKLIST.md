# Cultural Sound Lab - Production Deployment Checklist

## ✅ Completed Configuration

### 1. **Environment Variables**
- [x] Supabase production credentials (URL, anon key, service key)
- [x] Database connection string
- [x] JWT secrets (generated)
- [x] Session secret (generated)
- [x] Redis configuration (Upstash)
- [x] Domain configuration (culturalsoundlab.com)
- [x] CORS settings
- [x] Security flags enabled

### 2. **Domain Setup**
- Domain registered: `culturalsoundlab.com`
- Subdomains needed:
  - `api.culturalsoundlab.com` - Backend API
  - `www.culturalsoundlab.com` - WWW redirect

## 🔧 Still Required for Production

### 1. **Payment Integration (Razorpay)**
You have the live key ID (`rzp_live_IkKLQEcs0DcLzW`), but still need:
- [ ] Razorpay Key Secret
- [ ] Razorpay Webhook Secret
- [ ] Configure webhook endpoint: `https://api.culturalsoundlab.com/api/payments/webhook`

### 2. **File Storage**
Choose one option:
- [ ] **AWS S3**
  - Create S3 bucket
  - Create IAM user with S3 permissions
  - Get Access Key ID and Secret Access Key
- [ ] **Supabase Storage** (easier option)
  - Already included with your Supabase project
  - No additional setup needed

### 3. **Email Service** (for notifications)
Options:
- [ ] **Resend** (recommended, easy setup)
- [ ] **SendGrid**
- [ ] **AWS SES**
- [ ] **Postmark**

### 4. **Monitoring (Optional but Recommended)**
- [ ] **Sentry** for error tracking
  - Create project at sentry.io
  - Get DSN for both frontend and backend
- [ ] **Analytics** (optional)
  - Google Analytics or Plausible

## 🚀 Deployment Options

### Option 1: **Vercel** (Recommended for Quick Start)
Best for: Frontend + API in one deployment

1. **Frontend & API**:
   ```bash
   # Install Vercel CLI
   npm i -g vercel
   
   # Deploy from project root
   vercel --prod
   ```

2. **Environment Variables**:
   - Add all production env vars in Vercel dashboard
   - Set up domain in Vercel settings

### Option 2: **Railway** (Good Alternative)
Best for: Full-stack deployment with database

1. Connect GitHub repo
2. Add environment variables
3. Deploy with one click
4. Custom domain setup included

### Option 3: **Traditional VPS** (DigitalOcean, AWS EC2)
Best for: Full control

1. Set up Ubuntu server
2. Install Node.js, nginx
3. Clone repo and install dependencies
4. Set up PM2 for process management
5. Configure nginx reverse proxy

## 📋 Pre-Deployment Checklist

### 1. **Code Fixes Required**
- [ ] Fix TypeScript build errors in `apps/api/src/validations/generation.ts`
- [ ] Fix Next.js route parameter issues
- [ ] Update React version compatibility

### 2. **Database Setup**
```bash
# Run migrations (after fixing build errors)
cd apps/api
npm run db:migrate:prod
```

### 3. **Security Review**
- [ ] Remove all console.logs with sensitive data
- [ ] Ensure .env files are in .gitignore
- [ ] Review API rate limiting settings
- [ ] Test CORS configuration

### 4. **Performance Optimization**
- [ ] Enable gzip compression
- [ ] Set up CDN for static assets
- [ ] Configure caching headers
- [ ] Optimize images

## 🎯 Quick Start Deployment (Vercel)

1. **Fix Build Errors First**:
   ```bash
   # Test production build locally
   npm run build
   ```

2. **Deploy to Vercel**:
   ```bash
   vercel --prod
   ```

3. **Add Environment Variables** in Vercel Dashboard:
   - All variables from `.env.production` files
   - Add missing secrets (Razorpay, etc.)

4. **Configure Domain**:
   - Add custom domain in Vercel
   - Set up SSL (automatic)

5. **Test Production**:
   - Health check: `https://api.culturalsoundlab.com/health`
   - Frontend: `https://culturalsoundlab.com`

## 📞 What We Still Need From You

1. **Razorpay Secrets**:
   - Key Secret
   - Webhook Secret

2. **Deployment Platform Choice**:
   - Vercel (easiest)
   - Railway
   - Other preference?

3. **File Storage Preference**:
   - Supabase Storage (easiest, already available)
   - AWS S3
   - Other?

4. **Email Service Choice** (for user notifications):
   - Which service do you prefer?

Once you provide these, we can complete the deployment!