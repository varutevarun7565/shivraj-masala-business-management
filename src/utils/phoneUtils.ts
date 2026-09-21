// ============================================================
// Phone Validation & WhatsApp Message Utilities
// For Indian phone numbers and wa.me URL generation
// ============================================================

import type { Language } from '../i18n/translations';

export interface PhoneValidationResult {
  valid: boolean;
  /** Cleaned 10-digit number, e.g. '9876543210' */
  normalized: string;
  /** International format for wa.me, e.g. '919876543210' */
  international: string;
  /** Human-readable error when valid is false */
  error?: string;
}

/**
 * Validates and normalises an Indian phone number.
 *
 * Accepts:
 *   9876543210, 09876543210, +919876543210, 919876543210,
 *   98765 43210, 98765-43210, +91-98765-43210, etc.
 *
 * The function is designed so that a separate `whatsappPhone` field
 * can be added later — just pass whichever string the caller has.
 */
export function validateIndianPhone(raw: string): PhoneValidationResult {
  const empty: PhoneValidationResult = { valid: false, normalized: '', international: '', error: '' };

  if (!raw || typeof raw !== 'string') {
    return { ...empty, error: 'Phone number is missing.' };
  }

  // Strip whitespace, hyphens, dots, parentheses, plus sign
  let cleaned = raw.replace(/[\s\-.()+]/g, '');

  // Remove leading country code variants: 91, 091, 0091
  if (cleaned.startsWith('0091')) cleaned = cleaned.slice(4);
  else if (cleaned.startsWith('091')) cleaned = cleaned.slice(3);
  else if (cleaned.startsWith('91') && cleaned.length > 10) cleaned = cleaned.slice(2);
  else if (cleaned.startsWith('0') && cleaned.length === 11) cleaned = cleaned.slice(1);

  // Must be exactly 10 digits
  if (!/^\d{10}$/.test(cleaned)) {
    return { ...empty, error: 'Phone number must be 10 digits.' };
  }

  // Indian mobile numbers start with 6, 7, 8, or 9
  if (!/^[6-9]/.test(cleaned)) {
    return { ...empty, error: 'Invalid Indian mobile number.' };
  }

  return {
    valid: true,
    normalized: cleaned,
    international: `91${cleaned}`,
  };
}

/**
 * Builds a short, professional WhatsApp message for invoice sharing.
 * Supports English and Marathi.
 *
 * The message deliberately does NOT claim the PDF is attached,
 * because wa.me links cannot auto-attach files.
 */
export function buildWhatsAppMessage(invoiceNo: string, customerName: string, total: number, language: Language): string {
  const amount = `Rs. ${Number(total || 0).toFixed(2)}`;
  if (language === 'mr') {
    return [
      `नमस्कार ${customerName || 'ग्राहक'},`,
      `शिवराज मसाला येथे खरेदी केल्याबद्दल धन्यवाद.`,
      `बिल क्र.: ${invoiceNo}`,
      `एकूण रक्कम: ${amount}`,
      `कृपया सोबतचे बिल PDF पहा.`,
      `धन्यवाद!`,
      `चव आहे, तर नातं आहे !`,
    ].join('\n');
  }

  return [
    `Namaskar ${customerName || 'Customer'},`,
    `Thank you for shopping with Shivraj Masala.`,
    `Invoice No: ${invoiceNo}`,
    `Total Amount: ${amount}`,
    `Please see the invoice PDF shared with this message.`,
    `Thank you!`,
    `Chav aahe, tar naata aahe!`,
  ].join('\n');
}
