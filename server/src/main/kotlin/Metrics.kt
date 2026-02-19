/**
 * Metrics.kt - Micrometer application metrics definitions
 *
 * Defines all custom counters and gauges exposed via the /metrics endpoint.
 * No paste content, keys, or user-identifying data is included in any metric.
 * All metrics are aggregated counts or gauges only.
 */

import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.Gauge
import io.micrometer.core.instrument.MeterRegistry

/**
 * Application-level business metrics for Delerium.
 *
 * Counters increment on each relevant event; gauges query the DB at scrape time.
 * Registered JVM / HikariCP metrics are bound separately in App.kt.
 */
class AppMetrics(registry: MeterRegistry, repo: PasteRepo) {

    /** Total number of pastes successfully created. */
    val pastesCreated: Counter = Counter.builder("delerium.pastes.created")
        .description("Total pastes created")
        .register(registry)

    /** Total number of pastes deleted via the creator delete-token mechanism. */
    val pastesDeletedByToken: Counter = Counter.builder("delerium.pastes.deleted")
        .tag("method", "token")
        .description("Total pastes deleted by creator token")
        .register(registry)

    /** Total number of pastes deleted via password-derived authorization. */
    val pastesDeletedByAuth: Counter = Counter.builder("delerium.pastes.deleted")
        .tag("method", "auth")
        .description("Total pastes deleted by password auth")
        .register(registry)

    /** Total number of encrypted chat messages successfully created. */
    val messagesCreated: Counter = Counter.builder("delerium.messages.created")
        .description("Total chat messages created")
        .register(registry)

    /** Total number of requests rejected by the token-bucket rate limiter. */
    val rateLimitRejections: Counter = Counter.builder("delerium.rate.limit.rejected")
        .description("Total requests rejected by the rate limiter")
        .register(registry)

    /** Total number of proof-of-work challenges generated. */
    val powChallengesGenerated: Counter = Counter.builder("delerium.pow.challenges")
        .description("Total proof-of-work challenges generated")
        .register(registry)

    /** Total number of expired pastes removed by the background cleanup task. */
    val cleanupExpired: Counter = Counter.builder("delerium.cleanup.expired")
        .description("Total expired pastes removed by background cleanup")
        .register(registry)

    init {
        // Gauges: polled by Prometheus at each scrape interval.
        // The repo reference is held strongly by the Gauge to prevent GC.
        Gauge.builder("delerium.active.pastes", repo) { r ->
            try { r.countActive().toDouble() } catch (_: Exception) { Double.NaN }
        }
            .description("Number of active (non-expired) pastes")
            .register(registry)

        Gauge.builder("delerium.active.messages", repo) { r ->
            try { r.countMessages().toDouble() } catch (_: Exception) { Double.NaN }
        }
            .description("Total encrypted chat messages currently stored")
            .register(registry)
    }
}
