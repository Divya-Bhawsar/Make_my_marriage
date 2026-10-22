// Make My Marriage — Shared Domain Constants

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  MANAGER: 'MANAGER',
} as const;

export type UserRole = (typeof USER_ROLES)[keyof typeof USER_ROLES];

export const RSVP_STATUS = {
  PENDING: 'PENDING',
  ATTENDING: 'ATTENDING',
  NOT_ATTENDING: 'NOT_ATTENDING',
} as const;

export type RsvpStatus = (typeof RSVP_STATUS)[keyof typeof RSVP_STATUS];

export const GUEST_SIDE = {
  GROOM: 'GROOM',
  BRIDE: 'BRIDE',
  MUTUAL: 'MUTUAL',
} as const;

export type GuestSide = (typeof GUEST_SIDE)[keyof typeof GUEST_SIDE];

export const DIETARY_PREFERENCE = {
  ALL: 'ALL',
  PURE_VEG: 'PURE_VEG',
  JAIN: 'JAIN',
  NON_VEG: 'NON_VEG',
} as const;

export type DietaryPreference = (typeof DIETARY_PREFERENCE)[keyof typeof DIETARY_PREFERENCE];

export const TASK_STATUS = {
  TODO: 'TODO',
  IN_PROGRESS: 'IN_PROGRESS',
  COMPLETED: 'COMPLETED',
} as const;

export type TaskStatus = (typeof TASK_STATUS)[keyof typeof TASK_STATUS];

export const TASK_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
} as const;

export type TaskPriority = (typeof TASK_PRIORITY)[keyof typeof TASK_PRIORITY];

export const TASK_COMMITTEES = [
  'RITUALS_PUJA',
  'HOSPITALITY_LOGISTICS',
  'CATERING_HALWAI',
  'ATTIRE_JEWELLERY',
  'ENTERTAINMENT_MUSIC',
  'DECOR_FLORAL',
  'INVITATIONS_GIFTS',
  'GENERAL',
] as const;

export type TaskCommittee = (typeof TASK_COMMITTEES)[number];

export const STANDARD_EVENT_TYPES = [
  'ROKA',
  'ENGAGEMENT',
  'MEHENDI',
  'HALDI',
  'SANGEET',
  'COCKTAIL',
  'WEDDING',
  'RECEPTION',
  'CUSTOM',
] as const;

export type StandardEventType = (typeof STANDARD_EVENT_TYPES)[number];

export const DEFAULT_CURRENCY = 'INR' as const;

export const EXPENSE_CATEGORIES = [
  'VENUE',
  'CATERING',
  'PHOTOGRAPHY',
  'VIDEOGRAPHY',
  'DECORATION',
  'CLOTHING',
  'JEWELLERY',
  'ENTERTAINMENT',
  'INVITATIONS',
  'GIFTS',
  'TRAVEL',
  'MAKEUP',
  'OTHER',
] as const;

export type ExpenseCategory = (typeof EXPENSE_CATEGORIES)[number];

export const VENDOR_CATEGORIES = [
  'PHOTOGRAPHER',
  'VIDEOGRAPHER',
  'VENUE',
  'CATERER',
  'DECORATOR',
  'DJ',
  'MAKEUP_ARTIST',
  'MEHENDI_ARTIST',
  'PANDIT',
  'CHOREOGRAPHER',
  'FLORIST',
  'WEDDING_PLANNER',
  'TRANSPORT',
  'OTHER',
] as const;

export type VendorCategory = (typeof VENDOR_CATEGORIES)[number];

export const VENDOR_SOURCES = {
  MANUAL: 'MANUAL',
  GOOGLE_PLACES: 'GOOGLE_PLACES',
} as const;

export type VendorSource = (typeof VENDOR_SOURCES)[keyof typeof VENDOR_SOURCES];

export const PAYMENT_STATUS = {
  PENDING: 'PENDING',
  PARTIAL: 'PARTIAL',
  PAID: 'PAID',
} as const;

export type PaymentStatus = (typeof PAYMENT_STATUS)[keyof typeof PAYMENT_STATUS];

export const PAYER_SIDE = {
  GROOM: 'GROOM',
  BRIDE: 'BRIDE',
  SHARED: 'SHARED',
} as const;

export type PayerSide = (typeof PAYER_SIDE)[keyof typeof PAYER_SIDE];

export const SESSION_COOKIE_NAME = 'mmm_session' as const;

export const PAGINATION = {
  DEFAULT_PAGE: 1,
  DEFAULT_LIMIT: 20,
  MAX_LIMIT: 100,
} as const;

export const ERROR_CODES = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  UNAUTHENTICATED: 'UNAUTHENTICATED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_TOKEN: 'INVALID_TOKEN',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  RATE_LIMITED: 'RATE_LIMITED',
  UPLOAD_ERROR: 'UPLOAD_ERROR',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',

  // Business domain errors
  EMAIL_ALREADY_EXISTS: 'EMAIL_ALREADY_EXISTS',
  ALREADY_HAS_WEDDING: 'ALREADY_HAS_WEDDING',
  LAST_ADMIN: 'LAST_ADMIN',
  GUEST_LIMIT_EXCEEDED: 'GUEST_LIMIT_EXCEEDED',
  PARTY_SIZE_CHANGED: 'PARTY_SIZE_CHANGED',
  INVITATION_ALREADY_ACCEPTED: 'INVITATION_ALREADY_ACCEPTED',
  INVITATION_EMAIL_MISMATCH: 'INVITATION_EMAIL_MISMATCH',
} as const;

export type ErrorCode = (typeof ERROR_CODES)[keyof typeof ERROR_CODES];
