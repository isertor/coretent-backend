// src/jobs/email-parsing.job.ts
import { Worker } from 'bullmq';
import redis from '../config/redis';
import { parseNewsletterEmail } from '../services/parser.service';
import { prisma } from '../config/database';
import { logger } from '../config/logger';
import { EmailProcessingJobData } from './queue.config';

export const emailWorker = new Worker<EmailProcessingJobData>(
  'email-processing',
  async (job) => {
    const { newsletterId, html, fromEmail, subject } = job.data;

    logger.info({ newsletterId, fromEmail, subject }, 'Starting email parsing job');

    try {
      // Parse email content
      const parsed = await parseNewsletterEmail(html, fromEmail);

      // Update newsletter in database with parsed content
      await prisma.newsletter.update({
        where: { id: newsletterId },
        data: {
          title: parsed.title,
          author: parsed.author,
          cleanContent: parsed.cleanContent,
          textContent: parsed.textContent,
          excerpt: parsed.excerpt,
          estimatedReadTime: parsed.estimatedReadTime,
          publication: parsed.publication,
          parsedAt: new Date(),
          parseStatus: 'success'
        }
      });

      logger.info({ newsletterId, title: parsed.title }, 'Email parsed successfully');

      return { success: true, newsletterId };
    } catch (error) {
      logger.error({ newsletterId, error }, 'Email parsing failed');

      // Update newsletter with error status
      await prisma.newsletter.update({
        where: { id: newsletterId },
        data: {
          parseStatus: 'failed',
          parseError: error instanceof Error ? error.message : 'Unknown error'
        }
      });

      // Re-throw to trigger retry
      throw error;
    }
  },
  {
    connection: redis,
    concurrency: 5, // Process up to 5 jobs concurrently
    limiter: {
      max: 10, // Max 10 jobs
      duration: 1000 // per second
    }
  }
);

// Worker event listeners
emailWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Email parsing job completed');
});

emailWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, error: err }, 'Email parsing job failed');
});

emailWorker.on('error', (err) => {
  logger.error({ error: err }, 'Email worker error');
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, closing email worker...');
  await emailWorker.close();
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, closing email worker...');
  await emailWorker.close();
});
