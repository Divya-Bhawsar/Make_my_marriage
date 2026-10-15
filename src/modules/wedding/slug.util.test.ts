import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  normalizeNameForSlug,
  formatDateForSlug,
  buildBaseSlug,
  generateUniqueWeddingSlug,
} from './slug.util';
import { WeddingModel } from './wedding.model';

describe('Wedding Slug Utilities', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('normalizeNameForSlug', () => {
    it('normalizes simple names to lowercase', () => {
      expect(normalizeNameForSlug('Akshay')).toBe('akshay');
      expect(normalizeNameForSlug('Princi')).toBe('princi');
    });

    it('strips special characters and trims whitespace', () => {
      expect(normalizeNameForSlug('  Akshay Saini!  ')).toBe('akshay-saini');
      expect(normalizeNameForSlug('Princi & Sharma')).toBe('princi-sharma');
    });

    it('normalizes diacritics correctly', () => {
      expect(normalizeNameForSlug('Renée')).toBe('renee');
    });
  });

  describe('formatDateForSlug', () => {
    it('converts YYYY-MM-DD into DDMMYYYY format', () => {
      expect(formatDateForSlug('2027-02-14')).toBe('14022027');
      expect(formatDateForSlug('2026-11-05')).toBe('05112026');
    });
  });

  describe('buildBaseSlug', () => {
    it('constructs standard base slug format', () => {
      const slug = buildBaseSlug('Princi', 'Akshay', '2027-02-14');
      expect(slug).toBe('princi-akshay-14022027');
    });

    it('handles empty or unusual names with safe fallbacks', () => {
      const slug = buildBaseSlug('', '', '2027-02-14');
      expect(slug).toBe('bride-groom-14022027');
    });
  });

  describe('generateUniqueWeddingSlug', () => {
    it('returns base slug if no collision exists', async () => {
      vi.spyOn(WeddingModel, 'findOne').mockResolvedValue(null);

      const slug = await generateUniqueWeddingSlug('Princi', 'Akshay', '2027-02-14');
      expect(slug).toBe('princi-akshay-14022027');
    });

    it('appends incremented suffix on collision', async () => {
      // First call finds existing wedding, second call returns null
      vi.spyOn(WeddingModel, 'findOne')
        .mockResolvedValueOnce({ _id: 'existing-id' } as any)
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueWeddingSlug('Princi', 'Akshay', '2027-02-14');
      expect(slug).toBe('princi-akshay-14022027-2');
    });

    it('increments further if multiple collisions exist', async () => {
      vi.spyOn(WeddingModel, 'findOne')
        .mockResolvedValueOnce({ _id: '1' } as any)
        .mockResolvedValueOnce({ _id: '2' } as any)
        .mockResolvedValueOnce(null);

      const slug = await generateUniqueWeddingSlug('Princi', 'Akshay', '2027-02-14');
      expect(slug).toBe('princi-akshay-14022027-3');
    });
  });
});
