import { describe, it, expect } from 'vitest';
import {
  paiseToRupees,
  rupeesToPaise,
  formatRupees,
  formatCompactRupees,
} from './currency';

describe('Currency Utilities', () => {
  describe('paiseToRupees', () => {
    it('converts integer paise to rupees correctly', () => {
      expect(paiseToRupees(15000000)).toBe(150000);
      expect(paiseToRupees(100)).toBe(1);
      expect(paiseToRupees(50)).toBe(0.5);
      expect(paiseToRupees(0)).toBe(0);
      expect(paiseToRupees(NaN)).toBe(0);
    });
  });

  describe('rupeesToPaise', () => {
    it('converts rupees to integer paise without floating point inaccuracy', () => {
      expect(rupeesToPaise(150000)).toBe(15000000);
      expect(rupeesToPaise(1.99)).toBe(199);
      expect(rupeesToPaise(0.5)).toBe(50);
      expect(rupeesToPaise(0)).toBe(0);
    });
  });

  describe('formatRupees', () => {
    it('formats paise as Indian Rupee string', () => {
      expect(formatRupees(15000000)).toBe('₹1,50,000');
      expect(formatRupees(0)).toBe('₹0');
    });
  });

  describe('formatCompactRupees', () => {
    it('formats large wedding amounts with Indian Lakhs and Crores abbreviations', () => {
      expect(formatCompactRupees(15000000)).toBe('₹1.5 L');
      expect(formatCompactRupees(100000000)).toBe('₹10 L');
      expect(formatCompactRupees(1250000000)).toBe('₹1.25 Cr');
      expect(formatCompactRupees(5000000)).toBe('₹50 K');
      expect(formatCompactRupees(0)).toBe('₹0');
    });
  });
});
