// src/modules/newsletters/newsletters.service.ts
import { prisma } from '../../config/database';
import { NotFoundError } from '../../utils/errors';
import { logger } from '../../config/logger';

interface FetchNewslettersParams {
  userId: string;
  cursor?: string;
  limit: number;
  status: 'all' | 'unread' | 'read' | 'archived';
}

export async function fetchNewsletters(params: FetchNewslettersParams) {
  const { userId, cursor, limit, status } = params;

  // Build where clause based on status filter
  const where: any = { userId };
  
  if (status === 'unread') {
    where.isRead = false;
    where.isArchived = false;
  } else if (status === 'read') {
    where.isRead = true;
    where.isArchived = false;
  } else if (status === 'archived') {
    where.isArchived = true;
  }

  // Cursor-based pagination
  const newsletters = await prisma.newsletter.findMany({
    where,
    take: limit + 1, // Fetch one extra to check if there are more
    ...(cursor && {
      cursor: { id: cursor },
      skip: 1 // Skip the cursor itself
    }),
    orderBy: { receivedAt: 'desc' },
    select: {
      id: true,
      messageId: true,
      fromEmail: true,
      fromName: true,
      subject: true,
      receivedAt: true,
      title: true,
      author: true,
      publication: true,
      estimatedReadTime: true,
      excerpt: true,
      parseStatus: true,
      isRead: true,
      isArchived: true,
      createdAt: true,
      updatedAt: true
    }
  });

  const hasMore = newsletters.length > limit;
  const items = hasMore ? newsletters.slice(0, -1) : newsletters;
  const nextCursor = hasMore ? items[items.length - 1].id : null;

  logger.info({ userId, count: items.length, hasMore }, 'Fetched newsletters');

  return {
    newsletters: items,
    nextCursor,
    hasMore
  };
}

export async function getNewsletter(id: string, userId: string) {
  const newsletter = await prisma.newsletter.findFirst({
    where: { id, userId }
  });

  if (!newsletter) {
    throw new NotFoundError(`Newsletter not found: ${id}`);
  }

  return newsletter;
}

export async function updateNewsletter(
  id: string,
  userId: string,
  data: { isRead?: boolean; isArchived?: boolean }
) {
  // Verify ownership
  const existing = await prisma.newsletter.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    throw new NotFoundError(`Newsletter not found: ${id}`);
  }

  const updated = await prisma.newsletter.update({
    where: { id },
    data
  });

  logger.info({ id, userId, updates: data }, 'Newsletter updated');

  return updated;
}

export async function deleteNewsletter(id: string, userId: string) {
  // Verify ownership
  const existing = await prisma.newsletter.findFirst({
    where: { id, userId }
  });

  if (!existing) {
    throw new NotFoundError(`Newsletter not found: ${id}`);
  }

  await prisma.newsletter.delete({
    where: { id }
  });

  logger.info({ id, userId }, 'Newsletter deleted');

  return { success: true };
}
