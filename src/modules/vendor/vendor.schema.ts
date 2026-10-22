import { z } from 'zod';
import {
  VENDOR_CATEGORIES,
  VENDOR_SOURCES,
  PAGINATION,
} from '@/shared/constants';
import {
  objectIdSchema,
  phoneStringSchema,
  optionalNormalizedEmailSchema,
} from '@/shared/validators/common';
import { rupeesToPaise } from '@/shared/utils/currency';

export const vendorCategorySchema = z.enum(VENDOR_CATEGORIES);
export const vendorSourceSchema = z.enum([
  VENDOR_SOURCES.MANUAL,
  VENDOR_SOURCES.GOOGLE_PLACES,
]);

export const createVendorSchema = z
  .object({
    name: z
      .string()
      .trim()
      .min(1, 'Vendor name is required')
      .max(100, 'Vendor name must not exceed 100 characters'),
    category: vendorCategorySchema.optional().default('OTHER'),
    contactPerson: z
      .string()
      .trim()
      .max(100, 'Contact person must not exceed 100 characters')
      .optional()
      .nullable(),
    phone: phoneStringSchema,
    email: optionalNormalizedEmailSchema,
    address: z
      .string()
      .trim()
      .max(300, 'Address must not exceed 300 characters')
      .optional()
      .nullable(),
    website: z
      .string()
      .trim()
      .max(200, 'Website must not exceed 200 characters')
      .optional()
      .nullable(),
    totalAgreedCost: z
      .number({ invalid_type_error: 'Total agreed cost must be a number' })
      .nonnegative('Total agreed cost cannot be negative')
      .max(1000000000, 'Cost cannot exceed ₹100 Crore')
      .optional()
      .nullable(),
    totalAgreedCostPaise: z
      .number()
      .int()
      .nonnegative()
      .optional()
      .nullable(),
    eventIds: z.array(objectIdSchema).optional().default([]),
    notes: z
      .string()
      .trim()
      .max(1000, 'Notes must not exceed 1000 characters')
      .optional()
      .nullable(),
    source: vendorSourceSchema.optional().default('MANUAL'),
    googlePlaceId: z
      .string()
      .trim()
      .max(100)
      .optional()
      .nullable(),
    rating: z.number().min(0).max(5).optional().nullable(),
    userRatingsTotal: z.number().int().nonnegative().optional().nullable(),
  })
  .transform((data) => {
    let resolvedPaise = data.totalAgreedCostPaise;
    if (resolvedPaise === undefined && data.totalAgreedCost !== undefined && data.totalAgreedCost !== null) {
      resolvedPaise = rupeesToPaise(data.totalAgreedCost);
    }
    return {
      ...data,
      totalAgreedCostPaise: resolvedPaise ?? null,
      contactPerson: data.contactPerson || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      website: data.website || null,
      notes: data.notes || null,
      googlePlaceId: data.googlePlaceId || null,
      rating: data.rating ?? null,
      userRatingsTotal: data.userRatingsTotal ?? null,
    };
  });

export type CreateVendorInput = z.input<typeof createVendorSchema>;
export type CreateVendorOutput = z.output<typeof createVendorSchema>;

export const updateVendorSchema = z
  .object({
    name: z.string().trim().min(1).max(100).optional(),
    category: vendorCategorySchema.optional(),
    contactPerson: z.string().trim().max(100).optional().nullable(),
    phone: phoneStringSchema,
    email: optionalNormalizedEmailSchema,
    address: z.string().trim().max(300).optional().nullable(),
    website: z.string().trim().max(200).optional().nullable(),
    totalAgreedCost: z
      .number()
      .nonnegative()
      .max(1000000000)
      .optional()
      .nullable(),
    totalAgreedCostPaise: z.number().int().nonnegative().optional().nullable(),
    eventIds: z.array(objectIdSchema).optional(),
    notes: z.string().trim().max(1000).optional().nullable(),
    googlePlaceId: z.string().trim().max(100).optional().nullable(),
    archivedAt: z
      .string()
      .datetime({ offset: true })
      .optional()
      .nullable(),
  })
  .transform((data) => {
    const transformed: Record<string, unknown> = { ...data };
    if (data.totalAgreedCost !== undefined) {
      transformed.totalAgreedCostPaise =
        data.totalAgreedCost !== null ? rupeesToPaise(data.totalAgreedCost) : null;
    }
    return transformed;
  });

export type UpdateVendorInput = z.input<typeof updateVendorSchema>;

export const createFromPlaceSchema = z
  .object({
    googlePlaceId: z.string().trim().min(1, 'Google Place ID is required'),
    name: z.string().trim().min(1).max(100).optional(),
    category: vendorCategorySchema.optional().default('OTHER'),
    contactPerson: z.string().trim().max(100).optional().nullable(),
    phone: phoneStringSchema,
    email: optionalNormalizedEmailSchema,
    address: z.string().trim().max(300).optional().nullable(),
    website: z.string().trim().max(200).optional().nullable(),
    totalAgreedCost: z.number().nonnegative().optional().nullable(),
    totalAgreedCostPaise: z.number().int().nonnegative().optional().nullable(),
    eventIds: z.array(objectIdSchema).optional().default([]),
    notes: z.string().trim().max(1000).optional().nullable(),
    rating: z.number().min(0).max(5).optional().nullable(),
    userRatingsTotal: z.number().int().nonnegative().optional().nullable(),
  })
  .transform((data) => {
    let resolvedPaise = data.totalAgreedCostPaise;
    if (resolvedPaise === undefined && data.totalAgreedCost !== undefined && data.totalAgreedCost !== null) {
      resolvedPaise = rupeesToPaise(data.totalAgreedCost);
    }
    return {
      ...data,
      totalAgreedCostPaise: resolvedPaise ?? null,
      source: 'GOOGLE_PLACES' as const,
      contactPerson: data.contactPerson || null,
      phone: data.phone || null,
      email: data.email || null,
      address: data.address || null,
      website: data.website || null,
      notes: data.notes || null,
      rating: data.rating ?? null,
      userRatingsTotal: data.userRatingsTotal ?? null,
    };
  });

export type CreateFromPlaceInput = z.input<typeof createFromPlaceSchema>;

export const queryVendorsSchema = z.object({
  page: z.coerce
    .number()
    .int()
    .min(1)
    .default(PAGINATION.DEFAULT_PAGE),
  limit: z.coerce
    .number()
    .int()
    .min(1)
    .max(PAGINATION.MAX_LIMIT)
    .default(PAGINATION.DEFAULT_LIMIT),
  search: z.string().trim().optional(),
  category: vendorCategorySchema.optional(),
  includeArchived: z
    .preprocess((val) => {
      if (typeof val === 'string') return val === 'true' || val === '1';
      return Boolean(val);
    }, z.boolean())
    .optional()
    .default(false),
});

export type QueryVendorsFilter = z.infer<typeof queryVendorsSchema>;

export const discoverySearchSchema = z.object({
  category: z.string().trim().optional(),
  query: z.string().trim().optional(),
  latitude: z.coerce.number().optional(),
  longitude: z.coerce.number().optional(),
  limit: z.coerce.number().int().min(1).max(50).default(20),
});

export type DiscoverySearchFilter = z.infer<typeof discoverySearchSchema>;
