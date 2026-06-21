import type { Request, Response } from 'express';
import * as authService from './auth.service.js';
import { sendSuccess } from '../../utils/response.js';

export async function register(req: Request, res: Response): Promise<void> {
  const user = await authService.register(req.body);
  sendSuccess(res, user, 'Registration successful', 201);
}

export async function login(req: Request, res: Response): Promise<void> {
  const { email, password } = req.body;
  const meta = {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };

  const result = await authService.login(email, password, meta);
  sendSuccess(res, result, 'Login successful');
}

export async function refreshToken(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  const meta = {
    ipAddress: req.ip,
    userAgent: req.get('user-agent'),
  };

  const result = await authService.refreshToken(token, meta);
  sendSuccess(res, result, 'Token refreshed');
}

export async function logout(req: Request, res: Response): Promise<void> {
  const { refreshToken: token } = req.body;
  if (token) {
    await authService.logout(token);
  }
  sendSuccess(res, undefined, 'Logged out successfully');
}

export async function me(req: Request, res: Response): Promise<void> {
  const user = await authService.getMe(req.user!.id);
  sendSuccess(res, user, 'User profile retrieved');
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  await authService.changePassword(req.user!.id, req.body);
  sendSuccess(res, null, 'Password changed successfully');
}
