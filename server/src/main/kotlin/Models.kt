/**
 * Models.kt - Data models for API request/response objects
 * 
 * This file defines all the data transfer objects (DTOs) used in the delerium-paste API.
 * All encryption happens client-side; the server only stores encrypted content.
 */

/**
 * Request body for creating a new paste
 * 
 * @property ct Ciphertext - the encrypted paste content (base64url encoded)
 * @property iv Initialization vector for AES-GCM encryption (base64url encoded)
 * @property meta Metadata about the paste (expiration, view limits, etc.)
 * @property pow Optional proof-of-work solution (required if PoW is enabled)
 * @property deleteAuth Password-derived delete authorization (allows viewers to delete)
 */
data class CreatePasteRequest(
    val ct: String,
    val iv: String,
    val meta: PasteMeta,
    val pow: PowSubmission? = null,
    val deleteAuth: String? = null
)

/**
 * Metadata for a paste
 * 
 * @property expireTs Unix timestamp when the paste should expire
 * @property mime MIME type hint for the content (e.g., "text/plain")
 * @property allowKeyCaching If true, viewers can cache decryption key for chat convenience
 * @property allowChat If true, viewers can use anonymous chat for this paste
 */
data class PasteMeta(
    val expireTs: Long,
    val mime: String? = null,
    val allowKeyCaching: Boolean? = null,
    val allowChat: Boolean? = null
)

/**
 * Proof-of-work submission
 * 
 * @property challenge The challenge string received from /api/pow
 * @property nonce The nonce value that produces sufficient leading zero bits
 */
data class PowSubmission(val challenge: String, val nonce: Long)

/**
 * Response after successfully creating a paste
 * 
 * @property id The unique ID for the paste (used in URLs)
 * @property deleteToken Secret token for deleting the paste (should be kept private)
 */
data class CreatePasteResponse(val id: String, val deleteToken: String)

/**
 * Payload returned when retrieving a paste
 * 
 * @property ct Ciphertext - the encrypted paste content
 * @property iv Initialization vector for decryption
 * @property meta Original metadata from paste creation
 */
data class PastePayload(val ct: String, val iv: String, val meta: PasteMeta)

/**
 * Error response format
 * 
 * @property error Error code/message string
 */
data class ErrorResponse(val error: String)

/**
 * Health check response payload
 *
 * @property status Overall service status string ("ok" or "degraded")
 * @property timestampMs Server timestamp in milliseconds
 * @property powEnabled Whether proof-of-work is enabled
 * @property rateLimitingEnabled Whether rate limiting is enabled
 * @property databaseHealthy Whether database connectivity is healthy
 */
data class HealthStatus(
    val status: String = "ok",
    val timestampMs: Long = System.currentTimeMillis(),
    val powEnabled: Boolean,
    val rateLimitingEnabled: Boolean,
    val databaseHealthy: Boolean = true
)

/**
 * Request body for posting a chat message
 *
 * @property ct Ciphertext - the encrypted message (base64url encoded)
 * @property iv Initialization vector for AES-GCM encryption (base64url encoded)
 */
data class PostChatMessageRequest(
    val ct: String,
    val iv: String
)

/**
 * Response after successfully posting a chat message
 *
 * @property count Total number of messages for this paste
 */
data class PostChatMessageResponse(val count: Int)

/**
 * Chat message payload
 *
 * @property ct Ciphertext - the encrypted message
 * @property iv Initialization vector for decryption
 * @property timestamp Unix timestamp when message was created
 */
data class ChatMessage(
    val ct: String,
    val iv: String,
    val timestamp: Long
)

/**
 * Response containing list of chat messages
 *
 * @property messages List of encrypted chat messages
 */
data class GetChatMessagesResponse(val messages: List<ChatMessage>)

/**
 * Request body for password-based paste deletion
 *
 * @property deleteAuth Password-derived delete authorization
 */
data class DeleteWithAuthRequest(val deleteAuth: String)
