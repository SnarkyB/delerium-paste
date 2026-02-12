/**
 * RateLimiter.kt - Rate limiting and brute-force protection
 * 
 * This file implements:
 * - Token bucket algorithm for rate limiting API requests
 * - Failed attempt tracking for brute-force protection
 * 
 * Each client (identified by IP or key) has a bucket that holds tokens. Each request
 * consumes one token. Tokens are refilled over time at a constant rate.
 * 
 * This provides protection against abuse and ensures fair resource usage.
 */

import java.util.concurrent.ConcurrentHashMap
import kotlin.math.min

/**
 * Token bucket rate limiter
 * 
 * Thread-safe implementation that tracks token buckets per key (typically IP address).
 * Tokens are refilled continuously based on elapsed time.
 * 
 * @property capacity Maximum number of tokens a bucket can hold
 * @property refillPerMinute Number of tokens to add per minute
 */
class TokenBucket(private val capacity: Int, private val refillPerMinute: Int) {
    /**
     * Internal state for a single bucket
     * @property tokens Current number of tokens (can be fractional)
     * @property last Last update timestamp in milliseconds
     */
    private data class State(var tokens: Double, var last: Long)
    
    private val map = ConcurrentHashMap<String, State>()

    /**
     * Check if a request should be allowed
     * 
     * Refills tokens based on elapsed time, then attempts to consume one token.
     * If at least one token is available, the request is allowed and the token
     * count is decremented.
     * 
     * @param key Unique identifier for the client (typically "POST:IP_ADDRESS")
     * @return true if the request is allowed, false if rate limited
     */
    fun allow(key: String): Boolean {
        val nowMs = System.currentTimeMillis()
        val st = map.computeIfAbsent(key) { State(capacity.toDouble(), nowMs) }
        synchronized(st) {
            val elapsedMin = (nowMs - st.last) / 60000.0
            st.tokens = min(capacity.toDouble(), st.tokens + elapsedMin * refillPerMinute)
            st.last = nowMs
            return if (st.tokens >= 1.0) { st.tokens -= 1.0; true } else false
        }
    }
}

/**
 * Failed attempt tracker for brute-force protection
 * 
 * Tracks failed authentication attempts per key (typically paste ID).
 * After maxAttempts failures within windowSeconds, the key is blocked
 * until the window expires.
 * 
 * Thread-safe implementation using ConcurrentHashMap with synchronized access.
 * 
 * @property maxAttempts Maximum failed attempts before blocking (default: 10)
 * @property windowSeconds Time window in seconds for tracking attempts (default: 300 = 5 minutes)
 */
class FailedAttemptTracker(
    private val maxAttempts: Int = 10,
    private val windowSeconds: Long = 300
) {
    /**
     * Internal state for tracking attempts on a single key
     * @property count Number of failed attempts
     * @property firstAttemptMs Timestamp of first attempt in window (milliseconds)
     */
    private data class AttemptState(var count: Int, var firstAttemptMs: Long)
    
    private val attempts = ConcurrentHashMap<String, AttemptState>()

    /**
     * Check if a key is currently blocked due to too many failed attempts
     * 
     * @param key Unique identifier (typically paste ID)
     * @return true if blocked, false if allowed
     */
    fun isBlocked(key: String): Boolean {
        val nowMs = System.currentTimeMillis()
        val state = attempts[key] ?: return false
        synchronized(state) {
            // Check if window has expired
            if (nowMs - state.firstAttemptMs > windowSeconds * 1000) {
                attempts.remove(key)
                return false
            }
            return state.count >= maxAttempts
        }
    }

    /**
     * Record a failed attempt for a key
     * 
     * @param key Unique identifier (typically paste ID)
     * @return true if key is now blocked (reached maxAttempts), false otherwise
     */
    fun recordFailure(key: String): Boolean {
        val nowMs = System.currentTimeMillis()
        val state = attempts.computeIfAbsent(key) { AttemptState(0, nowMs) }
        synchronized(state) {
            // Reset if window has expired
            if (nowMs - state.firstAttemptMs > windowSeconds * 1000) {
                state.count = 1
                state.firstAttemptMs = nowMs
                return false
            }
            state.count++
            return state.count >= maxAttempts
        }
    }

    /**
     * Record a successful attempt, clearing the failure count
     * Called when authentication succeeds to reset the counter
     * 
     * @param key Unique identifier (typically paste ID)
     */
    fun recordSuccess(key: String) {
        attempts.remove(key)
    }

    /**
     * Clean up expired entries to prevent memory leaks
     * Should be called periodically (e.g., hourly) in production
     * 
     * @return Number of entries cleaned up
     */
    fun cleanupExpired(): Int {
        val nowMs = System.currentTimeMillis()
        val expiredKeys = attempts.entries
            .filter { nowMs - it.value.firstAttemptMs > windowSeconds * 1000 }
            .map { it.key }
        expiredKeys.forEach { attempts.remove(it) }
        return expiredKeys.size
    }
}
