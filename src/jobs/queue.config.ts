// src/jobs/queue.config.ts
import { Queue, Worker } from 'bullmq';
import redis from '../config/redis';

const redisConnection = redis;

export const emailQueue = new Queue('email-processing', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000
    },
    removeOnComplete: {
      age: 86400 // Keep completed jobs for 24 hours
    },
    removeOnFail: {
      age: 604800 // Keep failed jobs for 7 days
    }
  }
});

// Export types for job data
export interface EmailProcessingJobData {
  newsletterId: string;
  html: string;
  fromEmail: string;
  subject: string;
}
