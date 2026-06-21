import { Request, Response } from 'express';
import { sendSuccess } from '../../utils/response.js';
import * as pushService from './push.service.js';

export async function subscribe(req: Request, res: Response) {
  const result = await pushService.subscribe(req.user!.id, req.body, req.headers['user-agent']);
  sendSuccess(res, { id: result.id }, 'Subscribed successfully', 201);
}

export async function unsubscribe(req: Request, res: Response) {
  await pushService.unsubscribe(req.user!.id, req.body.endpoint);
  sendSuccess(res, null, 'Unsubscribed successfully');
}

export async function send(req: Request, res: Response) {
  const result = await pushService.send(req.body, req.user!.id);
  sendSuccess(res, result, 'Push notification queued successfully', 201);
}

export async function getSubscriptions(req: Request, res: Response) {
  const result = await pushService.getSubscriptions(req.user!.id);
  sendSuccess(res, result, 'Subscriptions retrieved successfully');
}

export async function getNotifications(req: Request, res: Response) {
  const result = await pushService.getUserNotifications(req.user!.id);
  sendSuccess(res, result, 'Notifications retrieved successfully');
}

export async function markAsReadInApp(req: Request, res: Response) {
  await pushService.markAsReadInApp(Number(req.params.id), req.user!.id);
  sendSuccess(res, null, 'Marked as read');
}

export async function markAsReadPush(req: Request, res: Response) {
  await pushService.markAsReadPush(Number(req.params.id), req.user!.id);
  sendSuccess(res, null, 'Marked as read (push)');
}

export async function markAllAsReadInApp(req: Request, res: Response) {
  await pushService.markAllAsReadInApp(req.user!.id);
  sendSuccess(res, null, 'All marked as read');
}
