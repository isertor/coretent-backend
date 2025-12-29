// src/modules/users/users.service.ts
import { prisma } from '../../config/database';
import { generateEmailAlias } from '../../utils/crypto.utils';
import { ConflictError, NotFoundError } from '../../utils/errors';
import { logger } from '../../config/logger';

export async function registerUser(userId: string) {
  const existing = await prisma.user.findUnique({ where: { userId } });
  
  if (existing) {
    logger.info({ userId }, 'User already registered');
    return { userId: existing.userId, emailAlias: existing.emailAlias };
  }

  const emailAlias = generateEmailAlias(userId);

  const user = await prisma.user.create({
    data: { userId, emailAlias }
  });

  logger.info({ userId, emailAlias }, 'User registered successfully');

  return { userId: user.userId, emailAlias: user.emailAlias };
}

export async function getUserEmailAlias(userId: string) {
  const user = await prisma.user.findUnique({ where: { userId } });

  if (!user) {
    throw new NotFoundError(`User not found: ${userId}`);
  }

  return { emailAlias: user.emailAlias };
}
