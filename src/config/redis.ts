// src/config/redis.ts
import Redis from 'ioredis';
import { logger } from './logger';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

export const redis = new Redis(redisUrl, {
  maxRetriesPerRequest: null,
  retryStrategy(times) {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  reconnectOnError(err) {
    logger.error({ error: err.message }, 'Redis connection error');
    return true;
  }
});

redis.on('connect', () => {
  logger.info('Redis connected successfully');
});

redis.on('error', (err) => {
  logger.error({ error: err.message }, 'Redis error');
});

redis.on('reconnecting', () => {
  logger.warn('Redis reconnecting...');
});

// Graceful shutdown
process.on('beforeExit', async () => {
  await redis.quit();
});

export default redis;
