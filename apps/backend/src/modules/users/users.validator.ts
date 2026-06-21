import { z } from 'zod';

export const createUserSchema = z.object({
  body: z.object({
    name: z
      .string({ required_error: 'Name is required' })
      .min(2, 'Name must be at least 2 characters')
      .max(255)
      .trim(),
    email: z
      .string({ required_error: 'Email is required' })
      .email('Invalid email address')
      .max(255)
      .transform((v) => v.toLowerCase().trim()),
    password: z
      .string({ required_error: 'Password is required' })
      .min(6, 'Password must be at least 6 characters')
      .max(128),
    phone: z.string().max(20).optional(),
    whatsappNumber: z.string().max(20).optional(),
    rollNumber: z.string().max(50).optional(),
    department: z.string().max(100).optional(),
    className: z.string().max(50).optional(),
    roleId: z.number().int().positive().optional(),
    groupIds: z.array(z.number().int().positive()).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(255).trim().optional(),
    email: z
      .string()
      .email('Invalid email address')
      .max(255)
      .transform((v) => v.toLowerCase().trim())
      .optional(),
    phone: z.string().max(20).nullable().optional(),
    whatsappNumber: z.string().max(20).nullable().optional(),
    rollNumber: z.string().max(50).nullable().optional(),
    department: z.string().max(100).nullable().optional(),
    className: z.string().max(50).nullable().optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
    roleId: z.number().int().positive().optional(),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
  }),
});
export const resetPasswordSchema = z.object({
  body: z.object({
    password: z.string().min(6, 'Password must be at least 6 characters').max(128),
  }),
  params: z.object({
    id: z.string().regex(/^\d+$/, 'Invalid user ID').transform(Number),
  }),
});

export const userQuerySchema = z.object({
  query: z.object({
    page: z.string().regex(/^\d+$/).transform(Number).optional(),
    limit: z.string().regex(/^\d+$/).transform(Number).optional(),
    search: z.string().max(255).optional(),
    sortBy: z.string().max(50).optional(),
    sortOrder: z.enum(['asc', 'desc']).optional(),
    roleId: z.string().regex(/^\d+$/).transform(Number).optional(),
    status: z.enum(['ACTIVE', 'INACTIVE', 'SUSPENDED']).optional(),
  }),
});

export type CreateUserInput = z.infer<typeof createUserSchema>['body'];
export type UpdateUserInput = z.infer<typeof updateUserSchema>['body'];
export type UserQueryInput = z.infer<typeof userQuerySchema>['query'];
