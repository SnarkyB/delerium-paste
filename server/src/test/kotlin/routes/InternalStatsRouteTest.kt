package routes

/**
 * InternalStatsRouteTest.kt - Tests for GET /internal/stats endpoint
 * 
 * Tests the internal statistics endpoint used by the metrics sidecar:
 * - Returns aggregate statistics
 * - Privacy: no paste content or IDs exposed
 * - Database health status
 */

import io.ktor.client.request.*
import io.ktor.client.statement.*
import io.ktor.http.*
import io.ktor.server.testing.*
import org.jetbrains.exposed.sql.Database
import org.junit.After
import org.junit.Assert.*
import org.junit.Before
import org.junit.Test
import java.io.File
import java.time.Instant
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import PasteRepo
import PasteMeta
import InternalStats
import createTestDatabase
import createTestKeyManager
import createTestAppConfig
import testModule

class InternalStatsRouteTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private val testPepper = "test-pepper-stats"
    private val objectMapper = jacksonObjectMapper()

    @Before
    fun setUp() {
        val (database, file) = createTestDatabase()
        db = database
        testDbFile = file
        repo = PasteRepo(db, testPepper, createTestKeyManager())
    }

    @After
    fun tearDown() {
        if (::testDbFile.isInitialized && testDbFile.exists()) {
            testDbFile.delete()
        }
    }

    @Test
    fun testInternalStats_ReturnsAggregateData() = testApplication {
        application { testModule(db, testPepper) }

        // Create some test pastes
        val futureExpiry = Instant.now().epochSecond + 3600
        repo.create("paste1", "ct1", "iv1", PasteMeta(expireTs = futureExpiry), "token1")
        repo.create("paste2", "ct2", "iv2", PasteMeta(expireTs = futureExpiry), "token2")
        repo.create("paste3", "ct3", "iv3", PasteMeta(expireTs = futureExpiry), "token3")

        val response = client.get("/internal/stats")

        assertEquals(HttpStatusCode.OK, response.status)
        
        val stats: InternalStats = objectMapper.readValue(response.bodyAsText())
        
        // Should have 3 active pastes
        assertEquals("Should count 3 active pastes", 3L, stats.activePasteCount)
        
        // Should have 0 chat messages initially
        assertEquals("Should have 0 chat messages", 0L, stats.totalChatMessages)
        
        // Database should be healthy
        assertTrue("Database should be healthy", stats.databaseHealthy)
        
        // Timestamp should be recent
        assertTrue("Timestamp should be recent", stats.timestampMs > 0)
    }

    @Test
    fun testInternalStats_ExcludesExpiredPastes() = testApplication {
        application { testModule(db, testPepper) }

        val futureExpiry = Instant.now().epochSecond + 3600
        val pastExpiry = Instant.now().epochSecond - 100

        // Create active and expired pastes
        repo.create("active1", "ct1", "iv1", PasteMeta(expireTs = futureExpiry), "token1")
        repo.create("expired1", "ct2", "iv2", PasteMeta(expireTs = pastExpiry), "token2")
        repo.create("active2", "ct3", "iv3", PasteMeta(expireTs = futureExpiry), "token3")

        val response = client.get("/internal/stats")

        assertEquals(HttpStatusCode.OK, response.status)
        
        val stats: InternalStats = objectMapper.readValue(response.bodyAsText())
        
        // Should only count active (non-expired) pastes
        assertEquals("Should count only 2 active pastes", 2L, stats.activePasteCount)
    }

    @Test
    fun testInternalStats_CountsChatMessages() = testApplication {
        application { testModule(db, testPepper) }

        val futureExpiry = Instant.now().epochSecond + 3600

        // Create a paste with chat enabled
        repo.create("paste1", "ct1", "iv1", PasteMeta(expireTs = futureExpiry, allowChat = true), "token1")

        // Add some chat messages
        repo.addChatMessage("paste1", "msg1-ct", "msg1-iv")
        repo.addChatMessage("paste1", "msg2-ct", "msg2-iv")
        repo.addChatMessage("paste1", "msg3-ct", "msg3-iv")

        val response = client.get("/internal/stats")

        assertEquals(HttpStatusCode.OK, response.status)
        
        val stats: InternalStats = objectMapper.readValue(response.bodyAsText())
        
        assertEquals("Should count 3 chat messages", 3L, stats.totalChatMessages)
    }

    @Test
    fun testInternalStats_EmptyDatabase() = testApplication {
        application { testModule(db, testPepper) }

        val response = client.get("/internal/stats")

        assertEquals(HttpStatusCode.OK, response.status)
        
        val stats: InternalStats = objectMapper.readValue(response.bodyAsText())
        
        assertEquals("Should have 0 active pastes", 0L, stats.activePasteCount)
        assertEquals("Should have 0 chat messages", 0L, stats.totalChatMessages)
        assertTrue("Database should be healthy", stats.databaseHealthy)
    }

    @Test
    fun testInternalStats_NoSensitiveDataExposed() = testApplication {
        application { testModule(db, testPepper) }

        val futureExpiry = Instant.now().epochSecond + 3600
        
        // Create paste with sensitive-looking content
        repo.create(
            "secret-paste-id",
            "super-secret-encrypted-content",
            "secret-iv",
            PasteMeta(expireTs = futureExpiry),
            "secret-delete-token"
        )

        val response = client.get("/internal/stats")
        val responseBody = response.bodyAsText()

        assertEquals(HttpStatusCode.OK, response.status)
        
        // Verify no sensitive data in response
        assertFalse("Should not contain paste ID", responseBody.contains("secret-paste-id"))
        assertFalse("Should not contain ciphertext", responseBody.contains("super-secret"))
        assertFalse("Should not contain IV", responseBody.contains("secret-iv"))
        assertFalse("Should not contain delete token", responseBody.contains("secret-delete-token"))
        
        // Should only contain aggregate fields
        val stats: InternalStats = objectMapper.readValue(responseBody)
        assertEquals(1L, stats.activePasteCount)
    }
}
