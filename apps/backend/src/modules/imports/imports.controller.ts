import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import * as importsService from './imports.service.js';
import { parsePaginationQuery } from '../../utils/pagination.js';
import { ValidationError } from '../../utils/errors.js';

export async function importUsers(req: Request, res: Response) {
  if (!req.file) {
    throw new ValidationError('No file uploaded');
  }

  const result = await importsService.importUsers(req.file, req.body.groupIds, req.user!.id);
  sendSuccess(res, result, 'Import completed', 201);
}

export async function getHistory(req: Request, res: Response) {
  const query = parsePaginationQuery(req.query);
  const result = await importsService.getHistory(query);
  sendPaginated(res, result.batches, result.meta, 'Import history retrieved successfully');
}

export async function getBatchDetails(req: Request, res: Response) {
  const batch = await importsService.getBatchDetails(Number(req.params.id));
  sendSuccess(res, batch, 'Import batch retrieved successfully');
}
