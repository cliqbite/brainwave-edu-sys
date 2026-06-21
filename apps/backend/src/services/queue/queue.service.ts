import { Queue } from 'bullmq';
import { createRedisConnection } from '../../config/redis.js';

const redisConnection = createRedisConnection();

export const messageQueue = new Queue('message-campaigns', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  },
});

export const pushQueue = new Queue('push-notifications', {
  connection: redisConnection as any,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 1000 },
    removeOnComplete: true,
  },
});

export async function enqueueMessageCampaign(campaignId: number) {
  await messageQueue.add('process', { campaignId });
}

export async function enqueuePushNotification(notificationId: number) {
  await pushQueue.add('process', { notificationId });
}
