import { describe, it, expect } from 'vitest';
import {
  AppError,
  ValidationError,
  UnauthenticatedError,
  ForbiddenError,
  NotFoundError,
  ConflictError,
  RateLimitedError,
  InternalError,
} from './app-error';
import { handleApiError } from './error-handler';
import { z, ZodError } from 'zod';

describe('AppError Hierarchy', () => {
  it('creates an AppError with default internal server error status', () => {
    const error = new AppError('Something broke');
    expect(error.message).toBe('Something broke');
    expect(error.statusCode).toBe(500);
    expect(error.code).toBe('INTERNAL_ERROR');
    expect(error.toResponse()).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'Something broke',
      },
    });
  });

  it('creates a ValidationError with code 400 and details', () => {
    const details = { email: 'Invalid email' };
    const error = new ValidationError('Validation failed', details);
    expect(error.statusCode).toBe(400);
    expect(error.code).toBe('VALIDATION_ERROR');
    expect(error.toResponse()).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Validation failed',
        details: { email: 'Invalid email' },
      },
    });
  });

  it('creates an UnauthenticatedError with code 401', () => {
    const error = new UnauthenticatedError();
    expect(error.statusCode).toBe(401);
    expect(error.code).toBe('UNAUTHENTICATED');
  });

  it('creates a ForbiddenError with code 403', () => {
    const error = new ForbiddenError();
    expect(error.statusCode).toBe(403);
    expect(error.code).toBe('FORBIDDEN');
  });

  it('creates a NotFoundError with code 404', () => {
    const error = new NotFoundError('Event not found');
    expect(error.statusCode).toBe(404);
    expect(error.code).toBe('NOT_FOUND');
    expect(error.message).toBe('Event not found');
  });

  it('creates a ConflictError with code 409', () => {
    const error = new ConflictError('Wedding already exists', 'ALREADY_HAS_WEDDING');
    expect(error.statusCode).toBe(409);
    expect(error.code).toBe('ALREADY_HAS_WEDDING');
  });

  it('creates a RateLimitedError with code 429', () => {
    const error = new RateLimitedError();
    expect(error.statusCode).toBe(429);
    expect(error.code).toBe('RATE_LIMITED');
  });
});

describe('handleApiError', () => {
  it('handles AppError and returns correct JSON response and status', async () => {
    const error = new NotFoundError('Task not found');
    const response = handleApiError(error);
    expect(response.status).toBe(404);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'NOT_FOUND',
        message: 'Task not found',
      },
    });
  });

  it('handles ZodError and formats as ValidationError with 400', async () => {
    const schema = z.object({
      email: z.string().email(),
    });

    let zodErr: ZodError | null = null;
    try {
      schema.parse({ email: 'not-an-email' });
    } catch (err) {
      zodErr = err as ZodError;
    }

    expect(zodErr).not.toBeNull();
    const response = handleApiError(zodErr);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body.error.code).toBe('VALIDATION_ERROR');
    expect(body.error.details).toBeDefined();
    expect(body.error.details.email).toBeDefined();
  });

  it('handles SyntaxError as 400 ValidationError', async () => {
    const syntaxError = new SyntaxError('Unexpected token in JSON');
    const response = handleApiError(syntaxError);
    expect(response.status).toBe(400);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'VALIDATION_ERROR',
        message: 'Malformed JSON request body',
      },
    });
  });

  it('handles generic unhandled error as 500 without leaking stack traces', async () => {
    const genericError = new Error('Database connection crashed');
    const response = handleApiError(genericError);
    expect(response.status).toBe(500);
    const body = await response.json();
    expect(body).toEqual({
      error: {
        code: 'INTERNAL_ERROR',
        message: 'An unexpected internal error occurred',
      },
    });
  });
});
