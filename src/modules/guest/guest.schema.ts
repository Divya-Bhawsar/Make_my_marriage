import { z } from 'zod';
import { GUEST_SIDE, DIETARY_PREFERENCE, RSVP_STATUS } from '@/shared/constants';

export const guestSideSchema = z.enum([GUEST_SIDE.GROOM, GUEST_SIDE.BRIDE, GUEST_SIDE.MUTUAL]);
export const dietaryPreferenceSchema = z.enum([
  DIETARY_PREFERENCE.ALL,
  DIETARY_PREFERENCE.PURE_VEG,
  DIETARY_PREFERENCE.JAIN,
  DIETARY_PREFERENCE.NON_VEG,
]);
export const rsvpStatusSchema = z.enum([
  RSVP_STATUS.PENDING,
  RSVP_STATUS.ATTENDING,
  RSVP_STATUS.NOT_ATTENDING,
]);

export const createGuestSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, 'Guest or family name is required')
    .max(120, 'Name must not exceed 120 characters'),
  email: z
    .string()
    .trim()
    .email('Invalid email address')
    .max(254)
    .optional()
    .nullable()
    .or(z.literal('')),
  phone: z
    .string()
    .trim()
    .max(40)
    .optional()
    .nullable()
    .or(z.literal('')),
  side: guestSideSchema.default(GUEST_SIDE.GROOM),
  dietary: dietaryPreferenceSchema.default(DIETARY_PREFERENCE.ALL),
  maxGuests: z.coerce
    .number()
    .int('Party capacity must be an integer')
    .min(1, 'Capacity must be at least 1')
    .max(10000, 'Capacity cannot exceed 10000')
    .default(1),
  invitedEventIds: z.array(z.string()).default([]),
  notes: z
    .string()
    .trim()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional()
    .nullable()
    .or(z.literal('')),
});

export type CreateGuestInput = z.input<typeof createGuestSchema>;
export type CreateGuestOutput = z.output<typeof createGuestSchema>;

export const updateGuestSchema = z.object({
  name: z.string().trim().min(1).max(120).optional(),
  email: z.string().trim().email().max(254).optional().nullable().or(z.literal('')),
  phone: z.string().trim().max(40).optional().nullable().or(z.literal('')),
  side: guestSideSchema.optional(),
  dietary: dietaryPreferenceSchema.optional(),
  maxGuests: z.coerce.number().int().min(1).max(10000).optional(),
  invitedEventIds: z.array(z.string()).optional(),
  rsvpStatus: rsvpStatusSchema.optional(),
  attendingCount: z.coerce.number().int().min(0).optional().nullable(),
  wishes: z.string().trim().max(1000).optional().nullable().or(z.literal('')),
  notes: z.string().trim().max(2000).optional().nullable().or(z.literal('')),
});

export type UpdateGuestInput = z.input<typeof updateGuestSchema>;

export const queryGuestsSchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  limit: z.coerce.number().int().min(1).max(100).default(50),
  search: z.string().trim().max(120).optional(),
  rsvpStatus: rsvpStatusSchema.optional(),
  side: guestSideSchema.optional(),
  eventId: z.string().optional(),
});

export type QueryGuestsInput = z.infer<typeof queryGuestsSchema>;

export const submitRsvpSchema = z
  .object({
    status: z.enum([RSVP_STATUS.ATTENDING, RSVP_STATUS.NOT_ATTENDING]),
    attendingCount: z.coerce.number().int().min(0),
    dietary: dietaryPreferenceSchema.optional(),
    wishes: z.string().trim().max(1000).optional().nullable(),
  })
  .refine(
    (data) => {
      if (data.status === RSVP_STATUS.ATTENDING) {
        return data.attendingCount >= 1;
      }
      return data.attendingCount === 0;
    },
    {
      message: 'Attending count must be at least 1 when attending, or 0 when not attending',
      path: ['attendingCount'],
    }
  );

export type SubmitRsvpInput = z.infer<typeof submitRsvpSchema>;
