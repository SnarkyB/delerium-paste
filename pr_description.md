# Docker Image Rename and Dockerfile Configuration Fix

## Overview

This PR renames the Docker image from `delerium-paste-server` to `delerium-server` across the codebase and fixes the Dockerfile Bazel configuration. These changes align the codebase with the Docker Hub repository name (`marcusb333/delerium-server`) that was used for the v1.0.6 release.

## 🎯 Problem Solved

**Before:** 
- Docker image was inconsistently named `delerium-paste-server` in some places
- Dockerfile had an unsupported `--batch` flag that caused build failures with Bazel 8.5.1
- Missing explicit Bazel version configuration in Dockerfile

**After:** 
- Consistent `delerium-server` naming across all files
- Dockerfile builds successfully with proper Bazel configuration
- Explicit Bazel version environment variables for reproducible builds

## ✨ Key Changes

### 🐳 **Docker Image Rename**
- **Makefile**: Updated `build-multiarch` and `push-multiarch` targets to use `delerium-server`
- **GitHub Actions**: Updated `docker-publish.yml` workflow to use `delerium-server`
- **Documentation**: Updated all references in:
  - `docs/deployment/multi-architecture.md`
  - `docs/prs/v1.0.4-prod-fix/BUILDX_SETUP.md`
- **Test Scripts**: Updated `scripts/test-deployment-cors.sh` to check for correct container name

### 🔧 **Dockerfile Configuration Fix**
- Added explicit Bazel version environment variables:
  - `ENV USE_BAZEL_VERSION=8.5.1`
  - `ENV BAZELISK_SKIP_WRAPPER=0`
- Updated comment explaining Bazel behavior in Docker builds
- Removed unsupported `--batch` flag (Bazel 8.5.1 doesn't support this flag)

## 📋 Files Changed

1. `server/Dockerfile` - Added Bazel ENV config, updated comment
2. `.github/workflows/docker-publish.yml` - Updated image name
3. `Makefile` - Updated image names in build/push targets
4. `docs/deployment/multi-architecture.md` - Updated image name references
5. `docs/prs/v1.0.4-prod-fix/BUILDX_SETUP.md` - Updated example image name
6. `scripts/test-deployment-cors.sh` - Updated container name check

## ✅ Testing

- [x] Docker image builds successfully with the fixed Dockerfile
- [x] Successfully pushed v1.0.6 image to Docker Hub as `marcusb333/delerium-server:v1.0.6`
- [x] Successfully tagged and pushed `latest` tag
- [x] All file changes reviewed for consistency

## 🔗 Related

This PR aligns the codebase with the Docker Hub repository that was used to publish v1.0.6:
- Repository: `marcusb333/delerium-server`
- Tags pushed: `v1.0.6` and `latest`

## 📝 Type of Change

- [x] Code refactoring (image name standardization)
- [x] Bug fix (Dockerfile Bazel configuration)
- [x] Documentation update (updated image name references)

## 🚀 Impact

- **Breaking Changes**: None - this is a naming consistency update
- **Deployment**: No changes required - Docker Hub repository already uses `delerium-server`
- **Backward Compatibility**: Maintained - old image names in documentation updated for consistency
