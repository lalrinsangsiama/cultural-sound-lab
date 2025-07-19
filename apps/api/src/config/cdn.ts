import { logger } from './logger';

export interface CDNConfig {
  enabled: boolean;
  provider: 'cloudflare' | 'aws' | 'azure' | 'custom';
  baseUrl: string;
  cacheTtl: number;
  purgeEnabled: boolean;
  zones: {
    audio: string;
    images: string;
    static: string;
  };
  security: {
    hotlinkProtection: boolean;
    allowedDomains: string[];
    signedUrls: boolean;
  };
}

export interface CacheSettings {
  ttl: number;
  browserCacheTtl: number;
  edgeCacheTtl: number;
  staleWhileRevalidate: boolean;
}

export interface PurgeOptions {
  urls?: string[];
  tags?: string[];
  everything?: boolean;
}

class CDNService {
  private config: CDNConfig;

  constructor() {
    this.config = this.loadConfig();
  }

  private loadConfig(): CDNConfig {
    return {
      enabled: process.env.CDN_ENABLED === 'true',
      provider: (process.env.CDN_PROVIDER || 'custom') as 'cloudflare' | 'aws' | 'azure' | 'custom',
      baseUrl: process.env.CDN_BASE_URL || '',
      cacheTtl: parseInt(process.env.CDN_CACHE_TTL || '86400'), // 24 hours
      purgeEnabled: process.env.CDN_PURGE_ENABLED === 'true',
      zones: {
        audio: process.env.CDN_AUDIO_ZONE || 'audio',
        images: process.env.CDN_IMAGES_ZONE || 'images',
        static: process.env.CDN_STATIC_ZONE || 'static',
      },
      security: {
        hotlinkProtection: process.env.CDN_HOTLINK_PROTECTION === 'true',
        allowedDomains: (process.env.CDN_ALLOWED_DOMAINS || '').split(',').filter(Boolean),
        signedUrls: process.env.CDN_SIGNED_URLS === 'true',
      },
    };
  }

  /**
   * Generate CDN URL for a given resource
   */
  generateUrl(path: string, zone: 'audio' | 'images' | 'static' = 'audio'): string {
    if (!this.config.enabled || !this.config.baseUrl) {
      return path;
    }

    // Remove leading slash if present
    const cleanPath = path.startsWith('/') ? path.slice(1) : path;
    
    // Add zone prefix if configured
    const zonePath = this.config.zones[zone] ? `${this.config.zones[zone]}/${cleanPath}` : cleanPath;
    
    return `${this.config.baseUrl}/${zonePath}`;
  }

  /**
   * Generate optimized image URL with transformations
   */
  generateImageUrl(path: string, options?: {
    width?: number;
    height?: number;
    quality?: number;
    format?: 'webp' | 'avif' | 'png' | 'jpeg';
    fit?: 'cover' | 'contain' | 'fill';
  }): string {
    const baseUrl = this.generateUrl(path, 'images');

    if (!options || !this.config.enabled) {
      return baseUrl;
    }

    // Build transformation parameters based on CDN provider
    const params: string[] = [];

    if (options.width) {
      params.push(`w=${options.width}`);
    }

    if (options.height) {
      params.push(`h=${options.height}`);
    }

    if (options.quality) {
      params.push(`q=${options.quality}`);
    }

    if (options.format) {
      params.push(`f=${options.format}`);
    }

    if (options.fit) {
      params.push(`fit=${options.fit}`);
    }

    if (params.length === 0) {
      return baseUrl;
    }

    const queryString = params.join('&');
    return `${baseUrl}?${queryString}`;
  }

  /**
   * Generate audio streaming URL with optimizations
   */
  generateAudioUrl(path: string, options?: {
    bitrate?: number;
    format?: 'mp3' | 'aac' | 'ogg';
    quality?: 'low' | 'medium' | 'high';
  }): string {
    const baseUrl = this.generateUrl(path, 'audio');

    if (!options || !this.config.enabled) {
      return baseUrl;
    }

    const params: string[] = [];

    if (options.bitrate) {
      params.push(`br=${options.bitrate}`);
    }

    if (options.format) {
      params.push(`fmt=${options.format}`);
    }

    if (options.quality) {
      params.push(`q=${options.quality}`);
    }

    if (params.length === 0) {
      return baseUrl;
    }

    const queryString = params.join('&');
    return `${baseUrl}?${queryString}`;
  }

  /**
   * Get cache control headers
   */
  getCacheHeaders(zone: 'audio' | 'images' | 'static' = 'audio'): Record<string, string> {
    const settings = this.getCacheSettings(zone);

    return {
      'Cache-Control': `public, max-age=${settings.browserCacheTtl}, s-maxage=${settings.edgeCacheTtl}${
        settings.staleWhileRevalidate ? ', stale-while-revalidate=86400' : ''
      }`,
      'CDN-Cache-Control': `max-age=${settings.edgeCacheTtl}`,
      'Surrogate-Control': `max-age=${settings.edgeCacheTtl}`,
    };
  }

