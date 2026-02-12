/**
 * Encryption Domain Service
 * 
 * Provides encryption and decryption operations for pastes and chat messages.
 * This is a domain service that encapsulates cryptographic operations.
 */

import {
  encryptWithPassword,
  decryptWithPassword,
  deriveDeleteAuth,
  deriveKeyFromPassword,
  secureClearBuffer
} from '../../security.js';
import { encodeBase64Url, decodeBase64Url } from '../crypto/encoding.js';
import type { EncryptedData } from '../models/paste.js';

/**
 * Chat message structure (domain model)
 */
export interface ChatMessage {
  ct: string;
  iv: string;
  timestamp: number;
}

/**
 * Decrypted chat message
 */
export interface DecryptedChatMessage {
  text: string;
  username?: string;
  timestamp?: number;
}

/**
 * Encryption service for paste operations
 */
export class EncryptionService {
  /**
   * Encrypt paste content with password
   * 
   * @param content Plaintext content to encrypt
   * @param password User-provided password
   * @returns Promise resolving to encrypted data with base64url-encoded values
   */
  async encryptPaste(content: string, password: string): Promise<EncryptedData> {
    const { encryptedData, salt, iv } = await encryptWithPassword(content, password);
    
    return {
      keyB64: encodeBase64Url(salt),
      ivB64: encodeBase64Url(iv),
      ctB64: encodeBase64Url(encryptedData)
    };
  }

  /**
   * Decrypt paste content with password
   * 
   * @param ctB64 Base64url-encoded ciphertext
   * @param password User-provided password
   * @param saltB64 Base64url-encoded salt
   * @param ivB64 Base64url-encoded IV
   * @returns Promise resolving to decrypted plaintext
   * @throws Error if decryption fails (wrong password or corrupted data)
   */
  async decryptPaste(
    ctB64: string,
    password: string,
    saltB64: string,
    ivB64: string
  ): Promise<string> {
    const ctBuffer = decodeBase64Url(ctB64);
    const saltBuffer = decodeBase64Url(saltB64);
    const ivBuffer = decodeBase64Url(ivB64);
    
    return decryptWithPassword(ctBuffer, password, saltBuffer, ivBuffer);
  }

  /**
   * Derive delete authorization from password
   * 
   * @param password User-provided password
   * @param salt Salt from the paste (as Uint8Array)
   * @returns Promise resolving to base64url-encoded delete authorization
   */
  async deriveDeleteAuth(password: string, salt: Uint8Array): Promise<string> {
    return deriveDeleteAuth(password, salt);
  }

  /**
   * Encrypt a chat message using a pre-derived CryptoKey
   * Encrypts message as JSON payload: { text, username }
   * 
   * @param message Plaintext message
   * @param key Pre-derived encryption key
   * @param username Optional username (truncated to 20 chars)
   * @returns Promise resolving to encrypted data and IV
   */
  async encryptChatMessage(
    message: string,
    key: CryptoKey,
    username?: string
  ): Promise<{ encryptedData: ArrayBuffer; iv: ArrayBuffer }> {
    // Truncate username to max 20 chars
    if (username && username.length > 20) {
      username = username.substring(0, 20);
    }

    // Generate IV for this message
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Create payload with message and optional username
    const payload = username ? { text: message, username } : { text: message };
    const payloadStr = JSON.stringify(payload);

    // Encrypt message
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: 'AES-GCM',
        iv: iv
      },
      key,
      new TextEncoder().encode(payloadStr)
    );

    return {
      encryptedData,
      iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
    };
  }

  /**
   * Decrypt a chat message using a pre-derived CryptoKey
   * Handles both new JSON format { text, username } and old plain text format
   * 
   * Clears decrypted data buffer from memory after use for security.
   * 
   * @param msg Encrypted chat message
   * @param key Pre-derived decryption key
   * @returns Promise resolving to decrypted message with text and optional username
   * @throws Error if decryption fails
   */
  async decryptChatMessage(
    msg: ChatMessage,
    key: CryptoKey
  ): Promise<DecryptedChatMessage> {
    const ctBuffer = decodeBase64Url(msg.ct);
    const ivBuffer = decodeBase64Url(msg.iv);

    // Ensure IV is properly typed for WebCrypto
    const iv = ivBuffer instanceof Uint8Array ? ivBuffer : new Uint8Array(ivBuffer);

    // Decrypt message
    const decryptedData = await crypto.subtle.decrypt(
      {
        name: 'AES-GCM',
        iv: iv as BufferSource
      },
      key,
      ctBuffer
    );

    try {
      const decryptedText = new TextDecoder().decode(decryptedData);

      // Try to parse as JSON (new format with username)
      try {
        const parsed = JSON.parse(decryptedText);
        // Validate it has the expected structure
        if (parsed && typeof parsed.text === 'string') {
          return {
            text: parsed.text,
            username: parsed.username
          };
        }
      } catch {
        // Not JSON or invalid format, fall through to plain text handling
      }

      // Backward compatibility: treat as plain text (old format)
      return { text: decryptedText, username: undefined };
    } finally {
      // Clear decrypted data buffer from memory (best effort)
      secureClearBuffer(decryptedData);
    }
  }

  /**
   * Derive encryption key from password for chat operations
   * 
   * @param password User-provided password
   * @param salt Salt from the paste
   * @returns Promise resolving to CryptoKey
   */
  async deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
    return deriveKeyFromPassword(password, salt);
  }
}
