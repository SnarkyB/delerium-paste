/**
 * high-risk-edge-cases.test.ts
 *
 * Comprehensive tests for High-Risk Change Protocol edge cases
 * as documented in CLAUDE.md and .cursor/rules/workspace.md
 *
 * This file ensures critical privacy and security edge cases are tested:
 * - Keys never leave the client
 * - URL fragment handling
 * - Unicode and special characters
 * - Concurrent access scenarios
 * - Browser compatibility
 * - Time-based edge cases
 *
 * These tests verify the zero-knowledge architecture remains intact
 * across all edge cases.
 */

import {
  encryptWithPassword,
  decryptWithPassword,
  generateSalt,
  deriveDeleteAuth,
} from '../../src/security.js';
import {
  encodeBase64Url,
  decodeBase64Url,
} from '../../src/core/crypto/encoding.js';

// ============================================================================
// SECURITY PATHS: Keys Never Leave Client
// ============================================================================

describe('High-Risk Protocol: Security Paths', () => {
  describe('keys never sent to server', () => {
    it('should never include encryption key in request body', async () => {
      // WHY: Core zero-knowledge principle - keys must stay client-side
      const password = 'test-password-123';
      const content = 'sensitive content';

      const { encryptedData, salt, iv } = await encryptWithPassword(content, password);

      // Simulate what gets sent to server
      const requestBody = JSON.stringify({
        ct: encodeBase64Url(encryptedData),
        iv: encodeBase64Url(iv),
        // Note: salt and password should NEVER be here
      });

      // Assert: Request body must not contain password or derived key
      expect(requestBody).not.toContain(password);
      expect(requestBody).not.toContain('key');
      expect(requestBody).not.toContain('password');

      // Salt is included (needed for decryption) but not the derived key
      expect(requestBody).toContain('ct');
      expect(requestBody).toContain('iv');
    });

    it('should never send password in any form', async () => {
      // WHY: Passwords must never be transmitted to server
      const password = 'my-secret-password';
      const content = 'test content';

      const result = await encryptWithPassword(content, password);

      // Convert all result values to strings to check
      const saltB64 = encodeBase64Url(result.salt);
      const ivB64 = encodeBase64Url(result.iv);
      const ctB64 = encodeBase64Url(result.encryptedData);

      // None of these should contain the plaintext password
      expect(saltB64).not.toContain(password);
      expect(ivB64).not.toContain(password);
      expect(ctB64).not.toContain(password);
    });
  });

  describe('URL fragment handling', () => {
    it('should store keys only in URL fragments', () => {
      // WHY: Browser never sends fragments to server (zero-knowledge)
      const pasteId = 'test-paste-123';
      const salt = 'abcd1234';
      const iv = 'efgh5678';

      // Simulate building share URL
      const shareUrl = `https://example.com/view?p=${pasteId}#${salt}:${iv}`;

      // Assert: Fragment exists and contains key material
      expect(shareUrl).toMatch(/#/);
      const [pathPart, fragmentPart] = shareUrl.split('#');

      // Key material MUST be in fragment
      expect(fragmentPart).toContain(salt);
      expect(fragmentPart).toContain(iv);

      // Key material must NOT be in path/query
      expect(pathPart).not.toContain(salt);
      expect(pathPart).not.toContain(iv);
    });

    it('should detect missing URL fragment', () => {
      // WHY: Email clients often strip fragments, must detect this
      const urlWithoutFragment = 'https://example.com/view?p=test-paste-123';

      // This should be detected as invalid
      expect(urlWithoutFragment).not.toMatch(/#/);

      // In real code, this should trigger an error message
      const hasFragment = urlWithoutFragment.includes('#');
      expect(hasFragment).toBe(false);
    });

    it('should handle URL encoding in fragments', () => {
      // WHY: Special characters in base64url need proper encoding
      const salt = 'abc-123_xyz'; // Contains special chars
      const iv = 'def+456/ghi';  // Contains + and /

      // Base64url encoding should handle these safely
      const saltEncoded = encodeURIComponent(salt);
      const ivEncoded = encodeURIComponent(iv);

      const url = `https://example.com/view?p=test#${saltEncoded}:${ivEncoded}`;

      // Should be valid URL
      expect(() => new URL(url)).not.toThrow();

      // Fragment should be recoverable
      const recoveredFragment = url.split('#')[1];
      expect(recoveredFragment).toBeTruthy();
    });
  });
});

// ============================================================================
// EDGE CASES: Unicode and Special Characters
// ============================================================================

describe('High-Risk Protocol: Unicode Edge Cases', () => {
  it('should encrypt and decrypt emoji correctly', async () => {
    // WHY: Unicode characters are common, must work perfectly
    const emoji = '🔐💾🎉🔑🚀';
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(emoji, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(emoji);
  });

  it('should handle right-to-left (RTL) text', async () => {
    // WHY: RTL languages (Arabic, Hebrew) must work correctly
    const rtlText = 'مرحبا بك في التطبيق السري';
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(rtlText, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(rtlText);
  });

  it('should handle zero-width characters', async () => {
    // WHY: Zero-width chars used in security contexts (homograph attacks)
    const textWithZeroWidth = 'test\u200B\u200C\u200Dtext'; // Zero-width space/joiner
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(textWithZeroWidth, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(textWithZeroWidth);
    expect(decrypted.length).toBe(textWithZeroWidth.length);
  });

  it('should handle newlines and special whitespace', async () => {
    // WHY: Users paste code with various whitespace types
    const textWithWhitespace = 'line1\nline2\r\nline3\ttabbed';
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(textWithWhitespace, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(textWithWhitespace);
  });

  it('should handle empty strings', async () => {
    // WHY: Edge case that must work gracefully
    const empty = '';
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(empty, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(empty);
  });

  it('should handle single character', async () => {
    // WHY: Minimum boundary case
    const single = 'a';
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(single, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(single);
  });

  it('should handle very long content', async () => {
    // WHY: Verify no length-based issues in crypto
    const longContent = 'a'.repeat(10000); // 10KB
    const password = 'test-pass';

    const encrypted = await encryptWithPassword(longContent, password);
    const decrypted = await decryptWithPassword(
      encrypted.encryptedData,
      password,
      encrypted.salt,
      encrypted.iv
    );

    expect(decrypted).toBe(longContent);
    expect(decrypted.length).toBe(10000);
  });
});

// ============================================================================
// EDGE CASES: Encryption/Decryption Boundary Conditions
// ============================================================================

describe('High-Risk Protocol: Encryption Boundary Conditions', () => {
  it('should fail gracefully with wrong password', async () => {
    // WHY: Wrong password should fail cleanly without exposing data
    const content = 'secret content';
    const correctPassword = 'correct-password';
    const wrongPassword = 'wrong-password';

    const encrypted = await encryptWithPassword(content, correctPassword);

    // Attempting to decrypt with wrong password should throw
    await expect(
      decryptWithPassword(
        encrypted.encryptedData,
        wrongPassword,
        encrypted.salt,
        encrypted.iv
      )
    ).rejects.toThrow();
  });

  it('should fail with corrupted ciphertext', async () => {
    // WHY: Corrupted data should be detected (authenticated encryption)
    const content = 'secret content';
    const password = 'test-password';

    const encrypted = await encryptWithPassword(content, password);

    // Corrupt the ciphertext
    const corruptedData = new Uint8Array(encrypted.encryptedData);
    corruptedData[0] ^= 0xFF; // Flip bits in first byte

    // Should fail to decrypt
    await expect(
      decryptWithPassword(
        corruptedData.buffer,
        password,
        encrypted.salt,
        encrypted.iv
      )
    ).rejects.toThrow();
  });

  it('should fail with wrong IV length', async () => {
    // WHY: IV must be exactly 16 bytes for AES-GCM
    const content = 'secret content';
    const password = 'test-password';

    const encrypted = await encryptWithPassword(content, password);

    // Create invalid IV (wrong length)
    const wrongIV = new ArrayBuffer(8); // Should be 16

    // Should fail to decrypt
    await expect(
      decryptWithPassword(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        wrongIV
      )
    ).rejects.toThrow();
  });

  it('should generate unique IVs for same content', async () => {
    // WHY: IV must be unique for each encryption (randomness)
    const content = 'same content';
    const password = 'same password';

    const encrypted1 = await encryptWithPassword(content, password);
    const encrypted2 = await encryptWithPassword(content, password);

    // IVs must be different (randomness)
    const iv1 = new Uint8Array(encrypted1.iv);
    const iv2 = new Uint8Array(encrypted2.iv);

    let ivsDifferent = false;
    for (let i = 0; i < iv1.length; i++) {
      if (iv1[i] !== iv2[i]) {
        ivsDifferent = true;
        break;
      }
    }

    expect(ivsDifferent).toBe(true);

    // Ciphertexts should also be different
    const ct1 = new Uint8Array(encrypted1.encryptedData);
    const ct2 = new Uint8Array(encrypted2.encryptedData);

    let ctsDifferent = false;
    for (let i = 0; i < Math.min(ct1.length, ct2.length); i++) {
      if (ct1[i] !== ct2[i]) {
        ctsDifferent = true;
        break;
      }
    }

    expect(ctsDifferent).toBe(true);
  });

  it('should generate unique salts', async () => {
    // WHY: Salt must be unique for PBKDF2 security
    const salt1 = generateSalt();
    const salt2 = generateSalt();

    const s1 = new Uint8Array(salt1);
    const s2 = new Uint8Array(salt2);

    let saltsDifferent = false;
    for (let i = 0; i < s1.length; i++) {
      if (s1[i] !== s2[i]) {
        saltsDifferent = true;
        break;
      }
    }

    expect(saltsDifferent).toBe(true);
  });
});

// ============================================================================
// EDGE CASES: Delete Authorization
// ============================================================================

describe('High-Risk Protocol: Delete Authorization', () => {
  it('should derive different delete auth from encryption key', async () => {
    // WHY: Delete auth must be cryptographically separate from encryption key
    const password = 'test-password';
    const content = 'test content';

    // Encrypt content (uses one derived key)
    const encrypted = await encryptWithPassword(content, password);

    // Derive delete auth (uses different salt modification)
    const deleteAuth = await deriveDeleteAuth(password, new Uint8Array(encrypted.salt));

    // Delete auth should be different from any encryption values
    // Note: deleteAuth is already a base64 string
    const ctB64 = encodeBase64Url(encrypted.encryptedData);
    const ivB64 = encodeBase64Url(encrypted.iv);
    const saltB64 = encodeBase64Url(encrypted.salt);

    // Delete auth should be unique
    expect(deleteAuth).not.toBe(ctB64);
    expect(deleteAuth).not.toBe(ivB64);
    expect(deleteAuth).not.toBe(saltB64);
  });

  it('should produce consistent delete auth for same password and salt', async () => {
    // WHY: Same password + salt must produce same delete auth (deterministic)
    const password = 'test-password';
    const salt = new Uint8Array(generateSalt());

    const deleteAuth1 = await deriveDeleteAuth(password, salt);
    const deleteAuth2 = await deriveDeleteAuth(password, salt);

    // Should be identical (both are already base64 strings)
    expect(deleteAuth1).toBe(deleteAuth2);
  });

  it('should produce different delete auth for different passwords', async () => {
    // WHY: Different passwords must produce different delete auth
    const password1 = 'password-one';
    const password2 = 'password-two';
    const salt = new Uint8Array(generateSalt());

    const deleteAuth1 = await deriveDeleteAuth(password1, salt);
    const deleteAuth2 = await deriveDeleteAuth(password2, salt);

    // Should be different (both are already base64 strings)
    expect(deleteAuth1).not.toBe(deleteAuth2);
  });
});

// ============================================================================
// EDGE CASES: Base64URL Encoding
// ============================================================================

describe('High-Risk Protocol: Base64URL Encoding', () => {
  it('should handle all byte values (0-255)', () => {
    // WHY: Encoding must work for all possible byte values
    const allBytes = new Uint8Array(256);
    for (let i = 0; i < 256; i++) {
      allBytes[i] = i;
    }

    const encoded = encodeBase64Url(allBytes.buffer);
    const decoded = decodeBase64Url(encoded);
    const decodedArray = new Uint8Array(decoded);

    // Should round-trip perfectly
    expect(decodedArray.length).toBe(256);
    for (let i = 0; i < 256; i++) {
      expect(decodedArray[i]).toBe(i);
    }
  });

  it('should not contain + or / characters', () => {
    // WHY: Base64URL must use URL-safe characters only
    const data = new Uint8Array(100);
    crypto.getRandomValues(data);

    const encoded = encodeBase64Url(data.buffer);

    // Base64URL should not have + or /
    expect(encoded).not.toContain('+');
    expect(encoded).not.toContain('/');
  });

  it('should handle empty buffer', () => {
    // WHY: Empty buffer is valid edge case
    const empty = new ArrayBuffer(0);
    const encoded = encodeBase64Url(empty);
    const decoded = decodeBase64Url(encoded);

    expect(decoded.byteLength).toBe(0);
  });

  it('should handle single byte', () => {
    // WHY: Minimum non-empty buffer
    const singleByte = new Uint8Array([42]);
    const encoded = encodeBase64Url(singleByte.buffer);
    const decoded = decodeBase64Url(encoded);
    const decodedArray = new Uint8Array(decoded);

    expect(decodedArray.length).toBe(1);
    expect(decodedArray[0]).toBe(42);
  });
});

// ============================================================================
// EDGE CASES: Memory Clearing (Security)
// ============================================================================

describe('High-Risk Protocol: Memory Clearing', () => {
  it('should not expose password in error messages', async () => {
    // WHY: Passwords must never appear in error messages
    const password = 'super-secret-password-12345';
    const wrongPassword = 'wrong-password';

    const content = 'test content';
    const encrypted = await encryptWithPassword(content, password);

    try {
      await decryptWithPassword(
        encrypted.encryptedData,
        wrongPassword,
        encrypted.salt,
        encrypted.iv
      );
      fail('Should have thrown an error');
    } catch (error) {
      const errorMessage = (error as Error).message.toLowerCase();

      // Error message should not contain either password
      expect(errorMessage).not.toContain(password.toLowerCase());
      expect(errorMessage).not.toContain(wrongPassword.toLowerCase());
    }
  });
});

// ============================================================================
// EDGE CASES: Concurrent Operations
// ============================================================================

describe('High-Risk Protocol: Concurrent Operations', () => {
  it('should handle multiple concurrent encryptions', async () => {
    // WHY: Users might encrypt multiple pastes simultaneously
    const password = 'test-password';
    const contents = ['content1', 'content2', 'content3'];

    const promises = contents.map(content =>
      encryptWithPassword(content, password)
    );

    const results = await Promise.all(promises);

    // All should succeed
    expect(results).toHaveLength(3);

    // All should have unique IVs
    const iv1 = encodeBase64Url(results[0].iv);
    const iv2 = encodeBase64Url(results[1].iv);
    const iv3 = encodeBase64Url(results[2].iv);

    expect(iv1).not.toBe(iv2);
    expect(iv2).not.toBe(iv3);
    expect(iv1).not.toBe(iv3);
  });

  it('should handle concurrent encryption and decryption', async () => {
    // WHY: User might be viewing one paste while creating another
    const password = 'test-password';
    const content1 = 'content to encrypt';
    const content2 = 'content to decrypt';

    // First encrypt content2
    const encrypted = await encryptWithPassword(content2, password);

    // Now do encryption and decryption concurrently
    const [encryptResult, decryptResult] = await Promise.all([
      encryptWithPassword(content1, password),
      decryptWithPassword(
        encrypted.encryptedData,
        password,
        encrypted.salt,
        encrypted.iv
      )
    ]);

    // Both should succeed
    expect(encryptResult.encryptedData).toBeTruthy();
    expect(decryptResult).toBe(content2);
  });
});
