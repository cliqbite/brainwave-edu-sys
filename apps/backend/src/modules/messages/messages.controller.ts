import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import * as messagesService from './messages.service.js';
import { parsePaginationQuery } from '../../utils/pagination.js';

export async function send(req: Request, res: Response) {
  const result = await messagesService.send(req.body, req.user!.id);
  sendSuccess(res, result, 'Message queued successfully', 201);
}

export async function broadcast(req: Request, res: Response) {
  const result = await messagesService.broadcast(req.body, req.user!.id);
  sendSuccess(res, result, 'Broadcast queued successfully', 201);
}

export async function getCampaigns(req: Request, res: Response) {
  const query = parsePaginationQuery(req.query);
  const result = await messagesService.getCampaigns(query);
  sendPaginated(res, result.campaigns, result.meta, 'Campaigns retrieved successfully');
}

export async function getCampaignById(req: Request, res: Response) {
  const campaign = await messagesService.getCampaignById(Number(req.params.id));
  sendSuccess(res, campaign, 'Campaign retrieved successfully');
}

export async function getCampaignRecipients(req: Request, res: Response) {
  const query = parsePaginationQuery(req.query);
  const result = await messagesService.getCampaignRecipients(Number(req.params.id), query);
  sendPaginated(res, result.recipients, result.meta, 'Recipients retrieved successfully');
}
