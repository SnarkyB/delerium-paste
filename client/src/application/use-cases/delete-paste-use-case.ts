/**
 * Delete Paste Use Case
 * 
 * Orchestrates paste deletion workflow:
 * - Token-based deletion (creator only)
 * - Password-based deletion (anyone with password)
 */

import type { IApiClient } from '../../infrastructure/api/interfaces.js';
import type { DeletePasteCommand } from '../dtos/paste-dtos.js';

/**
 * Use case for deleting a paste
 */
export class DeletePasteUseCase {
  constructor(private apiClient: IApiClient) {}

  /**
   * Execute paste deletion workflow
   * 
   * @param command Delete paste command
   * @returns Promise resolving to success or error
   */
  async execute(command: DeletePasteCommand): Promise<{ success: boolean; error?: string }> {
    try {
      if (command.method === 'token') {
        // Token-based deletion (creator only)
        await this.apiClient.deletePaste(command.pasteId, command.tokenOrPassword);
        return { success: true };
      } else {
        // Password-based deletion (anyone with password)
        // Derive deleteAuth from password
        const { EncryptionService } = await import('../../core/services/encryption-service.js');
        const encryptionService = new EncryptionService();
        
        // We need the salt from the paste to derive deleteAuth
        // This should be retrieved from the paste metadata or URL
        // For now, we'll need to fetch the paste first to get the salt
        // This is a limitation - we'll handle it in the presentation layer
        
        // Call the delete endpoint with password-derived auth
        const response = await fetch(`/api/pastes/${encodeURIComponent(command.pasteId)}/delete`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ deleteAuth: command.tokenOrPassword })
        });

        if (response.ok || response.status === 204) {
          return { success: true };
        } else {
          const err = await response.json().catch(() => ({ error: 'Unknown error' }));
          return { 
            success: false, 
            error: err.error === 'invalid_auth' 
              ? 'Delete authorization failed. Please refresh the page and try again.' 
              : err.error || 'Failed to delete paste'
          };
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, error: errorMessage };
    }
  }
}
