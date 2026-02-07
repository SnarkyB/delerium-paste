/**
 * Paste Creator View Component
 * 
 * Presentation layer component for paste creation.
 * Handles DOM manipulation and delegates business logic to use cases.
 */

import { CreatePasteUseCase } from '../../application/use-cases/create-paste-use-case.js';
import { showLoading, showError, showSuccess } from '../../ui/ui-manager.js';
import { secureClear } from '../../security.js';
import { storeDeleteToken } from '../../utils/storage.js';
import { isFailure } from '../../core/models/result.js';

/**
 * Paste creator view component
 */
export class PasteCreatorView {
  constructor(private useCase: CreatePasteUseCase) {}

  /**
   * Handle paste creation form submission
   */
  async handleSubmit(): Promise<void> {
    // Get form values
    const text = (document.getElementById('paste') as HTMLTextAreaElement)?.value || '';
    const mins = parseInt((document.getElementById('mins') as HTMLInputElement)?.value || '60', 10);
    const password = (document.getElementById('password') as HTMLInputElement)?.value || '';
    const allowChat = (document.getElementById('allowChat') as HTMLInputElement)?.checked ?? false;
    const allowKeyCaching = (document.getElementById('allowKeyCaching') as HTMLInputElement)?.checked ?? false;

    // Show loading state
    showLoading(true, 'Preparing...');

    try {
      // Execute use case
      const result = await this.useCase.execute({
        content: text,
        expirationMinutes: mins,
        password,
        allowChat,
        allowKeyCaching
      });

      if (isFailure(result)) {
        showError(result.error);
        return;
      }

      // Store delete token
      storeDeleteToken(result.value.id, result.value.deleteToken);

      // Show success result
      showSuccess(result.value.shareUrl, result.value.deleteUrl);

      // Securely clear sensitive data from memory
      secureClear(text);
      secureClear(password);

      // Clear the textarea after successful paste creation
      const pasteTextarea = document.getElementById('paste') as HTMLTextAreaElement;
      if (pasteTextarea) {
        pasteTextarea.value = '';
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      showError(errorMessage);
    } finally {
      showLoading(false);
    }
  }

  /**
   * Setup event handlers for paste creation
   */
  setup(): void {
    if (typeof document === 'undefined') return;
    
    const saveButton = document.getElementById('save');
    if (saveButton) {
      saveButton.addEventListener('click', () => {
        void this.handleSubmit();
      });
    }
  }
}
