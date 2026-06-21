import { z } from 'zod';
import { GROUP_TYPE, GROUP_STATUS } from '@brainwave/shared';

export const createGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255),
    description: z.string().optional(),
    type: z.nativeEnum(GROUP_TYPE).optional(),
  })
});

export const updateGroupSchema = z.object({
  body: z.object({
    name: z.string().min(2, 'Name must be at least 2 characters').max(255).optional(),
    description: z.string().optional(),
    type: z.nativeEnum(GROUP_TYPE).optional(),
    status: z.nativeEnum(GROUP_STATUS).optional(),
  })
});

export const addUsersSchema = z.object({
  body: z.object({
    userIds: z.array(z.number()).min(1, 'At least one user ID is required'),
  })
});

export type CreateGroupInput = z.infer<typeof createGroupSchema>['body'];
export type UpdateGroupInput = z.infer<typeof updateGroupSchema>['body'];
export type AddUsersInput = z.infer<typeof addUsersSchema>['body'];
