/**
 * Application Layer DTOs
 * 
 * Data Transfer Objects for application layer use cases.
 * These DTOs represent the input/output contracts for use cases.
 */

import type { PasteMetadata } from '../../core/models/paste.js';
import type { DecryptedChatMessage } from '../../core/services/encryption-service.js';

/**
 * Command to create a paste
 */
export interface CreatePasteCommand {
  content: string;
  expirationMinutes: number;
  password: string;
  allowChat?: boolean;
  /** Optional MIME type for image pastes. Defaults to 'text/plain'. */
  mime?: string;
}

/**
 * Result of creating a paste
 */
export interface PasteCreated {
  id: string;
  deleteToken: string;
  shareUrl: string;
  deleteUrl: string;
}

/**
 * Command to view a paste
 */
export interface ViewPasteCommand {
  pasteId: string;
  salt: string;
  iv: string;
  password: string;
}

/**
 * Result of viewing a paste
 */
export interface PasteViewResult {
  content: string;
  metadata: PasteMetadata;
  deleteAuth: string;
}

/**
 * Command to delete a paste
 */
export interface DeletePasteCommand {
  pasteId: string;
  method: 'token' | 'password';
  tokenOrPassword: string;
}

/**
 * Result of chat messages refresh
 */
export interface ChatMessagesResult {
  messages: DecryptedChatMessage[];
}

/**
 * Command to send a chat message
 */
export interface SendChatMessageCommand {
  pasteId: string;
  message: string;
  username: string;
  password: string;
}
