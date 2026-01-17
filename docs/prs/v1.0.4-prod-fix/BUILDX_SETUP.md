# Docker Buildx Installation Summary

**Installed:** December 2, 2025  
**Version:** v0.30.1  
**BuildKit Version:** v0.26.2

## Installation Details

### Package Installed

```bash
docker-buildx-plugin (0.30.1-1~ubuntu.24.04~noble)
```

### Builder Configuration

- **Builder Name:** delirium-builder (active)
- **Driver:** docker-container
- **Status:** Running
- **Endpoint:** unix:///var/run/docker.sock

### Supported Platforms

- linux/amd64
- linux/amd64/v2
- linux/amd64/v3
- linux/386

## Usage

### Basic Build

```bash
docker buildx build -t myimage:latest .
```

### Multi-Platform Build

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t myimage:latest .
```

### Build and Push

```bash
docker buildx build --platform linux/amd64,linux/arm64 -t myimage:latest --push .
```

### Build and Load (single platform)

```bash
docker buildx build --platform linux/amd64 -t myimage:latest --load .
```

## Builder Management

### List Builders

```bash
docker buildx ls
```

### Inspect Current Builder

```bash
docker buildx inspect
```

### Switch Builder

```bash
docker buildx use delirium-builder
```

### Create New Builder

```bash
docker buildx create --name mybuilder --use
```

### Remove Builder

```bash
docker buildx rm delirium-builder
```

## Current Builders

```text
NAME/NODE               DRIVER/ENDPOINT                   STATUS     BUILDKIT   PLATFORMS
delirium-builder*       docker-container                                        
 \_ delirium-builder0    \_ unix:///var/run/docker.sock   running    v0.26.2    linux/amd64, linux/386
default                 docker                                                  
 \_ default              \_ default                       running    v0.22.0    linux/amd64, linux/386
```

## BuildKit Container

The buildx builder runs as a Docker container:

```text
CONTAINER ID   IMAGE                           STATUS
0ca6691f8dc2   moby/buildkit:buildx-stable-1   Up
```

## Integration with Delirium Project

### Building Multi-Architecture Images

You can now build the Delirium server for multiple architectures:

```bash
cd /home/noob/delirium

# Build for AMD64 and ARM64
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t delirium-server:multi-arch \
  -f server/Dockerfile \
  .
```

### Push to Registry

To push multi-arch images to a registry (e.g., Docker Hub or GHCR):

```bash
# Login to registry
docker login ghcr.io

# Build and push
docker buildx build \
  --platform linux/amd64,linux/arm64 \
  -t ghcr.io/marcusb333/delerium-server:v1.0.4 \
  -f server/Dockerfile \
  --push \
  .
```

### Using the Makefile

The project's Makefile has targets for multi-arch builds:

```bash
# Build multi-arch locally
make build-multiarch

# Build and push to registry
make push-multiarch REGISTRY=ghcr.io/marcusb333 TAG=v1.0.4
```

## Cache Management

### View Cache

```bash
docker buildx du
```

### Prune Cache

```bash
docker buildx prune
```

### Prune All Cache

```bash
docker buildx prune --all
```

## Advanced Features

### Build with Secrets

```bash
docker buildx build \
  --secret id=mysecret,src=/path/to/secret \
  -t myimage:latest \
  .
```

### Build with SSH Agent

```bash
docker buildx build \
  --ssh default \
  -t myimage:latest \
  .
```

### Export Build Cache

```bash
docker buildx build \
  --cache-to type=local,dest=/tmp/cache \
  -t myimage:latest \
  .
```

### Import Build Cache

```bash
docker buildx build \
  --cache-from type=local,src=/tmp/cache \
  -t myimage:latest \
  .
```

## Troubleshooting

### Builder Not Starting

```bash
# Remove and recreate builder
docker buildx rm delirium-builder
docker buildx create --name delirium-builder --use
docker buildx inspect --bootstrap
```

### Container Issues

```bash
# Check buildkit container logs
docker logs buildx_buildkit_delirium-builder0

# Restart buildkit container
docker restart buildx_buildkit_delirium-builder0
```

### Platform Not Supported

```bash
# Install QEMU for cross-platform builds
docker run --privileged --rm tonistiigi/binfmt --install all
```

## Benefits for Delirium Project

1. **Multi-Architecture Support**: Build images for AMD64, ARM64, and ARM/v7
2. **Faster Builds**: BuildKit provides improved caching and parallel builds
3. **Registry Integration**: Direct push to container registries
4. **Build Attestation**: Supply chain security with SBOM generation
5. **Advanced Caching**: Layer caching across builds

## Docker Compose Integration

Docker Compose will now use buildx automatically when available. The warning message:

```text
level=warning msg="Docker Compose is configured to build using Bake, but buildx isn't installed"
```

will no longer appear.

## Verification

To verify buildx is working correctly:

```bash
# Check version
docker buildx version

# List builders
docker buildx ls

# Test build
cd /home/noob/delirium
docker buildx build --platform linux/amd64 -t test:latest -f server/Dockerfile .
```

## Next Steps

1. ✅ Buildx installed and configured
2. ✅ Builder created and active
3. ✅ BuildKit container running
4. 🔄 Ready for multi-architecture builds
5. 🔄 Ready to push to container registries

## Resources

- [Docker Buildx Documentation](https://docs.docker.com/buildx/working-with-buildx/)
- [BuildKit Documentation](https://github.com/moby/buildkit)
- [Multi-Platform Builds](https://docs.docker.com/build/building/multi-platform/)

---

**Installation completed successfully on December 2, 2025**
