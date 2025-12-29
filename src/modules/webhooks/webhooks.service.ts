// src/modules/webhooks/webhooks.service.ts
import { prisma } from '../../config/database';
import { emailQueue } from '../../jobs/queue.config';
import { extractUserIdFromEmailAlias } from '../../utils/crypto.utils';
import { extractEmailContent } from '../../services/parser.service';
import { logger } from '../../config/logger';
import { NotFoundError, EmailParsingError } from '../../utils/errors';

export async function processIncomingEmail(webhookData: any): Promise<void> {
  // Support both SendGrid and Mailgun formats
  const recipient = webhookData.to || webhookData.recipient;
  const sender = webhookData.from || webhookData.sender;
  const from = webhookData.from || webhookData.sender;
  const subject = webhookData.subject;
  const bodyHtml = webhookData.html || webhookData['body-html'];
  const bodyPlain = webhookData.text || webhookData['body-plain'];
  const messageId = webhookData.headers?.['message-id'] || webhookData['message-id'] || `sendgrid-${Date.now()}`;

  logger.info({ recipient, sender, subject, messageId }, 'Processing incoming email');

  const userId = extractUserIdFromEmailAlias(recipient);
  if (!userId) {
    throw new NotFoundError(`Invalid email alias: ${recipient}`);
  }

  const user = await prisma.user.findUnique({ where: { userId } });
  if (!user) {
    logger.warn({ userId, recipient }, 'User not found for email alias');
    throw new NotFoundError(`User not found: ${userId}`);
  }

  const existing = await prisma.newsletter.findUnique({ where: { messageId } });
  if (existing) {
    logger.info({ messageId }, 'Duplicate email detected, skipping');
    return;
  }

  const { html, text, hasHTML } = extractEmailContent({
    'body-html': bodyHtml,
    'body-plain': bodyPlain,
    html: bodyHtml,
    text: bodyPlain
  });

  if (!hasHTML && !text) {
    throw new EmailParsingError('Email has no content');
  }

  const newsletter = await prisma.newsletter.create({
    data: {
      userId: user.userId,
      messageId,
      fromEmail: sender || from,
      fromName: extractNameFromEmail(from || sender),
      subject: subject || 'No Subject',
      receivedAt: new Date(),
      htmlContent: html || text,
      cleanContent: '',
      textContent: text,
      parseStatus: 'pending'
    }
  });

  const senderEmail = sender || from;
  const senderDomain = senderEmail.split('@')[1];

  await prisma.subscription.upsert({
    where: { userId_senderEmail: { userId: user.userId, senderEmail } },
    update: { lastReceivedAt: new Date(), emailCount: { increment: 1 } },
    create: {
      userId: user.userId,
      newsletterName: extractNewsletterName(senderEmail, subject),
      senderEmail,
      senderDomain,
      emailCount: 1,
      lastReceivedAt: new Date()
    }
  });

  await emailQueue.add('parse-email', {
    newsletterId: newsletter.id,
    html: html || text,
    fromEmail: senderEmail,
    subject: subject || 'No Subject'
  });

  logger.info({ newsletterId: newsletter.id, userId }, 'Email queued for parsing');
}

function extractNameFromEmail(email: string): string | null {
  const match = email.match(/^(.+?)\s*<(.+?)>$/);
  return match ? match[1].trim() : null;
}

function extractNewsletterName(senderEmail: string, subject: string): string {
  const emailMatch = senderEmail.match(/([^@]+)@/);
  if (emailMatch) {
    const name = emailMatch[1]
      .split(/[._-]/)
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
    return name;
  }
  return subject.slice(0, 50);
}
