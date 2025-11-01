/**
 * Paste domain models
 * 
 * Core domain models for paste operations, encryption, and API interactions.
 * These models represent the core business entities without any UI or infrastructure concerns.
 */

/**
 * Result of encrypting data
 */
export interface EncryptedData {
  /** Base64url-encoded encryption key */
  keyB64: string;
  /** Base64url-encoded IV */
  ivB64: string;
  /** Base64url-encoded ciphertext */
  ctB64: string;
}

/**
 * Proof-of-work challenge from server
 */
export interface PowChallenge {
  /** Random challenge string */
  challenge: string;
  /** Number of leading zero bits required */
  difficulty: number;
}

/**
 * Proof-of-work solution
 */
export interface PowSolution {
  /** Challenge string from server */
  challenge: string;
  /** Nonce that solves the challenge */
  nonce: number;
}

/**
 * Paste metadata sent to the API
 */
export interface PasteMetadata {
  /** Unix timestamp when paste expires */
  expireTs: number;
  /** Delete after first view */
  singleView: boolean;
  /** Maximum number of views allowed */
  viewsAllowed: number;
  /** MIME type hint */
  mime: string;
}

/**
 * API request payload for creating a paste
 */
export interface CreatePasteRequest {
  /** Base64url-encoded ciphertext */
  ct: string;
  /** Base64url-encoded IV */
  iv: string;
  /** Paste metadata */
  meta: PasteMetadata;
  /** Proof-of-work solution (optional) */
  pow?: PowSolution | null;
}

/**
 * API response when creating a paste
 */
export interface CreatePasteResponse {
  /** Paste ID */
  id: string;
  /** Deletion token */
  deleteToken: string;
}

/**
 * API response when retrieving a paste
 */
export interface GetPasteResponse {
  /** Base64url-encoded ciphertext */
  ct: string;
  /** Base64url-encoded IV */
  iv: string;
  /** Paste metadata */
  meta: PasteMetadata;
  /** Number of views remaining (null if unlimited) */
  viewsLeft?: number | null;
}

/**
 * Paste options when creating a new paste (UI layer)
 */
export interface PasteOptions {
  /** Expiration time in minutes */
  expirationMinutes: number;
  /** Maximum number of views allowed */
  maxViews?: number;
  /** Delete after first view */
  singleView: boolean;
  /** Password protection enabled */
  hasPassword: boolean;
}

/**
 * Paste creation result (domain model)
 */
export interface PasteCreated {
  /** Paste ID */
  id: string;
  /** Deletion token */
  deleteToken: string;
  /** Shareable URL with encryption key in fragment */
  shareUrl: string;
  /** Deletion URL */
  deleteUrl: string;
}
