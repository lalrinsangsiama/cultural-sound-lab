# CDN Configuration Guide for Cultural Sound Lab

## Overview

This guide covers the CDN setup for Cultural Sound Lab, optimizing delivery of static assets and audio files through Vercel's Edge Network.

## Current Configuration

### 1. **Vercel Edge Network (Primary CDN)**

Vercel automatically provides a global CDN through its Edge Network. All static assets are cached and served from edge locations closest to users.

#### Key Features:
- Automatic HTTPS/SSL
- Global edge locations
- Automatic cache invalidation on deployments
- Built-in DDoS protection
- WebP/AVIF image optimization

### 2. **Cache Headers Configuration**

The following cache headers are configured in `vercel.json`:

#### Static Assets (1 year cache):
- `/_next/static/*` - Next.js build assets
- `/assets/*` - Static assets
- `*.js`, `*.css` - JavaScript and CSS files
- `*.webp`, `*.avif`, `*.jpg`, `*.png`, `*.svg` - Images

#### Audio Files (1 week cache):
- `*.mp3`, `*.mp4`, `*.wav` - Audio files
- Includes `Accept-Ranges: bytes` for streaming support

### 3. **Next.js Optimizations**

Configured in `next.config.js`:
- Image optimization with multiple formats (AVIF, WebP)
- Minimum cache TTL of 1 year for images
- Gzip compression enabled
- ETags generation for cache validation

## Audio File Delivery Strategy

### For Small Audio Files (< 50MB)
- Serve directly from Vercel CDN
- Place files in `public/audio/` directory
- Automatic edge caching with 1-week TTL

### For Large Audio Files (> 50MB)
- Use Supabase Storage or AWS S3
- Configure CORS for cross-origin access
- Implement signed URLs for secure access

## Environment Variables for CDN

Add these to your `.env.production`:

```env
# CDN Configuration
NEXT_PUBLIC_CDN_URL=https://culturalsoundlab.com
NEXT_PUBLIC_ASSET_PREFIX=

# For external storage (if needed)
NEXT_PUBLIC_STORAGE_CDN_URL=https://your-storage-cdn.com
```

## External CDN Options (If Needed)

### Option 1: Cloudflare (Additional Layer)
```env
# Cloudflare CDN
NEXT_PUBLIC_CF_CDN_URL=https://cdn.culturalsoundlab.com
NEXT_PUBLIC_CF_ZONE_ID=your-zone-id
CF_API_TOKEN=your-api-token
```

### Option 2: AWS CloudFront (For S3 Audio)
```env
# CloudFront Distribution
NEXT_PUBLIC_CF_DISTRIBUTION_ID=your-distribution-id
NEXT_PUBLIC_CF_DOMAIN=https://d1234567890.cloudfront.net
```

## Implementation for Audio Streaming

### 1. **Audio Component with CDN Support**

```typescript
// components/audio/CDNAudioPlayer.tsx
import { useEffect, useState } from 'react';

interface CDNAudioPlayerProps {
  src: string;
  title: string;
}

export function CDNAudioPlayer({ src, title }: CDNAudioPlayerProps) {
  const [audioUrl, setAudioUrl] = useState<string>('');

  useEffect(() => {
    // Use CDN URL in production
    const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
    const fullUrl = src.startsWith('http') ? src : `${cdnUrl}${src}`;
    setAudioUrl(fullUrl);
  }, [src]);

  return (
    <audio
      controls
      preload="metadata"
      crossOrigin="anonymous"
    >
      <source src={audioUrl} type="audio/mpeg" />
      Your browser does not support the audio element.
    </audio>
  );
}
```

### 2. **Optimized Audio Loading**

```typescript
// lib/audio/cdn-loader.ts
export function getOptimizedAudioUrl(path: string, quality: 'high' | 'medium' | 'low' = 'high'): string {
  const cdnUrl = process.env.NEXT_PUBLIC_CDN_URL || '';
  
  // Map quality to bitrate
  const bitrateMap = {
    high: '320',
    medium: '192',
    low: '128'
  };
  
  // Construct CDN URL with quality parameter
  return `${cdnUrl}/audio/${bitrateMap[quality]}/${path}`;
}
```

## Monitoring CDN Performance

### 1. **Vercel Analytics**
- Monitor Core Web Vitals
- Track asset loading times
- Identify slow-loading resources

### 2. **Custom Metrics**
```typescript
// lib/monitoring/cdn-metrics.ts
export function trackAudioLoadTime(audioUrl: string, loadTime: number) {
  // Send to analytics
  if (window.gtag) {
    window.gtag('event', 'audio_load', {
      event_category: 'CDN Performance',
      event_label: audioUrl,
      value: loadTime
    });
  }
}
```

## Best Practices

### 1. **Asset Organization**
```
public/
├── audio/
│   ├── samples/      # Original samples
│   ├── generated/    # AI-generated audio
│   └── previews/     # Low-quality previews
├── images/
│   ├── instruments/  # Instrument photos
│   └── cultural/     # Cultural imagery
└── assets/
    └── icons/        # UI icons
```

### 2. **File Naming Convention**
- Use descriptive, URL-friendly names
- Include version or hash for cache busting
- Example: `mizo-flute-v1-abc123.mp3`

### 3. **Progressive Enhancement**
- Provide multiple quality options
- Use adaptive bitrate for audio
- Implement lazy loading for non-critical assets

## Deployment Checklist

- [x] Configure cache headers in `vercel.json`
- [x] Set up Next.js image optimization
- [x] Enable compression and ETags
- [ ] Configure external storage CDN (if using S3/Supabase)
- [ ] Set up monitoring and analytics
- [ ] Test audio streaming performance
- [ ] Implement adaptive bitrate (optional)

## Testing CDN Configuration

### 1. **Verify Cache Headers**
```bash
curl -I https://culturalsoundlab.com/assets/demo-audio/sound-logo-demo.mp3
```

### 2. **Check Edge Location**
```bash
# Look for x-vercel-cache header
curl -I https://culturalsoundlab.com/_next/static/chunks/main.js
```

### 3. **Performance Testing**
- Use Google PageSpeed Insights
- Monitor with Vercel Analytics
- Test from different geographic locations

## Troubleshooting

### Issue: Audio files not caching
**Solution**: Ensure audio files are in `public/` directory and cache headers are set correctly

### Issue: CORS errors with external storage
**Solution**: Configure CORS headers on storage service:
```json
{
  "AllowedOrigins": ["https://culturalsoundlab.com"],
  "AllowedMethods": ["GET", "HEAD"],
  "AllowedHeaders": ["*"],
  "MaxAgeSeconds": 3600
}
```

### Issue: Large file timeouts
**Solution**: Use streaming with byte-range requests or implement chunked delivery

## Future Enhancements

1. **Multi-CDN Strategy**: Use multiple CDN providers for redundancy
2. **Edge Computing**: Process audio at edge locations
3. **P2P CDN**: Implement WebRTC for peer-to-peer delivery
4. **AI-Powered Optimization**: Predict and pre-cache popular content