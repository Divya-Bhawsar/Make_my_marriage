// Make My Marriage — Structured Server Logger with Secret Redaction

import { env } from '../env';

const SENSITIVE_KEYS = [
  'password',
  'token',
  'tokenHash',
  'session',
  'secret',
  'authorization',
  'cookie',
  'uploadUrl',
  'apiKey',
  'key',
];

function sanitize(data: unknown): unknown {
  if (data === null || data === undefined) return data;
  if (typeof data === 'string') return data;
  if (typeof data !== 'object') return data;

  if (Array.isArray(data)) {
    return data.map((item) => sanitize(item));
  }

  const sanitized: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    const isSensitive = SENSITIVE_KEYS.some((sensitiveKey) =>
      key.toLowerCase().includes(sensitiveKey.toLowerCase())
    );

    if (isSensitive) {
      sanitized[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      sanitized[key] = sanitize(value);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

export interface LogContext {
  requestId?: string;
  userId?: string;
  weddingId?: string;
  route?: string;
  [key: string]: unknown;
}

export const logger = {
  info(message: string, context?: LogContext) {
    const payload = {
      level: 'INFO',
      timestamp: new Date().toISOString(),
      message,
      ...(context ? { context: sanitize(context) } : {}),
    };

    if (env.NODE_ENV === 'production') {
      console.log(JSON.stringify(payload));
    } else {
      console.log(`[INFO] ${payload.timestamp} - ${message}`, context ? sanitize(context) : '');
    }
  },

  warn(message: string, context?: LogContext) {
    const payload = {
      level: 'WARN',
      timestamp: new Date().toISOString(),
      message,
      ...(context ? { context: sanitize(context) } : {}),
    };

    if (env.NODE_ENV === 'production') {
      console.warn(JSON.stringify(payload));
    } else {
      console.warn(`[WARN] ${payload.timestamp} - ${message}`, context ? sanitize(context) : '');
    }
  },

  error(message: string, error?: unknown, context?: LogContext) {
    const errorDetails =
      error instanceof Error
        ? { name: error.name, message: error.message, stack: env.NODE_ENV === 'development' ? error.stack : undefined }
        : error;

    const payload = {
      level: 'ERROR',
      timestamp: new Date().toISOString(),
      message,
      error: errorDetails,
      ...(context ? { context: sanitize(context) } : {}),
    };

    if (env.NODE_ENV === 'production') {
      console.error(JSON.stringify(payload));
    } else {
      console.error(`[ERROR] ${payload.timestamp} - ${message}`, error, context ? sanitize(context) : '');
    }
  },

  debug(message: string, context?: LogContext) {
    if (env.NODE_ENV === 'production') return;

    console.debug(`[DEBUG] ${new Date().toISOString()} - ${message}`, context ? sanitize(context) : '');
  },
};
