import { z } from 'zod';

export const signupSchema = z.object({
  name: z.string().min(1).max(255).trim(),
  email: z.string().email().trim(),
  password: z.string().min(8).max(255).trim(),
  role: z.enum(['admin', 'user']).default('user'),
});

export const signinSchema = z.object({
  email: z.string().email().toLowerCase().trim(),
  password: z.string().min(8).max(255).trim(),
});
