# Metrics Sidecar for Delirium Paste
#
# This container exposes Prometheus metrics on port 9090.
# It fetches aggregate statistics from the main server's internal
# endpoint and converts them to Prometheus format.
#
# Privacy: All metrics are aggregate only - no personal data,
# paste content, or identifiable information is exposed.

# Build stage
FROM golang:1.21-alpine AS builder

WORKDIR /app

# Copy go mod file
COPY go.mod ./

# Copy source
COPY main.go ./

# Build static binary
RUN CGO_ENABLED=0 GOOS=linux go build -ldflags="-s -w" -o metrics-sidecar .

# Runtime stage - use distroless for minimal attack surface
FROM gcr.io/distroless/static-debian12:nonroot

COPY --from=builder /app/metrics-sidecar /metrics-sidecar

# Metrics port
EXPOSE 9090

USER nonroot:nonroot

ENTRYPOINT ["/metrics-sidecar"]
