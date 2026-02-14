// Package main implements a Prometheus metrics exporter sidecar for Delirium Paste.
//
// This sidecar container fetches aggregate statistics from the main server's
// internal endpoint and exposes them in Prometheus format. It runs in isolation
// to maintain security boundaries - the metrics endpoint is separate from the
// main API.
//
// Authentication: Basic auth is required for the /metrics endpoint.
// Set METRICS_USER and METRICS_PASS environment variables.
//
// Privacy: All metrics are aggregate only. No personal data, paste content,
// IPs, or identifiable information is collected or exposed.
package main

import (
	"crypto/subtle"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"time"
)

// InternalStats matches the JSON response from /internal/stats
type InternalStats struct {
	ActivePasteCount  int64 `json:"activePasteCount"`
	TotalChatMessages int64 `json:"totalChatMessages"`
	DatabaseHealthy   bool  `json:"databaseHealthy"`
	TimestampMs       int64 `json:"timestampMs"`
}

var (
	serverURL   string
	startTime   time.Time
	metricsUser string
	metricsPass string
)

func init() {
	serverURL = os.Getenv("SERVER_URL")
	if serverURL == "" {
		serverURL = "http://server:8080"
	}
	startTime = time.Now()

	// Load authentication credentials
	metricsUser = os.Getenv("METRICS_USER")
	metricsPass = os.Getenv("METRICS_PASS")
}

// fetchStats retrieves stats from the main server's internal endpoint
func fetchStats() (*InternalStats, error) {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get(serverURL + "/internal/stats")
	if err != nil {
		return nil, fmt.Errorf("failed to fetch stats: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("unexpected status code: %d", resp.StatusCode)
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, fmt.Errorf("failed to read response: %w", err)
	}

	var stats InternalStats
	if err := json.Unmarshal(body, &stats); err != nil {
		return nil, fmt.Errorf("failed to parse stats: %w", err)
	}

	return &stats, nil
}

// basicAuth wraps a handler with HTTP Basic Authentication
func basicAuth(next http.HandlerFunc) http.HandlerFunc {
	return func(w http.ResponseWriter, r *http.Request) {
		// If no credentials configured, require them to be set
		if metricsUser == "" || metricsPass == "" {
			log.Printf("WARNING: METRICS_USER and METRICS_PASS not configured - rejecting request")
			w.Header().Set("WWW-Authenticate", `Basic realm="metrics"`)
			http.Error(w, "Metrics authentication not configured", http.StatusUnauthorized)
			return
		}

		user, pass, ok := r.BasicAuth()
		if !ok {
			w.Header().Set("WWW-Authenticate", `Basic realm="metrics"`)
			http.Error(w, "Authentication required", http.StatusUnauthorized)
			return
		}

		// Constant-time comparison to prevent timing attacks
		userMatch := subtle.ConstantTimeCompare([]byte(user), []byte(metricsUser)) == 1
		passMatch := subtle.ConstantTimeCompare([]byte(pass), []byte(metricsPass)) == 1

		if !userMatch || !passMatch {
			w.Header().Set("WWW-Authenticate", `Basic realm="metrics"`)
			http.Error(w, "Invalid credentials", http.StatusUnauthorized)
			return
		}

		next(w, r)
	}
}

// metricsHandler serves Prometheus-formatted metrics
func metricsHandler(w http.ResponseWriter, r *http.Request) {
	stats, err := fetchStats()
	if err != nil {
		log.Printf("Error fetching stats: %v", err)
		// Return metrics with error indicator
		w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")
		fmt.Fprintf(w, "# HELP delerium_up Whether the metrics sidecar can reach the main server\n")
		fmt.Fprintf(w, "# TYPE delerium_up gauge\n")
		fmt.Fprintf(w, "delerium_up 0\n")
		return
	}

	uptime := int64(time.Since(startTime).Seconds())
	dbHealthy := 0
	if stats.DatabaseHealthy {
		dbHealthy = 1
	}

	w.Header().Set("Content-Type", "text/plain; version=0.0.4; charset=utf-8")

	// Server reachability
	fmt.Fprintf(w, "# HELP delerium_up Whether the metrics sidecar can reach the main server\n")
	fmt.Fprintf(w, "# TYPE delerium_up gauge\n")
	fmt.Fprintf(w, "delerium_up 1\n\n")

	// Sidecar uptime
	fmt.Fprintf(w, "# HELP delerium_sidecar_uptime_seconds Metrics sidecar uptime in seconds\n")
	fmt.Fprintf(w, "# TYPE delerium_sidecar_uptime_seconds gauge\n")
	fmt.Fprintf(w, "delerium_sidecar_uptime_seconds %d\n\n", uptime)

	// Active pastes gauge
	fmt.Fprintf(w, "# HELP delerium_pastes_active Current number of non-expired pastes\n")
	fmt.Fprintf(w, "# TYPE delerium_pastes_active gauge\n")
	fmt.Fprintf(w, "delerium_pastes_active %d\n\n", stats.ActivePasteCount)

	// Total chat messages gauge
	fmt.Fprintf(w, "# HELP delerium_chat_messages_total Total chat messages in database\n")
	fmt.Fprintf(w, "# TYPE delerium_chat_messages_total gauge\n")
	fmt.Fprintf(w, "delerium_chat_messages_total %d\n\n", stats.TotalChatMessages)

	// Database health gauge
	fmt.Fprintf(w, "# HELP delerium_database_healthy Database health status (1=healthy, 0=unhealthy)\n")
	fmt.Fprintf(w, "# TYPE delerium_database_healthy gauge\n")
	fmt.Fprintf(w, "delerium_database_healthy %d\n", dbHealthy)
}

// healthHandler provides a simple health check for the sidecar itself
func healthHandler(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(http.StatusOK)
	fmt.Fprintf(w, `{"status":"ok"}`)
}

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "9090"
	}

	http.HandleFunc("/metrics", basicAuth(metricsHandler))
	http.HandleFunc("/health", healthHandler) // Health check doesn't require auth

	log.Printf("Metrics sidecar starting on :%s", port)
	log.Printf("Fetching stats from: %s/internal/stats", serverURL)

	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
