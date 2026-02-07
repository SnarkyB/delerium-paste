/**
 * paste-creator.ts - Paste creation flow (Refactored)
 * 
 * Thin wrapper around presentation layer for backward compatibility.
 * Delegates to PasteCreatorView component.
 */

import { PasteCreatorView } from '../presentation/components/paste-creator-view.js';
import { CreatePasteUseCase } from '../application/use-cases/create-paste-use-case.js';
import { EncryptionService } from '../core/services/encryption-service.js';
import { PasteService } from '../core/services/paste-service.js';
import { HttpApiClient } from '../infrastructure/api/http-client.js';
import { InlinePowSolver } from '../infrastructure/pow/inline-solver.js';

// Initialize dependencies
const apiClient = new HttpApiClient();
const powSolver = new InlinePowSolver();
const encryptionService = new EncryptionService();
const pasteService = new PasteService();
const useCase = new CreatePasteUseCase(apiClient, powSolver, encryptionService, pasteService);
const view = new PasteCreatorView(useCase);

/**
 * Create a new paste (backward compatibility wrapper)
 */
export async function createPaste(): Promise<void> {
  await view.handleSubmit();
}

/**
 * Setup paste creation event handlers (backward compatibility wrapper)
 */
export function setupPasteCreation(): void {
  view.setup();
}
