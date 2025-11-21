# Multi-Architecture Implementation Summary

This document summarizes the multi-architecture Docker deployment implementation for Delirium Paste Mono.

## Overview

Delirium Paste now fully supports multi-architecture Docker deployments, enabling the application to run natively on both AMD64 (x86_64) and ARM64 (aarch64) processors. This allows deployment on a wide range of hardware including:

- Traditional Intel/AMD servers (amd64)
- Apple Silicon Macs (M1/M2/M3) (arm64)
- AWS Graviton instances (arm64)
- Raspberry Pi 4/5 (arm64)
- Oracle Cloud ARM instances (arm64)

## Changes Made

### 1. Dockerfile Updates (`server/Dockerfile`)

**Enhanced multi-architecture build support:**
- Added build information logging to display target platform during builds
- Added runtime architecture arguments to the final stage
- Added OCI metadata label for base image
- Added runtime platform display for verification

**Key improvements:**
```dockerfile
# Builder stage uses BUILDPLATFORM for faster cross-compilation
FROM --platform=$BUILDPLATFORM gradle:8.11.1-jdk21 AS builder

# Display build information
RUN echo "Building on $BUILDPLATFORM for $TARGETPLATFORM (arch: $TARGETARCH)"

# Runtime stage with architecture arguments
FROM eclipse-temurin:21-jre-jammy
ARG TARGETPLATFORM
ARG TARGETOS
ARG TARGETARCH

# Display target architecture
RUN echo "Running on platform: $TARGETPLATFORM (arch: $TARGETARCH)"
```

### 2. Docker Compose Configuration

**Docker Compose files configured for standard builds:**

#### `docker-compose.yml`
- Builds for host architecture by default
- No platform specifications needed (Docker auto-detects)

#### `docker-compose.prod.yml`
- Builds for host architecture by default
- No platform specifications needed (Docker auto-detects)

**Note**: Multi-architecture builds are handled via Docker Buildx (see Makefile targets). Docker Compose does not support multi-arch builds natively. For multi-arch deployments, build with Buildx and push to a registry, then pull from the registry.

**Example configuration:**
```yaml
services:
  server:
    build:
      context: ./server
    # Builds for current host architecture
  web:
    image: nginx:1.27-alpine
    # Pulls appropriate architecture from Docker Hub
```

### 3. Makefile Enhancements

**Added new multi-architecture build targets:**

#### `make build-multiarch`
Builds multi-architecture Docker images locally for testing:
- Creates builder instance if needed
- Builds for both linux/amd64 and linux/arm64
- Tags images as `delerium-paste-mono-server:latest` and `delerium-paste-mono-server:multi-arch`
- Uses `--load` to make images available locally

#### `make push-multiarch`
Builds and pushes multi-architecture images to a registry:
- Requires `REGISTRY` parameter (e.g., `ghcr.io/username`)
- Optional `TAG` parameter (defaults to `latest`)
- Builds for both architectures
- Pushes to specified registry
- Provides inspection command for verification

**Usage examples:**
```bash
# Build locally
make build-multiarch

# Push to GitHub Container Registry
make push-multiarch REGISTRY=ghcr.io/yourusername TAG=v1.0.0

# Push to Docker Hub
make push-multiarch REGISTRY=docker.io/yourusername TAG=latest
```

### 4. Documentation

**Created comprehensive multi-architecture guide:**

#### `docs/deployment/multi-architecture.md`
Complete guide covering:
- Overview of supported architectures
- Prerequisites and setup (Linux, macOS, Windows)
- Building multi-architecture images (3 methods)
- Deployment scenarios
- CI/CD integration
- Performance considerations
- Troubleshooting
- Best practices
- Example deployment scenarios

**Updated existing documentation:**

#### `README.md`
- Added multi-architecture information to Docker deployment section
- Added links to new multi-architecture guide
- Added Makefile commands for multi-arch builds

#### `docs/README.md`
- Added multi-architecture guide to deployment section
- Added to DevOps/Deployers role section
- Added to quick links section

## CI/CD Integration

The GitHub Actions workflows already support multi-architecture builds:

### `docker-publish.yml`
- Builds for `linux/amd64` and `linux/arm64`
- Publishes to GitHub Container Registry (GHCR)
- Optionally publishes to Docker Hub
- Uses GitHub Actions cache for faster builds

### `docker-hub-server.yml`
- Manual workflow for Docker Hub publishing
- Builds for both architectures
- Includes image verification step

