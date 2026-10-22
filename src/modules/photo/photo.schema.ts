import { z } from 'zod';

export const updateGallerySettingsSchema = z.object({
  isEnabled: z.boolean().optional(),
  guestUploadsEnabled: z.boolean().optional(),
  regenerateToken: z.boolean().optional(),
});

export type UpdateGallerySettingsInput = z.infer<typeof updateGallerySettingsSchema>;

export const queryPhotosSchema = z.object({
  eventId: z.string().optional().nullable(),
  limit: z.coerce.number().min(1).max(100).default(30),
  cursor: z.string().optional().nullable(),
});

export type QueryPhotosInput = z.infer<typeof queryPhotosSchema>;

export const uploadGuestPhotoMetadataSchema = z.object({
  eventId: z.string().optional().nullable(),
  caption: z.string().max(500).optional().nullable(),
  uploaderName: z.string().max(100).optional().nullable(),
});

export type UploadGuestPhotoMetadataInput = z.infer<typeof uploadGuestPhotoMetadataSchema>;
