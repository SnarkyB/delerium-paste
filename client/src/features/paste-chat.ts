/**
 * paste-chat.ts - Anonymous chat functionality for pastes
 *
 * Handles encrypted chat messages on paste view pages:
 * - Encrypts messages client-side with paste password
 * - Manual polling (user must click refresh and enter password)
 * - 50 message limit per paste
 * - Messages expire with paste
 * - Optional key caching for convenience (when enabled by paste creator)
 */

import { deriveKeyFromPassword, secureClear } from '../security.js';
import { encodeBase64Url } from '../core/crypto/encoding.js';

/**
 * Debug flag for verbose error logging
 * Set to false in production builds to prevent information disclosure
 */
const DEBUG_MODE = typeof process !== 'undefined' && process.env?.NODE_ENV !== 'production';

interface ChatMessage {
  ct: string;
  iv: string;
  timestamp: number;
}

interface DecryptedMessage {
  text: string;
  timestamp: number;
}

/**
 * Chat context with optional key caching support
 */
interface ChatContext {
  pasteId: string;
  salt: Uint8Array;
  allowKeyCaching: boolean;
  cachedKey?: CryptoKey;
}

/**
 * Initialize chat functionality on view page
 * Shows chat section after paste is successfully decrypted
 * 
 * NOTE: This function should only be called once per page load.
 * For static HTML pages (like view.html), this is safe. If integrating
 * into an SPA, ensure this is only called once or implement cleanup.
 * 
 * @param pasteId The paste ID
 * @param salt The salt from the paste URL for key derivation
 * @param allowKeyCaching Whether to allow caching the derived key for convenience
 */
export function setupPasteChat(pasteId: string, salt: Uint8Array, allowKeyCaching: boolean = false): void {
  const chatSection = document.getElementById('chatSection');
  const refreshBtn = document.getElementById('refreshMessagesBtn');
  const sendBtn = document.getElementById('sendMessageBtn');
  const chatInput = document.getElementById('chatInput') as HTMLInputElement;
  const forgetKeyBtn = document.getElementById('forgetKeyBtn');
  const chatInfoText = document.getElementById('chatInfoText');

  if (!chatSection || !refreshBtn || !sendBtn || !chatInput) {
    console.warn('Chat UI elements not found');
    return;
  }

  // Guard against duplicate initialization (prevents memory leaks in SPA contexts)
  if (refreshBtn.dataset.chatInitialized === 'true') {
    console.warn('Chat already initialized, skipping duplicate setup');
    return;
  }

  // Show chat section
  chatSection.style.display = 'block';

  // Store context for handlers with key caching support
  const chatContext: ChatContext = { pasteId, salt, allowKeyCaching };

  // Update info text based on key caching setting
  if (chatInfoText) {
    if (allowKeyCaching) {
      chatInfoText.textContent = '💡 Messages are encrypted with your paste password. Key can be cached after first entry.';
    } else {
      chatInfoText.textContent = '💡 Messages are encrypted with your paste password. Password required for each action.';
    }
  }

  // Setup forget key button if key caching is allowed
  if (forgetKeyBtn && allowKeyCaching) {
    forgetKeyBtn.addEventListener('click', () => {
      forgetKey(chatContext);
    });
  }

  // Clear key on page unload for security
  if (allowKeyCaching) {
    window.addEventListener('beforeunload', () => {
      chatContext.cachedKey = undefined;
    });
  }

  // Refresh messages handler
  refreshBtn.addEventListener('click', () => void handleRefreshMessages(chatContext));

  // Send message handler
  sendBtn.addEventListener('click', () => void handleSendMessage(chatContext, chatInput));

  // Allow Enter key to send message
  chatInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
      void handleSendMessage(chatContext, chatInput);
    }
  });

  // Mark as initialized to prevent duplicate listeners
  refreshBtn.dataset.chatInitialized = 'true';
}

/**
 * Update the key status indicator UI
 */
function updateKeyIndicator(hasKey: boolean, allowed: boolean): void {
  const keyStatus = document.getElementById('keyStatus');
  if (!keyStatus) return;

  if (allowed && hasKey) {
    keyStatus.style.display = 'block';
  } else {
    keyStatus.style.display = 'none';
  }
}

/**
 * Derive and optionally cache the encryption key
 */
async function deriveAndCacheKey(context: ChatContext, password: string): Promise<CryptoKey> {
  const key = await deriveKeyFromPassword(password, context.salt);
  
  if (context.allowKeyCaching) {
    context.cachedKey = key;
    updateKeyIndicator(true, true);
  }
  
  return key;
}

/**
 * Forget (clear) the cached key
 */
