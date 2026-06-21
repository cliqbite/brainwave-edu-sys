import type { Request, Response } from 'express';
import * as usersService from './users.service.js';
import { sendSuccess, sendPaginated } from '../../utils/response.js';

export async function list(req: Request, res: Response): Promise<void> {
  const { data, meta } = await usersService.list(req.query as Record<string, unknown>);
  sendPaginated(res, data, meta, 'Users retrieved');
}

export async function getById(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const user = await usersService.getById(id);
  sendSuccess(res, user, 'User retrieved');
}

export async function create(req: Request, res: Response): Promise<void> {
  const user = await usersService.create(req.body, req.user!.id);
  sendSuccess(res, user, 'User created', 201);
}

export async function update(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const user = await usersService.update(id, req.body, req.user!.id);
  sendSuccess(res, user, 'User updated');
}

export async function remove(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  await usersService.remove(id, req.user!.id);
  sendSuccess(res, undefined, 'User deleted');
}

export async function resetPassword(req: Request, res: Response): Promise<void> {
  const id = Number(req.params.id);
  const { password } = req.body;
  await usersService.resetPassword(id, password, req.user!.id);
  sendSuccess(res, undefined, 'Password reset successfully');
}
