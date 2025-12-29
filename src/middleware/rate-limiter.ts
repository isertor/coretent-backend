// src/middleware/rate-limiter.ts
import rateLimit from 'express-rate-limit';
import RedisStore from 'rate-limit-redis';
import redis from '../config/redis';

// API rate limiter - 60 requests per minute
export const apiLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore - Redis client type mismatch
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 60, // 60 requests per minute
  message: 'Too many requests, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Auth rate limiter - 5 requests per minute (stricter)
export const authLimiter = rateLimit({
  store: new RedisStore({
    // @ts-ignore
    sendCommand: (...args: string[]) => redis.call(...args),
  }),
  windowMs: 60 * 1000, // 1 minute
  max: 5, // 5 requests per minute
  message: 'Too many authentication attempts.',
  standardHeaders: true,
  legacyHeaders: false,
});

// Webhook rate limiter - disabled (verified by signature)
// Webhooks from Mailgun don't need rate limiting as they're verified
export const webhookLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 1000, // Very high limit
  skip: () => true, // Skip rate limiting for webhooks (signature verified instead)
});
