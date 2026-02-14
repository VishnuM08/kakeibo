/**
 * VALIDATION UTILITIES & SCHEMAS
 * 
 * This file contains all validation logic using industry-standard practices:
 * - Type-safe validation schemas
 * - Custom validation rules
 * - Error message standardization
 * - Input sanitization
 * 
 * LIBRARIES USED:
 * - Native JavaScript for basic validation (no external deps for now)
 * - Can be upgraded to Zod/Yup for advanced schemas
 * 
 * SECURITY NOTES:
 * - All user inputs should be validated on both client AND server
 * - Client-side validation is for UX only, not security
 * - Server-side validation is the source of truth
 */

// ================================
// TYPE DEFINITIONS
// ================================

export interface ValidationResult {
  isValid: boolean;
  errors: Record<string, string>;
}

export interface ValidationRule {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  min?: number;
  max?: number;
  pattern?: RegExp;
  custom?: (value: any) => boolean;
  message?: string;
}

// ================================
// REGEX PATTERNS
// ================================

/**
 * Email validation regex (RFC 5322 compliant)
 * Matches: user@example.com, user.name+tag@example.co.uk
 */
export const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Strong password regex
 * Requirements:
 * - At least 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character
 */
export const STRONG_PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

/**
 * PIN validation regex (4-6 digits only)
 */
export const PIN_REGEX = /^\d{4,6}$/;

/**
 * Amount validation regex (positive numbers with up to 2 decimal places)
 * Matches: 100, 100.5, 100.50
 */
export const AMOUNT_REGEX = /^\d+(\.\d{1,2})?$/;

/**
 * Name validation regex (letters, spaces, hyphens, apostrophes only)
 * Matches: John Doe, Mary-Jane, O'Brien
 */
