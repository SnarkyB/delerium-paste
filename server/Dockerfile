# ---- builder ----
FROM --platform=$BUILDPLATFORM gradle:8.11.1-jdk21 AS builder

# Multi-architecture build arguments
ARG TARGETPLATFORM
ARG BUILDPLATFORM
ARG TARGETOS
ARG TARGETARCH
ARG TARGETVARIANT

# Display build information
RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM (arch: $TARGETARCH)"

WORKDIR /build
COPY build.gradle.kts settings.gradle.kts ./
COPY src ./src
RUN gradle --no-daemon clean installDist

# ---- runner ----
FROM eclipse-temurin:21-jre-jammy

# Multi-architecture runtime arguments
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

# OCI metadata labels
LABEL org.opencontainers.image.title="Delirium Paste Server"
LABEL org.opencontainers.image.description="Zero-knowledge encrypted paste service backend"
LABEL org.opencontainers.image.source="https://github.com/marcusb333/delerium-paste-mono"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.base.name="eclipse-temurin:21-jre-jammy"

# Display target architecture
RUN echo "Running on platform: $TARGETPLATFORM (arch: $TARGETARCH)"

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application from builder
COPY --from=builder /build/build/install/delerium-paste-server/ /app/

# Create non-root user and set permissions
RUN groupadd -r delirium && \
    useradd -r -g delirium delirium && \
    chown -R delirium:delirium /app && \
    mkdir -p /data && \
    chown -R delirium:delirium /data

# Switch to non-root user
USER delirium

VOLUME ["/data"]
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
    CMD curl -f http://localhost:8080/api/pow || exit 1

ENTRYPOINT ["/app/bin/delerium-paste-server"]
