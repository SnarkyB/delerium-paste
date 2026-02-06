/**
 * paste-creator.ts - Paste creation flow
 * 
 * Handles the complete paste creation workflow including:
 * - Form validation
 * - Encryption (password or PIN-based)
 * - Proof-of-work solving
 * - API submission
 * - Success display
 */

import {
  validateContentSize,
  validateExpiration,
  validatePassword,
  isValidUTF8
} from '../core/validators/index.js';

import {
  secureClear,
  getSafeErrorMessage,
  encryptWithPassword,
  deriveDeleteAuth
} from '../security.js';

import { encodeBase64Url } from '../core/crypto/encoding.js';
import { HttpApiClient } from '../infrastructure/api/http-client.js';
import { InlinePowSolver } from '../infrastructure/pow/inline-solver.js';
import { storeDeleteToken } from '../utils/storage.js';
import { showLoading, showError, showSuccess } from '../ui/ui-manager.js';

const apiClient = new HttpApiClient();
const powSolver = new InlinePowSolver();

/**
 * Create a new paste
 */
export async function createPaste(): Promise<void> {
  // Get form values
  const text = (document.getElementById("paste") as HTMLTextAreaElement).value;
  const mins = parseInt((document.getElementById("mins") as HTMLInputElement).value || "60", 10);
  const password = (document.getElementById("password") as HTMLInputElement).value;
  const allowChat = (document.getElementById("allowChat") as HTMLInputElement)?.checked ?? false;
  const allowKeyCaching = (document.getElementById("allowKeyCaching") as HTMLInputElement)?.checked ?? false;

  // Privacy-preserving validation (without reading content)
  const contentValidation = validateContentSize(text);
  const expirationValidation = validateExpiration(mins);
  const passwordValidation = validatePassword(password);

  // Check for validation errors
  const allErrors = [
    ...contentValidation.errors,
    ...expirationValidation.errors,
    ...passwordValidation.errors
  ];

  if (allErrors.length > 0) {
    showError(allErrors.join('. '));
    return;
  }

  // Check UTF-8 validity without reading content
  if (!isValidUTF8(text)) {
    showError("Invalid character encoding. Please use standard text characters.");
    return;
  }

  // Show loading state
  showLoading(true, 'Preparing...');

  try {
    const expireTs = Math.floor(Date.now()/1000) + mins * 60;
    
    showLoading(true, 'Encrypting with password or PIN...');
    const { encryptedData, salt, iv } = await encryptWithPassword(text, password);
    const keyB64 = encodeBase64Url(salt); // Use salt as the "key" in the URL
    const ivB64 = encodeBase64Url(iv);
    const ctB64 = encodeBase64Url(encryptedData);
    
    // Derive delete authorization from password (allows viewers to delete)
    const deleteAuth = await deriveDeleteAuth(password, new Uint8Array(salt));

    // Solve proof-of-work challenge if enabled
    let pow = null;
    try {
      showLoading(true, 'Fetching proof-of-work challenge...');
      const challenge = await apiClient.getPowChallenge();
      if (challenge) {
        showLoading(true, 'Solving proof-of-work...');
        pow = await powSolver.solve(challenge);
      }
    } catch (error) {
      // If PoW is required by server, we must fail
      const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
      if (errorMsg.includes('pow_required') || errorMsg.includes('pow_invalid')) {
        throw error; // Re-throw PoW errors so they're handled properly
      }
      // PoW is optional, continue without it
      console.warn('PoW challenge failed:', error);
    }

    // Create paste using API client
    showLoading(true, 'Uploading paste...');
    const data = await apiClient.createPaste({
      ct: ctB64,
      iv: ivB64,
      meta: {
        expireTs,
        mime: "text/plain",
        allowChat,
        allowKeyCaching
      },
      pow,
      deleteAuth
    });
    const url = `${location.origin}/view.html?p=${encodeURIComponent(data.id)}#${keyB64}:${ivB64}`;
    const deleteUrl = `${location.origin}/delete.html?p=${encodeURIComponent(data.id)}&token=${encodeURIComponent(data.deleteToken)}`;

    // Store delete token for later use on view page (scoped to the current session)
    storeDeleteToken(data.id, data.deleteToken);
    
    // Show success result
    showSuccess(url, deleteUrl);
    
    // Securely clear sensitive data from memory
    secureClear(text);
    secureClear(keyB64);
    secureClear(ivB64);
    secureClear(ctB64);
    secureClear(password);
    
  } catch (error) {
    showError(getSafeErrorMessage(error, 'paste creation'));
  } finally {
    showLoading(false);
  }

  // Clear the textarea after successful paste creation
  (document.getElementById("paste") as HTMLTextAreaElement).value = "";
}

/**
 * Setup paste creation event handlers
 */
export function setupPasteCreation(): void {
  if (typeof document === 'undefined') return;
  const saveButton = document.getElementById("save");
  if (saveButton) {
    saveButton.addEventListener("click", createPaste);
  }
}