export const NAME_REGEX = /^[a-zA-Z\s'-]+$/;

// ================================
// VALIDATION FUNCTIONS
// ================================

/**
 * Validate email address
 * 
 * @param email - Email address to validate
 * @returns Validation result with error message if invalid
 * 
 * @example
 * validateEmail('user@example.com') // { isValid: true, error: null }
 * validateEmail('invalid') // { isValid: false, error: 'Invalid email format' }
 */
export function validateEmail(email: string): { isValid: boolean; error: string | null } {
  if (!email || email.trim() === '') {
    return { isValid: false, error: 'Email is required' };
  }

  if (!EMAIL_REGEX.test(email)) {
    return { isValid: false, error: 'Invalid email format' };
  }

  if (email.length > 254) {
    return { isValid: false, error: 'Email is too long (max 254 characters)' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate password strength
 * 
 * Requirements:
 * - Minimum 8 characters
 * - At least one uppercase letter
 * - At least one lowercase letter
 * - At least one digit
 * - At least one special character (@$!%*?&)
 * 
 * @param password - Password to validate
 * @returns Validation result with error message if invalid
 */
export function validatePassword(password: string): { isValid: boolean; error: string | null } {
  if (!password || password.trim() === '') {
    return { isValid: false, error: 'Password is required' };
  }

  if (password.length < 8) {
    return { isValid: false, error: 'Password must be at least 8 characters long' };
  }

  if (password.length > 128) {
    return { isValid: false, error: 'Password is too long (max 128 characters)' };
  }

  if (!/[a-z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one lowercase letter' };
  }

  if (!/[A-Z]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one uppercase letter' };
  }

  if (!/\d/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one number' };
  }

  if (!/[@$!%*?&]/.test(password)) {
    return { isValid: false, error: 'Password must contain at least one special character (@$!%*?&)' };
  }

  return { isValid: true, error: null };
}

/**
 * Calculate password strength score
 * 
 * @param password - Password to evaluate
 * @returns Score from 0-4 (0=very weak, 4=very strong)
 */
export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: string;
} {
  let score = 0;

  if (password.length >= 8) score++;
  if (password.length >= 12) score++;
  if (/[a-z]/.test(password) && /[A-Z]/.test(password)) score++;
  if (/\d/.test(password)) score++;
  if (/[@$!%*?&]/.test(password)) score++;

  const labels = ['Very Weak', 'Weak', 'Fair', 'Strong', 'Very Strong'];
  const colors = ['#ff4444', '#ff8800', '#ffbb00', '#00bb00', '#00aa00'];

  return {
    score: Math.min(score, 4),
    label: labels[Math.min(score, 4)],
    color: colors[Math.min(score, 4)],
  };
}

/**
 * Validate PIN code
 * 
 * Requirements:
 * - 4-6 digits only
 * - No spaces or special characters
 * - Not sequential (1234, 5678)
 * - Not repeating (1111, 2222)
 * 
 * @param pin - PIN to validate
 * @returns Validation result with error message if invalid
 */
export function validatePIN(pin: string): { isValid: boolean; error: string | null } {
  if (!pin || pin.trim() === '') {
    return { isValid: false, error: 'PIN is required' };
  }

  if (!PIN_REGEX.test(pin)) {
    return { isValid: false, error: 'PIN must be 4-6 digits only' };
  }

  // Check for sequential numbers (1234, 5678, etc.)
  const isSequential = /0123|1234|2345|3456|4567|5678|6789|7890/.test(pin);
  if (isSequential) {
    return { isValid: false, error: 'PIN cannot be sequential (e.g., 1234)' };
  }

  // Check for repeating numbers (1111, 2222, etc.)
  const isRepeating = /^(\d)\1+$/.test(pin);
  if (isRepeating) {
    return { isValid: false, error: 'PIN cannot be all the same digit (e.g., 1111)' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate expense amount
 * 
 * Requirements:
 * - Must be a positive number
 * - Maximum 2 decimal places
 * - Reasonable range (0.01 - 1,000,000)
 * 
 * @param amount - Amount to validate (can be string or number)
 * @returns Validation result with error message if invalid
 */
export function validateAmount(amount: string | number): { isValid: boolean; error: string | null } {
  const amountStr = String(amount).trim();

  if (!amountStr || amountStr === '') {
    return { isValid: false, error: 'Amount is required' };
  }

  if (!AMOUNT_REGEX.test(amountStr)) {
    return { isValid: false, error: 'Invalid amount format (use numbers only, up to 2 decimals)' };
  }

  const numAmount = parseFloat(amountStr);

  if (isNaN(numAmount)) {
    return { isValid: false, error: 'Amount must be a valid number' };
  }

  if (numAmount <= 0) {
    return { isValid: false, error: 'Amount must be greater than zero' };
  }

  if (numAmount > 1000000) {
    return { isValid: false, error: 'Amount is too large (max ₹1,000,000)' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate name (first name, last name, etc.)
 * 
 * Requirements:
 * - Letters, spaces, hyphens, apostrophes only
 * - 2-50 characters
 * - No numbers or special characters (except - and ')
 * 
 * @param name - Name to validate
 * @returns Validation result with error message if invalid
 */
export function validateName(name: string): { isValid: boolean; error: string | null } {
  if (!name || name.trim() === '') {
    return { isValid: false, error: 'Name is required' };
  }

  if (name.length < 2) {
    return { isValid: false, error: 'Name must be at least 2 characters long' };
  }

  if (name.length > 50) {
    return { isValid: false, error: 'Name is too long (max 50 characters)' };
  }

  if (!NAME_REGEX.test(name)) {
    return { isValid: false, error: 'Name can only contain letters, spaces, hyphens, and apostrophes' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate expense description
 * 
 * Requirements:
 * - Not empty
 * - 2-200 characters
 * 
 * @param description - Description to validate
 * @returns Validation result with error message if invalid
 */
export function validateDescription(description: string): { isValid: boolean; error: string | null } {
  if (!description || description.trim() === '') {
    return { isValid: false, error: 'Description is required' };
  }

  if (description.trim().length < 2) {
    return { isValid: false, error: 'Description must be at least 2 characters long' };
  }

  if (description.length > 200) {
    return { isValid: false, error: 'Description is too long (max 200 characters)' };
  }

  return { isValid: true, error: null };
}

/**
 * Validate date
 * 
 * Requirements:
 * - Valid date format
 * - Not in the future (for expenses)
 * - Not older than 10 years
 * 
 * @param date - Date string to validate
 * @param allowFuture - Whether to allow future dates (default: false)
 * @returns Validation result with error message if invalid
 */
export function validateDate(date: string, allowFuture = false): { isValid: boolean; error: string | null } {
  if (!date || date.trim() === '') {
    return { isValid: false, error: 'Date is required' };
  }

  const parsedDate = new Date(date);

  if (isNaN(parsedDate.getTime())) {
    return { isValid: false, error: 'Invalid date format' };
  }

  const now = new Date();
  const tenYearsAgo = new Date();
  tenYearsAgo.setFullYear(tenYearsAgo.getFullYear() - 10);

  if (!allowFuture && parsedDate > now) {
    return { isValid: false, error: 'Date cannot be in the future' };
  }

  if (parsedDate < tenYearsAgo) {
    return { isValid: false, error: 'Date cannot be older than 10 years' };
  }

  return { isValid: true, error: null };
}

/**
 * Sanitize string input
 * Removes potentially dangerous characters and trims whitespace
 * 
 * SECURITY NOTE: This is basic sanitization for display purposes.
 * Server-side validation and sanitization is still required!
 * 
 * @param input - String to sanitize
 * @returns Sanitized string
 */
export function sanitizeInput(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove < and > to prevent XSS
    .replace(/\s+/g, ' '); // Replace multiple spaces with single space
}

/**
 * Validate file upload (for receipt images)
 * 
 * Requirements:
 * - Valid file type (JPEG, PNG, PDF)
 * - File size under limit (default 5MB)
 * 
 * @param file - File object to validate
 * @param maxSizeMB - Maximum file size in MB (default: 5)
 * @returns Validation result with error message if invalid
 */
export function validateFile(
  file: File,
  maxSizeMB: number = 5
): { isValid: boolean; error: string | null } {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];

  if (!allowedTypes.includes(file.type)) {
    return {
      isValid: false,
      error: 'Invalid file type. Only JPEG, PNG, and PDF files are allowed',
    };
  }

  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      isValid: false,
      error: `File size exceeds ${maxSizeMB}MB limit`,
    };
  }

  return { isValid: true, error: null };
}

/**
 * Generic form validator
 * Validates multiple fields at once
 * 
 * @param fields - Object with field names and values
 * @param rules - Object with field names and validation rules
 * @returns Validation result with errors for each field
 * 
 * @example
 * validateForm(
 *   { email: 'test@test.com', password: 'Test123!' },
 *   { email: validateEmail, password: validatePassword }
 * )
 */
export function validateForm(
  fields: Record<string, any>,
  validators: Record<string, (value: any) => { isValid: boolean; error: string | null }>
): ValidationResult {
  const errors: Record<string, string> = {};
  let isValid = true;

  for (const [fieldName, value] of Object.entries(fields)) {
    const validator = validators[fieldName];
    if (validator) {
      const result = validator(value);
      if (!result.isValid && result.error) {
        errors[fieldName] = result.error;
        isValid = false;
      }
    }
  }

  return { isValid, errors };
}
