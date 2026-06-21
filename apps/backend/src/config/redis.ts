import { Redis, type RedisOptions } from 'ioredis';
import { env } from './env.js';
import { logger } from './logger.js';

function getRedisOptions(): RedisOptions {
  return {
    host: env.REDIS_HOST,
    port: env.REDIS_PORT,
    ...(env.REDIS_PASSWORD && { password: env.REDIS_PASSWORD }),
    maxRetriesPerRequest: null,
    retryStrategy(times: number) {
      const delay = Math.min(times * 200, 5000);
      logger.warn({ attempt: times, delay }, 'Redis reconnecting...');
      return delay;
    },
  };
}

export const redis = new (Redis as any)(getRedisOptions());

redis.on('connect', () => {
  logger.info('Redis connected');
});

redis.on('error', (err) => {
  logger.error({ err }, 'Redis connection error');
});

export function createRedisConnection(): Redis {
  return new (Redis as any)(getRedisOptions());
}
