import { createServer } from 'node:http';
import app from './app.js';
import { env } from './config/env.js';
import { logger } from './config/logger.js';
import { prisma } from './config/database.js';

const server = createServer(app);

async function start(): Promise<void> {
  try {
    // Test database connection
    await prisma.$connect();
    logger.info('Database connected');

    server.listen(env.API_PORT, env.API_HOST, () => {
      logger.info(
        {
          port: env.API_PORT,
          host: env.API_HOST,
          env: env.NODE_ENV,
          url: env.API_URL,
        },
        `🚀 ${env.APP_NAME} server running on ${env.API_URL}`,
      );
    });
  } catch (err) {
    logger.fatal({ err }, 'Failed to start server');
    process.exit(1);
  }
}

// ---- Graceful shutdown ----
async function shutdown(signal: string): Promise<void> {
  logger.info({ signal }, 'Shutdown signal received, closing gracefully...');

  server.close(() => {
    logger.info('HTTP server closed');
  });

  try {
    await prisma.$disconnect();
    logger.info('Database disconnected');
  } catch (err) {
    logger.error({ err }, 'Error during database disconnect');
  }

  process.exit(0);
}

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

process.on('unhandledRejection', (reason) => {
  logger.fatal({ err: reason }, 'Unhandled promise rejection');
  process.exit(1);
});

process.on('uncaughtException', (err) => {
  logger.fatal({ err }, 'Uncaught exception');
  process.exit(1);
});

start();
