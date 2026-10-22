import { z } from 'zod';
import { dateOnlyStringSchema } from '@/shared/validators/common';

export const locationSchema = z.object({
  formattedAddress: z.string().trim().max(500).optional().nullable(),
  city: z.string().trim().max(100).optional().nullable(),
  state: z.string().trim().max(100).optional().nullable(),
  country: z.string().trim().max(100).optional().nullable(),
  latitude: z.number().min(-90).max(90).optional().nullable(),
  longitude: z.number().min(-180).max(180).optional().nullable(),
  googlePlaceId: z.string().trim().max(255).optional().nullable(),
});

export const createWeddingSchema = z.object({
  brideName: z
    .string()
    .trim()
    .min(1, 'Bride name is required')
    .max(100, 'Bride name must not exceed 100 characters'),
  groomName: z
    .string()
    .trim()
    .min(1, 'Groom name is required')
    .max(100, 'Groom name must not exceed 100 characters'),
  weddingDate: dateOnlyStringSchema,
  title: z.string().trim().max(200, 'Title must not exceed 200 characters').optional().nullable(),
  description: z
    .string()
    .trim()
    .max(2000, 'Description must not exceed 2000 characters')
    .optional()
    .nullable(),
  timeZone: z.string().trim().default('Asia/Kolkata'),
  location: locationSchema.optional().nullable(),
});

export type CreateWeddingInput = z.infer<typeof createWeddingSchema>;

export const updateWeddingSchema = z.object({
  brideName: z.string().trim().min(1).max(100).optional(),
  groomName: z.string().trim().min(1).max(100).optional(),
  weddingDate: dateOnlyStringSchema.optional(),
  title: z.string().trim().max(200).optional().nullable(),
  description: z.string().trim().max(2000).optional().nullable(),
  timeZone: z.string().trim().optional(),
  location: locationSchema.optional().nullable(),
});

export type UpdateWeddingInput = z.infer<typeof updateWeddingSchema>;

export const updateWebsiteSchema = z.object({
  theme: z.string().trim().min(1).max(50).optional(),
  welcomeMessage: z.string().trim().max(2000).optional().nullable(),
  isPublished: z.boolean().optional(),
});

export type UpdateWebsiteInput = z.infer<typeof updateWebsiteSchema>;

export const updateLivestreamSchema = z.object({
  provider: z.enum(['YOUTUBE', 'GOOGLE_MEET']).optional(),
  youtubeUrl: z.string().trim().max(500).optional().nullable(),
  meetingUrl: z.string().trim().max(500).optional().nullable(),
  instructions: z.string().trim().max(1000).optional().nullable(),
  scheduledStartTime: z.string().trim().max(100).optional().nullable(),
  isEnabled: z.boolean().optional(),
});

export type UpdateLivestreamInput = z.infer<typeof updateLivestreamSchema>;
