import type { Request, Response } from 'express';
import * as rolesService from './roles.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function list(_req: Request, res: Response): Promise<void> {
  const roles = await rolesService.list();
  sendSuccess(res, roles, 'Roles retrieved');
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const role = await rolesService.getById(id);
  sendSuccess(res, role, 'Role retrieved');
}
