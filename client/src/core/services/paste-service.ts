/**
 * Paste Domain Service
 * 
 * Provides business logic for paste operations including validation,
 * URL building, and URL parsing.
 */

import {
  validateContentSize,
  validateExpiration,
  validatePassword,
  isValidUTF8
} from '../validators/index.js';
import type { Result } from '../models/result.js';
import { success, failure } from '../models/result.js';

/**
 * Paste domain service for business logic operations
 */
export class PasteService {
  /**
   * Validate paste creation input
   * 
   * @param content Paste content
   * @param expirationMinutes Expiration time in minutes
   * @param password User password
   * @returns Result indicating validation success or errors
   */
  validatePasteCreation(
    content: string,
    expirationMinutes: number,
    password: string
  ): Result<void, string[]> {
    const contentValidation = validateContentSize(content);
    const expirationValidation = validateExpiration(expirationMinutes);
    const passwordValidation = validatePassword(password);

    const allErrors = [
      ...contentValidation.errors,
      ...expirationValidation.errors,
      ...passwordValidation.errors
    ];

    if (allErrors.length > 0) {
      return failure(allErrors);
    }

    // Check UTF-8 validity without reading content
    if (!isValidUTF8(content)) {
      return failure(['Invalid character encoding. Please use standard text characters.']);
    }

    return success(undefined);
  }

  /**
   * Build shareable URL for a paste
   * 
   * @param pasteId Paste identifier
   * @param saltB64 Base64url-encoded salt (encryption key identifier)
   * @param ivB64 Base64url-encoded IV
   * @returns Shareable URL with encryption key in fragment
   */
  buildShareUrl(pasteId: string, saltB64: string, ivB64: string): string {
    const baseUrl = typeof window !== 'undefined' 
      ? `${window.location.origin}/view.html`
      : '/view.html';
    return `${baseUrl}?p=${encodeURIComponent(pasteId)}#${saltB64}:${ivB64}`;
  }

  /**
   * Build deletion URL for a paste
   * 
   * @param pasteId Paste identifier
   * @param deleteToken Deletion token
   * @returns Deletion URL
   */
  buildDeleteUrl(pasteId: string, deleteToken: string): string {
    const baseUrl = typeof window !== 'undefined'
      ? `${window.location.origin}/delete.html`
      : '/delete.html';
    return `${baseUrl}?p=${encodeURIComponent(pasteId)}&token=${encodeURIComponent(deleteToken)}`;
  }

  /**
   * Parse view URL to extract paste ID and encryption parameters
   * 
   * @param url URL to parse (can be URL object or string)
   * @returns Parsed URL data or null if invalid
   */
  parseViewUrl(url: URL | string): { pasteId: string; salt: string; iv: string } | null {
    const urlObj = typeof url === 'string' ? new URL(url, typeof window !== 'undefined' ? window.location.href : 'http://localhost') : url;
    
    const pasteId = urlObj.searchParams.get('p');
    const frag = urlObj.hash.startsWith('#') ? urlObj.hash.slice(1) : '';
    
    if (!pasteId || !frag) {
      return null;
    }
    
    const [salt, iv] = frag.split(':');
    if (!salt || !iv) {
      return null;
    }
    
    return { pasteId, salt, iv };
  }

  /**
   * Calculate expiration timestamp from minutes
   * 
   * @param minutes Expiration time in minutes
   * @returns Unix timestamp (seconds since epoch)
   */
  calculateExpirationTimestamp(minutes: number): number {
    return Math.floor(Date.now() / 1000) + minutes * 60;
  }
}
