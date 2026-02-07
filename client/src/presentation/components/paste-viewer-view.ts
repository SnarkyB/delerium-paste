/**
 * Paste Viewer View Component
 * 
 * Presentation layer component for paste viewing.
 * Handles DOM manipulation and delegates business logic to use cases.
 */

import { ViewPasteUseCase } from '../../application/use-cases/view-paste-use-case.js';
import { DeletePasteUseCase } from '../../application/use-cases/delete-paste-use-case.js';
import { PasteService } from '../../core/services/paste-service.js';
import { safeDisplayContent, secureClear, getSafeErrorMessage } from '../../security.js';
import { WindowWithUI } from '../../ui/ui-manager.js';
import type { PasteMetadata } from '../../core/models/paste.js';
import { isFailure } from '../../core/models/result.js';

/**
 * Paste viewer view component
 */
export class PasteViewerView {
  private pasteService = new PasteService();

  constructor(
    private viewUseCase: ViewPasteUseCase,
    private deleteUseCase: DeletePasteUseCase
  ) {}

  /**
   * Check if chat should be initialized for this paste
   */
  shouldInitChat(meta: PasteMetadata): boolean {
    return meta.allowChat === true;
  }

  /**
   * Setup destroy button for password-based deletion
   */
  private setupDestroyButton(pasteId: string, deleteAuth: string): void {
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

        // Call delete use case
        const result = await this.deleteUseCase.execute({
          pasteId,
          method: 'password',
          tokenOrPassword: authForRequest
        });

        // Clear auth from request body string (best effort)
        secureClear(authForRequest);

        if (result.success) {
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
          window.alert(result.error || 'Failed to delete paste');
          destroyBtn.disabled = false;
          if (destroyText) destroyText.textContent = originalText;
        }
      } catch (error) {
        window.alert(`Failed to delete paste: ${(error as Error).message}`);
        destroyBtn.disabled = false;
        if (destroyText) destroyText.textContent = originalText;
      }
    });
  }

  /**
   * Handle paste viewing
   */
  async handleView(): Promise<{ pasteId: string; metadata: PasteMetadata; deleteAuth: string; salt: Uint8Array } | null> {
    if (!location.pathname.endsWith('view.html')) return null;

    const parsed = this.pasteService.parseViewUrl(new URL(window.location.href));
    if (!parsed) {
      const content = document.getElementById('content');
      if (content) {
        content.textContent = 'Missing paste ID or key.';
        content.classList.remove('loading');
        content.classList.add('error');
      }
      const updateStatus = (window as WindowWithUI).updateStatus;
      if (updateStatus) updateStatus(false, 'Missing information');
      return null;
    }

    const { pasteId, salt, iv } = parsed;
    const content = document.getElementById('content');
    const updateStatus = (window as WindowWithUI).updateStatus;
    const showInfo = (window as WindowWithUI).showInfo;

    try {
      if (updateStatus) updateStatus(true, 'Fetching paste...');

      // Prompt for password with retry logic using modal
      const passwordPrompt = async (attempt: number, remaining: number): Promise<string | null> => {
        // Dynamically import modal to avoid unused import warning
        const { getPasswordModal } = await import('./password-modal.js');
        const modal = getPasswordModal();
        
        const message = attempt === 0
          ? 'This paste is protected. Enter the password or PIN to decrypt it.'
          : undefined;
        
        // Show/update modal with retry info
        const password = await modal.show({
          title: 'Password Required',
          message,
          attempt,
          remainingAttempts: remaining,
          placeholder: 'Enter password or PIN'
        });

        // Close modal after getting password (success or cancel)
        // If password is wrong, modal will be shown again on next retry
        if (password) {
          modal.closeOnSuccess();
        }

        return password;
      };

      // Execute use case
      const result = await this.viewUseCase.execute(
        {
          pasteId,
          salt,
          iv,
          password: '' // Will be prompted by use case
        },
        passwordPrompt
      );

      if (isFailure(result)) {
        throw new Error(result.error);
      }

      // Safely display content
      if (content) {
        content.classList.remove('loading');
        content.classList.remove('error');
        safeDisplayContent(content, result.value.content);
      }

      // Update status and info
      if (updateStatus) updateStatus(true, 'Decrypted successfully');
      if (showInfo && result.value.metadata) {
        showInfo(result.value.metadata.expireTs);
      }

      // Setup destroy button
      if (result.value.deleteAuth) {
        this.setupDestroyButton(pasteId, result.value.deleteAuth);
        secureClear(result.value.deleteAuth);
      }

      // Return metadata for chat initialization
      const saltArray = new Uint8Array(
        await import('../../core/crypto/encoding.js').then(m => 
          new Uint8Array(m.decodeBase64Url(salt))
        )
      );

      return {
        pasteId,
        metadata: result.value.metadata,
        deleteAuth: result.value.deleteAuth,
        salt: saltArray
      };
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
      return null;
    }
  }

  /**
   * Setup paste viewing
   */
  setup(): void {
    if (typeof document === 'undefined' || typeof location === 'undefined') return;
    void this.handleView();
  }
}
