/**
 * paste-chat.ts - Anonymous chat functionality for pastes
 *
 * Handles encrypted chat messages on paste view pages:
 * - Encrypts messages client-side with paste password
 * - Manual polling (user must click refresh and enter password)
 * - 50 message limit per paste
 * - Messages expire with paste
 */

import { deriveKeyFromPassword, secureClear } from '../security.js';
import { encodeBase64Url } from '../core/crypto/encoding.js';

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
 * Initialize chat functionality on view page
 * Shows chat section after paste is successfully decrypted
 */
export function setupPasteChat(pasteId: string, salt: Uint8Array): void {
  const chatSection = document.getElementById('chatSection');
  const refreshBtn = document.getElementById('refreshMessagesBtn');
  const sendBtn = document.getElementById('sendMessageBtn');
  const chatInput = document.getElementById('chatInput') as HTMLInputElement;

  if (!chatSection || !refreshBtn || !sendBtn || !chatInput) {
    console.warn('Chat UI elements not found');
    return;
  }

  // Show chat section
  chatSection.style.display = 'block';

  // Store context for handlers (no password - user must re-enter for privacy)
  const chatContext = { pasteId, salt };

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
}

/**
 * Handle refreshing chat messages (requires password re-entry)
 */
async function handleRefreshMessages(context: { pasteId: string; salt: Uint8Array }): Promise<void> {
  const messagesDiv = document.getElementById('chatMessages');
  if (!messagesDiv) return;

  // Prompt for password
  const password = prompt('Enter the paste password to decrypt messages:');
  if (!password) {
    showChatError('Password is required to decrypt messages');
    return;
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
      return;
    }

    // Decrypt all messages
    const decryptedMessages: DecryptedMessage[] = [];
    for (const msg of data.messages) {
      try {
        const text = await decryptMessage(msg, password, context.salt);
        decryptedMessages.push({ text, timestamp: msg.timestamp });
      } catch (e) {
        console.error('Failed to decrypt message:', e);
        decryptedMessages.push({ text: '[Decryption failed - wrong password?]', timestamp: msg.timestamp });
      }
    }

    // Display messages
    displayMessages(decryptedMessages);
    secureClear(password);

  } catch (error) {
    console.error('Error refreshing messages:', error);
    showChatError(error instanceof Error ? error.message : 'Failed to load messages');
    secureClear(password);
  }
}

/**
 * Handle sending a new chat message (requires password re-entry)
 */
async function handleSendMessage(
  context: { pasteId: string; salt: Uint8Array },
  input: HTMLInputElement
): Promise<void> {
  const message = input.value.trim();

  if (!message) {
    return;
  }

  if (message.length > 1000) {
    showChatError('Message too long (max 1000 characters)');
    return;
  }

  // Prompt for password
  const password = prompt('Enter the paste password to send message:');
  if (!password) {
    showChatError('Password is required to encrypt message');
    return;
  }

  try {
    // Disable input and button while sending
    input.disabled = true;
    const sendBtn = document.getElementById('sendMessageBtn') as HTMLButtonElement;
    if (sendBtn) sendBtn.disabled = true;

    // Encrypt message
    const { encryptedData, iv } = await encryptMessage(message, password, context.salt);

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
    input.value = '';
    await handleRefreshMessages(context);

    secureClear(password);

  } catch (error) {
    console.error('Error sending message:', error);
    showChatError(error instanceof Error ? error.message : 'Failed to send message');
    secureClear(password);
  } finally {
    input.disabled = false;
    const sendBtn = document.getElementById('sendMessageBtn') as HTMLButtonElement;
    if (sendBtn) sendBtn.disabled = false;
  }
}

/**
 * Encrypt a chat message using the paste password and salt
 * Uses the same salt from the paste URL to ensure password compatibility
 */
async function encryptMessage(
  message: string,
  password: string,
  salt: Uint8Array
): Promise<{ encryptedData: ArrayBuffer; iv: ArrayBuffer }> {
  // Generate IV for this message
  const iv = new Uint8Array(12);
  crypto.getRandomValues(iv);

  // Derive key from password using the paste's salt
  const key = await deriveKeyFromPassword(password, salt);

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
 * Decrypt a chat message using the paste password and salt
 * Uses the same salt from the paste URL to ensure password compatibility
 */
async function decryptMessage(
  msg: ChatMessage,
  password: string,
  salt: Uint8Array
): Promise<string> {
  const { decodeBase64Url } = await import('../core/crypto/encoding.js');
  const ctBuffer = decodeBase64Url(msg.ct);
  const ivBuffer = decodeBase64Url(msg.iv);

  // Derive key from password using the paste's salt
  const key = await deriveKeyFromPassword(password, salt);

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
 * Escape HTML to prevent XSS
 */
function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
