## Overview

This PR adds comprehensive container image publishing setup for the delerium-paste server, enabling automated publishing to both Docker Hub and GitHub Container Registry (GHCR).

## Changes

- **Documentation**
  - Added `CONTAINER_PUBLISHING.md` - Comprehensive guide covering manual and automated publishing workflows
  - Added `QUICK_START.md` - Quick reference for getting started with container publishing

- **CI/CD**
  - Added GitHub Actions workflow (`.github/workflows/docker-publish.yml`) for automated image building and publishing
  - Supports publishing to both Docker Hub and GHCR
  - Automatic semantic versioning with multiple tag formats (latest, 1.0.0, 1.0, 1)
  - Builds on pushes to `main` branch and version tags

- **Build Scripts**
  - Enhanced `docker-build.sh` with dual registry support (Docker Hub and GHCR)
  - Improved error handling and user feedback

## Features

- ✅ Automated publishing via GitHub Actions
- ✅ Support for both Docker Hub and GHCR
- ✅ Semantic versioning with multiple tag formats
- ✅ Multi-stage Docker builds for optimized image size
- ✅ Comprehensive documentation and quick start guides

## Usage

After merging, images will be automatically published to GHCR on pushes to `main` or version tags. For Docker Hub publishing, configure the `DOCKERHUB_USERNAME` and `DOCKERHUB_TOKEN` secrets in GitHub repository settings.

See `server/CONTAINER_PUBLISHING.md` and `server/QUICK_START.md` for detailed instructions.
