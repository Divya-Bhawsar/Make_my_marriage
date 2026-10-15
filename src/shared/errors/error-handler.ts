// Make My Marriage — API Route Error Handler

import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { AppError, InternalError, ValidationError } from './app-error';

export function handleApiError(error: unknown): NextResponse {
  if (error instanceof AppError) {
    return NextResponse.json(error.toResponse(), { status: error.statusCode });
  }

  if (error instanceof ZodError) {
    const details: Record<string, string> = {};
    for (const issue of error.issues) {
      const field = issue.path.join('.') || 'root';
      details[field] = issue.message;
    }
    const validationError = new ValidationError('Invalid request parameters', details);
    return NextResponse.json(validationError.toResponse(), { status: validationError.statusCode });
  }

  if (error instanceof SyntaxError) {
    const validationError = new ValidationError('Malformed JSON request body');
    return NextResponse.json(validationError.toResponse(), { status: validationError.statusCode });
  }

  // Fallback for unhandled exceptions (never leak internal stack trace to clients)
  console.error('[UnhandledApiError]', error);
  const internalError = new InternalError();
  return NextResponse.json(internalError.toResponse(), { status: internalError.statusCode });
}
