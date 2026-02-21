/**
 * Create Paste Use Case
 * 
 * Orchestrates the paste creation workflow:
 * 1. Validate input
 * 2. Encrypt content
 * 3. Solve PoW (if required)
 * 4. Submit to API
 * 5. Build URLs
 */

import type { IApiClient } from '../../infrastructure/api/interfaces.js';
import type { IPowSolver } from '../../infrastructure/pow/interfaces.js';
import { EncryptionService } from '../../core/services/encryption-service.js';
import { PasteService } from '../../core/services/paste-service.js';
import type { CreatePasteCommand, PasteCreated } from '../dtos/paste-dtos.js';
import type { Result } from '../../core/models/result.js';
import { success, failure, isFailure } from '../../core/models/result.js';
import { getSafeErrorMessage } from '../../security.js';

/**
 * Use case for creating a paste
 */
export class CreatePasteUseCase {
  constructor(
    private apiClient: IApiClient,
    private powSolver: IPowSolver,
    private encryptionService: EncryptionService,
    private pasteService: PasteService
  ) {}

  /**
   * Execute paste creation workflow
   * 
   * @param command Create paste command
   * @returns Result containing paste creation data or error
   */
  async execute(command: CreatePasteCommand): Promise<Result<PasteCreated, string>> {
    // 1. Validate input
    const validation = this.pasteService.validatePasteCreation(
      command.content,
      command.expirationMinutes,
      command.password
    );

    if (isFailure(validation)) {
      return failure(validation.error.join('. '));
    }

    try {
      // 2. Calculate expiration timestamp
      const expireTs = this.pasteService.calculateExpirationTimestamp(command.expirationMinutes);

      // 3. Encrypt content
      const encrypted = await this.encryptionService.encryptPaste(
        command.content,
        command.password
      );

      // 4. Derive delete authorization
      // Decode the base64url salt to get the original salt bytes
      const { decodeBase64Url } = await import('../../core/crypto/encoding.js');
      const saltArray = new Uint8Array(decodeBase64Url(encrypted.keyB64));
      const deleteAuth = await this.encryptionService.deriveDeleteAuth(
        command.password,
        saltArray
      );

      // 5. Solve PoW challenge (if required)
      let pow = null;
      try {
        const challenge = await this.apiClient.getPowChallenge();
        if (challenge) {
          pow = await this.powSolver.solve(challenge);
        }
      } catch (error) {
        // If PoW is required by server, we must fail
        const errorMsg = error instanceof Error ? error.message.toLowerCase() : String(error).toLowerCase();
        if (errorMsg.includes('pow_required') || errorMsg.includes('pow_invalid')) {
          return failure('Proof of work verification failed. Please try again.');
        }
        // PoW is optional, continue without it
        console.warn('PoW challenge failed:', error);
      }

      // 6. Submit to API
      const response = await this.apiClient.createPaste({
        ct: encrypted.ctB64,
        iv: encrypted.ivB64,
        meta: {
          expireTs,
          mime: command.mime ?? 'text/plain',
          allowChat: command.allowChat ?? true
        },
        pow,
        deleteAuth
      });

      // 7. Build URLs
      const shareUrl = this.pasteService.buildShareUrl(
        response.id,
        encrypted.keyB64,
        encrypted.ivB64
      );
      const deleteUrl = this.pasteService.buildDeleteUrl(
        response.id,
        response.deleteToken
      );

      return success({
        id: response.id,
        deleteToken: response.deleteToken,
        shareUrl,
        deleteUrl
      });
    } catch (error) {
      return failure(getSafeErrorMessage(error, 'paste creation'));
    }
  }
}
