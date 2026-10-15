import { describe, it, expect } from 'vitest';
import {
  objectIdSchema,
  normalizedEmailSchema,
  optionalNormalizedEmailSchema,
  dateOnlyStringSchema,
  isoDateTimeStringSchema,
  phoneStringSchema,
  paginationQuerySchema,
} from './common';

describe('Common Validators', () => {
  describe('objectIdSchema', () => {
    it('accepts valid 24-character hexadecimal ObjectId', () => {
      const validId = '507f1f77bcf86cd799439011';
      expect(objectIdSchema.parse(validId)).toBe(validId);
    });

    it('rejects invalid ObjectId strings', () => {
      expect(() => objectIdSchema.parse('invalid-id')).toThrow();
      expect(() => objectIdSchema.parse('507f1f77bcf86cd79943901')).toThrow(); // 23 chars
      expect(() => objectIdSchema.parse('507f1f77bcf86cd799439011z')).toThrow(); // non-hex
    });
  });

  describe('normalizedEmailSchema', () => {
    it('trims and lowercases valid email addresses', () => {
      const email = '  Akshay.Saini@Example.COM  ';
      expect(normalizedEmailSchema.parse(email)).toBe('akshay.saini@example.com');
    });

    it('rejects malformed email addresses', () => {
      expect(() => normalizedEmailSchema.parse('not-an-email')).toThrow();
      expect(() => normalizedEmailSchema.parse('@missinguser.com')).toThrow();
    });
  });

  describe('optionalNormalizedEmailSchema', () => {
    it('normalizes empty strings to null', () => {
      expect(optionalNormalizedEmailSchema.parse('')).toBeNull();
      expect(optionalNormalizedEmailSchema.parse('   ')).toBeNull();
      expect(optionalNormalizedEmailSchema.parse(null)).toBeNull();
      expect(optionalNormalizedEmailSchema.parse(undefined)).toBeUndefined();
    });

    it('accepts valid email', () => {
      expect(optionalNormalizedEmailSchema.parse('guest@example.com')).toBe('guest@example.com');
    });
  });

  describe('dateOnlyStringSchema', () => {
    it('accepts YYYY-MM-DD date strings', () => {
      expect(dateOnlyStringSchema.parse('2027-02-14')).toBe('2027-02-14');
    });

    it('rejects non YYYY-MM-DD date formats', () => {
      expect(() => dateOnlyStringSchema.parse('14-02-2027')).toThrow();
      expect(() => dateOnlyStringSchema.parse('2027/02/14')).toThrow();
    });
  });

  describe('isoDateTimeStringSchema', () => {
    it('accepts valid ISO 8601 date-time strings with UTC Z or offset', () => {
      const isoUtc = '2027-02-12T10:30:00.000Z';
      expect(isoDateTimeStringSchema.parse(isoUtc)).toBe(isoUtc);
    });

    it('rejects plain date strings without time', () => {
      expect(() => isoDateTimeStringSchema.parse('2027-02-12')).toThrow();
    });
  });

  describe('phoneStringSchema', () => {
    it('accepts valid phone numbers with plus and dashes', () => {
      expect(phoneStringSchema.parse('+91 98765-43210')).toBe('+91 98765-43210');
    });

    it('converts empty string to null', () => {
      expect(phoneStringSchema.parse('')).toBeNull();
    });
  });

  describe('paginationQuerySchema', () => {
    it('applies default pagination values if omitted', () => {
      const parsed = paginationQuerySchema.parse({});
      expect(parsed).toEqual({ page: 1, limit: 20 });
    });

    it('coerces string query parameters into numbers', () => {
      const parsed = paginationQuerySchema.parse({ page: '3', limit: '50' });
      expect(parsed).toEqual({ page: 3, limit: 50 });
    });

    it('enforces maximum limit cap of 100', () => {
      expect(() => paginationQuerySchema.parse({ limit: '101' })).toThrow();
    });

    it('enforces minimum page of 1', () => {
      expect(() => paginationQuerySchema.parse({ page: '0' })).toThrow();
    });
  });
});
