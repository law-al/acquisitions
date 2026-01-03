import { z } from 'zod';

export const userIdSchema = z.object({
  id: z.coerce.number().int().positive(),
});

export const updateUserSchema = z.object({
  name: z.string().min(1).max(255).trim().optional(),
  email: z.string().email().trim().optional(),
  password: z.string().min(8).max(255).trim().optional(),
  role: z.enum(['admin', 'user']).optional(),
});
