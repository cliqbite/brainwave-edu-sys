import { z } from 'zod';
import { MESSAGE_CHANNEL, RECIPIENT_TYPE } from '@brainwave/shared';

export const sendMessageSchema = z.object({
  body: z.object({
    messageBody: z.string().min(1, 'Message body is required'),
    channel: z.nativeEnum(MESSAGE_CHANNEL),
    recipientType: z.enum([RECIPIENT_TYPE.SINGLE, RECIPIENT_TYPE.MULTIPLE]),
    userIds: z.array(z.number()).min(1, 'At least one user ID is required'),
  }),
});

export const broadcastMessageSchema = z.object({
  body: z.object({
    messageBody: z.string().min(1, 'Message body is required'),
    channel: z.nativeEnum(MESSAGE_CHANNEL),
    recipientType: z.enum([RECIPIENT_TYPE.GROUP, RECIPIENT_TYPE.ALL]),
    groupIds: z.array(z.number()).optional(),
    title: z.string().optional(),
  }),
});

export type SendMessageInput = z.infer<typeof sendMessageSchema>['body'];
export type BroadcastMessageInput = z.infer<typeof broadcastMessageSchema>['body'];
