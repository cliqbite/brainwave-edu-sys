import pino from 'pino';
import { env } from './env.js';

const transport =
  env.NODE_ENV === 'development'
    ? pino.transport({
        target: 'pino-pretty',
        options: {
          colorize: true,
          translateTime: 'SYS:HH:MM:ss.l',
          ignore: 'pid,hostname',
        },
      })
    : undefined;

export const logger = pino(
  {
    name: env.APP_NAME,
    level: env.LOG_LEVEL,
    ...(env.NODE_ENV === 'production' && {
      redact: ['req.headers.authorization', 'req.body.password'],
    }),
  },
  transport,
);
