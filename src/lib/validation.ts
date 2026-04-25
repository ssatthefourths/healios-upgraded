/**
 * Validation utilities for checkout and form handling
 * Includes country-aware postal code validation, input sanitization, and security checks
 */

import { z } from 'zod';

// ==================================
// COUNTRY-AWARE POSTAL CODE VALIDATION
// ==================================

interface PostalCodeConfig {
  label: string;
  placeholder: string;
  regex: RegExp | null; // null = accept any non-empty value
  example: string;
}

const POSTAL_CODE_CONFIGS: Record<string, PostalCodeConfig> = {
  'United Kingdom': {
    label: 'Postcode',
    placeholder: 'SW1A 1AA',
    regex: /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i,
    example: 'SW1A 1AA',
  },
  'South Africa': {
    label: 'Postal Code',
    placeholder: '2000',
    regex: /^\d{4}$/,
    example: '2000',
  },
  'United States': {
    label: 'ZIP Code',
    placeholder: '10001',
    regex: /^\d{5}(-\d{4})?$/,
    example: '10001',
  },
  'Canada': {
    label: 'Postal Code',
    placeholder: 'K1A 0B1',
    regex: /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/i,
    example: 'K1A 0B1',
  },
  'Australia': {
    label: 'Postcode',
    placeholder: '2000',
    regex: /^\d{4}$/,
    example: '2000',
  },
  'Cyprus': {
    label: 'Postal Code',
    placeholder: '1000',
    regex: /^\d{4}$/,
    example: '1000',
  },
};

const DEFAULT_POSTAL_CONFIG: PostalCodeConfig = {
  label: 'Postal Code',
  placeholder: '',
  regex: null,
  example: '',
};

export const getPostalCodeConfig = (country: string): PostalCodeConfig =>
  POSTAL_CODE_CONFIGS[country] ?? DEFAULT_POSTAL_CONFIG;

export const isValidPostalCode = (code: string, country: string): boolean => {
  if (!code || !code.trim()) return false;
  const config = getPostalCodeConfig(country);
  if (!config.regex) return true; // any non-empty value accepted
  return config.regex.test(code.trim());
};

export const getPostalCodeError = (code: string, country: string): string | null => {
  if (!code || !code.trim()) return `${getPostalCodeConfig(country).label} is required`;
  if (!isValidPostalCode(code, country)) {
    const config = getPostalCodeConfig(country);
    return config.example
      ? `Please enter a valid ${config.label.toLowerCase()} (e.g., ${config.example})`
      : `Please enter a valid ${config.label.toLowerCase()}`;
  }
  return null;
};

// Legacy UK-only exports — kept for backward compatibility
const UK_POSTCODE_REGEX = /^([A-Z]{1,2}\d[A-Z\d]? ?\d[A-Z]{2}|GIR ?0A{2})$/i;

export const isValidUKPostcode = (postcode: string): boolean => {
  if (!postcode) return false;
  return UK_POSTCODE_REGEX.test(postcode.trim().toUpperCase());
};

export const formatUKPostcode = (postcode: string): string => {
  if (!postcode) return '';
  const cleaned = postcode.replace(/\s+/g, '').toUpperCase();
  if (cleaned.length > 3) return `${cleaned.slice(0, -3)} ${cleaned.slice(-3)}`;
  return cleaned;
};

export const getPostcodeError = (postcode: string): string | null => {
  if (!postcode) return "Postcode is required";
  if (!isValidUKPostcode(postcode)) return "Please enter a valid UK postcode (e.g., SW1A 1AA)";
  return null;
};

// ==================================
// INPUT SANITIZATION
// ==================================

