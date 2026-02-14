# Monitoring and Metrics

Delirium Paste includes an optional metrics sidecar that exposes Prometheus-compatible metrics for monitoring service health and performance.

## Security

The metrics endpoint requires **HTTP Basic Authentication**. Credentials must be configured via environment variables:

```bash
# Add to .env file
METRICS_USER=metrics
METRICS_PASS=$(openssl rand -hex 16)
```

## Privacy Guarantees

**All metrics are aggregate only.** The monitoring system is designed to preserve zero-knowledge privacy:

- No paste content or IDs are exposed
- No IP addresses or user information
- No request logs or access patterns
- No timestamps of individual operations
- Only aggregate counts and health status

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Docker Network                          │
│                                                             │
│  ┌─────────┐     ┌─────────────┐     ┌──────────────────┐  │
│  │  nginx  │────▶│   server    │◀────│ metrics-sidecar  │  │
│  │  :80    │     │   :8080     │     │     :9090        │  │
│  └─────────┘     └─────────────┘     └──────────────────┘  │
│       │                │                      │             │
│       │                │                      │             │
└───────┼────────────────┼──────────────────────┼─────────────┘
        │                │                      │
        ▼                ▼                      ▼
   Public API      Internal only          Prometheus
   /api/*          /internal/stats        scrape target
```

The metrics sidecar:
1. Runs in its own isolated container
2. Fetches stats from the main server's internal endpoint
3. Converts to Prometheus format
4. Exposes metrics on port 9090

The `/internal/stats` endpoint is **not exposed via nginx** - it's only accessible within the Docker network.

## Quick Start

### 1. Configure Authentication

Add to your `.env` file:

```bash
# Generate a secure password
METRICS_USER=metrics
METRICS_PASS=$(openssl rand -hex 16)
```

### 2. Enable Metrics (Development)

```bash
# Start with monitoring profile
docker-compose --profile monitoring up -d

# Metrics available at (requires auth)
curl -u metrics:your-password http://localhost:9090/metrics
```

### 3. Enable Metrics (Production)

```bash
# Start with monitoring profile
docker-compose -f docker-compose.prod.yml --profile monitoring up -d

# Metrics only accessible on localhost (127.0.0.1:9090)
curl -u metrics:your-password http://127.0.0.1:9090/metrics
```

## Available Metrics

| Metric | Type | Description |
|--------|------|-------------|
| `delerium_up` | gauge | Whether metrics sidecar can reach main server (1=yes, 0=no) |
| `delerium_sidecar_uptime_seconds` | gauge | Metrics sidecar uptime in seconds |
| `delerium_pastes_active` | gauge | Current number of non-expired pastes |
| `delerium_chat_messages_total` | gauge | Total chat messages in database |
| `delerium_database_healthy` | gauge | Database health status (1=healthy, 0=unhealthy) |

### Example Output

```
# HELP delerium_up Whether the metrics sidecar can reach the main server
# TYPE delerium_up gauge
delerium_up 1

# HELP delerium_sidecar_uptime_seconds Metrics sidecar uptime in seconds
# TYPE delerium_sidecar_uptime_seconds gauge
delerium_sidecar_uptime_seconds 3600

# HELP delerium_pastes_active Current number of non-expired pastes
# TYPE delerium_pastes_active gauge
delerium_pastes_active 42

# HELP delerium_chat_messages_total Total chat messages in database
# TYPE delerium_chat_messages_total gauge
delerium_chat_messages_total 156

# HELP delerium_database_healthy Database health status (1=healthy, 0=unhealthy)
# TYPE delerium_database_healthy gauge
delerium_database_healthy 1
```

## Prometheus Configuration

Add to your `prometheus.yml`:

```yaml
scrape_configs:
  - job_name: 'delerium'
    static_configs:
      - targets: ['localhost:9090']  # or container name if in same network
    scrape_interval: 30s
    basic_auth:
      username: 'metrics'
      password: 'your-metrics-password'  # Or use password_file for security
```

For better security, use a password file:

```yaml
scrape_configs:
  - job_name: 'delerium'
    static_configs:
      - targets: ['localhost:9090']
    scrape_interval: 30s
    basic_auth:
      username: 'metrics'
      password_file: '/etc/prometheus/delerium_password'
```

## Grafana Dashboard

### Recommended Panels

1. **Service Health**
   - `delerium_up` - Server reachability
   - `delerium_database_healthy` - Database status

2. **Usage Overview**
   - `delerium_pastes_active` - Active paste count over time
   - `delerium_chat_messages_total` - Chat message growth

3. **Uptime**
   - `delerium_sidecar_uptime_seconds` - Service uptime

### Example Queries

```promql
# Alert if server unreachable
delerium_up == 0

# Alert if database unhealthy
delerium_database_healthy == 0

# Active pastes trend (5 minute rate)
rate(delerium_pastes_active[5m])
```

## Security Considerations

### Production Deployment

In production, the metrics endpoint is bound to `127.0.0.1:9090` by default:

```yaml
ports:
  - "127.0.0.1:9090:9090"  # Only accessible from localhost
```

This means:
- Prometheus must run on the same host, OR
- You need to configure a secure tunnel/VPN

### Alternative: Docker Network Only

For maximum security, remove the port binding entirely and access metrics only via Docker network:

```yaml
metrics:
  # ... other config ...
  # Remove ports section - only accessible via Docker network
  networks:
    - app-network
    - monitoring-network  # Shared with Prometheus container
```

### Authentication

The metrics endpoint **requires HTTP Basic Authentication**:

1. Set `METRICS_USER` and `METRICS_PASS` in your `.env` file
2. Configure Prometheus with matching credentials
3. Use constant-time comparison to prevent timing attacks

If credentials are not configured, the sidecar will reject all requests with 401 Unauthorized.

## Troubleshooting

### Metrics Sidecar Not Starting

```bash
# Check logs
docker-compose --profile monitoring logs metrics

# Verify server is healthy first
curl http://localhost:8080/api/health
```

### No Metrics Returned

```bash
# Check if sidecar can reach server
docker-compose --profile monitoring exec metrics wget -qO- http://server:8080/internal/stats
```

### Connection Refused

Ensure the `server` container is healthy before the metrics sidecar starts:

```bash
docker-compose --profile monitoring ps
```

## Disabling Metrics

Simply don't include the `--profile monitoring` flag:

```bash
# Without metrics
docker-compose up -d

# With metrics
docker-compose --profile monitoring up -d
```

## Building the Metrics Sidecar

```bash
# Build locally
cd metrics-sidecar
docker build -t delerium-metrics .

# Or via docker-compose
docker-compose --profile monitoring build metrics
```