  /**
   * Get cache settings for different content types
   */
  private getCacheSettings(zone: 'audio' | 'images' | 'static'): CacheSettings {
    switch (zone) {
      case 'audio':
        return {
          ttl: this.config.cacheTtl,
          browserCacheTtl: 3600, // 1 hour
          edgeCacheTtl: this.config.cacheTtl, // 24 hours
          staleWhileRevalidate: true,
        };
      case 'images':
        return {
          ttl: this.config.cacheTtl * 7, // 7 days
          browserCacheTtl: 86400, // 1 day
          edgeCacheTtl: this.config.cacheTtl * 7, // 7 days
          staleWhileRevalidate: true,
        };
      case 'static':
        return {
          ttl: this.config.cacheTtl * 30, // 30 days
          browserCacheTtl: this.config.cacheTtl, // 24 hours
          edgeCacheTtl: this.config.cacheTtl * 30, // 30 days
          staleWhileRevalidate: false,
        };
      default:
        return {
          ttl: this.config.cacheTtl,
          browserCacheTtl: 3600,
          edgeCacheTtl: this.config.cacheTtl,
          staleWhileRevalidate: true,
        };
    }
  }

  /**
   * Purge cache for specific URLs or tags
   */
  async purgeCache(options: PurgeOptions): Promise<boolean> {
    if (!this.config.purgeEnabled) {
      logger.warn('CDN cache purging is not enabled');
      return false;
    }

    try {
      switch (this.config.provider) {
        case 'cloudflare':
          return this.purgeCloudflareCache(options);
        case 'aws':
          return this.purgeAWSCache(options);
        case 'azure':
          return this.purgeAzureCache(options);
        default:
          logger.warn('CDN cache purging not implemented for custom provider');
          return false;
      }
    } catch (error) {
      logger.error({ error, options }, 'Failed to purge CDN cache');
      return false;
    }
  }

  private async purgeCloudflareCache(options: PurgeOptions): Promise<boolean> {
    const zoneId = process.env.CLOUDFLARE_ZONE_ID;
    const apiToken = process.env.CLOUDFLARE_API_TOKEN;

    if (!zoneId || !apiToken) {
      logger.error('Cloudflare zone ID or API token not configured');
      return false;
    }

    const purgeData: any = {};

    if (options.everything) {
      purgeData.purge_everything = true;
    } else {
      if (options.urls) {
        purgeData.files = options.urls;
      }
      if (options.tags) {
        purgeData.tags = options.tags;
      }
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4/zones/${zoneId}/purge_cache`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(purgeData),
    });

    if (!response.ok) {
      throw new Error(`Cloudflare API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json() as { success: boolean };
    logger.info({ result, options }, 'Cloudflare cache purged successfully');
    
    return result.success;
  }

  private async purgeAWSCache(options: PurgeOptions): Promise<boolean> {
    // AWS CloudFront invalidation would be implemented here
    logger.warn('AWS CloudFront cache purging not yet implemented');
    return false;
  }

  private async purgeAzureCache(options: PurgeOptions): Promise<boolean> {
    // Azure CDN purging would be implemented here
    logger.warn('Azure CDN cache purging not yet implemented');
    return false;
  }

  /**
   * Generate signed URL for protected content
   */
  generateSignedUrl(path: string, expiresIn: number = 3600): string {
    if (!this.config.security.signedUrls) {
      return this.generateUrl(path);
    }

    const baseUrl = this.generateUrl(path);
    const expires = Math.floor(Date.now() / 1000) + expiresIn;
    
    // Simple HMAC signing (in production, use proper CDN-specific signing)
    const secret = process.env.CDN_SIGNING_SECRET || 'default-secret';
    const crypto = require('crypto');
    const signature = crypto
      .createHmac('sha256', secret)
      .update(`${path}${expires}`)
      .digest('hex');

    return `${baseUrl}?expires=${expires}&signature=${signature}`;
  }

  /**
   * Validate request origin for hotlink protection
   */
  validateOrigin(referer?: string): boolean {
    if (!this.config.security.hotlinkProtection) {
      return true;
    }

    if (!referer) {
      return false;
    }

    if (this.config.security.allowedDomains.length === 0) {
      return true;
    }

    try {
      const refererUrl = new URL(referer);
      return this.config.security.allowedDomains.some(domain => 
        refererUrl.hostname === domain || refererUrl.hostname.endsWith(`.${domain}`)
      );
    } catch {
      return false;
    }
  }

  /**
   * Get CDN performance metrics
   */
  async getMetrics(): Promise<{
    cacheHitRatio: number;
    bandwidth: number;
    requests: number;
    errors: number;
  }> {
    // This would integrate with CDN provider APIs to get real metrics
    return {
      cacheHitRatio: 0,
      bandwidth: 0,
      requests: 0,
      errors: 0,
    };
  }

  /**
   * Health check for CDN service
   */
  async healthCheck(): Promise<{
    enabled: boolean;
    reachable: boolean;
    latency: number;
  }> {
    if (!this.config.enabled || !this.config.baseUrl) {
      return {
        enabled: false,
        reachable: false,
        latency: 0,
      };
    }

    try {
      const start = Date.now();
      const response = await fetch(`${this.config.baseUrl}/health`, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000), // 5 second timeout
      });
      const latency = Date.now() - start;

      return {
        enabled: true,
        reachable: response.ok,
        latency,
      };
    } catch (error) {
      logger.warn({ error }, 'CDN health check failed');
      return {
        enabled: true,
        reachable: false,
        latency: 0,
      };
    }
  }

  /**
   * Get configuration
   */
  getConfig(): CDNConfig {
    return { ...this.config };
  }
}

// Export singleton instance
export const cdnService = new CDNService();

// Types are already exported above as interfaces