// Dangerous patterns to remove
const DANGEROUS_PATTERNS = [
  /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, // Script tags
  /<[^>]*>/g, // All HTML tags
  /javascript:/gi, // JavaScript URLs
  /on\w+\s*=/gi, // Event handlers (onclick, onload, etc.)
  /data:/gi, // Data URLs
  /vbscript:/gi, // VBScript URLs
  /expression\s*\(/gi, // CSS expressions
  /url\s*\(/gi, // CSS url() - potential vector
  /\\x[0-9a-f]{2}/gi, // Hex escape sequences
  /\\u[0-9a-f]{4}/gi, // Unicode escape sequences
];

/**
 * Strips potentially dangerous HTML/script content from input
 * Prevents XSS attacks while preserving legitimate text
 * 
 * @param input - The string to sanitize
 * @param maxLength - Maximum allowed length (default 1000)
 * @returns Sanitized string safe for display
 */
export const sanitizeInput = (input: string, maxLength: number = 1000): string => {
  if (!input) return '';
  
  let sanitized = input;
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Encode special characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;');
  
  // Trim and limit length
  return sanitized.trim().slice(0, maxLength);
};

/**
 * Sanitizes input but preserves quotes for names (doesn't encode them)
 * Use for name fields where apostrophes are common (O'Brien, etc.)
 */
export const sanitizeNameInput = (input: string, maxLength: number = 100): string => {
  if (!input) return '';
  
  let sanitized = input;
  
  // Remove dangerous patterns
  for (const pattern of DANGEROUS_PATTERNS) {
    sanitized = sanitized.replace(pattern, '');
  }
  
  // Only encode angle brackets (keep quotes for names)
  sanitized = sanitized
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  
  // Remove any remaining suspicious characters
  sanitized = sanitized.replace(/[<>{}[\]\\]/g, '');
  
  return sanitized.trim().slice(0, maxLength);
};

/**
 * Sanitizes an object's string values
 * @param obj - Object with string values to sanitize
 * @returns Object with sanitized string values
 */
export const sanitizeFormData = <T extends Record<string, unknown>>(obj: T): T => {
  const sanitized = { ...obj };
  
  for (const key in sanitized) {
    const value = sanitized[key];
    if (typeof value === 'string') {
      (sanitized as Record<string, unknown>)[key] = sanitizeInput(value);
    }
  }
  
  return sanitized;
};

// ==================================
// EMAIL VALIDATION
// ==================================

/**
 * Validates email format with comprehensive regex
 * @param email - Email to validate
 * @returns true if valid email format
 */
export const isValidEmail = (email: string): boolean => {
  if (!email || email.length > 254) return false;
  
  // More comprehensive email regex
  const emailRegex = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
  return emailRegex.test(email);
};

// ==================================
// PHONE VALIDATION (UK)
// ==================================

/**
 * Validates UK phone number format
 * Accepts formats like: 07123456789, +447123456789, 0207 123 4567
 * @param phone - Phone number to validate
 * @returns true if valid UK phone format
 */
export const isValidUKPhone = (phone: string): boolean => {
  if (!phone) return true; // Phone is optional

  // Remove spaces and dashes
  const cleaned = phone.replace(/[\s-]/g, '');

  // UK mobile or landline
  const ukPhoneRegex = /^(\+44|0)[1-9]\d{8,10}$/;
  return ukPhoneRegex.test(cleaned);
};

/**
 * International phone validator. Accepts the format produced by PhoneInput
 * ("+<dial> <local>") for any country, plus tolerates legacy UK-only inputs
 * that haven't been migrated to PhoneInput yet.
 *
 * Returns true on empty input (phone is optional in our forms).
 *
 * Used by checkout (ticket #9, v3 CSV) so a SA / EU / US visitor can submit a
 * non-UK number without being blocked by the old isValidUKPhone gate.
 */
export const isValidInternationalPhone = (phone: string): boolean => {
  if (!phone) return true;
  const cleaned = phone.replace(/[\s\-().]/g, '');
  // Accept either "+<dialCode><local>" (E.164-ish, 7-15 digits after the +)
  // OR a legacy bare UK number for backwards compatibility.
  if (/^\+\d{7,15}$/.test(cleaned)) return true;
  return isValidUKPhone(phone);
};

/**
 * Formats UK phone number to standard format
 */
export const formatUKPhone = (phone: string): string => {
  if (!phone) return '';
  
  // Remove all non-digits except leading +
  let cleaned = phone.replace(/[^\d+]/g, '');
  
  // Convert +44 to 0
  if (cleaned.startsWith('+44')) {
    cleaned = '0' + cleaned.slice(3);
  }
  
  return cleaned;
};

// ==================================
// ZOD SCHEMAS FOR CHECKOUT
// ==================================

export const customerDetailsSchema = z.object({
  email: z.string()
    .trim()
    .min(1, "Email is required")
    .max(254, "Email is too long")
    .email("Invalid email address"),
  firstName: z.string()
    .trim()
    .min(1, "First name is required")
    .max(50, "First name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "First name contains invalid characters"),
  lastName: z.string()
    .trim()
    .min(1, "Last name is required")
    .max(50, "Last name is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "Last name contains invalid characters"),
  phone: z.string()
    .trim()
    .max(20, "Phone number is too long")
    .optional()
    .refine(
      (val) => !val || isValidUKPhone(val),
      "Invalid UK phone number"
    ),
});

export const addressSchema = z.object({
  address: z.string()
    .trim()
    .min(1, "Address is required")
    .max(200, "Address is too long"),
  city: z.string()
    .trim()
    .min(1, "City is required")
    .max(100, "City is too long")
    .regex(/^[a-zA-Z\s'-]+$/, "City contains invalid characters"),
  postalCode: z.string()
    .trim()
    .min(1, "Postal code is required")
    .max(10, "Postal code is too long"),
  country: z.string()
    .trim()
    .min(1, "Country is required")
    .max(100, "Country is too long"),
});

export const checkoutFormSchema = z.object({
  customerDetails: customerDetailsSchema,
  shippingAddress: addressSchema,
  billingAddress: addressSchema.optional(),
});

/**
 * Validates checkout form data using Zod schema
 * @returns Object with success boolean and either data or error messages
 */
export const validateCheckoutForm = (data: unknown): {
  success: boolean;
  data?: z.infer<typeof checkoutFormSchema>;
  errors?: string[];
} => {
  try {
    const result = checkoutFormSchema.parse(data);
    return { success: true, data: result };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return {
        success: false,
        errors: error.errors.map(e => e.message),
      };
    }
    return { success: false, errors: ["Validation failed"] };
  }
};

// ==================================
// DISCOUNT CODE VALIDATION
// ==================================

/**
 * Validates discount code format
 * Only alphanumeric and common separators allowed
 */
export const sanitizeDiscountCode = (code: string): string => {
  if (!code) return '';
  
  // Only allow alphanumeric, dash, underscore
  return code
    .toUpperCase()
    .replace(/[^A-Z0-9\-_]/g, '')
    .slice(0, 30);
};
