import { z } from 'zod';

export const importUsersSchema = z.object({
  groupIds: z.string().optional() // JSON string of array
});
