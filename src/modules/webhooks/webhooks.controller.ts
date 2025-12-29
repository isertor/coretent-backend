// src/modules/webhooks/webhooks.controller.ts
import { Request, Response, NextFunction } from 'express';
import { processIncomingEmail } from './webhooks.service';
import { logger } from '../../config/logger';

/**
 * Handle incoming email webhook from SendGrid or Mailgun
 */
export async function handleIncomingEmail(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const provider = req.body.to ? 'SendGrid' : 'Mailgun';
    logger.info({ provider, headers: req.headers }, 'Received email webhook');

    await processIncomingEmail(req.body);

    // Respond quickly (webhook requires <5s response)
    res.status(200).json({ success: true });
  } catch (error) {
    logger.error({ error }, 'Webhook processing error');
    next(error);
  }
}
