// src/server.ts
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { logger } from './config/logger';
import { errorHandler, notFoundHandler } from './middleware/error-handler';
import { emailWorker } from './jobs/email-parsing.job';

// Import routes
import userRoutes from './modules/users/users.routes';
import newsletterRoutes from './modules/newsletters/newsletters.routes';
import subscriptionRoutes from './modules/subscriptions/subscriptions.routes';
import webhookRoutes from './modules/webhooks/webhooks.routes';

const app = express();
const PORT = process.env.PORT || 3000;

// Trust proxy (required for Railway/Heroku)
app.set('trust proxy', 1);

// Security middleware
app.use(helmet());

// CORS configuration
const corsOrigins = process.env.CORS_ORIGIN?.split(',') || ['http://localhost:3000'];
app.use(cors({
  origin: corsOrigins,
  credentials: true
}));

// Body parsing middleware
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    uptime: process.uptime()
  });
});

// API routes
app.use('/api/v1/users', userRoutes);
app.use('/api/v1/newsletters', newsletterRoutes);
app.use('/api/v1/subscriptions', subscriptionRoutes);

// Webhook routes (no /api/v1 prefix)
app.use('/webhooks', webhookRoutes);

// 404 handler
app.use(notFoundHandler);

// Global error handler (must be last)
app.use(errorHandler);

// Start server
const server = app.listen(PORT, () => {
  logger.info({ port: PORT, env: process.env.NODE_ENV }, 'Server started successfully');
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  logger.info({ signal }, 'Received shutdown signal, closing gracefully...');

  // Stop accepting new connections
  server.close(async () => {
    logger.info('HTTP server closed');

    try {
      // Close email worker
      await emailWorker.close();
      logger.info('Email worker closed');

      // Exit process
      process.exit(0);
    } catch (error) {
      logger.error({ error }, 'Error during graceful shutdown');
      process.exit(1);
    }
  });

  // Force shutdown after 30 seconds
  setTimeout(() => {
    logger.error('Forced shutdown after timeout');
    process.exit(1);
  }, 30000);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.fatal({ error }, 'Uncaught exception');
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  logger.fatal({ reason, promise }, 'Unhandled rejection');
  process.exit(1);
});

export { app };
