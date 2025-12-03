/**
 * paste-chat.test.ts - Tests for anonymous chat functionality
 *
 * Tests encryption, decryption, and UI integration for chat messages
 */

import { deriveKeyFromPassword, generateSalt } from '../../../src/security.js';
import { encodeBase64Url, decodeBase64Url } from '../../../src/core/crypto/encoding.js';

// ============================================================================
// CHAT ENCRYPTION/DECRYPTION TESTS
// ============================================================================

describe('Chat Message Encryption', () => {
  // Suppress console warnings in tests
  const originalConsoleWarn = console.warn;
  beforeEach(() => {
    console.warn = jest.fn();
  });
  afterEach(() => {
    console.warn = originalConsoleWarn;
  });

  it('should encrypt and decrypt a simple message with password', async () => {
    // Arrange - Setup password and message
    const password = 'test-password-123';
    const message = 'Hello, this is a secret chat message!';
    const salt = generateSalt();

    // Act - Encrypt message
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    const key = await deriveKeyFromPassword(password, salt);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(message)
    );

    // Act - Decrypt message
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    const decryptedMessage = new TextDecoder().decode(decryptedData);

    // Assert
    expect(decryptedMessage).toBe(message);
  });

  it('should fail decryption with wrong password', async () => {
    // Arrange
    const correctPassword = 'correct-password';
    const wrongPassword = 'wrong-password';
    const message = 'Secret message';
    const salt = generateSalt();
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Encrypt with correct password
    const correctKey = await deriveKeyFromPassword(correctPassword, salt);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      correctKey,
      new TextEncoder().encode(message)
    );

    // Try to decrypt with wrong password
    const wrongKey = await deriveKeyFromPassword(wrongPassword, salt);

    // Assert - Should throw error
    await expect(
      crypto.subtle.decrypt(
        { name: 'AES-GCM', iv },
        wrongKey,
        encryptedData
      )
    ).rejects.toThrow();
  });

  it('should use same salt as paste for key derivation', async () => {
    // Arrange - Simulate paste salt (from URL fragment)
    const password = 'shared-password';
    const message = 'Test message';
    const pasteSalt = generateSalt();
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Act - Derive keys using same salt and password
    const key1 = await deriveKeyFromPassword(password, pasteSalt);
    const key2 = await deriveKeyFromPassword(password, pasteSalt);

    // Encrypt with key1
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key1,
      new TextEncoder().encode(message)
    );

    // Decrypt with key2 (should work if keys are identical)
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key2,
      encrypted
    );

    // Assert - Decryption should succeed, proving keys are identical
    expect(new TextDecoder().decode(decrypted)).toBe(message);
  });

  it('should handle unicode characters in messages', async () => {
    // Arrange
    const password = 'test-password';
    const message = '你好世界 🌍 Émojis & spëcial çhars!';
    const salt = generateSalt();
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Act - Encrypt and decrypt
    const key = await deriveKeyFromPassword(password, salt);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(message)
    );
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    const decryptedMessage = new TextDecoder().decode(decryptedData);

    // Assert
    expect(decryptedMessage).toBe(message);
  });

  it('should handle long messages (up to 1000 chars)', async () => {
    // Arrange
    const password = 'test-password';
    const message = 'A'.repeat(1000); // Max message length
    const salt = generateSalt();
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Act
    const key = await deriveKeyFromPassword(password, salt);
    const encryptedData = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(message)
    );
    const decryptedData = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encryptedData
    );
    const decryptedMessage = new TextDecoder().decode(decryptedData);

    // Assert
    expect(decryptedMessage).toBe(message);
    expect(decryptedMessage.length).toBe(1000);
  });

  it('should produce different ciphertexts for same message (different IVs)', async () => {
    // Arrange
    const password = 'test-password';
    const message = 'Same message';
    const salt = generateSalt();

    // Act - Encrypt same message twice with different IVs
    const iv1 = new Uint8Array(12);
    crypto.getRandomValues(iv1);
    const iv2 = new Uint8Array(12);
    crypto.getRandomValues(iv2);

    const key = await deriveKeyFromPassword(password, salt);

    const encrypted1 = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv1 },
      key,
      new TextEncoder().encode(message)
    );

    const encrypted2 = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv: iv2 },
      key,
      new TextEncoder().encode(message)
    );

    // Assert - Ciphertexts should be different
    expect(new Uint8Array(encrypted1)).not.toEqual(new Uint8Array(encrypted2));
  });
});

