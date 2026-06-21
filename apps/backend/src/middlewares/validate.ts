import type { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendError } from '../utils/response.js';

function handleValidationError(res: Response, error: ZodError): void {
  const errors = error.issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code,
  }));
  sendError(res, 'Validation failed', 400, errors);
}

/** Validates `req` against the given Zod schema */
export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });
    if (!result.success) {
      handleValidationError(res, result.error);
      return;
    }
    
    // Update req with validated/coerced data
    if (result.data.body) req.body = result.data.body;
    if (result.data.query) req.query = result.data.query;
    if (result.data.params) req.params = result.data.params;
    
    next();
  };
}

/** Validates `req.query` against the given Zod schema */
export function validateQuery(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      handleValidationError(res, result.error);
      return;
    }
    req.query = result.data;
    next();
  };
}

/** Validates `req.params` against the given Zod schema */
export function validateParams(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      handleValidationError(res, result.error);
      return;
    }
    req.params = result.data;
    next();
  };
}
