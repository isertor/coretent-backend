// src/modules/webhooks/webhooks.routes.ts
import { Router } from 'express';
import { handleIncomingEmail } from './webhooks.controller';
import { verifyWebhookMiddleware } from './webhooks.security';
import { webhookLimiter } from '../../middleware/rate-limiter';
import { asyncHandler } from '../../middleware/error-handler';

const router = Router();

// SendGrid Inbound Parse webhook endpoint
router.post(
  '/sendgrid',
  webhookLimiter,
  verifyWebhookMiddleware,
  asyncHandler(handleIncomingEmail)
);

// Mailgun webhook endpoint (legacy support)
router.post(
  '/mailgun',
  webhookLimiter,
  verifyWebhookMiddleware,
  asyncHandler(handleIncomingEmail)
);

// Generic email webhook (works with both)
router.post(
  '/email',
  webhookLimiter,
  verifyWebhookMiddleware,
  asyncHandler(handleIncomingEmail)
);

export default router;