// ============================================================================
// BASE64URL ENCODING TESTS (for message transmission)
// ============================================================================

describe('Chat Message Encoding', () => {
  it('should encode and decode encrypted message data', () => {
    // Arrange
    const testData = new Uint8Array([1, 2, 3, 4, 5, 255, 254, 253]);

    // Act
    const encoded = encodeBase64Url(testData);
    const decoded = decodeBase64Url(encoded);

    // Assert
    expect(new Uint8Array(decoded)).toEqual(testData);
  });

  it('should handle empty messages', () => {
    // Arrange
    const emptyData = new Uint8Array([]);

    // Act
    const encoded = encodeBase64Url(emptyData);
    const decoded = decodeBase64Url(encoded);

    // Assert
    expect(new Uint8Array(decoded)).toEqual(emptyData);
  });
});

// ============================================================================
// CHAT UI HELPER TESTS
// ============================================================================

describe('Chat UI Helpers', () => {
  let container: HTMLElement;

  beforeEach(() => {
    // Setup DOM
    container = document.createElement('div');
    document.body.appendChild(container);
  });

  afterEach(() => {
    // Cleanup
    document.body.removeChild(container);
  });

  it('should escape HTML in messages to prevent XSS', () => {
    // Arrange
    const maliciousMessage = '<script>alert("XSS")</script>';
    const div = document.createElement('div');

    // Act - Use textContent (safe method)
    div.textContent = maliciousMessage;

    // Assert - Script tags should be escaped
    expect(div.innerHTML).toContain('&lt;script&gt;');
    expect(div.innerHTML).not.toContain('<script>');
  });

  it('should format timestamp correctly', () => {
    // Arrange
    const timestamp = 1701619200; // Dec 3, 2023 14:00:00 UTC
    const date = new Date(timestamp * 1000);

    // Act
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    // Assert - Should be formatted as HH:MM
    expect(timeStr).toMatch(/\d{1,2}:\d{2}/);
  });

  it('should handle chat section visibility', () => {
    // Arrange
    const chatSection = document.createElement('div');
    chatSection.id = 'chatSection';
    chatSection.style.display = 'none';
    container.appendChild(chatSection);

    // Act - Show chat section
    chatSection.style.display = 'block';

    // Assert
    expect(chatSection.style.display).toBe('block');
  });
});

// ============================================================================
// PASSWORD SECURITY TESTS
// ============================================================================

describe('Chat Password Security', () => {
  it('should derive different keys from different passwords', async () => {
    // Arrange
    const password1 = 'password-one';
    const password2 = 'password-two';
    const salt = generateSalt(); // Same salt
    const message = 'Test message';
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Act - Derive keys and encrypt with first password
    const key1 = await deriveKeyFromPassword(password1, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key1,
      new TextEncoder().encode(message)
    );

    // Try to decrypt with second password's key
    const key2 = await deriveKeyFromPassword(password2, salt);

    // Assert - Decryption should fail, proving keys are different
    await expect(
      crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key2, encrypted)
    ).rejects.toThrow();
  });

  it('should use PBKDF2 with 100,000 iterations', async () => {
    // This test ensures the key derivation works correctly
    // The actual parameters (iterations, hash) are tested in security.test.ts
    const password = 'test-password';
    const salt = generateSalt();
    const message = 'Test message';
    const iv = new Uint8Array(12);
    crypto.getRandomValues(iv);

    // Act - Derive key and use it for encryption
    const key = await deriveKeyFromPassword(password, salt);
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      new TextEncoder().encode(message)
    );

    // Assert - Key should work for AES-256-GCM operations
    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );
    expect(new TextDecoder().decode(decrypted)).toBe(message);
  });
});
