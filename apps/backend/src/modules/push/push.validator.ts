import { z } from 'zod';
import { RECIPIENT_TYPE } from '@brainwave/shared';

export const subscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
  keys: z.object({
    p256dh: z.string(),
    auth: z.string(),
  }),
});

export const unsubscribeSchema = z.object({
  endpoint: z.string().url('Invalid endpoint URL'),
});

export const sendPushSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  body: z.string().min(1, 'Body is required'),
  recipientType: z.enum([RECIPIENT_TYPE.SINGLE, RECIPIENT_TYPE.MULTIPLE, RECIPIENT_TYPE.GROUP, RECIPIENT_TYPE.ALL]),
  userIds: z.array(z.number()).optional(),
  groupIds: z.array(z.number()).optional(),
});

export type SubscribeInput = z.infer<typeof subscribeSchema>;
export type UnsubscribeInput = z.infer<typeof unsubscribeSchema>;
export type SendPushInput = z.infer<typeof sendPushSchema>;
