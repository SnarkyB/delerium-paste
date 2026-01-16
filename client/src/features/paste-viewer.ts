/**
 * paste-viewer.ts - Paste viewing flow
 * 
 * Handles the complete paste viewing workflow including:
 * - URL parsing
 * - Paste retrieval
 * - Decryption with user-supplied password/PIN
 * - Content display
 * - Delete button management
 */

import {
  secureClear,
  safeDisplayContent,
  getSafeErrorMessage,
  decryptWithPassword,
  deriveDeleteAuth
} from '../security.js';

import { decodeBase64Url } from '../core/crypto/encoding.js';
import { HttpApiClient } from '../infrastructure/api/http-client.js';
import { WindowWithUI } from '../ui/ui-manager.js';
import { setupPasteChat } from './paste-chat.js';

const apiClient = new HttpApiClient();

/**
 * Setup the destroy button for password-based deletion
 * Uses pre-derived deleteAuth to avoid requiring password entry again
 * 
 * Security: deleteAuth is stored in closure and cleared after use or on page unload
 */
function setupDestroyButton(pasteId: string, deleteAuth: string): void {
  const destroyBtn = document.getElementById('destroyBtn') as HTMLButtonElement | null;
  if (!destroyBtn) return;
  
  // Show the button
  destroyBtn.style.display = 'inline-flex';
  
  // Store deleteAuth in closure - single use, cleared after first use
  let storedDeleteAuth: string | null = deleteAuth;
  let isUsed = false;
  
  // Clear deleteAuth on page unload for security
  const cleanup = (): void => {
    if (storedDeleteAuth) {
      secureClear(storedDeleteAuth);
      storedDeleteAuth = null;
    }
  };
  window.addEventListener('beforeunload', cleanup);
  window.addEventListener('pagehide', cleanup);
  
  destroyBtn.addEventListener('click', async () => {
    // Security: Check if deleteAuth has already been used
    if (isUsed || !storedDeleteAuth) {
      window.alert('Delete authorization has expired. Please refresh the page and try again.');
      return;
    }
    
    // Confirm deletion
    if (!window.confirm('Are you sure you want to permanently delete this paste? This action cannot be undone.')) {
      return;
    }
    
    const destroyText = document.getElementById('destroyText');
    const originalText = destroyText?.textContent || 'Destroy Paste';
    
    // Capture deleteAuth for this request, then clear it immediately (single-use)
    const authForRequest = storedDeleteAuth;
    isUsed = true;
    secureClear(storedDeleteAuth);
    storedDeleteAuth = null;
    
    try {
      destroyBtn.disabled = true;
      if (destroyText) destroyText.textContent = 'Deleting...';
      
      // Call the delete API with deleteAuth (already cleared from memory)
      const response = await fetch(`/api/pastes/${encodeURIComponent(pasteId)}/delete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deleteAuth: authForRequest })
      });
      
      // Clear auth from request body string (best effort)
      secureClear(authForRequest);
      
      if (response.ok || response.status === 204) {
        // Success - update UI
        const content = document.getElementById('content');
        if (content) {
          content.textContent = 'Paste has been permanently deleted.';
          content.classList.add('error');
        }
        destroyBtn.style.display = 'none';
        
        // Hide chat section
        const chatSection = document.getElementById('chatSection');
        if (chatSection) chatSection.style.display = 'none';
        
        const updateStatus = (window as WindowWithUI).updateStatus;
        if (updateStatus) updateStatus(true, 'Paste deleted');
        
        // Remove cleanup listeners since deletion succeeded
        window.removeEventListener('beforeunload', cleanup);
        window.removeEventListener('pagehide', cleanup);
      } else {
        const err = await response.json().catch(() => ({ error: 'Unknown error' }));
        const errorMsg = err.error === 'invalid_auth' 
          ? 'Delete authorization failed. Please refresh the page and try again.' 
          : `Failed to delete: ${err.error || 'Unknown error'}`;
        window.alert(errorMsg);
        destroyBtn.disabled = false;
        if (destroyText) destroyText.textContent = originalText;
        // Note: deleteAuth already cleared, user must refresh to delete again
      }
    } catch (error) {
      window.alert(`Failed to delete paste: ${(error as Error).message}`);
      destroyBtn.disabled = false;
      if (destroyText) destroyText.textContent = originalText;
      // Note: deleteAuth already cleared, user must refresh to delete again
    }
  });
}

/**
 * View a paste
 */
export async function viewPaste(): Promise<void> {
  if (!location.pathname.endsWith("view.html")) return;
  
  const q = new URLSearchParams(location.search);
  const id = q.get("p");
  const frag = location.hash.startsWith("#") ? location.hash.slice(1) : "";
  const content = document.getElementById("content");
  
  // Update status if new UI is available
  const updateStatus = (window as WindowWithUI).updateStatus;
  const showInfo = (window as WindowWithUI).showInfo;
  
  if (!id || !frag) { 
    if (content) {
      content.textContent = "Missing paste ID or key.";
      content.classList.remove('loading');
      content.classList.add('error');
    }
    if (updateStatus) updateStatus(false, 'Missing information');
    return; 
  }
  
  const [keyB64, ivB64] = frag.split(":");

  try {
    if (updateStatus) updateStatus(true, 'Fetching paste...');
    const response = await apiClient.retrievePaste(id);
    const { ct, iv, meta } = response;

    const salt = decodeBase64Url(keyB64);
    const ivBuffer = decodeBase64Url(ivB64 || iv);
    const ctBuffer = decodeBase64Url(ct);

    const MAX_PASSWORD_ATTEMPTS = 5;
    let attempts = 0;
    let text = '';
    let deleteAuth: string | null = null;

    while (attempts < MAX_PASSWORD_ATTEMPTS && !text) {
      const attemptsRemaining = MAX_PASSWORD_ATTEMPTS - attempts;
      const promptMessage = attempts === 0
        ? 'This paste is protected. Enter the password or PIN:'
        : `Incorrect password or PIN. ${attemptsRemaining} attempt${attemptsRemaining !== 1 ? 's' : ''} remaining:`;

      const password = prompt(promptMessage);
      if (!password) {
        throw new Error('A password or PIN is required to decrypt this content.');
      }

      try {
        if (updateStatus) updateStatus(true, 'Verifying password...');
        text = await decryptWithPassword(ctBuffer, password, salt, ivBuffer);
        
        // Derive deleteAuth after successful decryption (before clearing password)
        // Convert ArrayBuffer to Uint8Array for deriveDeleteAuth
        deleteAuth = await deriveDeleteAuth(password, new Uint8Array(salt));
        secureClear(password);
      } catch {
        secureClear(password);
        attempts++;
        if (attempts >= MAX_PASSWORD_ATTEMPTS) {
          throw new Error('Maximum password attempts exceeded. Incorrect password or PIN.');
        }
      }
    }

    // Safely display content without XSS risk
    if (content) {
      content.classList.remove('loading');
      content.classList.remove('error');
      safeDisplayContent(content, text);
    }
    
    // Update status and info
    if (updateStatus) updateStatus(true, 'Decrypted successfully');
    if (showInfo && meta) showInfo(meta.expireTs);

    // Setup destroy button with pre-derived deleteAuth (no password prompt needed)
    // Security: deleteAuth is passed to closure and will be cleared after use or on unload
    if (deleteAuth) {
      setupDestroyButton(id, deleteAuth);
      // Clear deleteAuth from this scope - it's now stored in the button's closure
      secureClear(deleteAuth);
      deleteAuth = null;
    }

    // Initialize chat functionality with key caching setting from metadata
    setupPasteChat(id, new Uint8Array(salt), meta.allowKeyCaching ?? false);

    // Securely clear decryption data from memory
    secureClear(keyB64);
    secureClear(ivB64 || iv);
    secureClear(ct);
    
  } catch (e) {
    if (content) {
      const errorMessage = getSafeErrorMessage(e, 'paste viewing');
      content.classList.remove('loading');
      content.classList.add('error');
      safeDisplayContent(content, errorMessage);
    }
    if (updateStatus) {
      const errorMsg = getSafeErrorMessage(e, 'paste viewing');
      updateStatus(false, errorMsg.length > 50 ? 'Decryption failed' : errorMsg);
    }
  }
}

/**
 * Setup paste viewing
 */
export function setupPasteViewing(): void {
  if (typeof document === 'undefined' || typeof location === 'undefined') return;
  void viewPaste();
}
