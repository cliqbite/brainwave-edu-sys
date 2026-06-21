import { Request, Response } from 'express';
import { sendSuccess, sendPaginated } from '../../utils/response.js';
import * as groupsService from './groups.service.js';
import { parsePaginationQuery } from '../../utils/pagination.js';

export async function listGroups(req: Request, res: Response) {
  const query = parsePaginationQuery(req.query);
  const result = await groupsService.listGroups(query);
  sendPaginated(res, result.groups, result.meta, 'Groups retrieved successfully');
}

export async function getGroupById(req: Request, res: Response) {
  const group = await groupsService.getGroupById(Number(req.params.id));
  sendSuccess(res, group, 'Group retrieved successfully');
}

export async function createGroup(req: Request, res: Response) {
  const group = await groupsService.createGroup(req.body, req.user!.id);
  sendSuccess(res, group, 'Group created successfully', 201);
}

export async function updateGroup(req: Request, res: Response) {
  const group = await groupsService.updateGroup(Number(req.params.id), req.body, req.user!.id);
  sendSuccess(res, group, 'Group updated successfully');
}

export async function deleteGroup(req: Request, res: Response) {
  await groupsService.deleteGroup(Number(req.params.id), req.user!.id);
  sendSuccess(res, null, 'Group deleted successfully');
}

export async function addUsersToGroup(req: Request, res: Response) {
  const result = await groupsService.addUsersToGroup(Number(req.params.id), req.body.userIds, req.user!.id);
  sendSuccess(res, result, 'Users added to group successfully');
}

export async function removeUserFromGroup(req: Request, res: Response) {
  await groupsService.removeUserFromGroup(Number(req.params.id), Number(req.params.userId), req.user!.id);
  sendSuccess(res, null, 'User removed from group successfully');
}
