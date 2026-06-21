import pinoHttp from 'pino-http';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export const requestLogger = (pinoHttp as any)({
  logger,
  autoLogging: {
    ignore: (req) => {
      // Skip health-check noise
      return req.url === '/api/v1/health';
    },
  },
  redact: {
    paths: ['req.headers.authorization', 'req.headers.cookie'],
    censor: '[REDACTED]',
  },
  customLogLevel: (_req, res, err) => {
    if (err || (res.statusCode >= 500)) return 'error';
    if (res.statusCode >= 400) return 'warn';
    return 'info';
  },
  ...(env.NODE_ENV === 'development' && {
    transport: {
      target: 'pino-pretty',
      options: {
        colorize: true,
        translateTime: 'SYS:HH:MM:ss.l',
        ignore: 'pid,hostname,req.headers,res.headers',
      },
    },
  }),
});
