package integration

/**
 * CorsIntegrationTest.kt - Integration tests for CORS handling
 * 
 * Tests that the application correctly handles CORS requests including:
 * - Requests with Origin headers
 * - OPTIONS preflight requests
 * - Proper error responses with Origin headers
 * 
 * Note: CORS is now handled at the Nginx reverse proxy level, not in Ktor.
 * These tests verify that the backend properly responds to requests that
 * would have Origin headers, and that the CORS plugin is disabled.
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
import com.fasterxml.jackson.module.kotlin.readValue
import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import PasteRepo
import PowService
import ErrorResponse
import CreatePasteResponse
import createTestDatabase
import createTestAppConfig
import createTestPasteRequest
import testModule

class CorsIntegrationTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private val testPepper = "test-pepper-cors"
    private val objectMapper = jacksonObjectMapper()

    @Before
    fun setUp() {
        val (database, file) = createTestDatabase()
        db = database
        testDbFile = file
        repo = PasteRepo(db, testPepper)
    }

    @After
    fun tearDown() {
        if (::testDbFile.isInitialized && testDbFile.exists()) {
            testDbFile.delete()
        }
    }

    // ========== Origin Header Tests ==========

    @Test
    fun testPostPastes_WithOriginHeader_Returns400PowRequired() = testApplication {
        // This test verifies that the backend properly handles requests
        // that come with Origin headers (as they would from a browser).
        // The backend should NOT reject these with 403, but should
        // return the normal error (e.g., pow_required).
        val cfg = createTestAppConfig(powEnabled = true, rlEnabled = false)
        val pow = PowService(cfg.powDifficulty, cfg.powTtl)
        val request = createTestPasteRequest(pow = null)

        application {
            testModule(repo, null, pow, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            setBody(objectMapper.writeValueAsString(request))
        }

        // Should return 400 (Bad Request) with pow_required, NOT 403 (Forbidden)
        assertEquals(HttpStatusCode.BadRequest, response.status)
        val error = objectMapper.readValue<ErrorResponse>(response.bodyAsText())
        assertEquals("pow_required", error.error)
    }

    @Test
    fun testPostPastes_WithOriginHeader_NoPow_Succeeds() = testApplication {
        // Test that requests with Origin headers work when PoW is disabled
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            setBody(objectMapper.writeValueAsString(request))
        }

        // Should succeed with 201 Created, NOT fail with 403 Forbidden
        assertEquals(HttpStatusCode.Created, response.status)
        val result = objectMapper.readValue<CreatePasteResponse>(response.bodyAsText())
        assertNotNull("ID should not be null", result.id)
    }

    @Test
    fun testPostPastes_WithDifferentOrigin_Succeeds() = testApplication {
        // Test that requests from different origins work (CORS is handled by Nginx)
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "https://example.com")
            setBody(objectMapper.writeValueAsString(request))
        }

        assertEquals(HttpStatusCode.Created, response.status)
    }

    @Test
    fun testGetPaste_WithOriginHeader_Succeeds() = testApplication {
        // Test that GET requests with Origin headers work
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        // First create a paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val paste = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Then get it with an Origin header
        val getResponse = client.get("/api/pastes/${paste.id}") {
            header(HttpHeaders.Origin, "http://localhost:8080")
        }

        assertEquals(HttpStatusCode.OK, getResponse.status)
    }

    @Test
    fun testDeletePaste_WithOriginHeader_Succeeds() = testApplication {
        // Test that DELETE requests with Origin headers work
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        // First create a paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val paste = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Then delete it with an Origin header and deletion token as query parameter
        val deleteResponse = client.delete("/api/pastes/${paste.id}?token=${paste.deleteToken}") {
            header(HttpHeaders.Origin, "http://localhost:8080")
        }

        assertEquals(HttpStatusCode.NoContent, deleteResponse.status)
    }

    // ========== OPTIONS Request Tests ==========

    @Test
    fun testOptionsPastes_ReturnsSuccess() = testApplication {
        // OPTIONS requests are used for CORS preflight checks
        // The backend should handle them gracefully (though Nginx handles CORS)
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.options("/api/pastes") {
            header(HttpHeaders.Origin, "http://localhost:8080")
            header(HttpHeaders.AccessControlRequestMethod, "POST")
            header(HttpHeaders.AccessControlRequestHeaders, "Content-Type")
        }

        // Backend may return 404 or 405 for OPTIONS since CORS is handled by Nginx
        // This is acceptable as Nginx intercepts OPTIONS before reaching the backend
        assertTrue(
            "OPTIONS should be handled (200, 204) or pass through (404, 405)",
            response.status in listOf(
                HttpStatusCode.OK,
                HttpStatusCode.NoContent,
                HttpStatusCode.NotFound,
                HttpStatusCode.MethodNotAllowed
            )
        )
    }

    // ========== Header Validation Tests ==========

    @Test
    fun testPostPastes_NoOriginHeader_Succeeds() = testApplication {
        // Verify that requests without Origin headers still work
        // (e.g., from curl, server-to-server, etc.)
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            // Explicitly NOT setting Origin header
            setBody(objectMapper.writeValueAsString(request))
        }

        assertEquals(HttpStatusCode.Created, response.status)
    }

    @Test
    fun testPostPastes_ResponseHasNoAccessControlHeaders() = testApplication {
        // Verify that the backend itself is NOT adding CORS headers
        // (since CORS is handled by Nginx)
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            setBody(objectMapper.writeValueAsString(request))
        }

        // Backend should NOT add Access-Control-Allow-Origin header
        // (Nginx adds these headers)
        val corsHeader = response.headers[HttpHeaders.AccessControlAllowOrigin]
        assertNull("Backend should not add CORS headers (Nginx handles this)", corsHeader)
    }

    // ========== Security Headers Tests ==========

    @Test
    fun testPostPastes_HasSecurityHeaders() = testApplication {
        // Verify that security headers are still present
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }

        // These security headers should be present
        assertNotNull("X-Content-Type-Options header should be present", 
            response.headers["X-Content-Type-Options"])
        assertNotNull("X-Frame-Options header should be present", 
            response.headers["X-Frame-Options"])
        assertNotNull("Referrer-Policy header should be present", 
            response.headers["Referrer-Policy"])
    }

    @Test
    fun testPostPastes_NoIncompatibleCrossOriginHeaders() = testApplication {
        // Verify that incompatible Cross-Origin-* headers are NOT present
        // These were removed because they conflict with CORS
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        val request = createTestPasteRequest()

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            setBody(objectMapper.writeValueAsString(request))
        }

        // These headers should NOT be present (they conflict with CORS)
        assertNull("Cross-Origin-Embedder-Policy should not be present", 
            response.headers["Cross-Origin-Embedder-Policy"])
        assertNull("Cross-Origin-Opener-Policy should not be present", 
            response.headers["Cross-Origin-Opener-Policy"])
        assertNull("Cross-Origin-Resource-Policy should not be present", 
            response.headers["Cross-Origin-Resource-Policy"])
    }

    // ========== Error Response Tests ==========

    @Test
    fun testPostPastes_ErrorResponsesWorkWithOrigin() = testApplication {
        // Test that various error responses work correctly with Origin headers
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false, maxSizeBytes = 100)

        application {
            testModule(repo, null, null, cfg)
        }

        // Test with invalid data (too large)
        val request = createTestPasteRequest(ct = "a".repeat(200))
        val response = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            header(HttpHeaders.Origin, "http://localhost:8080")
            setBody(objectMapper.writeValueAsString(request))
        }

        // Should return proper error, not 403 Forbidden
        assertEquals(HttpStatusCode.BadRequest, response.status)
        val error = objectMapper.readValue<ErrorResponse>(response.bodyAsText())
        assertEquals("size_invalid", error.error)
    }
}
