import Redis from 'ioredis';

const isRedisConfigured = process.env.REDIS_URL || process.env.REDIS_HOST;

if (!isRedisConfigured) {
  console.warn('⚠️  Redis not configured - running without caching. Queue operations will be simulated.');
}

// Redis configuration
const redisConfig = {
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
export const redis = isRedisConfigured ? new Redis(redisConfig) : createMockRedis();

// Create separate Redis client for Bull queues
export const queueRedis = isRedisConfigured ? new Redis({
  ...redisConfig,
  maxRetriesPerRequest: null, // Bull requires this to be null
}) : createMockRedis();

if (isRedisConfigured) {
  // Redis connection event handlers
  redis.on('connect', () => {
    console.log('✅ Redis connected');
  });

  redis.on('error', (error) => {
    console.error('❌ Redis connection error:', error);
  });

  redis.on('close', () => {
    console.log('🔌 Redis connection closed');
  });

  queueRedis.on('connect', () => {
    console.log('✅ Queue Redis connected');
  });

  queueRedis.on('error', (error) => {
    console.error('❌ Queue Redis connection error:', error);
  });

  // Graceful shutdown
  process.on('SIGTERM', async () => {
    console.log('Closing Redis connections...');
    await redis.quit();
    await queueRedis.quit();
  });

  process.on('SIGINT', async () => {
    console.log('Closing Redis connections...');
    await redis.quit();
    await queueRedis.quit();
  });
}

export default redis;