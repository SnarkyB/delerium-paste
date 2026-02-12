/**
 * FailedAttemptTrackerTest.kt - Unit tests for brute-force protection
 * 
 * Tests the FailedAttemptTracker class which provides protection against
 * brute-force attacks on password-based deletion.
 */

import org.junit.Assert.*
import org.junit.Test

class FailedAttemptTrackerTest {
    
    @Test
    fun testNewKeyIsNotBlocked() {
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 60)
        assertFalse(tracker.isBlocked("paste-123"))
    }
    
    @Test
    fun testRecordFailure_BelowThreshold_NotBlocked() {
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 60)
        
        // Record 2 failures (below threshold of 3)
        assertFalse(tracker.recordFailure("paste-123")) // 1st failure
        assertFalse(tracker.recordFailure("paste-123")) // 2nd failure
        
        // Should still not be blocked
        assertFalse(tracker.isBlocked("paste-123"))
    }
    
    @Test
    fun testRecordFailure_AtThreshold_BecomesBlocked() {
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 60)
        
        tracker.recordFailure("paste-123") // 1st
        tracker.recordFailure("paste-123") // 2nd
        val blocked = tracker.recordFailure("paste-123") // 3rd - should trigger block
        
        assertTrue(blocked)
        assertTrue(tracker.isBlocked("paste-123"))
    }
    
    @Test
    fun testRecordFailure_AboveThreshold_StaysBlocked() {
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 60)
        
        repeat(5) { tracker.recordFailure("paste-123") }
        
        assertTrue(tracker.isBlocked("paste-123"))
    }
    
    @Test
    fun testRecordSuccess_ClearsFailures() {
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 60)
        
        // Get close to the threshold
        tracker.recordFailure("paste-123")
        tracker.recordFailure("paste-123")
        
        // Success clears the counter
        tracker.recordSuccess("paste-123")
        
        // Key should no longer be tracked
        assertFalse(tracker.isBlocked("paste-123"))
        
        // Can fail twice more before being blocked
        assertFalse(tracker.recordFailure("paste-123"))
        assertFalse(tracker.recordFailure("paste-123"))
        assertTrue(tracker.recordFailure("paste-123")) // Now blocked
    }
    
    @Test
    fun testDifferentKeys_TrackedIndependently() {
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 60)
        
        // Block paste-1
        repeat(3) { tracker.recordFailure("paste-1") }
        assertTrue(tracker.isBlocked("paste-1"))
        
        // paste-2 should not be affected
        assertFalse(tracker.isBlocked("paste-2"))
        assertFalse(tracker.recordFailure("paste-2"))
    }
    
    @Test
    fun testCleanupExpired_RemovesOldEntries() {
        // Use a very short window for testing
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 0)
        
        // Record some failures
        tracker.recordFailure("paste-1")
        tracker.recordFailure("paste-2")
        
        // Wait a tiny bit for the window to expire
        Thread.sleep(10)
        
        // Cleanup should remove expired entries
        val cleaned = tracker.cleanupExpired()
        assertEquals(2, cleaned)
        
        // Keys should no longer be tracked
        assertFalse(tracker.isBlocked("paste-1"))
        assertFalse(tracker.isBlocked("paste-2"))
    }
    
    @Test
    fun testWindowExpiration_ResetsCounter() {
        // Use a very short window
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 0)
        
        // Record 2 failures
        tracker.recordFailure("paste-123")
        tracker.recordFailure("paste-123")
        
        // Wait for window to expire
        Thread.sleep(10)
        
        // Next failure should reset the counter (new window)
        assertFalse(tracker.recordFailure("paste-123")) // 1st in new window
        assertFalse(tracker.isBlocked("paste-123"))
    }
    
    @Test
    fun testIsBlocked_ExpiredWindow_NotBlocked() {
        // Use a very short window
        val tracker = FailedAttemptTracker(maxAttempts = 3, windowSeconds = 0)
        
        // Get blocked
        repeat(3) { tracker.recordFailure("paste-123") }
        assertTrue(tracker.isBlocked("paste-123"))
        
        // Wait for window to expire
        Thread.sleep(10)
        
        // Should no longer be blocked after window expires
        assertFalse(tracker.isBlocked("paste-123"))
    }
    
    @Test
    fun testDefaultValues() {
        val tracker = FailedAttemptTracker()
        
        // Default is 10 attempts
        repeat(9) { tracker.recordFailure("test") }
        assertFalse(tracker.isBlocked("test"))
        
        tracker.recordFailure("test")
        assertTrue(tracker.isBlocked("test"))
    }
}