## Benefits

### 1. **Broader Hardware Support**
- Run on any modern server architecture
- Deploy to ARM-based cloud instances (often cheaper)
- Use on Apple Silicon development machines
- Deploy to Raspberry Pi for home/edge deployments

### 2. **Performance**
- Native execution on all supported platforms (no emulation overhead)
- Optimal performance for each architecture

### 3. **Cost Efficiency**
- ARM instances often cost 20-40% less than x86 equivalents
- Better performance-per-dollar on ARM platforms

### 4. **Developer Experience**
- Seamless local development on Apple Silicon Macs
- No need to deal with emulation during development
- Consistent behavior across all platforms

### 5. **Future-Proof**
- Ready for the growing ARM server market
- Supports emerging ARM-based cloud offerings

## Technical Details

### Build Process

1. **Cross-compilation**: Uses Docker Buildx with QEMU for building non-native architectures
2. **Multi-stage builds**: Optimized Dockerfile reduces final image size
3. **Platform arguments**: Dockerfile receives platform information during build
4. **Manifest lists**: Docker automatically selects correct image for host architecture

### Image Registry

Images are published as multi-architecture manifests:
- Single image tag (e.g., `latest`) contains multiple architecture variants
- Docker automatically pulls the correct variant for the host platform
- No need for architecture-specific tags

### Verification

Verify multi-architecture images:
```bash
docker buildx imagetools inspect ghcr.io/username/delerium-paste-server:latest
```

Output shows available platforms:
```
Name:      ghcr.io/username/delerium-paste-server:latest
MediaType: application/vnd.docker.distribution.manifest.list.v2+json

Manifests:
  Platform:  linux/amd64
  Platform:  linux/arm64
```

## Testing

### Local Testing

1. **Build multi-arch images:**
   ```bash
   make build-multiarch
   ```

2. **Test on current architecture:**
   ```bash
   docker compose up -d
   ```

3. **Test specific architecture (with QEMU):**
   ```bash
   docker run --platform linux/arm64 delerium-paste-server:latest
   ```

### CI/CD Testing

GitHub Actions automatically:
- Builds for both architectures on every push to main
- Builds on pull requests (without pushing)
- Publishes on tagged releases
- Verifies build success for both platforms

## Migration Path

For existing deployments:

1. **No changes required** - Docker automatically selects the correct architecture
2. **Pull latest images** - `docker compose pull`
3. **Restart services** - `docker compose up -d`

The multi-architecture support is transparent to existing deployments.

## Troubleshooting

### Common Issues

1. **"exec format error"**
   - Cause: Running wrong architecture without QEMU
   - Solution: Install QEMU or pull correct architecture

2. **Buildx not found**
   - Cause: Docker Buildx not installed
   - Solution: Install Docker Desktop or enable buildx

3. **Slow builds**
   - Cause: Cross-compilation using emulation
   - Solution: Use CI/CD or build on native hardware

See the full [Multi-Architecture Guide](docs/deployment/multi-architecture.md) for detailed troubleshooting.

## Future Enhancements

Potential improvements:
- Add support for additional architectures (arm/v7, riscv64)
- Optimize build times with better caching strategies
- Add architecture-specific optimizations
- Create architecture-specific performance benchmarks

## Support Matrix

| Component | AMD64 | ARM64 | Notes |
|-----------|-------|-------|-------|
| Server (Kotlin/JVM) | ✅ | ✅ | Eclipse Temurin JRE 21 supports both |
| Nginx (Web) | ✅ | ✅ | Official nginx:alpine is multi-arch |
| Client (Static) | ✅ | ✅ | Architecture-independent |
| Database (SQLite) | ✅ | ✅ | File-based, architecture-independent |

All components are fully supported on both AMD64 and ARM64.

## References

- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [Multi-platform Images](https://docs.docker.com/build/building/multi-platform/)
- [GitHub Actions Multi-arch](https://docs.github.com/en/actions/using-github-hosted-runners/about-github-hosted-runners)
- [Eclipse Temurin Multi-arch Support](https://adoptium.net/temurin/releases/)

## Conclusion

Delirium Paste Mono now provides first-class support for multi-architecture deployments, enabling users to deploy on any modern hardware platform with optimal performance. The implementation is transparent to end users while providing significant benefits in terms of hardware flexibility, cost efficiency, and future-proofing.
