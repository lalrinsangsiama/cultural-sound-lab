# 🚀 Cultural Sound Lab - Ready to Deploy!

All production configurations are now complete. Here's how to deploy immediately:

## ✅ All Credentials Configured

- **Database**: Supabase (all keys set)
- **Storage**: Supabase Storage S3-compatible (configured)
- **Payments**: Razorpay (all secrets set)
- **Security**: JWT & session secrets generated
- **Domain**: culturalsoundlab.com

## 🔧 Pre-Deployment Fix (Required)

Before deploying, we need to fix the TypeScript build errors:

```bash
# 1. Fix the Zod validation errors in API
cd apps/api
# Edit src/validations/generation.ts to fix the Zod schema issues

# 2. Test the build locally
cd ../..
npm run build
```

## 🚀 Option 1: Deploy to Vercel (Recommended - 5 minutes)

### Step 1: Install Vercel CLI
```bash
npm i -g vercel
```

### Step 2: Deploy
```bash
# From project root
vercel --prod
```

### Step 3: Add Environment Variables in Vercel Dashboard

1. Go to your project in Vercel dashboard
2. Settings → Environment Variables
3. Add all variables from:
   - `apps/api/.env.production`
   - `apps/web/.env.production`

### Step 4: Configure Domain
1. In Vercel dashboard → Settings → Domains
2. Add `culturalsoundlab.com`
3. Add `api.culturalsoundlab.com` (for API routes)

## 🚀 Option 2: Deploy to Railway (Alternative)

### Step 1: Create Railway Account
Visit [railway.app](https://railway.app)

### Step 2: New Project from GitHub
1. Connect your GitHub repo
2. Railway will auto-detect the monorepo

### Step 3: Configure Services
1. **Web Service**: 
   - Root Directory: `/apps/web`
   - Start Command: `npm run start`
   
2. **API Service**:
   - Root Directory: `/apps/api`
   - Start Command: `npm run start`

### Step 4: Add Environment Variables
Copy all variables from your `.env.production` files

### Step 5: Configure Domain
Railway provides free SSL and custom domain setup

## 📋 Post-Deployment Checklist

### 1. **Create Storage Bucket**
```sql
-- Run this in Supabase SQL editor
INSERT INTO storage.buckets (id, name, public)
VALUES ('cultural-audio', 'cultural-audio', true);
```

### 2. **Set Storage CORS Policy**
```json
[
  {
    "origin": ["https://culturalsoundlab.com"],
    "allowed_headers": ["*"],
    "allowed_methods": ["GET", "POST", "PUT", "DELETE"]
  }
]
```

### 3. **Configure Razorpay Webhook**
1. Go to Razorpay Dashboard
2. Settings → Webhooks
3. Add webhook URL: `https://api.culturalsoundlab.com/api/payments/webhook`
4. Secret: `BuildCSL4ppl`

### 4. **Test Production**
- Frontend: https://culturalsoundlab.com
- API Health: https://api.culturalsoundlab.com/health
- Test user registration
- Test audio preview
- Test generation (mock)

## 🐛 Quick Fixes for Common Issues

### TypeScript Build Errors
The Zod validation in `generation.ts` needs updating:
```typescript
// Change from:
z.string().regex(/pattern/)
// To:
z.string().regex(/pattern/, "Error message")
```

### Next.js Route Issues
Update route handlers to use new Next.js 15 syntax:
```typescript
// Add proper typing for params
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  // ... rest of handler
}
```

## 🎯 Deployment in 10 Minutes

1. **Fix build errors** (5 min)
2. **Run `vercel --prod`** (2 min)
3. **Add env vars in dashboard** (2 min)
4. **Configure domain** (1 min)

## 🆘 Need Help?

- **Build failing?** Check TypeScript errors first
- **Env vars not working?** Ensure they're added in Vercel dashboard
- **Domain issues?** DNS propagation can take up to 48 hours

## 🎉 You're Ready!

Once deployed, your platform will be live with:
- User authentication
- Audio library browsing
- Mock AI generation
- Payment integration
- Secure file storage

The only missing piece is the real AI service, which can be added later when ready.