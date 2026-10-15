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
