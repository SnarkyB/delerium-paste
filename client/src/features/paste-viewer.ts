/**
 * paste-viewer.ts - Paste viewing flow (Refactored)
 * 
 * Thin wrapper around presentation layer for backward compatibility.
 * Delegates to PasteViewerView component.
 */

import { PasteViewerView } from '../presentation/components/paste-viewer-view.js';
import { ViewPasteUseCase } from '../application/use-cases/view-paste-use-case.js';
import { DeletePasteUseCase } from '../application/use-cases/delete-paste-use-case.js';
import { EncryptionService } from '../core/services/encryption-service.js';
import { HttpApiClient } from '../infrastructure/api/http-client.js';
import { setupPasteChat } from './paste-chat.js';
import type { PasteMetadata } from '../core/models/paste.js';

// Initialize dependencies
const apiClient = new HttpApiClient();
const encryptionService = new EncryptionService();
const viewUseCase = new ViewPasteUseCase(apiClient, encryptionService);
const deleteUseCase = new DeletePasteUseCase(apiClient);
const view = new PasteViewerView(viewUseCase, deleteUseCase);

/** Returns true if chat should be initialized for this paste (for testing). */
export function shouldInitChat(meta: PasteMetadata): boolean {
  return view.shouldInitChat(meta);
}

/**
 * View a paste (backward compatibility wrapper)
 */
export async function viewPaste(): Promise<void> {
  if (!location.pathname.endsWith('view.html')) return;
  
  const result = await view.handleView();
  
  // Initialize chat if paste was successfully viewed
  if (result && shouldInitChat(result.metadata)) {
    setupPasteChat(
      result.pasteId,
      result.salt,
      result.metadata.allowKeyCaching ?? false,
      result.cachedKey
    );
  }
}

/**
 * Setup paste viewing (backward compatibility wrapper)
 */
export function setupPasteViewing(): void {
  void viewPaste();
}
