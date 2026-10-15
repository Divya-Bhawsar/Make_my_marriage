// Make My Marriage — Application Error Hierarchy

import { ERROR_CODES, ErrorCode } from '../constants';

export class AppError extends Error {
  public readonly code: ErrorCode;
  public readonly statusCode: number;
  public readonly details?: Record<string, string>;

  constructor(message: string, code: ErrorCode = ERROR_CODES.INTERNAL_ERROR, statusCode: number = 500, details?: Record<string, string>) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;

    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, this.constructor);
    }
  }

  public toResponse() {
    return {
      error: {
        code: this.code,
        message: this.message,
        ...(this.details ? { details: this.details } : {}),
      },
    };
  }
}

export class ValidationError extends AppError {
  constructor(message: string = 'Invalid request data', details?: Record<string, string>) {
    super(message, ERROR_CODES.VALIDATION_ERROR, 400, details);
  }
}

export class UnauthenticatedError extends AppError {
  constructor(message: string = 'Authentication required') {
    super(message, ERROR_CODES.UNAUTHENTICATED, 401);
  }
}

export class ForbiddenError extends AppError {
  constructor(message: string = 'Insufficient permissions to perform this action') {
    super(message, ERROR_CODES.FORBIDDEN, 403);
  }
}

export class NotFoundError extends AppError {
  constructor(message: string = 'Resource not found') {
    super(message, ERROR_CODES.NOT_FOUND, 404);
  }
}

export class ConflictError extends AppError {
  constructor(message: string, code: ErrorCode = ERROR_CODES.CONFLICT) {
    super(message, code, 409);
  }
}

export class RateLimitedError extends AppError {
  constructor(message: string = 'Too many requests. Please try again later.') {
    super(message, ERROR_CODES.RATE_LIMITED, 429);
  }
}

export class ExternalServiceError extends AppError {
  constructor(message: string = 'External service is temporarily unavailable') {
    super(message, ERROR_CODES.EXTERNAL_SERVICE_ERROR, 502);
  }
}

export class InternalError extends AppError {
  constructor(message: string = 'An unexpected internal error occurred') {
    super(message, ERROR_CODES.INTERNAL_ERROR, 500);
  }
}