function forgetKey(context: ChatContext): void {
  context.cachedKey = undefined;
  updateKeyIndicator(false, context.allowKeyCaching);
}

/**
 * Handle refreshing chat messages
 * Uses cached key if available and allowed, otherwise prompts for password
 * 
 * @param context Chat context with paste ID, salt, and caching settings
 * @param password Optional password to reuse (for UX improvement after sending)
 */
async function handleRefreshMessages(
  context: ChatContext,
  password?: string
): Promise<void> {
  const messagesDiv = document.getElementById('chatMessages');
  if (!messagesDiv) return;

  // Determine if we can use cached key
  let key: CryptoKey | undefined = context.allowKeyCaching ? context.cachedKey : undefined;
  let pwd = password;

  // If no cached key and no password provided, prompt for password
  if (!key && !pwd) {
    pwd = prompt('Enter the paste password to decrypt messages:');
    if (!pwd) {
      showChatError('Password is required to decrypt messages');
      return;
    }
  }

  try {
    messagesDiv.innerHTML = '<div style="text-align: center; padding: 1rem; color: var(--text-light);">Loading messages...</div>';

    // Fetch encrypted messages from server
    const response = await fetch(`/api/pastes/${context.pasteId}/messages`);

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Paste not found or expired');
      }
      throw new Error('Failed to fetch messages');
    }

    const data = await response.json() as { messages: ChatMessage[] };

    if (!data.messages || data.messages.length === 0) {
      messagesDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-light);">No messages yet. Be the first to chat!</div>';
      // If we used password, derive and cache key before clearing password
      if (pwd && !key && context.allowKeyCaching) {
        key = await deriveAndCacheKey(context, pwd);
      }
      // Clear password before returning
      if (pwd && !password) {
        secureClear(pwd);
      }
      return;
    }

    // Derive key if we have password but no cached key
    if (pwd && !key) {
      key = await deriveAndCacheKey(context, pwd);
    }

    // Decrypt all messages using the key
    const decryptedMessages: DecryptedMessage[] = [];
    let decryptionFailed = false;
    
    for (const msg of data.messages) {
      try {
        const text = await decryptMessageWithKey(msg, key!, context.salt);
        decryptedMessages.push({ text, timestamp: msg.timestamp });
      } catch (e) {
        // Don't log error details in production - may contain sensitive crypto information
        if (DEBUG_MODE) {
          console.error('Failed to decrypt message:', e);
        } else {
          console.error('Failed to decrypt message');
        }
        decryptedMessages.push({ text: '[Decryption failed - wrong password?]', timestamp: msg.timestamp });
        decryptionFailed = true;
      }
    }

    // If decryption failed and we were using cached key, clear it and re-prompt
    if (decryptionFailed && context.cachedKey && !pwd) {
      forgetKey(context);
      // Re-prompt for password
      messagesDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--warning);">Cached key failed. Please re-enter password.</div>';
      return;
    }

    // Display messages
    displayMessages(decryptedMessages);
    // Clear password after use (always clear local copy for security)
    // Note: When password is passed in, the caller is responsible for clearing it
    if (pwd && !password) {
      secureClear(pwd);
    }

  } catch (error) {
    // Don't log error details in production - may contain sensitive information
    if (DEBUG_MODE) {
      console.error('Error refreshing messages:', error);
    } else {
      console.error('Error refreshing messages');
    }
    showChatError(error instanceof Error ? error.message : 'Failed to load messages');
    // Only clear password if we prompted for it (not passed in)
    if (pwd && !password) {
      secureClear(pwd);
    }
  }
}

/**
 * Handle sending a new chat message
 * Uses cached key if available and allowed, otherwise prompts for password
 */
