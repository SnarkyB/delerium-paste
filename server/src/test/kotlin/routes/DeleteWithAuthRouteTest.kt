package routes

/**
 * DeleteWithAuthRouteTest.kt - Tests for POST /api/pastes/{id}/delete endpoint
 * 
 * Tests password-based deletion (allows anyone with the password to delete):
 * - Success with correct auth
 * - Failure with wrong auth
 * - Failure when no auth hash stored
 * - Failure for non-existent paste
 * - Validation of request body
 * - Cascade delete of chat messages
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
import createTestDatabase
import createTestKeyManager
import createTestAppConfig
import createTestPasteRequest
import testModule

class DeleteWithAuthRouteTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private val testPepper = "test-pepper-delete-auth"
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

    // ========== Success Tests ==========

    @Test
    fun testDeleteWithAuth_Success_Returns204() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val deleteAuth = "test-delete-auth-key"
        val request = createTestPasteRequest(deleteAuth = deleteAuth)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create a paste with deleteAuth
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        assertEquals(HttpStatusCode.Created, createResponse.status)
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Verify paste exists
        val getResponse = client.get("/api/pastes/${createResult.id}")
        assertEquals(HttpStatusCode.OK, getResponse.status)

        // Delete with auth
        val deleteResponse = client.post("/api/pastes/${createResult.id}/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{"deleteAuth": "$deleteAuth"}""")
        }
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)

        // Verify paste is gone
        val getAfterDelete = client.get("/api/pastes/${createResult.id}")
        assertEquals(HttpStatusCode.NotFound, getAfterDelete.status)
    }

    // ========== Failure Tests ==========

    @Test
    fun testDeleteWithAuth_WrongAuth_Returns403() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val deleteAuth = "correct-auth-key"
        val request = createTestPasteRequest(deleteAuth = deleteAuth)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Try delete with wrong auth
        val deleteResponse = client.post("/api/pastes/${createResult.id}/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{"deleteAuth": "wrong-auth-key"}""")
        }
        assertEquals(HttpStatusCode.Forbidden, deleteResponse.status)

        val errorBody = objectMapper.readValue<ErrorResponse>(deleteResponse.bodyAsText())
        assertEquals("invalid_auth", errorBody.error)

        // Verify paste still exists
        val getResponse = client.get("/api/pastes/${createResult.id}")
        assertEquals(HttpStatusCode.OK, getResponse.status)
    }

    @Test
    fun testDeleteWithAuth_NoAuthHashStored_Returns403() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        // Create paste WITHOUT deleteAuth
        val request = createTestPasteRequest(deleteAuth = null)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Try delete with auth (should fail because paste has no auth hash)
        val deleteResponse = client.post("/api/pastes/${createResult.id}/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{"deleteAuth": "any-auth-value"}""")
        }
        assertEquals(HttpStatusCode.Forbidden, deleteResponse.status)

        // Verify paste still exists
        val getResponse = client.get("/api/pastes/${createResult.id}")
        assertEquals(HttpStatusCode.OK, getResponse.status)
    }

    @Test
    fun testDeleteWithAuth_NonExistentPaste_Returns403() = testApplication {
        val cfg = createTestAppConfig()

        application {
            testModule(repo, null, null, cfg)
        }

        // Try to delete non-existent paste
        val deleteResponse = client.post("/api/pastes/nonexistent123/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{"deleteAuth": "any-auth"}""")
        }
        assertEquals(HttpStatusCode.Forbidden, deleteResponse.status)
    }

    // ========== Validation Tests ==========

    @Test
    fun testDeleteWithAuth_MissingAuth_Returns400() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest(deleteAuth = "test-auth")

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Try delete with missing deleteAuth field
        val deleteResponse = client.post("/api/pastes/${createResult.id}/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{}""")
        }
        assertEquals(HttpStatusCode.BadRequest, deleteResponse.status)
    }

    @Test
    fun testDeleteWithAuth_EmptyAuth_Returns400() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest(deleteAuth = "test-auth")

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Try delete with empty deleteAuth
        val deleteResponse = client.post("/api/pastes/${createResult.id}/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{"deleteAuth": ""}""")
        }
        assertEquals(HttpStatusCode.BadRequest, deleteResponse.status)

        val errorBody = objectMapper.readValue<ErrorResponse>(deleteResponse.bodyAsText())
        assertEquals("missing_auth", errorBody.error)
    }

    @Test
    fun testDeleteWithAuth_InvalidJson_Returns400() = testApplication {
        val cfg = createTestAppConfig()

        application {
            testModule(repo, null, null, cfg)
        }

        val deleteResponse = client.post("/api/pastes/someid/delete") {
            contentType(ContentType.Application.Json)
            setBody("not valid json")
        }
        assertEquals(HttpStatusCode.BadRequest, deleteResponse.status)

        val errorBody = objectMapper.readValue<ErrorResponse>(deleteResponse.bodyAsText())
        assertEquals("invalid_json", errorBody.error)
    }

    // ========== Cascade Delete Tests ==========

    @Test
    fun testDeleteWithAuth_CascadesDeleteToChatMessages() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val deleteAuth = "cascade-test-auth"
        val request = createTestPasteRequest(deleteAuth = deleteAuth)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Add chat messages
        for (i in 1..3) {
            client.post("/api/pastes/${createResult.id}/messages") {
                contentType(ContentType.Application.Json)
                setBody("""{"ct": "message$i", "iv": "iv$i"}""")
            }
        }

        // Verify messages exist
        val messagesResponse = client.get("/api/pastes/${createResult.id}/messages")
        assertEquals(HttpStatusCode.OK, messagesResponse.status)
        assertTrue("Should have messages", messagesResponse.bodyAsText().contains("message"))

        // Delete paste with auth
        val deleteResponse = client.post("/api/pastes/${createResult.id}/delete") {
            contentType(ContentType.Application.Json)
            setBody("""{"deleteAuth": "$deleteAuth"}""")
        }
        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)

        // Verify messages are also gone (paste doesn't exist)
        val messagesAfter = client.get("/api/pastes/${createResult.id}/messages")
        assertEquals(HttpStatusCode.NotFound, messagesAfter.status)
    }
}
