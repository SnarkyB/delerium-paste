/**
 * Unit tests for core/validators module
 * 
 * Tests all validation functions including:
 * - Content size validation
 * - Expiration validation
 * - View count validation
 * - Password validation
 * - UTF-8 validation
 */

import {
  validateContentSize,
  validateExpiration,
  validateViewCount,
  validatePassword,
  isValidUTF8,
  MAX_CONTENT_SIZE,
  MAX_EXPIRATION_MINUTES,
  MIN_EXPIRATION_MINUTES,
  MAX_VIEW_COUNT,
  MIN_VIEW_COUNT,
  MIN_PASSWORD_LENGTH,
  MAX_PASSWORD_LENGTH
} from '../../../src/core/validators/index.js';

// ============================================================================
// CONTENT SIZE VALIDATION TESTS
// ============================================================================

describe('validateContentSize', () => {
  it('should accept valid content', () => {
    const result = validateContentSize('Hello, world!');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject empty content', () => {
    const result = validateContentSize('');
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain('Content cannot be empty');
  });

  it('should reject content that is too large', () => {
    const largeContent = 'x'.repeat(MAX_CONTENT_SIZE + 1);
    const result = validateContentSize(largeContent);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('Content too large');
  });

  it('should accept content just under the limit', () => {
    const content = 'x'.repeat(MAX_CONTENT_SIZE - 100);
    const result = validateContentSize(content);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept content exactly at the limit', () => {
    const content = 'x'.repeat(MAX_CONTENT_SIZE);
    const result = validateContentSize(content);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should handle unicode content correctly', () => {
    const unicodeContent = '???? ??';
    const result = validateContentSize(unicodeContent);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should calculate byte size correctly for unicode', () => {
    // Each emoji is ~4 bytes, so 250k emojis exceeds 1MB
    const largeUnicode = '??'.repeat(250000);
    const result = validateContentSize(largeUnicode);
    expect(result.isValid).toBe(false);
    expect(result.errors[0]).toContain('Content too large');
  });
});

// ============================================================================
// EXPIRATION VALIDATION TESTS
// ============================================================================

describe('validateExpiration', () => {
  it('should accept valid expiration times', () => {
    const result = validateExpiration(60);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept minimum expiration', () => {
    const result = validateExpiration(MIN_EXPIRATION_MINUTES);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept maximum expiration', () => {
    const result = validateExpiration(MAX_EXPIRATION_MINUTES);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject below minimum', () => {
    const result = validateExpiration(0);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('at least');
  });

  it('should reject negative values', () => {
    const result = validateExpiration(-1);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject above maximum', () => {
    const result = validateExpiration(MAX_EXPIRATION_MINUTES + 1);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
    expect(result.errors[0]).toContain('cannot exceed');
  });

  it('should reject non-integers', () => {
    const result = validateExpiration(1.5);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject very large numbers', () => {
    const result = validateExpiration(1000000);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// VIEW COUNT VALIDATION TESTS
// ============================================================================

describe('validateViewCount', () => {
  it('should accept valid view counts', () => {
    const result = validateViewCount(5);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept minimum view count', () => {
    const result = validateViewCount(MIN_VIEW_COUNT);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept maximum view count', () => {
    const result = validateViewCount(MAX_VIEW_COUNT);
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject zero', () => {
    const result = validateViewCount(0);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => err.includes('must be at least 1'))).toBe(true);
  });

  it('should reject negative values', () => {
    const result = validateViewCount(-1);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });

  it('should reject above maximum', () => {
    const result = validateViewCount(MAX_VIEW_COUNT + 1);
    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => err.includes('cannot exceed 100'))).toBe(true);
  });

  it('should reject non-integers', () => {
    const result = validateViewCount(5.5);
    expect(result.isValid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});

// ============================================================================
// PASSWORD VALIDATION TESTS
// ============================================================================

describe('validatePassword', () => {
  it('should accept strong passwords', () => {
    const result = validatePassword('MySecureP@ssw0rd123');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should accept minimum length password', () => {
    const result = validatePassword('Pass1234');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject short passwords', () => {
    const result = validatePassword('Short1!');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => err.includes('at least 8 characters'))).toBe(true);
  });

  it('should reject empty password', () => {
    const result = validatePassword('');
    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => err.includes('at least 8 characters'))).toBe(true);
  });

  it('should reject long passwords', () => {
    const result = validatePassword('a'.repeat(MAX_PASSWORD_LENGTH + 1));
    expect(result.isValid).toBe(false);
    expect(result.errors.some(err => err.includes('cannot exceed 128 characters'))).toBe(true);
  });

  it('should accept maximum length password', () => {
    const result = validatePassword('a'.repeat(MAX_PASSWORD_LENGTH));
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });

  it('should reject common weak passwords', () => {
    const weakPasswords = ['password', 'Password', 'PASSWORD', '12345678', 'qwerty', 'QWERTY', 'admin', 'ADMIN', 'letmein', 'LETMEIN'];
    
    weakPasswords.forEach(password => {
      const result = validatePassword(password);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('too common'))).toBe(true);
    });
  });

  it('should accept passwords that contain common words but are not exactly them', () => {
    const result = validatePassword('mypassword123');
    expect(result.isValid).toBe(true);
    expect(result.errors).toHaveLength(0);
  });
});

// ============================================================================
// UTF-8 VALIDATION TESTS
// ============================================================================

describe('isValidUTF8', () => {
  it('should accept valid UTF-8 strings', () => {
    expect(isValidUTF8('Hello, world!')).toBe(true);
    expect(isValidUTF8('????')).toBe(true);
    expect(isValidUTF8('?? Emoji')).toBe(true);
    expect(isValidUTF8('Caf? r?sum?')).toBe(true);
  });

  it('should handle empty string', () => {
    expect(isValidUTF8('')).toBe(true);
  });

  it('should handle strings with newlines and special chars', () => {
    expect(isValidUTF8('Line1\nLine2\tTabbed\r\nWindows')).toBe(true);
    expect(isValidUTF8('Special: !@#$%^&*()')).toBe(true);
  });

  it('should handle unicode surrogate pairs', () => {
    expect(isValidUTF8('\uD83D\uDE00')).toBe(true); // ?? emoji
  });

  it('should handle mixed content', () => {
    expect(isValidUTF8('Mixed: 123 ABC ?? ??')).toBe(true);
  });

  it('should handle edge cases', () => {
    expect(isValidUTF8('\u0000')).toBe(true); // Null byte
    expect(isValidUTF8('\u00FF')).toBe(true); // Extended ASCII
  });
});

// ============================================================================
// CONSTANTS TESTS
// ============================================================================

describe('Constants', () => {
  it('should export all required constants', () => {
    expect(MAX_CONTENT_SIZE).toBe(1024 * 1024);
    expect(MAX_EXPIRATION_MINUTES).toBe(7 * 24 * 60);
    expect(MIN_EXPIRATION_MINUTES).toBe(1);
    expect(MAX_VIEW_COUNT).toBe(100);
    expect(MIN_VIEW_COUNT).toBe(1);
    expect(MIN_PASSWORD_LENGTH).toBe(8);
    expect(MAX_PASSWORD_LENGTH).toBe(128);
  });
});
