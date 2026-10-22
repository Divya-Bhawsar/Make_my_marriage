import { z } from 'zod';
import { STANDARD_EVENT_TYPES } from '@/shared/constants';

export const eventTypeSchema = z.enum(STANDARD_EVENT_TYPES);

export const createEventSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Event name is required')
      .max(100, 'Event name must not exceed 100 characters'),
    type: eventTypeSchema.optional().default('CUSTOM'),
    startsAt: z
      .string()
      .datetime({ offset: true, message: 'startsAt must be a valid ISO 8601 datetime with timezone offset' }),
    endsAt: z
      .string()
      .datetime({ offset: true, message: 'endsAt must be a valid ISO 8601 datetime with timezone offset' })
      .optional()
      .nullable(),
    venueName: z.string().trim().max(100, 'Venue name must not exceed 100 characters').optional().nullable(),
    address: z.string().trim().max(500, 'Address must not exceed 500 characters').optional().nullable(),
    description: z
      .string()
      .trim()
      .max(2000, 'Description must not exceed 2000 characters')
      .optional()
      .nullable(),
    dressCode: z.string().trim().max(100, 'Dress code must not exceed 100 characters').optional().nullable(),
    coverImageObjectKey: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (!data.endsAt) return true;
      return new Date(data.endsAt) > new Date(data.startsAt);
    },
    {
      message: 'endsAt must be strictly after startsAt',
      path: ['endsAt'],
    }
  );

export type CreateEventInput = z.input<typeof createEventSchema>;
export type CreateEventOutput = z.output<typeof createEventSchema>;

export const updateEventSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    type: eventTypeSchema.optional(),
    startsAt: z
      .string()
      .datetime({ offset: true, message: 'startsAt must be a valid ISO 8601 datetime with timezone offset' })
      .optional(),
    endsAt: z
      .string()
      .datetime({ offset: true, message: 'endsAt must be a valid ISO 8601 datetime with timezone offset' })
      .optional()
      .nullable(),
    venueName: z.string().trim().max(100).optional().nullable(),
    address: z.string().trim().max(500).optional().nullable(),
    description: z.string().trim().max(2000).optional().nullable(),
    dressCode: z.string().trim().max(100).optional().nullable(),
    coverImageObjectKey: z.string().trim().max(500).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.startsAt && data.endsAt) {
        return new Date(data.endsAt) > new Date(data.startsAt);
      }
      return true;
    },
    {
      message: 'endsAt must be strictly after startsAt',
      path: ['endsAt'],
    }
  );

export type UpdateEventInput = z.infer<typeof updateEventSchema>;

export const queryEventsSchema = z.object({
  includeArchived: z
    .enum(['true', 'false'])
    .optional()
    .transform((val) => val === 'true'),
  from: z.string().datetime({ offset: true }).optional(),
  to: z.string().datetime({ offset: true }).optional(),
});

export type QueryEventsInput = z.infer<typeof queryEventsSchema>;
