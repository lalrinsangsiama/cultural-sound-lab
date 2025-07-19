# Database & Storage Implementation Guide

This guide covers the comprehensive database and storage implementation for the Cultural Sound Lab platform, including Prisma integration, performance optimization, S3/MinIO configuration, and CDN setup.

## 🗄️ Database Architecture

### Dual Database Strategy

The platform uses a hybrid approach combining:

1. **Supabase** - Primary database with authentication and real-time features
2. **Prisma** - Type-safe ORM with migration support and performance optimization

### Database Features

#### Core Schema
- **Users** - Authentication, profiles, and subscription management
- **AudioSamples** - Cultural audio files with metadata and licensing
- **Generations** - AI-generated audio tracks and job tracking
- **Licenses** - Usage rights and payment processing
- **RevenueSplits** - Automatic royalty distribution

#### Performance Optimizations
- **Read Replicas** - Automatic failover for read operations
- **Connection Pooling** - Optimized database connections
- **Critical Indexes** - 20+ performance indexes for frequent queries
- **Query Monitoring** - Built-in slow query detection

## 🏗️ Prisma Integration

### Schema Management

The Prisma schema (`apps/api/prisma/schema.prisma`) provides:

```prisma
model AudioSample {
  id                 String   @id @default(uuid())
  title              String
  culturalOrigin     String   @map("cultural_origin")
  instrumentType     String   @map("instrument_type")
  // ... with comprehensive indexes
  
  @@index([culturalOrigin, approved])
  @@index([instrumentType, approved])
  @@index([downloadCount])
}
```

### Migration Strategy

1. **Development**: Use `npx prisma db push` for rapid iteration
2. **Production**: Use `npx prisma migrate` for versioned migrations
3. **Backup**: Automatic schema backup before migrations

### Type Safety

```typescript
import { prisma } from '@/config/database';

// Fully typed database operations
const audioSamples = await prisma.audioSample.findMany({
  where: {
    approved: true,
    culturalOrigin: 'Mizo'
  },
  include: {
    contributor: true,
    licenses: true
  }
});
```

## 📊 Performance Indexes

### Critical Indexes Implemented

#### Audio Samples (Search & Filtering)
```sql
-- Cultural and approval filtering
CREATE INDEX idx_audio_samples_cultural_origin_approved ON audio_samples(cultural_origin, approved);

-- Instrument-based queries
CREATE INDEX idx_audio_samples_instrument_approved ON audio_samples(instrument_type, approved);

-- Array-based mood tag searches
CREATE INDEX idx_audio_samples_mood_tags_gin ON audio_samples USING gin(mood_tags);

-- Popularity and downloads
CREATE INDEX idx_audio_samples_download_count_desc ON audio_samples(download_count DESC);
```

#### User Management
```sql
-- Email lookup optimization
CREATE INDEX idx_users_email_active ON users(email) WHERE email IS NOT NULL;

-- Stripe customer mapping
CREATE INDEX idx_users_stripe_customer_active ON users(stripe_customer_id) WHERE stripe_customer_id IS NOT NULL;

-- Role-based queries
CREATE INDEX idx_users_role_created ON users(role, created_at);
```

#### Revenue & Payments
```sql
-- License payment tracking
CREATE INDEX idx_licenses_payment_status_active ON licenses(payment_status, active);

-- Revenue distribution
CREATE INDEX idx_revenue_splits_contributor_status ON revenue_splits(contributor_id, status);

-- Payment processing
CREATE INDEX idx_payment_intents_user_status_created ON payment_intents(user_id, status, created_at);
```

### Performance Monitoring

```typescript
// Built-in performance analysis
const analysis = await databaseService.analyzePerformance();
console.log('Slow queries:', analysis.slowQueries);
console.log('Index usage:', analysis.indexUsage);
console.log('Recommendations:', analysis.recommendations);
```

## 🗂️ Storage Architecture

### Multi-Provider Storage System

The platform supports multiple storage providers with automatic failover:

#### Primary Providers
1. **MinIO** - S3-compatible object storage (development)
2. **AWS S3** - Production cloud storage
3. **Supabase Storage** - Integrated with authentication

#### Configuration

