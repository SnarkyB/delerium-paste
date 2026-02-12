package routes

/**
 * ChatRouteSecurityTest.kt - Security tests for chat message endpoints
 * 
 * Tests verify that:
 * - Chat messages cannot be accessed for expired pastes
 * - Chat messages cannot be posted to expired pastes
 * - Chat messages cannot be accessed for deleted pastes
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
import CreatePasteResponse
import ErrorResponse
import GetChatMessagesResponse
import PostChatMessageRequest
import PostChatMessageResponse
import createTestDatabase
import createTestKeyManager
import createTestAppConfig
import createTestPasteRequest
import testModule

class ChatRouteSecurityTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private val testPepper = "test-pepper-chat-security"
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

    // ========== Expired Paste Chat Security ==========

    @Test
    fun testGetMessages_ExpiredPaste_Returns404() = testApplication {
        // SECURITY: Cannot retrieve chat messages for expired pastes
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val pastExpiry = Instant.now().epochSecond - 3600 // 1 hour ago

        application {
            testModule(repo, null, null, cfg)
        }

        // Create expired paste directly in repo (bypass API validation)
        val pasteId = "expired-paste-chat"
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = pastExpiry),
            rawDeleteToken = "token"
        )

        // Add chat messages
        repo.addChatMessage(pasteId, "secret-message", "iv123456789012")

        // Try to get messages for expired paste
        val response = client.get("/api/pastes/$pasteId/messages")

        // SECURITY CHECK: Should return 404 for expired paste
        assertEquals(
            "Should return 404 for expired paste chat messages",
            HttpStatusCode.NotFound, 
            response.status
        )
        val error = objectMapper.readValue<ErrorResponse>(response.bodyAsText())
        assertEquals("paste_not_found", error.error)
    }

    @Test
    fun testPostMessage_ExpiredPaste_Returns404() = testApplication {
        // SECURITY: Cannot post chat messages to expired pastes
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val pastExpiry = Instant.now().epochSecond - 3600 // 1 hour ago

        application {
            testModule(repo, null, null, cfg)
        }

        // Create expired paste directly in repo
        val pasteId = "expired-paste-post"
        repo.create(
            id = pasteId,
            ct = "encrypted-content",
            iv = "iv12345678901",
            meta = PasteMeta(expireTs = pastExpiry),
            rawDeleteToken = "token"
        )

        // Try to post message to expired paste
        val messageRequest = PostChatMessageRequest(
            ct = "new-secret-message",
            iv = "iv123456789012"
        )
        val response = client.post("/api/pastes/$pasteId/messages") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(messageRequest))
        }

        // SECURITY CHECK: Should return 404 for expired paste
        assertEquals(
            "Should return 404 when posting to expired paste",
            HttpStatusCode.NotFound,
            response.status
        )
        val error = objectMapper.readValue<ErrorResponse>(response.bodyAsText())
        assertEquals("paste_not_found", error.error)
    }

    // ========== Deleted Paste Chat Security ==========

    @Test
    fun testGetMessages_DeletedPaste_Returns404() = testApplication {
        // SECURITY: Cannot retrieve chat messages for deleted pastes
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest(allowChat = true)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste via API
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Add chat messages
        val messageRequest = PostChatMessageRequest(
            ct = "secret-chat-message",
            iv = "iv123456789012"
        )
        val postResponse = client.post("/api/pastes/${createResult.id}/messages") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(messageRequest))
        }
        assertEquals(HttpStatusCode.Created, postResponse.status)

        // Verify messages exist before deletion
        val getBeforeDelete = client.get("/api/pastes/${createResult.id}/messages")
        assertEquals(HttpStatusCode.OK, getBeforeDelete.status)
        val messagesBefore = objectMapper.readValue<GetChatMessagesResponse>(getBeforeDelete.bodyAsText())
        assertEquals("Should have 1 message before deletion", 1, messagesBefore.messages.size)

        // Delete the paste
        val deleteResponse = client.delete("/api/pastes/${createResult.id}?token=${createResult.deleteToken}")
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)

        // SECURITY CHECK: Cannot access chat messages after paste deletion
        val getAfterDelete = client.get("/api/pastes/${createResult.id}/messages")
        assertEquals(
            "Should return 404 for deleted paste chat messages",
            HttpStatusCode.NotFound,
            getAfterDelete.status
        )
    }

    @Test
    fun testPostMessage_DeletedPaste_Returns404() = testApplication {
        // SECURITY: Cannot post chat messages to deleted pastes
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest(allowChat = true)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create and then delete paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Delete the paste
        val deleteResponse = client.delete("/api/pastes/${createResult.id}?token=${createResult.deleteToken}")
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)

        // SECURITY CHECK: Cannot post messages to deleted paste
        val messageRequest = PostChatMessageRequest(
            ct = "message-to-deleted-paste",
            iv = "iv123456789012"
        )
        val postResponse = client.post("/api/pastes/${createResult.id}/messages") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(messageRequest))
        }
        assertEquals(
            "Should return 404 when posting to deleted paste",
            HttpStatusCode.NotFound,
            postResponse.status
        )
    }

    // ========== Non-existent Paste Chat Security ==========

    @Test
    fun testGetMessages_NonExistentPaste_Returns404() = testApplication {
        // SECURITY: Cannot retrieve chat messages for non-existent pastes
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.get("/api/pastes/nonexistent123/messages")
        
        assertEquals(
            "Should return 404 for non-existent paste",
            HttpStatusCode.NotFound,
            response.status
        )
        val error = objectMapper.readValue<ErrorResponse>(response.bodyAsText())
        assertEquals("paste_not_found", error.error)
    }

    @Test
    fun testPostMessage_NonExistentPaste_Returns404() = testApplication {
        // SECURITY: Cannot post chat messages to non-existent pastes
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)

        application {
            testModule(repo, null, null, cfg)
        }

        val messageRequest = PostChatMessageRequest(
            ct = "message-to-nonexistent",
            iv = "iv123456789012"
        )
        val response = client.post("/api/pastes/nonexistent123/messages") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(messageRequest))
        }

        assertEquals(
            "Should return 404 for non-existent paste",
            HttpStatusCode.NotFound,
            response.status
        )
        val error = objectMapper.readValue<ErrorResponse>(response.bodyAsText())
        assertEquals("paste_not_found", error.error)
    }
}
