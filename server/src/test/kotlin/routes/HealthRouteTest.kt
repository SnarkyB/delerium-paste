package routes

/**
 * HealthRouteTest.kt - Tests for GET/HEAD /api/health endpoint
 *
 * Validates that the health check endpoint reports feature flags correctly.
 */

import com.fasterxml.jackson.module.kotlin.jacksonObjectMapper
import com.fasterxml.jackson.module.kotlin.readValue
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
import HealthStatus
import PasteRepo
import PowService
import TokenBucket
import createTestAppConfig
import createTestDatabase
import createTestKeyManager
import testModule

class HealthRouteTest {
    private lateinit var db: Database
    private lateinit var repo: PasteRepo
    private lateinit var testDbFile: File
    private val testPepper = "test-pepper-health"
    private val mapper = jacksonObjectMapper()

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
    fun testHealthEndpointReturnsOkWithDatabaseHealthy() = testApplication {
        val cfg = createTestAppConfig(powEnabled = true, rlEnabled = true)
        val rl = TokenBucket(cfg.rlCapacity, cfg.rlRefill)
        val pow = PowService(cfg.powDifficulty, cfg.powTtl)

        application {
            testModule(repo, rl, pow, cfg)
        }

        val response = client.get("/api/health")
        assertEquals(HttpStatusCode.OK, response.status)

        val status = mapper.readValue<HealthStatus>(response.bodyAsText())
        assertEquals("ok", status.status)
        assertTrue("Timestamp should be positive", status.timestampMs > 0)
        assertTrue("Database should be reported as healthy", status.databaseHealthy)
        // Security config (powEnabled, rateLimitingEnabled) is intentionally not
        // exposed in the health response to avoid disclosing active mitigations.
    }

    @Test
    fun testHealthEndpointWithNoOptionalServices() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.get("/api/health")
        val status = mapper.readValue<HealthStatus>(response.bodyAsText())
        assertEquals("ok", status.status)
        assertTrue("Database should be reported as healthy", status.databaseHealthy)
    }

    @Test
    fun testHealthHeadRequestReturns200() = testApplication {
        val cfg = createTestAppConfig(powEnabled = false, rlEnabled = false)

        application {
            testModule(repo, null, null, cfg)
        }

        val response = client.head("/api/health")
        assertEquals(HttpStatusCode.OK, response.status)
        assertEquals("Head request should not include body", "", response.bodyAsText())
    }
}