```typescript
// Automatic provider selection with failback
const uploadResult = await storageService.upload(buffer, {
  filename: 'audio-sample.mp3',
  contentType: 'audio/mpeg',
  path: 'cultural-samples',
  isPublic: true
});
```

### Storage Features

#### Upload Management
- **File Validation** - MIME type and extension checking
- **Size Limits** - Configurable per file type
- **Unique Naming** - UUID-based collision prevention
- **Metadata Storage** - Custom attributes and tags

#### Access Control
- **Public URLs** - Direct access for approved content
- **Signed URLs** - Time-limited access for private content
- **Hotlink Protection** - Domain-based access control
- **CDN Integration** - Automatic cache optimization

## 🌐 CDN Implementation

### CDN Architecture

The CDN service provides:

1. **Multi-Provider Support** - Cloudflare, AWS CloudFront, Azure CDN
2. **Zone-Based Routing** - Separate optimization for audio, images, static files
3. **Cache Management** - Intelligent TTL and purging
4. **Performance Optimization** - Compression and format optimization

### CDN Configuration

```typescript
// Zone-specific URL generation
const audioUrl = cdnService.generateAudioUrl('sample.mp3', {
  bitrate: 128,
  format: 'mp3',
  quality: 'high'
});

const imageUrl = cdnService.generateImageUrl('cover.jpg', {
  width: 800,
  height: 600,
  format: 'webp',
  quality: 85
});
```

### Cache Strategy

#### Cache TTL by Content Type
- **Audio Files**: 24 hours (browser) / 7 days (edge)
- **Images**: 1 day (browser) / 30 days (edge)
- **Static Assets**: 1 day (browser) / 30 days (edge)

#### Cache Headers
```typescript
const headers = cdnService.getCacheHeaders('audio');
// Returns:
// {
//   'Cache-Control': 'public, max-age=3600, s-maxage=86400',
//   'CDN-Cache-Control': 'max-age=86400',
//   'Surrogate-Control': 'max-age=86400'
// }
```

## 🚀 Deployment Setup

### Environment Configuration

#### Storage Providers
```bash
# Primary storage provider
STORAGE_PROVIDER=minio
STORAGE_FALLBACK_PROVIDER=supabase

# MinIO Configuration
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin
MINIO_BUCKET=cultural-audio
MINIO_FORCE_PATH_STYLE=true

# AWS S3 Configuration
AWS_ACCESS_KEY_ID=your-aws-access-key
AWS_SECRET_ACCESS_KEY=your-aws-secret-key
S3_BUCKET=cultural-sound-lab-audio

# CDN Configuration
CDN_ENABLED=true
CDN_PROVIDER=cloudflare
CDN_BASE_URL=https://cdn.culturalsoundlab.com
CDN_CACHE_TTL=86400
```

#### Database Configuration
```bash
# Primary Database
DATABASE_URL=postgresql://user:password@localhost:5432/cultural_sound_lab

# Read Replica (Optional)
DATABASE_READ_REPLICA_URL=postgresql://user:password@replica:5432/cultural_sound_lab

# Supabase Integration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-key
```

### Docker Deployment

The project includes a comprehensive Docker Compose setup:

```bash
# Start all services
docker-compose up -d

# Services included:
# - PostgreSQL database
# - Redis cache
# - MinIO object storage
# - API backend
# - Web frontend
# - Prometheus monitoring
# - Grafana dashboards
```

### Initialization Script

Run the setup script to initialize optimizations:

```bash
# From project root
./scripts/setup-database-optimization.sh
```

This script:
1. Generates Prisma client
2. Installs performance indexes
3. Tests storage connectivity
4. Validates CDN configuration
5. Provides performance analysis

## 📈 Monitoring & Maintenance

### Health Checks

#### Database Health
```typescript
const dbHealth = await databaseService.checkHealth();
// Returns: { main: boolean, replica: boolean, prisma: boolean }
```

#### Storage Health
```typescript
const storageHealth = await storageService.healthCheck();
// Tests upload/download for all configured providers
```

#### CDN Health
```typescript
const cdnHealth = await cdnService.healthCheck();
// Tests CDN reachability and latency
```

### Performance Monitoring

