/**
 * Phone number normalization utilities for WhatsApp messaging and contacts.
 */

/**
 * Normalizes phone numbers to a clean numeric international format for WhatsApp deep linking.
 * Removes all formatting characters (+, -, spaces, dots, parentheses).
 * Auto-prepends Indian country code (91) for 10-digit mobile numbers.
 */
export function normalizeWhatsAppPhone(phone?: string | null): string | null {
  if (!phone) return null;
  let digits = phone.replace(/\D/g, '');
  if (!digits) return null;

  // Handle leading zero: 09826012345 -> 919826012345
  if (digits.startsWith('0') && digits.length === 11) {
    digits = '91' + digits.slice(1);
  }

  // Standard 10-digit Indian mobile number
  if (digits.length === 10) {
    digits = '91' + digits;
  }

  return digits;
}

/**
 * Formats a phone number for display (e.g. +91 98260 12345)
 */
export function formatPhoneDisplay(phone?: string | null): string {
  if (!phone) return 'No phone';
  const clean = normalizeWhatsAppPhone(phone);
  if (!clean) return phone;

  if (clean.startsWith('91') && clean.length === 12) {
    return `+91 ${clean.slice(2, 7)} ${clean.slice(7)}`;
  }

  return `+${clean}`;
}
