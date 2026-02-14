/**
 * StorageTest.kt - Tests for paste storage and expiration logic
 * 
 * Tests verify that expired pastes are automatically deleted from the database.
 */

import org.jetbrains.exposed.sql.Database
import org.jetbrains.exposed.sql.SqlExpressionBuilder.eq
import org.jetbrains.exposed.sql.insert
import org.jetbrains.exposed.sql.selectAll
import org.jetbrains.exposed.sql.transactions.transaction
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.time.Instant

class StorageTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private lateinit var keyManager: DataKeyManager
    private val testPepper = "test-pepper-12345"

    @Before
    fun setUp() {
        // Use a temporary file database for testing (more reliable than in-memory)
        testDbFile = File.createTempFile("test_paste_db", ".sqlite")
        testDbFile.deleteOnExit()
        // Enable foreign keys via JDBC URL parameter for SQLite
        // This ensures CASCADE DELETE works correctly for chat messages
        val jdbcUrl = "jdbc:sqlite:${testDbFile.absolutePath}?foreign_keys=on"
        db = Database.connect(jdbcUrl, driver = "org.sqlite.JDBC")
        // Create repo - this will create tables in its init block
        keyManager = createTestKeyManager()
        repo = PasteRepo(db, testPepper, keyManager)
    }

    @After
    fun tearDown() {
        // Clean up test database file
        if (::testDbFile.isInitialized && testDbFile.exists()) {
            testDbFile.delete()
        }
    }

    @Test
    fun testEncryptedAtRest_RoundTrip() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600
        val id = "roundtrip1"
        val ct = "encrypted-content-roundtrip"
        val iv = "iv-roundtrip-123"

        repo.create(
            id = id,
            ct = ct,
            iv = iv,
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token-roundtrip"
        )

        val payload = repo.getPayloadIfAvailable(id)
        assertNotNull("Payload should be returned for active paste", payload)
        assertEquals(ct, payload!!.ct)
        assertEquals(iv, payload.iv)
    }

    @Test
    fun testLegacyRowMigratesOnRead() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600
        val id = "legacy1"
        val ct = "legacy-ct"
        val iv = "legacy-iv"

        transaction(db) {
            Pastes.insert {
                it[Pastes.id] = id
                it[Pastes.ct] = ct
                it[Pastes.iv] = iv
                it[Pastes.encKeyId] = null
                it[Pastes.expireTs] = futureExpiry
                it[Pastes.mime] = "text/plain"
                it[Pastes.deleteTokenHash] = "hash"
                it[Pastes.deleteAuthHash] = null
                it[Pastes.createdAt] = now
                it[Pastes.allowKeyCaching] = false
            }
        }

        val payload = repo.getPayloadIfAvailable(id)
        assertNotNull("Payload should be returned for legacy paste", payload)
        assertEquals(ct, payload!!.ct)
        assertEquals(iv, payload.iv)

        val row = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq id }.single()
        }
        assertNotNull("Legacy row should be migrated with encKeyId", row[Pastes.encKeyId])
        assertNotEquals("Encrypted ct should not match plaintext", ct, row[Pastes.ct])
        assertNotEquals("Encrypted iv should not match plaintext", iv, row[Pastes.iv])
    }

    @Test
    fun testRotationReencryptsData() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600
        val id = "rotate1"
        val ct = "rotate-ct"
        val iv = "rotate-iv"

        repo.create(
            id = id,
            ct = ct,
            iv = iv,
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token-rotate"
        )

        val beforeRow = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq id }.single()
        }
        val beforeKeyId = beforeRow[Pastes.encKeyId]
        val beforeCt = beforeRow[Pastes.ct]
        val beforeIv = beforeRow[Pastes.iv]

        keyManager.rotate()
        val updated = repo.rotateAtRestEncryption(batchSize = 10)
        assertTrue("Expected at least one row to be updated", updated >= 1)

        val afterRow = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq id }.single()
        }
        assertNotNull(afterRow[Pastes.encKeyId])
        assertNotEquals(beforeKeyId, afterRow[Pastes.encKeyId])
        assertNotEquals(beforeCt, afterRow[Pastes.ct])
        assertNotEquals(beforeIv, afterRow[Pastes.iv])

        val payload = repo.getPayloadIfAvailable(id)
        assertEquals(ct, payload!!.ct)
        assertEquals(iv, payload.iv)
    }

    @Test
    fun testMissingKeyFailsDecryption() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600
        val id = "missingkey1"
        repo.create(
            id = id,
            ct = "ct-missing",
            iv = "iv-missing",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token-missing"
        )

        val otherRepo = PasteRepo(db, testPepper, createTestKeyManager())
        assertThrows(IllegalStateException::class.java) {
            otherRepo.getPayloadIfAvailable(id)
        }
    }

    @Test
    fun testDeleteExpired_DeletesOnlyExpiredPastes() {
        val now = Instant.now().epochSecond
        val pastExpiry = now - 3600 // 1 hour ago
        val futureExpiry = now + 3600 // 1 hour from now

        // Create expired paste
        val expiredId = "expired123"
        repo.create(
            id = expiredId,
            ct = "encrypted-content-1",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = pastExpiry),
            rawDeleteToken = "token1"
        )

        // Create non-expired paste
        val activeId = "active123"
        repo.create(
            id = activeId,
            ct = "encrypted-content-2",
            iv = "iv12345678902",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token2"
        )

        // Verify both pastes exist in database (getIfAvailable filters expired, so check directly)
        val expiredExistsBefore = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq expiredId }.singleOrNull() != null
        }
        assertTrue("Expired paste should exist in database before cleanup", expiredExistsBefore)
        assertNotNull("Active paste should exist before cleanup", repo.getIfAvailable(activeId))

        // Delete expired pastes
        val deletedCount = repo.deleteExpired()

        // Verify results
        assertEquals("Should delete 1 expired paste", 1, deletedCount)
        val expiredExistsAfter = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq expiredId }.singleOrNull() != null
        }
        assertFalse("Expired paste should be deleted from database", expiredExistsAfter)
        assertNotNull("Active paste should still exist", repo.getIfAvailable(activeId))
    }

    @Test
    fun testDeleteExpired_DeletesMultipleExpiredPastes() {
        val now = Instant.now().epochSecond
        val pastExpiry1 = now - 7200 // 2 hours ago
        val pastExpiry2 = now - 1800 // 30 minutes ago
        val futureExpiry = now + 3600 // 1 hour from now

        // Create multiple expired pastes
        repo.create("expired1", "ct1", "iv12345678901", PasteMeta(expireTs = pastExpiry1), "token1")
        repo.create("expired2", "ct2", "iv12345678902", PasteMeta(expireTs = pastExpiry2), "token2")
        
        // Create non-expired paste
        repo.create("active1", "ct3", "iv12345678903", PasteMeta(expireTs = futureExpiry), "token3")

        // Delete expired pastes
        val deletedCount = repo.deleteExpired()

        // Verify results
        assertEquals("Should delete 2 expired pastes", 2, deletedCount)
        val expired1Exists = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq "expired1" }.singleOrNull() != null
        }
        val expired2Exists = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq "expired2" }.singleOrNull() != null
        }
        assertFalse("First expired paste should be deleted", expired1Exists)
        assertFalse("Second expired paste should be deleted", expired2Exists)
        assertNotNull("Active paste should still exist", repo.getIfAvailable("active1"))
    }

    @Test
    fun testDeleteExpired_NoExpiredPastes_ReturnsZero() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600

        // Create only non-expired paste
        repo.create("active1", "ct1", "iv12345678901", PasteMeta(expireTs = futureExpiry), "token1")

        // Delete expired pastes
        val deletedCount = repo.deleteExpired()

        // Verify results
        assertEquals("Should delete 0 pastes", 0, deletedCount)
        assertNotNull("Active paste should still exist", repo.getIfAvailable("active1"))
    }

    @Test
    fun testDeleteExpired_EmptyDatabase_ReturnsZero() {
        // Delete expired pastes from empty database
        val deletedCount = repo.deleteExpired()

        // Verify results
        assertEquals("Should delete 0 pastes from empty database", 0, deletedCount)
    }

    @Test
    fun testDeleteExpired_DeletesExactlyExpiredPastes() {
        val now = Instant.now().epochSecond
        val exactlyNow = now // Paste expiring exactly now should be deleted

        // Create paste expiring exactly now
        repo.create("exact1", "ct1", "iv12345678901", PasteMeta(expireTs = exactlyNow), "token1")
        
        // Create paste expiring in the past
        repo.create("past1", "ct2", "iv12345678902", PasteMeta(expireTs = now - 10), "token2")
        
        // Create paste expiring well in the future so deleteExpired()'s fresh clock doesn't cross it
        repo.create("future1", "ct3", "iv12345678903", PasteMeta(expireTs = now + 60), "token3")

        // Delete expired pastes (uses fresh Instant.now() inside; avoid 1s boundary race)
        val deletedCount = repo.deleteExpired()

        // Verify results
        assertEquals("Should delete 2 expired pastes (exactly now and past)", 2, deletedCount)
        val exact1Exists = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq "exact1" }.singleOrNull() != null
        }
        val past1Exists = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq "past1" }.singleOrNull() != null
        }
        assertFalse("Paste expiring exactly now should be deleted", exact1Exists)
        assertFalse("Paste expiring in the past should be deleted", past1Exists)
        assertNotNull("Paste expiring in the future should not be deleted", repo.getIfAvailable("future1"))
    }

    @Test
    fun testGetIfAvailable_FiltersExpiredPastes() {
        val now = Instant.now().epochSecond
        val pastExpiry = now - 3600
        val futureExpiry = now + 3600

        // Create expired paste
        repo.create("expired1", "ct1", "iv12345678901", PasteMeta(expireTs = pastExpiry), "token1")
        
        // Create non-expired paste
        repo.create("active1", "ct2", "iv12345678902", PasteMeta(expireTs = futureExpiry), "token2")

        // Verify getIfAvailable filters expired pastes (but they still exist in DB)
        val expiredExistsInDb = transaction(db) {
            Pastes.selectAll().where { Pastes.id eq "expired1" }.singleOrNull() != null
        }
        assertTrue("Expired paste should exist in database", expiredExistsInDb)
        assertNull("Expired paste should not be available via getIfAvailable", repo.getIfAvailable("expired1"))
        assertNotNull("Active paste should be available", repo.getIfAvailable("active1"))
    }

    @Test
    fun testAddChatMessage_Maintains50MessageLimit() {
        val pasteId = "test-paste-chat"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste first
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1"
        )

        // Add 55 messages (should trigger FIFO deletion)
        for (i in 1..55) {
            repo.addChatMessage(pasteId, "ct$i", "iv$i")
        }

        // Verify only 50 messages remain
        val messages = repo.getChatMessages(pasteId)
        assertEquals("Should maintain 50 message limit", 50, messages.size)

        // Verify oldest messages were deleted (messages 1-5 should be gone)
        val messageCts = messages.map { it.ct }.toSet()
        assertFalse("Oldest message (ct1) should be deleted", messageCts.contains("ct1"))
        assertFalse("Oldest message (ct5) should be deleted", messageCts.contains("ct5"))
        assertTrue("Newest message (ct55) should exist", messageCts.contains("ct55"))
    }

    @Test
    fun testAddChatMessage_BatchDeleteOptimization() {
        val pasteId = "test-paste-batch"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste first
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1"
        )

        // Add exactly 50 messages
        for (i in 1..50) {
            repo.addChatMessage(pasteId, "ct$i", "iv$i")
        }

        // Verify we have 50 messages
        val messagesBefore = repo.getChatMessages(pasteId)
        assertEquals("Should have 50 messages", 50, messagesBefore.size)

        // Add 10 more messages (should delete oldest 10 in batch)
        for (i in 51..60) {
            repo.addChatMessage(pasteId, "ct$i", "iv$i")
        }

        // Verify only 50 messages remain
        val messagesAfter = repo.getChatMessages(pasteId)
        assertEquals("Should maintain 50 message limit after batch delete", 50, messagesAfter.size)

        // Verify oldest 10 messages (ct1-ct10) were deleted
        val messageCts = messagesAfter.map { it.ct }.toSet()
        for (i in 1..10) {
            assertFalse("Oldest message (ct$i) should be deleted", messageCts.contains("ct$i"))
        }

        // Verify newest messages (ct51-ct60) exist
        for (i in 51..60) {
            assertTrue("Newest message (ct$i) should exist", messageCts.contains("ct$i"))
        }
    }

    @Test
    fun testAddChatMessage_EmptyListDoesNotCrash() {
        val pasteId = "test-paste-empty"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste first
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1"
        )

        // Add messages up to exactly 50 (no deletion needed)
        for (i in 1..50) {
            repo.addChatMessage(pasteId, "ct$i", "iv$i")
        }

        // Verify we have 50 messages
        val messages = repo.getChatMessages(pasteId)
        assertEquals("Should have 50 messages", 50, messages.size)

        // Adding one more should trigger deletion, but empty list check prevents crash
        val count = repo.addChatMessage(pasteId, "ct51", "iv51")
        assertEquals("Should return 50 after deletion", 50, count)
    }

    @Test
    fun testGetChatMessages_ReturnsEmptyListForPasteWithNoMessages() {
        val pasteId = "test-paste-no-messages"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste but don't add messages
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1"
        )

        // Get messages for paste with no messages
        val messages = repo.getChatMessages(pasteId)

        // Assert
        assertTrue("Should return empty list", messages.isEmpty())
    }

    @Test
    fun testGetChatMessages_ReturnsMessagesOrderedByTimestamp() {
        val pasteId = "test-paste-ordered"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste first
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1"
        )

        // Add messages with small delays to ensure different timestamps
        for (i in 1..5) {
            repo.addChatMessage(pasteId, "ct$i", "iv$i")
            Thread.sleep(10) // Small delay to ensure different timestamps
        }

        // Get messages
        val messages = repo.getChatMessages(pasteId)

        // Assert - Messages should be ordered by timestamp (oldest first)
        assertEquals("Should have 5 messages", 5, messages.size)
        for (i in 1 until messages.size) {
            assertTrue(
                "Messages should be ordered by timestamp (oldest first)",
                messages[i].timestamp >= messages[i - 1].timestamp
            )
        }
    }

    // ========== Security Tests: Delete with Auth ==========

    @Test
    fun testDeleteIfAuthMatches_Success_WithCorrectAuth() {
        // SECURITY: Password-based deletion should work with correct auth
        val pasteId = "test-paste-auth"
        val futureExpiry = Instant.now().epochSecond + 3600
        val deleteAuth = "password-derived-auth-key-12345"

        // Create paste with deleteAuth
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1",
            rawDeleteAuth = deleteAuth
        )

        // Verify paste exists
        assertNotNull("Paste should exist before deletion", repo.getIfAvailable(pasteId))

        // Delete with correct auth
        val deleted = repo.deleteIfAuthMatches(pasteId, deleteAuth)
        assertTrue("Should delete paste with correct auth", deleted)

        // Verify paste is gone
        assertNull("Paste should not exist after deletion", repo.getIfAvailable(pasteId))
    }

    @Test
    fun testDeleteIfAuthMatches_Fails_WithWrongAuth() {
        // SECURITY: Password-based deletion should fail with wrong auth
        val pasteId = "test-paste-wrong-auth"
        val futureExpiry = Instant.now().epochSecond + 3600
        val deleteAuth = "correct-auth-key"
        val wrongAuth = "wrong-auth-key"

        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1",
            rawDeleteAuth = deleteAuth
        )

        // Try delete with wrong auth
        val deleted = repo.deleteIfAuthMatches(pasteId, wrongAuth)
        assertFalse("Should NOT delete paste with wrong auth", deleted)

        // Verify paste still exists
        assertNotNull("Paste should still exist after failed deletion", repo.getIfAvailable(pasteId))
    }

    @Test
    fun testDeleteIfAuthMatches_Fails_WhenNoAuthHashStored() {
        // SECURITY: Password-based deletion should fail when paste has no auth hash
        val pasteId = "test-paste-no-auth"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste WITHOUT deleteAuth (null)
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1",
            rawDeleteAuth = null  // No auth hash stored
        )

        // Try delete with any auth
        val deleted = repo.deleteIfAuthMatches(pasteId, "any-auth-value")
        assertFalse("Should NOT delete paste when no auth hash is stored", deleted)

        // Verify paste still exists
        assertNotNull("Paste should still exist", repo.getIfAvailable(pasteId))
    }

    @Test
    fun testDeleteIfAuthMatches_Fails_ForNonExistentPaste() {
        // SECURITY: Deletion should fail for non-existent paste
        val deleted = repo.deleteIfAuthMatches("nonexistent-paste", "any-auth")
        assertFalse("Should return false for non-existent paste", deleted)
    }

    @Test
    fun testDeleteIfAuthMatches_CascadesDeleteToChatMessages() {
        // SECURITY: Chat messages MUST be deleted when paste is deleted via auth
        val pasteId = "test-paste-auth-cascade"
        val futureExpiry = Instant.now().epochSecond + 3600
        val deleteAuth = "cascade-auth-key"

        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "token1",
            rawDeleteAuth = deleteAuth
        )

        // Add chat messages
        for (i in 1..3) {
            repo.addChatMessage(pasteId, "secret-message-$i", "iv$i")
        }

        // Verify messages exist
        assertEquals("Should have 3 messages", 3, repo.getChatMessages(pasteId).size)

        // Delete with auth
        val deleted = repo.deleteIfAuthMatches(pasteId, deleteAuth)
        assertTrue("Should delete paste", deleted)

        // SECURITY CHECK: Chat messages must also be deleted
        val messagesAfter = repo.getChatMessages(pasteId)
        assertTrue("All chat messages must be deleted via CASCADE", messagesAfter.isEmpty())
    }

    // ========== Security Tests: Cascade Delete ==========

    @Test
    fun testChatMessages_CascadeDelete_WhenPasteDeleted() {
        // SECURITY: Chat messages MUST be deleted when paste is deleted
        // This prevents orphaned sensitive data from remaining in the database
        val pasteId = "test-paste-cascade"
        val futureExpiry = Instant.now().epochSecond + 3600

        // Create paste
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = "cascade-token"
        )

        // Add multiple chat messages
        for (i in 1..5) {
            repo.addChatMessage(pasteId, "secret-message-$i", "iv$i")
        }

        // Verify messages exist
        val messagesBefore = repo.getChatMessages(pasteId)
        assertEquals("Should have 5 messages before deletion", 5, messagesBefore.size)

        // Delete the paste
        val deleted = repo.delete(pasteId)
        assertTrue("Paste should be deleted", deleted)

        // SECURITY CHECK: All chat messages must be deleted via CASCADE
        val messagesAfter = repo.getChatMessages(pasteId)
        assertTrue("All chat messages must be deleted when paste is deleted", messagesAfter.isEmpty())
    }

    @Test
    fun testChatMessages_CascadeDelete_WhenPasteDeletedWithToken() {
        // SECURITY: Chat messages MUST be deleted when paste is deleted via token
        val pasteId = "test-paste-cascade-token"
        val futureExpiry = Instant.now().epochSecond + 3600
        val deleteToken = "secure-delete-token-123"

        // Create paste
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = futureExpiry),
            rawDeleteToken = deleteToken
        )

        // Add chat messages
        for (i in 1..3) {
            repo.addChatMessage(pasteId, "private-chat-$i", "iv$i")
        }

        // Verify messages exist
        val messagesBefore = repo.getChatMessages(pasteId)
        assertEquals("Should have 3 messages before deletion", 3, messagesBefore.size)

        // Delete with token
        val deleted = repo.deleteIfTokenMatches(pasteId, deleteToken)
        assertTrue("Paste should be deleted with valid token", deleted)

        // SECURITY CHECK: All chat messages must be deleted
        val messagesAfter = repo.getChatMessages(pasteId)
        assertTrue("All chat messages must be deleted when paste is deleted via token", messagesAfter.isEmpty())
    }

    @Test
    fun testChatMessages_CascadeDelete_WhenExpiredPastesCleaned() {
        // SECURITY: Chat messages MUST be deleted when expired pastes are cleaned up
        val now = Instant.now().epochSecond
        val pastExpiry = now - 3600 // 1 hour ago

        val pasteId = "expired-paste-with-chat"

        // Create expired paste
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = pastExpiry),
            rawDeleteToken = "token"
        )

        // Add chat messages to expired paste
        for (i in 1..3) {
            repo.addChatMessage(pasteId, "expired-message-$i", "iv$i")
        }

        // Verify messages exist (directly, since paste is expired)
        val messagesBefore = repo.getChatMessages(pasteId)
        assertEquals("Should have 3 messages before cleanup", 3, messagesBefore.size)

        // Run expired cleanup
        val deletedCount = repo.deleteExpired()
        assertEquals("Should delete 1 expired paste", 1, deletedCount)

        // SECURITY CHECK: All chat messages must be deleted via CASCADE
        val messagesAfter = repo.getChatMessages(pasteId)
        assertTrue("All chat messages must be deleted when expired paste is cleaned up", messagesAfter.isEmpty())
    }

    // ========================================
    // Aggregate Statistics Tests (for metrics)
    // ========================================

    @Test
    fun testGetActivePasteCount_ReturnsOnlyActivePastes() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600
        val pastExpiry = now - 100

        // Create active pastes
        repo.create("active1", "ct1", "iv1", PasteMeta(expireTs = futureExpiry), "token1")
        repo.create("active2", "ct2", "iv2", PasteMeta(expireTs = futureExpiry), "token2")
        repo.create("active3", "ct3", "iv3", PasteMeta(expireTs = futureExpiry), "token3")

        // Create expired pastes
        repo.create("expired1", "ct4", "iv4", PasteMeta(expireTs = pastExpiry), "token4")
        repo.create("expired2", "ct5", "iv5", PasteMeta(expireTs = pastExpiry), "token5")

        val count = repo.getActivePasteCount()
        assertEquals("Should count only active (non-expired) pastes", 3L, count)
    }

    @Test
    fun testGetActivePasteCount_EmptyDatabase() {
        val count = repo.getActivePasteCount()
        assertEquals("Empty database should return 0", 0L, count)
    }

    @Test
    fun testGetTotalChatMessageCount_CountsAllMessages() {
        val now = Instant.now().epochSecond
        val futureExpiry = now + 3600

        // Create two pastes with chat messages
        repo.create("paste1", "ct1", "iv1", PasteMeta(expireTs = futureExpiry), "token1")
        repo.create("paste2", "ct2", "iv2", PasteMeta(expireTs = futureExpiry), "token2")

        // Add messages to both pastes
        repo.addChatMessage("paste1", "msg1-ct", "msg1-iv")
        repo.addChatMessage("paste1", "msg2-ct", "msg2-iv")
        repo.addChatMessage("paste2", "msg3-ct", "msg3-iv")

        val count = repo.getTotalChatMessageCount()
        assertEquals("Should count all chat messages across pastes", 3L, count)
    }

    @Test
    fun testGetTotalChatMessageCount_EmptyDatabase() {
        val count = repo.getTotalChatMessageCount()
        assertEquals("Empty database should return 0", 0L, count)
    }
}
