import { z } from 'zod';
import { GUEST_SIDE, RSVP_STATUS } from '@/shared/constants';

export const BROADCAST_TEMPLATES = {
  RSVP_REMINDER: 'RSVP_REMINDER',
  CEREMONY_ITINERARY: 'CEREMONY_ITINERARY',
  PHOTO_VAULT: 'PHOTO_VAULT',
  VIRTUAL_LIVESTREAM: 'VIRTUAL_LIVESTREAM',
  CUSTOM: 'CUSTOM',
} as const;

export type BroadcastTemplateType =
  (typeof BROADCAST_TEMPLATES)[keyof typeof BROADCAST_TEMPLATES];

export const queryRecipientsSchema = z.object({
  template: z.nativeEnum(BROADCAST_TEMPLATES).default(BROADCAST_TEMPLATES.RSVP_REMINDER),
  rsvpStatus: z.enum([RSVP_STATUS.PENDING, RSVP_STATUS.ATTENDING, RSVP_STATUS.NOT_ATTENDING, 'ALL']).default('ALL'),
  side: z.enum([GUEST_SIDE.GROOM, GUEST_SIDE.BRIDE, GUEST_SIDE.MUTUAL, 'ALL']).default('ALL'),
  eventId: z.string().optional(),
  customMessage: z.string().max(2000).optional(),
});

export type QueryRecipientsInput = z.infer<typeof queryRecipientsSchema>;
