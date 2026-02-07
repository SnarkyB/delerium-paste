/**
 * Chat Use Case
 * 
 * Orchestrates chat operations:
 * - Refresh messages
 * - Send messages
 * - Handle key caching
 */

import { EncryptionService } from '../../core/services/encryption-service.js';
import type { ChatMessage, DecryptedChatMessage } from '../../core/services/encryption-service.js';
import type { ChatMessagesResult, SendChatMessageCommand } from '../dtos/paste-dtos.js';
import { encodeBase64Url } from '../../core/crypto/encoding.js';

/**
 * Use case for chat operations
 */
export class ChatUseCase {
  constructor(private encryptionService: EncryptionService) {}

  /**
   * Refresh chat messages
   * 
   * @param pasteId Paste ID
   * @param password User password
   * @param salt Salt from paste (for key derivation)
   * @param cachedKey Optional cached encryption key
   * @param allowKeyCaching Whether key caching is allowed
   * @returns Promise resolving to decrypted messages
   */
  async refreshMessages(
    pasteId: string,
    password: string,
    salt: Uint8Array,
    cachedKey?: CryptoKey,
    allowKeyCaching: boolean = false
  ): Promise<{ messages: DecryptedChatMessage[]; key?: CryptoKey }> {
    // Fetch encrypted messages from server
    const response = await fetch(`/api/pastes/${pasteId}/messages`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Paste not found or expired');
      }
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json() as { messages: ChatMessage[] };

    if (!data.messages || data.messages.length === 0) {
      // Derive and cache key if we have password
      let key = cachedKey;
      if (!key && password) {
        key = await this.encryptionService.deriveKeyFromPassword(password, salt);
      }
      return { messages: [], key: allowKeyCaching ? key : undefined };
    }

    // Derive key if we have password but no cached key
    let key = cachedKey;
    if (!key && password) {
      key = await this.encryptionService.deriveKeyFromPassword(password, salt);
    }

    if (!key) {
      throw new Error('Encryption key is required to decrypt messages');
    }

    // Decrypt all messages
    const decryptedMessages: DecryptedChatMessage[] = [];
    let decryptionFailed = false;

    for (const msg of data.messages) {
      try {
        const decrypted = await this.encryptionService.decryptChatMessage(msg, key!);
        decryptedMessages.push({
          text: decrypted.text,
          username: decrypted.username,
          timestamp: msg.timestamp
        });
      } catch (e) {
        decryptedMessages.push({
          text: '[Decryption failed - wrong password?]',
          timestamp: msg.timestamp
        });
        decryptionFailed = true;
      }
    }

    // If decryption failed and we were using cached key, clear it
    if (decryptionFailed && cachedKey && !password) {
      return { messages: decryptedMessages, key: undefined };
    }

    return { 
      messages: decryptedMessages, 
      key: allowKeyCaching ? key : undefined 
    };
  }

  /**
   * Send a chat message
   * 
   * @param command Send message command
   * @param salt Salt from paste (for key derivation if needed)
   * @param allowKeyCaching Whether key caching is allowed
   * @returns Promise resolving to success or error
   */
  async sendMessage(
    command: SendChatMessageCommand,
    salt: Uint8Array,
    allowKeyCaching: boolean = false
  ): Promise<{ success: boolean; error?: string; key?: CryptoKey }> {
    // Client-side validation: 1000 character limit
    if (command.message.length > 1000) {
      return { success: false, error: 'Message too long (max 1000 characters)' };
    }

    // Derive key if we have password but no cached key
    let key = command.cachedKey;
    if (!key && command.password) {
      key = await this.encryptionService.deriveKeyFromPassword(command.password, salt);
    }

    if (!key) {
      return { success: false, error: 'Encryption key is required to encrypt message' };
    }

    try {
      // Encrypt message
      const { encryptedData, iv } = await this.encryptionService.encryptChatMessage(
        command.message,
        key,
        command.username
      );

      // Send to server
      const response = await fetch(`/api/pastes/${command.pasteId}/messages`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ct: encodeBase64Url(encryptedData),
          iv: encodeBase64Url(iv)
        })
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: 'Paste not found or expired' };
        }
        if (response.status === 429) {
          return { success: false, error: 'Rate limited. Please wait before sending more messages.' };
        }
        return { success: false, error: 'Failed to send message' };
      }

      return { 
        success: true, 
        key: allowKeyCaching ? key : undefined 
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}
