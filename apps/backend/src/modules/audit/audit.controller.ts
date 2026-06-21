import { Request, Response } from 'express';
import { sendPaginated } from '../../utils/response.js';
import * as auditService from './audit.service.js';
import { parsePaginationQuery } from '../../utils/pagination.js';

export async function getLogs(req: Request, res: Response) {
  const query = {
    ...parsePaginationQuery(req.query),
    module: req.query.module as string,
    action: req.query.action as string,
    userId: req.query.userId as string,
  };
  
  const result = await auditService.getLogs(query);
  sendPaginated(res, result.logs, result.meta, 'Audit logs retrieved successfully');
}
