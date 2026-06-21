import type { Request, Response } from 'express';
import * as permissionsService from './permissions.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function list(_req: Request, res: Response): Promise<void> {
  const permissions = await permissionsService.list();
  sendSuccess(res, permissions, 'Permissions retrieved');
}

export async function getUserPermissions(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const result = await permissionsService.getUserPermissions(userId);
  sendSuccess(res, result, 'User permissions retrieved');
}

export async function setUserPermissions(req: Request, res: Response): Promise<void> {
  const userId = Number(req.params.userId);
  const { permissions } = req.body;
  const result = await permissionsService.setUserPermissions(
    userId,
    permissions,
    req.user!.id,
  );
  sendSuccess(res, result, 'User permissions updated');
}
