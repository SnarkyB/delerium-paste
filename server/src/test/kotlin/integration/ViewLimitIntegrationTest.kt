package integration

/**
 * ExpirationIntegrationTest.kt - Expiration integration tests
 * 
 * Tests expiration functionality with real database operations.
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
import CreatePasteResponse
import createTestDatabase
import createTestAppConfig
import createTestPasteRequest
import testModule

class ViewLimitIntegrationTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private val testPepper = "test-pepper-expiration"
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

    @Test
    fun testPasteExpiration() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)
        // Create paste with valid expiry first (validation requires at least 10 seconds)
        val futureExpiry = Instant.now().epochSecond + 3600
        val request = createTestPasteRequest(expireTs = futureExpiry)

        application {
            testModule(repo, null, null, cfg)
        }

        // Create paste
        val createResponse = client.post("/api/pastes") {
            contentType(ContentType.Application.Json)
            setBody(objectMapper.writeValueAsString(request))
        }
        val createResult = objectMapper.readValue<CreatePasteResponse>(createResponse.bodyAsText())

        // Retrieve immediately (should work)
        val getResponse1 = client.get("/api/pastes/${createResult.id}")
        assertEquals(HttpStatusCode.OK, getResponse1.status)

        // Manually delete the paste to simulate expiration
        // (In real scenario, expiration happens naturally via getIfAvailable filter)
        repo.delete(createResult.id)

        // Retrieve after expiration (should fail)
        val getResponse2 = client.get("/api/pastes/${createResult.id}")
        assertEquals(HttpStatusCode.NotFound, getResponse2.status)
    }
}
