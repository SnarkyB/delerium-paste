/**
 * View Paste Use Case
 * 
 * Orchestrates the paste viewing workflow:
 * 1. Retrieve paste from API
 * 2. Decrypt with password (with retry logic)
 * 3. Derive delete authorization
 */

import type { IApiClient } from '../../infrastructure/api/interfaces.js';
import { EncryptionService } from '../../core/services/encryption-service.js';
import type { ViewPasteCommand, PasteViewResult } from '../dtos/paste-dtos.js';
import type { Result } from '../../core/models/result.js';
import { success, failure } from '../../core/models/result.js';

const MAX_PASSWORD_ATTEMPTS = 5;

/**
 * Use case for viewing a paste
 */
export class ViewPasteUseCase {
  constructor(
    private apiClient: IApiClient,
    private encryptionService: EncryptionService
  ) {}

  /**
   * Execute paste viewing workflow
   * 
   * @param command View paste command
   * @param onPasswordPrompt Callback to prompt for password (returns password or null)
   * @returns Result containing decrypted paste data or error
   */
  async execute(
    command: ViewPasteCommand,
    onPasswordPrompt: (attempt: number, remaining: number) => string | null
  ): Promise<Result<PasteViewResult, string>> {
    try {
      // 1. Retrieve paste from API
      const response = await this.apiClient.retrievePaste(command.pasteId);
      const { ct, iv, meta } = response;

      // Use IV from URL fragment if provided, otherwise use server IV
      const ivToUse = command.iv || iv;

      // 2. Decrypt with password (with retry logic)
      let attempts = 0;
      let content = '';
      let deleteAuth: string | null = null;

      while (attempts < MAX_PASSWORD_ATTEMPTS && !content) {
        const attemptsRemaining = MAX_PASSWORD_ATTEMPTS - attempts;
        const password = onPasswordPrompt(attempts, attemptsRemaining);
        
        if (!password) {
          return failure('A password or PIN is required to decrypt this content.');
        }

        try {
          // Decrypt content
          content = await this.encryptionService.decryptPaste(
            ct,
            password,
            command.salt,
            ivToUse
          );

          // Derive deleteAuth after successful decryption
          const { decodeBase64Url } = await import('../../core/crypto/encoding.js');
          const saltArray = new Uint8Array(decodeBase64Url(command.salt));
          deleteAuth = await this.encryptionService.deriveDeleteAuth(
            password,
            saltArray
          );
        } catch (error) {
          attempts++;
          if (attempts >= MAX_PASSWORD_ATTEMPTS) {
            return failure('Maximum password attempts exceeded. Incorrect password or PIN.');
          }
          // Continue to retry
        }
      }

      if (!content || !deleteAuth) {
        return failure('Failed to decrypt paste. Maximum attempts exceeded.');
      }

      return success({
        content,
        metadata: meta,
        deleteAuth
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return failure(errorMessage);
    }
  }
}
