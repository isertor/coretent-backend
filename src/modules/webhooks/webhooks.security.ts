// src/modules/webhooks/webhooks.security.ts
import crypto from 'crypto';
import redis from '../../config/redis';
import { WebhookVerificationError } from '../../utils/errors';
import { logger } from '../../config/logger';

/**
 * Verify SendGrid webhook signature (optional for testing)
 * For production, configure SendGrid Event Webhook with OAuth
 * For now, we skip verification for simplicity
 */
export async function verifySendGridSignature(
  timestamp: string,
  token: string,
  signature: string
): Promise<boolean> {
  // SendGrid Inbound Parse doesn't require signature verification
  // In production, you can add basic auth or IP whitelisting
  logger.info('SendGrid webhook received (verification skipped for development)');
  return true;
}

/**
 * Legacy Mailgun signature verification (kept for reference)
 */
export async function verifyMailgunSignature(
  timestamp: string,
  token: string,
  signature: string
): Promise<boolean> {
  try {
    // 1. Prevent replay attacks (reject if >5 minutes old)
    const currentTime = Math.floor(Date.now() / 1000);
    const messageTime = parseInt(timestamp, 10);
    
    if (isNaN(messageTime)) {
      logger.warn({ timestamp }, 'Invalid timestamp format');
      return false;
    }

    if (Math.abs(currentTime - messageTime) > 300) {
      logger.warn({ timestamp, currentTime, messageTime }, 'Timestamp too old or in future');
      return false;
    }

    // 2. Check token uniqueness (store in Redis with 10min TTL to prevent reuse)
    const tokenKey = `webhook:token:${token}`;
    const tokenExists = await redis.get(tokenKey);
    
    if (tokenExists) {
      logger.warn({ token }, 'Token already used (duplicate webhook)');
      return false;
    }

    // Store token for 10 minutes
    await redis.setex(tokenKey, 600, '1');

    // 3. Verify HMAC signature
    const signingKey = process.env.MAILGUN_WEBHOOK_SIGNING_KEY;
    if (!signingKey) {
      throw new WebhookVerificationError('MAILGUN_WEBHOOK_SIGNING_KEY not configured');
    }

    const expectedSignature = crypto
      .createHmac('sha256', signingKey)
      .update(`${timestamp}${token}`)
      .digest('hex');

    // 4. Timing-safe comparison to prevent timing attacks
    const isValid = crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );

    if (!isValid) {
      logger.warn({ providedSignature: signature }, 'Invalid signature');
    }

    return isValid;
  } catch (error) {
    logger.error({ error }, 'Signature verification error');
    return false;
  }
}

/**
 * Middleware to verify webhook signatures
 * For SendGrid: verification is optional (skipped for development)
 * For Mailgun: full HMAC verification (legacy support)
 */
export async function verifyWebhookMiddleware(
  req: any,
  res: any,
  next: any
): Promise<void> {
  // Check if this is a SendGrid webhook (has 'to' field in multipart form)
  const isSendGrid = req.body.to || req.headers['user-agent']?.includes('SendGrid');

  if (isSendGrid) {
    // SendGrid webhooks don't require signature verification for Inbound Parse
    logger.info('SendGrid webhook accepted (no verification required)');
    next();
    return;
  }

  // Legacy Mailgun verification
  const timestamp = req.headers['x-mailgun-timestamp'] || req.body.timestamp;
  const token = req.headers['x-mailgun-token'] || req.body.token;
  const signature = req.headers['x-mailgun-signature'] || req.body.signature;

  if (!timestamp || !token || !signature) {
    logger.warn({
      hasTimestamp: !!timestamp,
      hasToken: !!token,
      hasSignature: !!signature
    }, 'Missing webhook signature parameters');
    return res.status(403).json({ error: 'Missing signature parameters' });
  }

  const isValid = await verifyMailgunSignature(timestamp, token, signature);

  if (!isValid) {
    logger.warn({ timestamp, token }, 'Webhook signature verification failed');
    return res.status(403).json({ error: 'Invalid signature' });
  }

  next();
}
