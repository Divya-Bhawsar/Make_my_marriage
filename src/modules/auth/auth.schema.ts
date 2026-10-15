import { z } from 'zod';
import { normalizedEmailSchema } from '@/shared/validators/common';

export const signupSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Name is required')
    .max(120, 'Name must not exceed 120 characters'),
  email: normalizedEmailSchema,
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters long')
    .max(100, 'Password must not exceed 100 characters'),
});

export type SignupInput = z.infer<typeof signupSchema>;

export const loginSchema = z.object({
  email: normalizedEmailSchema,
  password: z.string().min(1, 'Password is required'),
});

export type LoginInput = z.infer<typeof loginSchema>;
