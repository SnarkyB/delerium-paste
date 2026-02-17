/**
 * paste-chat.ts - Anonymous chat functionality for pastes (Refactored)
 *
 * Thin wrapper around presentation layer for backward compatibility.
 * Delegates to ChatView component while maintaining exported functions.
 */

import { ChatView, generateRandomUsername as generateRandomUsernameFromView } from '../presentation/components/chat-view.js';
import { ChatUseCase } from '../application/use-cases/chat-use-case.js';
import { EncryptionService } from '../core/services/encryption-service.js';

// Initialize dependencies
const encryptionService = new EncryptionService();
const chatUseCase = new ChatUseCase(encryptionService);
const chatView = new ChatView(chatUseCase);

// Re-export for backward compatibility
export { generateRandomUsernameFromView as generateRandomUsername };

/**
 * Initialize chat functionality on view page (backward compatibility wrapper)
 *
 * @param pasteId The paste ID
 * @param salt The salt from the paste URL for key derivation
 * @param initialPassword Optional password from paste view - avoids repeated prompts for refresh/send
 */
export function setupPasteChat(
  pasteId: string,
  salt: Uint8Array,
  initialPassword?: string
): void {
  chatView.setup(pasteId, salt, initialPassword);
}

/**
 * Encrypt a chat message using a pre-derived CryptoKey (backward compatibility)
 * Exported for testing purposes
 */
export async function encryptMessageWithKey(
  message: string,
  key: CryptoKey,
  username?: string
): Promise<{ encryptedData: ArrayBuffer; iv: ArrayBuffer }> {
  return encryptionService.encryptChatMessage(message, key, username);
}

/**
 * Escape HTML to prevent XSS attacks (backward compatibility)
 */
export function escapeHtml(text: string): string {
  // Use the escapeHtml from chat-view, but handle the import issue
  // For now, implement inline to avoid circular dependency
  if (text == null) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
