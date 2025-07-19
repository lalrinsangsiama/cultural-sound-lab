import Redis from 'ioredis';
import { Redis as UpstashRedis } from '@upstash/redis';

const isRedisConfigured = process.env.REDIS_URL || process.env.REDIS_HOST;

if (!isRedisConfigured) {
  console.warn('⚠️  Redis not configured - running without caching. Queue operations will be simulated.');
}

// Redis configuration - support both URL and individual config
const getRedisConfig = (): any => {
  if (process.env.REDIS_URL) {
    const isUpstash = process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io');
    
    if (isUpstash) {
      // For Upstash, pass the URL directly
      return {
        connectionName: 'upstash',
        connectTimeout: 10000,
        lazyConnect: true,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100
      };
    } else {
      // Use Redis URL for other providers
      return {
        url: process.env.REDIS_URL,
        maxRetriesPerRequest: 3,
        retryDelayOnFailover: 100,
        lazyConnect: true,
        keepAlive: 30000,
        family: 4,
        tls: process.env.REDIS_URL.includes('rediss://') || process.env.REDIS_URL.includes('@') ? {} : undefined,
      };
    }
  } else {
    // Use individual config options
    return {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD,
      db: parseInt(process.env.REDIS_DB || '0'),
      maxRetriesPerRequest: 3,
      retryDelayOnFailover: 100,
      lazyConnect: true,
      keepAlive: 30000,
      family: 4, // Force IPv4
    };
  }
};

const redisConfig = getRedisConfig();

// Create mock Redis client
const createMockRedis = () => ({
  ping: () => Promise.resolve('PONG'),
  get: () => Promise.resolve(null),
  set: () => Promise.resolve('OK'),
  del: () => Promise.resolve(1),
  quit: () => Promise.resolve('OK'),
  on: () => {},
}) as any;

// Create Redis client for general use
export const redis = isRedisConfigured ? 
  (process.env.REDIS_URL && (process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io')) ? 
    UpstashRedis.fromEnv() : 
    new Redis(redisConfig)
  ) : createMockRedis();

// Create separate Redis client for Bull queues (use ioredis for Bull compatibility)
export const queueRedis = isRedisConfigured ? 
  (process.env.REDIS_URL && (process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io')) ? 
    new Redis(process.env.REDIS_URL, { maxRetriesPerRequest: null }) : 
    new Redis({ ...redisConfig, maxRetriesPerRequest: null })
  ) : createMockRedis();

if (isRedisConfigured) {
  const isUpstash = process.env.REDIS_URL && (process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io'));
  
  if (!isUpstash) {
    // Redis connection event handlers for ioredis
    (redis as any).on('connect', () => {
      console.log('✅ Redis connected');
    });

    (redis as any).on('error', (error: Error) => {
      console.error('❌ Redis connection error:', error);
    });

    (redis as any).on('close', () => {
      console.log('🔌 Redis connection closed');
    });
  } else {
    console.log('✅ Upstash Redis client initialized');
  }

  // Queue Redis event handlers (always ioredis)
  queueRedis.on('connect', () => {
    console.log('✅ Queue Redis connected');
  });

  queueRedis.on('error', (error: Error) => {
    console.error('❌ Queue Redis connection error:', error);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Closing Redis connections...');
    if (!isUpstash && typeof (redis as any).quit === 'function') {
      await (redis as any).quit();
    }
    if (typeof queueRedis.quit === 'function') {
      await queueRedis.quit();
    }
  });

  process.on('SIGINT', async () => {
    console.log('Closing Redis connections...');
    if (!isUpstash && typeof (redis as any).quit === 'function') {
      await (redis as any).quit();
    }
    if (typeof queueRedis.quit === 'function') {
      await queueRedis.quit();
    }
  });
}

// Helper functions for common caching operations
export const cacheHelpers = {
  // Get cached data with JSON parsing
  async get<T>(key: string): Promise<T | null> {
    try {
      if (!isRedisConfigured) return null;
      const cached = await redis.get(key);
      if (cached === null || cached === undefined) return null;
      
      const isUpstash = process.env.REDIS_URL && (process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io'));
      
      if (isUpstash) {
        // Upstash client returns the actual value
        return cached as T;
      } else {
        // ioredis returns strings that need to be parsed
        if (typeof cached === 'string') {
          try {
            return JSON.parse(cached);
          } catch {
            // If JSON.parse fails, return the string as-is
            return cached as T;
          }
        }
        return cached as T;
      }
    } catch (error) {
      console.error(`Error getting cache for key ${key}:`, error);
      return null;
    }
  },

  // Set cache data with JSON stringification and TTL
  async set(key: string, value: any, ttl?: number): Promise<void> {
    try {
      if (!isRedisConfigured) return;
      const isUpstash = process.env.REDIS_URL && (process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io'));
      
      if (isUpstash) {
        // Upstash client handles JSON automatically
        if (ttl) {
          await (redis as any).setex(key, ttl, value);
        } else {
          await redis.set(key, value);
        }
      } else {
        // ioredis requires string conversion
        const stringified = JSON.stringify(value);
        if (ttl) {
          await (redis as any).setex(key, ttl, stringified);
        } else {
          await redis.set(key, stringified);
        }
      }
    } catch (error) {
      console.error(`Error setting cache for key ${key}:`, error);
    }
  },

  // Delete cached data
  async del(key: string | string[]): Promise<void> {
    try {
      if (!isRedisConfigured) return;
      if (Array.isArray(key)) {
        for (const k of key) {
          await redis.del(k);
        }
      } else {
        await redis.del(key);
      }
    } catch (error) {
      console.error(`Error deleting cache for key(s) ${key}:`, error);
    }
  },

  // Clear cache by pattern (only for ioredis)
  async clearByPattern(pattern: string): Promise<void> {
    try {
      if (!isRedisConfigured) return;
      const isUpstash = process.env.REDIS_URL && (process.env.REDIS_URL.includes('@picked-leech-') || process.env.REDIS_URL.includes('.upstash.io'));
      
      if (isUpstash) {
        console.warn('Pattern-based cache clearing not supported with Upstash REST API');
        return;
      }
      
      const keys = await (redis as any).keys(pattern);
      if (keys.length > 0) {
        await (redis as any).del(...keys);
      }
    } catch (error) {
      console.error(`Error clearing cache by pattern ${pattern}:`, error);
    }
  },

  // Check if Redis is available
  async isAvailable(): Promise<boolean> {
    try {
      if (!isRedisConfigured) return false;
      const result = await redis.ping();
      return result === 'PONG';
    } catch (error) {
      return false;
    }
  }
};

export default redis;