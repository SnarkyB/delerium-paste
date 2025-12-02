# ---- builder ----
FROM ubuntu:22.04 AS builder

# Install dependencies for Bazel and Java
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        curl \
        ca-certificates \
        openjdk-21-jdk \
        git \
        build-essential \
    && rm -rf /var/lib/apt/lists/*

# Install Bazelisk with architecture detection
RUN ARCH=$(uname -m) && \
    case $ARCH in \
        x86_64) BAZELISK_ARCH="amd64" ;; \
        aarch64|arm64) BAZELISK_ARCH="arm64" ;; \
        *) echo "Unsupported architecture: $ARCH"; exit 1 ;; \
    esac && \
    curl -LO "https://github.com/bazelbuild/bazelisk/releases/download/v1.19.0/bazelisk-linux-${BAZELISK_ARCH}" && \
    chmod +x "bazelisk-linux-${BAZELISK_ARCH}" && \
    mv "bazelisk-linux-${BAZELISK_ARCH}" /usr/local/bin/bazel

WORKDIR /build

# Copy Bazel configuration files
COPY WORKSPACE .bazelrc .bazelversion .bazelignore ./

# Copy server source and BUILD files
COPY server/ ./server/

# Build with Bazel using CI configuration
RUN bazel build //server:delerium_server_deploy --config=ci

# Extract all JARs and create a fat JAR
RUN mkdir -p /app/lib && \
    cd /build && \
    # Collect all dependency JARs
    find bazel-bin/server/delerium_server_deploy.runfiles -name "*.jar" -exec cp {} /app/lib/ \; && \
    # Copy the main application JAR
    cp bazel-bin/server/delerium_server_lib.jar /app/lib/ && \
    cp bazel-bin/server/delerium_server_lib-resources.jar /app/lib/ && \
    # Create a classpath string
    echo "io.ktor.server.netty.EngineMain" > /app/mainclass.txt

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

ENTRYPOINT ["sh", "-c", "java -cp '/app/lib/*' io.ktor.server.netty.EngineMain"]
