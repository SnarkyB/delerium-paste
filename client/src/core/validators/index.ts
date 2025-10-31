/**
 * Validators module public API
 * Privacy-preserving validation without content analysis
 */

/**
 * Validation result for privacy-preserving checks
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Maximum content size in bytes (1MB)
 */
export const MAX_CONTENT_SIZE = 1024 * 1024;

/**
 * Maximum expiration time in minutes (7 days)
 */
export const MAX_EXPIRATION_MINUTES = 7 * 24 * 60;

/**
 * Minimum expiration time in minutes (1 minute)
 */
export const MIN_EXPIRATION_MINUTES = 1;

/**
 * Maximum view count
 */
export const MAX_VIEW_COUNT = 100;

/**
 * Minimum view count
 */
export const MIN_VIEW_COUNT = 1;

/**
 * Minimum password length
 */
export const MIN_PASSWORD_LENGTH = 8;

/**
 * Maximum password length
 */
export const MAX_PASSWORD_LENGTH = 128;

/**
 * Validate content size without reading content
 * 
 * @param content The content to validate
 * @returns Validation result
 */
export function validateContentSize(content: string): ValidationResult {
  const errors: string[] = [];
  
  // Check if content is empty
  if (!content || content.length === 0) {
    errors.push("Content cannot be empty");
  }
  
  // Check content size (using UTF-8 byte length approximation)
  const byteLength = new TextEncoder().encode(content).length;
  if (byteLength > MAX_CONTENT_SIZE) {
    errors.push(`Content too large (${Math.round(byteLength / 1024)}KB, max ${Math.round(MAX_CONTENT_SIZE / 1024)}KB)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate expiration time without analyzing content
 * 
 * @param minutes Expiration time in minutes
 * @returns Validation result
 */
export function validateExpiration(minutes: number): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(minutes) || minutes < MIN_EXPIRATION_MINUTES) {
    errors.push(`Expiration must be at least ${MIN_EXPIRATION_MINUTES} minute(s)`);
  }
  
  if (minutes > MAX_EXPIRATION_MINUTES) {
    errors.push(`Expiration cannot exceed ${MAX_EXPIRATION_MINUTES} minutes (7 days)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate view count without analyzing content
 * 
 * @param views Maximum number of views
 * @returns Validation result
 */
export function validateViewCount(views: number): ValidationResult {
  const errors: string[] = [];
  
  if (!Number.isInteger(views) || views < 1) {
    errors.push("View count must be at least 1");
  }
  
  if (views > 100) {
    errors.push("View count cannot exceed 100");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Validate password strength
 * 
 * @param password Password to validate
 * @returns Validation result
 */
export function validatePassword(password: string): ValidationResult {
  const errors: string[] = [];
  
  if (!password || password.length < 8) {
    errors.push("Password must be at least 8 characters long");
  }
  
  if (password.length > 128) {
    errors.push("Password cannot exceed 128 characters");
  }
  
  // Check for common weak passwords (without storing them)
  const commonPatterns = [
    /^password$/i,
    /^12345678$/,
    /^qwerty$/i,
    /^admin$/i,
    /^letmein$/i
  ];
  
  if (commonPatterns.some(pattern => pattern.test(password))) {
    errors.push("Password is too common. Please choose a stronger password.");
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Check if string is valid UTF-8 without reading content
 * 
 * @param str String to check
 * @returns True if valid UTF-8
 */
export function isValidUTF8(str: string): boolean {
  try {
    // Try to encode and decode - if it fails, it's not valid UTF-8
    const encoded = new TextEncoder().encode(str);
    const decoded = new TextDecoder('utf-8', { fatal: true }).decode(encoded);
    return decoded === str;
  } catch {
    return false;
  }
}