#### Built-in Metrics
- Database query performance
- Storage operation latency
- CDN cache hit ratios
- Error rates and patterns

#### Grafana Dashboards
- Real-time performance metrics
- Resource utilization
- Business metrics (uploads, downloads, revenue)

### Maintenance Tasks

#### Database Maintenance
```typescript
// Analyze and optimize database performance
const analysis = await databaseService.analyzePerformance();

// Manual vacuum for PostgreSQL
await databaseService.executeRaw('VACUUM ANALYZE');
```

#### Storage Cleanup
```typescript
// Remove expired temporary files
await storageService.cleanup();

// Verify file integrity
const exists = await storageService.exists('file-key');
```

#### CDN Cache Management
```typescript
// Purge specific URLs
await cdnService.purgeCache({
  urls: ['https://cdn.example.com/audio/sample.mp3']
});

// Purge by tags
await cdnService.purgeCache({
  tags: ['audio', 'generation']
});
```

## 🔧 Troubleshooting

### Common Issues

#### Database Connection Issues
```bash
# Test database connectivity
npx prisma db push

# Reset database schema
npx prisma migrate reset

# Generate fresh client
npx prisma generate
```

#### Storage Provider Issues
```bash
# Test MinIO connectivity
curl http://localhost:9000/minio/health/live

# Check bucket permissions
mc ls minio/cultural-audio

# Test S3 credentials
aws s3 ls s3://your-bucket
```

#### CDN Issues
```bash
# Test CDN reachability
curl -I https://cdn.culturalsoundlab.com/health

# Check cache headers
curl -I https://cdn.culturalsoundlab.com/audio/sample.mp3
```

### Performance Issues

#### Slow Queries
1. Check the performance analysis output
2. Review index usage statistics
3. Optimize query patterns
4. Consider read replica usage

#### Storage Latency
1. Verify network connectivity
2. Check regional settings
3. Monitor bandwidth usage
4. Consider CDN optimization

#### CDN Performance
1. Review cache hit ratios
2. Optimize cache TTL settings
3. Check geographic distribution
4. Monitor origin server load

## 📚 API Reference

### Database Service

```typescript
import { databaseService, prisma } from '@/config/database';

// Transaction with retry logic
await databaseService.transaction(async (tx) => {
  await tx.user.create({ data: userData });
  await tx.audioSample.create({ data: audioData });
});

// Performance analysis
const analysis = await databaseService.analyzePerformance();

// Health monitoring
const health = await databaseService.checkHealth();
```

### Storage Service

```typescript
import { storageService } from '@/config/storage';

// File upload with automatic provider selection
const result = await storageService.upload(buffer, {
  filename: 'audio.mp3',
  contentType: 'audio/mpeg',
  path: 'uploads/audio',
  isPublic: true
});

// Generate signed URL for private access
const signedUrl = await storageService.getSignedUrl('private/file.mp3', {
  expiresIn: 3600 // 1 hour
});

// Delete file from all providers
await storageService.delete('path/to/file.mp3');
```

### CDN Service

```typescript
import { cdnService } from '@/config/cdn';

// Generate optimized URLs
const audioUrl = cdnService.generateAudioUrl('sample.mp3');
const imageUrl = cdnService.generateImageUrl('cover.jpg', {
  width: 400,
  format: 'webp'
});

// Cache management
await cdnService.purgeCache({ 
  urls: ['https://cdn.example.com/file.mp3'] 
});

// Performance monitoring
const metrics = await cdnService.getMetrics();
```

## 🎯 Best Practices

### Database Best Practices
1. Use read replicas for analytics queries
2. Implement connection pooling
3. Monitor slow query logs
4. Regular performance analysis
5. Backup before schema changes

### Storage Best Practices
1. Use appropriate storage tiers
2. Implement proper access controls
3. Monitor storage costs
4. Regular backup verification
5. Optimize file formats

### CDN Best Practices
1. Set appropriate cache TTLs
2. Use compression for text assets
3. Implement proper cache invalidation
4. Monitor cache hit ratios
5. Geographic distribution optimization

---

This implementation provides a robust, scalable, and performant database and storage architecture for the Cultural Sound Lab platform, with comprehensive monitoring, failover capabilities, and optimization features built-in.