// ============================================================
// Brainwave EduSys - Worker Service Entry Point
// Processes background jobs for message campaigns and push notifications
// ============================================================

import { Worker } from 'bullmq';
import { Redis } from 'ioredis';
import pino from 'pino';
import { PrismaClient } from '@prisma/client';
import { PrismaMariaDb } from '@prisma/adapter-mariadb';
import { processMessageCampaign } from './processors/message.processor.js';
import { processPushNotification } from './processors/push.processor.js';

const logger = pino({
  level: process.env['LOG_LEVEL'] ?? 'info',
  transport: process.env['NODE_ENV'] !== 'production'
    ? { target: 'pino-pretty', options: { colorize: true } }
    : undefined,
});

const adapter = new PrismaMariaDb(process.env['DATABASE_URL']!);
const prisma = new PrismaClient({ adapter });

const redisConnection = new Redis({
  host: process.env['REDIS_HOST'] ?? 'localhost',
  port: Number(process.env['REDIS_PORT'] ?? 6379),
  password: process.env['REDIS_PASSWORD'] || undefined,
  maxRetriesPerRequest: null,
});

redisConnection.on('error', (err: any) => {
  logger.error({ err }, 'Redis connection error in worker');
});

redisConnection.on('connect', () => {
  logger.info('Worker connected to Redis');
});

// Message Campaign Worker
const messageWorker = new Worker(
  'message-campaigns',
  async (job) => {
    logger.info({ jobId: job.id, campaignId: job.data.campaignId }, 'Processing message campaign');
    await processMessageCampaign(job.data.campaignId, prisma, logger);
  },
  {
    connection: redisConnection as any,
    concurrency: 5,
    limiter: {
      max: 10,
      duration: 1000,
    },
  }
);

messageWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Message campaign job completed');
});

messageWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Message campaign job failed');
});

// Push Notification Worker
const pushWorker = new Worker(
  'push-notifications',
  async (job) => {
    logger.info({ jobId: job.id, notificationId: job.data.notificationId }, 'Processing push notification');
    await processPushNotification(job.data.notificationId, prisma, logger);
  },
  {
    connection: redisConnection as any,
    concurrency: 10,
  }
);

pushWorker.on('completed', (job) => {
  logger.info({ jobId: job.id }, 'Push notification job completed');
});

pushWorker.on('failed', (job, err) => {
  logger.error({ jobId: job?.id, err }, 'Push notification job failed');
});

// Graceful shutdown
const shutdown = async (signal: string) => {
  logger.info({ signal }, 'Worker shutting down');
  await messageWorker.close();
  await pushWorker.close();
  await redisConnection.quit();
  await prisma.$disconnect();
  process.exit(0);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

logger.info('Brainwave EduSys Worker started');
logger.info('Listening for jobs on queues: message-campaigns, push-notifications');
