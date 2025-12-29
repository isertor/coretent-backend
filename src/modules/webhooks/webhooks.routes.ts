// src/modules/webhooks/webhooks.routes.ts
import { Router } from 'express';
import { handleIncomingEmail } from './webhooks.controller';
import { verifyWebhookMiddleware } from './webhooks.security';
import { webhookLimiter } from '../../middleware/rate-limiter';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

// Mailgun webhook endpoint - signature verified, no rate limit
router.post(
  '/mailgun',
  webhookLimiter,
  verifyWebhookMiddleware,
  asyncHandler(handleIncomingEmail)
);

export default router;
