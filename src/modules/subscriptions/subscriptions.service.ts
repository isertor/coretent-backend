// src/modules/subscriptions/subscriptions.service.ts
import { prisma } from '../../config/database';
import { NotFoundError, ConflictError } from '../../utils/errors';
import { logger } from '../../config/logger';

export async function createSubscription(
  userId: string,
  newsletterName: string,
  senderEmail: string
) {
  const senderDomain = senderEmail.split('@')[1];

  // Check if subscription already exists
  const existing = await prisma.subscription.findUnique({
    where: {
      userId_senderEmail: {
        userId,
        senderEmail
      }
    }
  });

  if (existing) {
    throw new ConflictError(`Subscription already exists for ${senderEmail}`);
  }

  const subscription = await prisma.subscription.create({
    data: {
      userId,
      newsletterName,
      senderEmail,
      senderDomain
    }
  });

  logger.info({ userId, senderEmail, newsletterName }, 'Subscription created');

  return subscription;
}

export async function fetchSubscriptions(userId: string) {
  const subscriptions = await prisma.subscription.findMany({
    where: { userId },
    orderBy: { subscribedAt: 'desc' }
  });

  logger.info({ userId, count: subscriptions.length }, 'Fetched subscriptions');

  return { subscriptions };
}

export async function updateSubscription(
  id: string,
  userId: string,
  isActive: boolean
) {
  // Verify ownership
  const existing = await prisma.subscription.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    throw new NotFoundError(`Subscription not found: ${id}`);
  }

  const updated = await prisma.subscription.update({
    where: { id },
    data: { isActive }
  });

  logger.info({ id, userId, isActive }, 'Subscription updated');

  return updated;
}

export async function deleteSubscription(id: string, userId: string) {
  // Verify ownership
  const existing = await prisma.subscription.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    throw new NotFoundError(`Subscription not found: ${id}`);
  }

  await prisma.subscription.delete({
    where: { id }
  });

  logger.info({ id, userId }, 'Subscription deleted');

  return { success: true };
}
