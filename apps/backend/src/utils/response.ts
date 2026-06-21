import type { Response } from 'express';
import type { ApiResponse, PaginationMeta, ApiError } from '@brainwave/shared';

export function sendSuccess<T>(
  res: Response,
  data?: T,
  message = 'Success',
  statusCode = 200,
  meta?: PaginationMeta,
): void {
  const body: ApiResponse<T> = {
    success: true,
    message,
    ...(data !== undefined && { data }),
    ...(meta && { meta }),
  };
  res.status(statusCode).json(body);
}

export function sendError(
  res: Response,
  message = 'Internal server error',
  statusCode = 500,
  errors?: ApiError[],
): void {
  const body: ApiResponse = {
    success: false,
    message,
    ...(errors && { errors }),
  };
  res.status(statusCode).json(body);
}

export function sendPaginated<T>(
  res: Response,
  data: T[],
  meta: PaginationMeta,
  message = 'Success',
): void {
  const body: ApiResponse<T[]> = {
    success: true,
    message,
    data,
    meta,
  };
  res.status(200).json(body);
}
