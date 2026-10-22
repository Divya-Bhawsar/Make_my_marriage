/**
 * Indian Rupee & Paise Minor Unit Utilities
 *
 * All financial amounts in Make My Marriage are stored as integer paise
 * (1 Rupee = 100 Paise) to eliminate floating-point rounding errors.
 */

/**
 * Converts integer paise to rupees.
 * Example: 15000000 -> 150000
 */
export function paiseToRupees(paise: number): number {
  if (!Number.isFinite(paise)) return 0;
  return paise / 100;
}

/**
 * Converts rupees to integer paise.
 * Safely rounds to the nearest integer to prevent precision loss.
 * Example: 150000.50 -> 15000050
 */
export function rupeesToPaise(rupees: number): number {
  if (!Number.isFinite(rupees)) return 0;
  return Math.round(rupees * 100);
}

/**
 * Formats integer paise into a standard Indian numbering system currency string.
 * Example: 15000000 -> "₹1,50,000"
 */
export function formatRupees(paise: number): string {
  if (!Number.isFinite(paise)) return '₹0';
  const rupees = paise / 100;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: paise % 100 === 0 ? 0 : 2,
  }).format(rupees);
}

/**
 * Formats integer paise into an abbreviated Indian notation (K, L, Cr).
 * Example: 15000000 (1.5 Lakh) -> "₹1.5L"
 * Example: 125000000 (1.25 Crore) -> "₹1.25 Cr"
 */
export function formatCompactRupees(paise: number): string {
  if (!Number.isFinite(paise) || paise === 0) return '₹0';
  const rupees = Math.abs(paise / 100);
  const sign = paise < 0 ? '-' : '';

  if (rupees >= 10000000) {
    const cr = rupees / 10000000;
    return `${sign}₹${parseFloat(cr.toFixed(2))} Cr`;
  }
  if (rupees >= 100000) {
    const l = rupees / 100000;
    return `${sign}₹${parseFloat(l.toFixed(2))} L`;
  }
  if (rupees >= 1000) {
    const k = rupees / 1000;
    return `${sign}₹${parseFloat(k.toFixed(1))} K`;
  }

  return formatRupees(paise);
}
