# ---- builder ----
FROM ubuntu:22.04 AS builder

# Install dependencies for Bazel and Java
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        openjdk-21-jdk \
        git \
    && rm -rf /var/lib/apt/lists/*

# Install Bazelisk
RUN curl -LO "https://github.com/bazelbuild/bazelisk/releases/download/v1.19.0/bazelisk-linux-amd64" && \
    chmod +x bazelisk-linux-amd64 && \
    mv bazelisk-linux-amd64 /usr/local/bin/bazel

WORKDIR /build

# Copy Bazel configuration files
COPY WORKSPACE .bazelrc .bazelversion .bazelignore ./

# Copy server source and BUILD files
COPY server/ ./server/

# Build with Bazel using CI configuration
RUN bazel build //server:delerium_server_deploy --config=ci

# Extract the binary JAR and create deployment structure
RUN mkdir -p /app/bin /app/lib && \
    cp bazel-bin/server/delerium_server_deploy.jar /app/lib/ && \
    cp bazel-bin/server/delerium_server_deploy_deploy.jar /app/lib/delerium-paste.jar || \
    cp bazel-bin/server/delerium_server_deploy.jar /app/lib/delerium-paste.jar

# ---- runner ----
FROM eclipse-temurin:21-jre-jammy

# OCI metadata labels
LABEL org.opencontainers.image.title="Delirium Paste Server"
LABEL org.opencontainers.image.description="Zero-knowledge encrypted paste service backend"
LABEL org.opencontainers.image.source="https://github.com/marcusb333/delerium-paste"
LABEL org.opencontainers.image.licenses="MIT"
LABEL org.opencontainers.image.base.name="eclipse-temurin:21-jre-jammy"

# Install curl for health checks
RUN apt-get update && \
    apt-get install -y --no-install-recommends curl && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy application from builder
COPY --from=builder /app/ /app/

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
    CMD curl -f http://localhost:8080/api/health || exit 1

ENTRYPOINT ["java", "-jar", "/app/lib/delerium-paste.jar"]
