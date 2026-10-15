// Make My Marriage — Shared Zod Validation Schemas

import { z } from 'zod';
import { PAGINATION } from '../constants';

export const objectIdSchema = z
  .string()
  .trim()
  .regex(/^[0-9a-fA-F]{24}$/, 'Invalid ObjectId format');

export const normalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email('Invalid email address')
  .max(254, 'Email must not exceed 254 characters');

export const optionalNormalizedEmailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .max(254, 'Email must not exceed 254 characters')
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val))
  .refine((val) => val === null || val === undefined || z.string().email().safeParse(val).success, {
    message: 'Invalid email address',
  });

export const dateOnlyStringSchema = z
  .string()
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be in YYYY-MM-DD format');

export const isoDateTimeStringSchema = z
  .string()
  .trim()
  .datetime({ message: 'Must be a valid ISO 8601 date-time string with timezone offset' });

export const phoneStringSchema = z
  .string()
  .trim()
  .max(40, 'Phone number must not exceed 40 characters')
  .regex(/^[\d\s\+\-\(\)]*$/, 'Phone number contains invalid characters')
  .optional()
  .nullable()
  .transform((val) => (val === '' ? null : val));

export const paginationQuerySchema = z.object({
  page: z.coerce
    .number()
    .int('Page must be an integer')
    .min(1, 'Page must be at least 1')
    .max(100000, 'Page exceeds maximum allowed')
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(PAGINATION.MAX_LIMIT, `Limit must not exceed ${PAGINATION.MAX_LIMIT}`)
    .default(PAGINATION.DEFAULT_LIMIT),
});

export const cursorPaginationQuerySchema = z.object({
  cursor: z.string().trim().optional(),
  limit: z.coerce
    .number()
    .int('Limit must be an integer')
    .min(1, 'Limit must be at least 1')
    .max(50, 'Limit must not exceed 50')
    .default(20),
});
