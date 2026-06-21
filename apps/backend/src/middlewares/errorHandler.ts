import type { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { ZodError } from 'zod';
import { AppError, ValidationError } from '../utils/errors.js';
import { sendError } from '../utils/response.js';
import { logger } from '../config/logger.js';
import { env } from '../config/env.js';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  // --- AppError (our own operational errors) ---
  if (err instanceof ValidationError) {
    sendError(res, err.message, err.statusCode, err.errors);
    return;
  }

  if (err instanceof AppError || ('statusCode' in err && typeof (err as any).statusCode === 'number')) {
    const appErr = err as any;
    if (appErr.isOperational === false) {
      logger.fatal({ err }, 'Non-operational error');
    }
    sendError(res, err.message, appErr.statusCode || 500);
    return;
  }

  // --- Prisma known errors ---
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002': {
        // Unique constraint violation
        const target = (err.meta?.['target'] as string[] | undefined)?.join(', ') ?? 'field';
        sendError(res, `A record with this ${target} already exists`, 409);
        return;
      }
      case 'P2025': {
        // Record not found
        sendError(res, 'Record not found', 404);
        return;
      }
      default: {
        logger.error({ err, code: err.code }, 'Prisma error');
        sendError(res, 'Database error', 500);
        return;
      }
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    logger.error({ err }, 'Prisma validation error');
    sendError(res, 'Invalid database query', 400);
    return;
  }

  // --- Zod validation errors ---
  if (err instanceof ZodError) {
    const errors = err.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
      code: issue.code,
    }));
    sendError(res, 'Validation failed', 400, errors);
    return;
  }

  // --- Generic / unexpected errors ---
  logger.error({ err }, 'Unhandled error');

  const message =
    env.NODE_ENV === 'production' ? 'Internal server error' : err.message;

  sendError(res, message, 500);
}