async function handleSendMessage(
  context: ChatContext,
  input: HTMLInputElement
): Promise<void> {
  const message = input.value.trim();

  if (!message) {
    return;
  }

  // Client-side validation: 1000 character limit (more restrictive than server's 10KB)
  // Server validates encrypted message size (10KB max), but we limit plaintext to prevent
  // users from hitting server limits after encryption overhead (base64 encoding, IV, etc.)
  if (message.length > 1000) {
    showChatError('Message too long (max 1000 characters)');
    return;
  }

  // Determine if we can use cached key
  let key: CryptoKey | undefined = context.allowKeyCaching ? context.cachedKey : undefined;
  let password: string | undefined;

  // If no cached key, prompt for password
  if (!key) {
    password = prompt('Enter the paste password to send message:') ?? undefined;
    if (!password) {
      showChatError('Password is required to encrypt message');
      return;
    }
  }

  try {
    // Disable input and button while sending
    input.disabled = true;
    const sendBtn = document.getElementById('sendMessageBtn') as HTMLButtonElement;
    if (sendBtn) sendBtn.disabled = true;

    // Derive key if we have password but no cached key
    if (password && !key) {
      key = await deriveAndCacheKey(context, password);
    }

    // Encrypt message using the key
    const { encryptedData, iv } = await encryptMessageWithKey(message, key!);

    // Send to server
    const response = await fetch(`/api/pastes/${context.pasteId}/messages`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        ct: encodeBase64Url(encryptedData),
        iv: encodeBase64Url(iv)
      })
    });

    if (!response.ok) {
      if (response.status === 404) {
        throw new Error('Paste not found or expired');
      }
      if (response.status === 429) {
        throw new Error('Rate limited. Please wait before sending more messages.');
      }
      throw new Error('Failed to send message');
    }

    // Clear input and refresh messages
    // Pass password to avoid double prompt (privacy-first: password cleared after refresh)
    input.value = '';
    await handleRefreshMessages(context, password);
    
    // Clear password after use (handleRefreshMessages doesn't clear passed passwords)
    if (password) {
      secureClear(password);
    }

  } catch (error) {
    // Don't log error details in production - may contain sensitive information
    if (DEBUG_MODE) {
      console.error('Error sending message:', error);
    } else {
      console.error('Error sending message');
    }
    showChatError(error instanceof Error ? error.message : 'Failed to send message');
    if (password) {
      secureClear(password);
    }
  } finally {
    input.disabled = false;
    const sendBtn = document.getElementById('sendMessageBtn') as HTMLButtonElement;
    if (sendBtn) sendBtn.disabled = false;
  }
}

/**
 * Encrypt a chat message using a pre-derived CryptoKey
 */
async function encryptMessageWithKey(
  message: string,
  key: CryptoKey
): Promise<{ encryptedData: ArrayBuffer; iv: ArrayBuffer }> {
  // Generate IV for this message
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Encrypt message
  const encryptedData = await crypto.subtle.encrypt(
    {
      name: 'AES-GCM',
      iv: iv
    },
    key,
    new TextEncoder().encode(message)
  );

  return {
    encryptedData,
    iv: iv.buffer.slice(iv.byteOffset, iv.byteOffset + iv.byteLength) as ArrayBuffer
  };
}

/**
 * Decrypt a chat message using a pre-derived CryptoKey
 */
async function decryptMessageWithKey(
  msg: ChatMessage,
  key: CryptoKey,
  _salt: Uint8Array // kept for signature compatibility
): Promise<string> {
  const { decodeBase64Url } = await import('../core/crypto/encoding.js');
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

  return new TextDecoder().decode(decryptedData);
}

/**
 * Display decrypted messages in the chat UI
 */
function displayMessages(messages: DecryptedMessage[]): void {
  const messagesDiv = document.getElementById('chatMessages');
  if (!messagesDiv) return;

  if (messages.length === 0) {
    messagesDiv.innerHTML = '<div style="text-align: center; padding: 2rem; color: var(--text-light);">No messages yet. Be the first to chat!</div>';
    return;
  }

  let html = '';
  for (const msg of messages) {
    const date = new Date(msg.timestamp * 1000);
    const timeStr = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    html += `
      <div style="margin-bottom: 0.75rem; padding: 0.5rem; background: var(--bg-card); border-radius: 0.375rem;">
        <div style="font-size: 0.75rem; color: var(--text-light); margin-bottom: 0.25rem;">
          ${escapeHtml(timeStr)}
        </div>
        <div style="color: var(--text); word-wrap: break-word;">
          ${escapeHtml(msg.text)}
        </div>
      </div>
    `;
  }

  messagesDiv.innerHTML = html;

  // Scroll to bottom
  messagesDiv.scrollTop = messagesDiv.scrollHeight;
}

/**
 * Show an error message in the chat UI
 */
function showChatError(message: string): void {
  const messagesDiv = document.getElementById('chatMessages');
  if (!messagesDiv) return;

  messagesDiv.innerHTML = `
    <div style="text-align: center; padding: 2rem; color: var(--danger);">
      ⚠️ ${escapeHtml(message)}
    </div>
  `;
}

/**
 * Escape HTML to prevent XSS attacks
 * 
 * Uses browser's native textContent to safely escape all HTML entities including:
 * - < > & quotes
 * - Unicode characters
 * - Script injection attempts
 * 
 * @param text Text to escape (handles null/undefined by converting to empty string)
 * @returns HTML-safe string
 */
export function escapeHtml(text: string): string {
  // Handle null/undefined edge cases
  if (text == null) {
    return '';
  }
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
