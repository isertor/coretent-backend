// src/utils/crypto.utils.ts
import crypto from 'crypto';

/**
 * Timing-safe string comparison to prevent timing attacks
 */
export function timingSafeEqual(a: string, b: string): boolean {
  try {
    return crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
  } catch {
    return false;
  }
}

/**
 * Generate HMAC SHA256 signature
 */
export function generateHmacSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Verify HMAC SHA256 signature
 */
export function verifyHmacSignature(
  data: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = generateHmacSignature(data, secret);
  return timingSafeEqual(signature, expectedSignature);
}

/**
 * Generate random token
 */
export function generateRandomToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex');
}

/**
 * Extract user ID from email alias
 * Format: u-{userId}@newsletters.coretent.app
 */
export function extractUserIdFromEmailAlias(emailAlias: string): string | null {
  const match = emailAlias.match(/^u-([a-f0-9-]+)@/i);
  return match ? match[1] : null;
}

/**
 * Generate email alias from user ID
 * Format: u-{userId}@newsletters.coretent.app
 */
export function generateEmailAlias(userId: string): string {
  const domain = process.env.MAILGUN_DOMAIN || 'newsletters.coretent.app';
  return `u-${userId}@${domain}`;
}

/**
 * Hash password using bcrypt (if needed for future authentication)
 */
export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return `${salt}:${hash}`;
}

/**
 * Verify password hash
 */
export function verifyPassword(password: string, hashedPassword: string): boolean {
  const [salt, originalHash] = hashedPassword.split(':');
  const hash = crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex');
  return timingSafeEqual(hash, originalHash);
}
