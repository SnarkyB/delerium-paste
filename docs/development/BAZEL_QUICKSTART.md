# Bazel Quick Start Guide

## Overview

Delirium Paste uses Bazel for improved build performance, reproducibility, and to eliminate wrapper dependencies.

## Why Bazel?

- ✅ **No wrapper files needed** - Uses Bazelisk as version manager
- ✅ **Hermetic builds** - Fully reproducible builds
- ✅ **Extreme speed** - Incremental builds with aggressive caching
- ✅ **Multi-language ready** - Easy to add other languages later
- ✅ **Remote caching** - Share build artifacts between CI and local

## Installation

### One-Time Setup

Install Bazelisk (Bazel version manager):

**macOS:**

```bash
brew install bazelisk
```

**Linux:**

```bash
./scripts/setup-bazel.sh
```

**Windows:**

```bash
choco install bazelisk
```

**Manual Installation:**
Download from [Bazelisk Releases](https://github.com/bazelbuild/bazelisk/releases)

### Verify Installation

```bash
bazel --version
# Should output: Bazel 7.4.0 (or version from .bazelversion)
```

## Basic Commands

### Building

```bash
# Build server
bazel build //server:delerium_server

# Build deployable JAR
bazel build //server:delerium_server_deploy
```

### Testing

```bash
# Run all tests
bazel test //server:all_tests

# Run specific test suite
bazel test //server:routes_tests
bazel test //server:integration_tests
bazel test //server:storage_test

# Run with detailed output
bazel test //server:all_tests --test_output=all
```

### Running

```bash
# Run server locally
bazel run //server:delerium_server
```

### Coverage

```bash
# Generate coverage report
bazel coverage //server:all_tests

# View report
# Report will be in: bazel-out/_coverage/_coverage_report.dat
```

### Cleaning

```bash
# Clean build artifacts
bazel clean

# Clean everything including external dependencies
bazel clean --expunge
```

## Configuration Files

- **WORKSPACE** - Defines external dependencies and repository rules
- **.bazelrc** - Build configuration options
- **.bazelversion** - Pins Bazel version (managed by Bazelisk)
- **.bazelignore** - Directories to exclude from Bazel scanning
- **server/BUILD.bazel** - Build rules for server code

## Build Configurations

Use different configurations for different scenarios:

```bash
# CI build (optimized for CI/CD)
bazel build //server:delerium_server --config=ci

# Local development (with debug info)
bazel build //server:delerium_server --config=local

# Debug build
bazel build //server:delerium_server --config=debug

# Release build (optimized)
bazel build //server:delerium_server --config=release
```

## IDE Integration

### IntelliJ IDEA

1. Install the "Bazel" plugin from JetBrains Marketplace
2. Open project as a Bazel project
3. The plugin will auto-generate project files

### VS Code

1. Install the "Bazel" extension
2. The extension provides syntax highlighting and build support

## Troubleshooting

### Build fails with "cannot find symbol"

```bash
# Clean and rebuild
bazel clean --expunge
bazel build //server:delerium_server
```

### Tests fail unexpectedly

```bash
# Run with verbose output
bazel test //server:all_tests --test_output=all --verbose_failures
```

### Dependency issues

```bash
# Check what dependencies are resolved
bazel query 'deps(//server:delerium_server_lib)' --output=build
```

### Cache issues

```bash
# Clear Bazel cache
rm -rf ~/.cache/bazel
bazel clean --expunge
```

## Performance Tips

1. **Use local config for development**: `--config=local`
2. **Incremental builds are fast**: Only changed files are rebuilt
3. **Parallel execution**: Bazel automatically parallelizes builds
4. **Remote caching**: Can be configured for team-wide artifact sharing

## Common Commands

| Task | Bazel Command |
|------|--------------|
| Build server | `bazel build //server:delerium_server` |
| Run tests | `bazel test //server:all_tests` |
| Run server | `bazel run //server:delerium_server` |
| Clean | `bazel clean` |
| Coverage | `bazel coverage //server:all_tests` |

## Next Steps

- [ ] Install Bazelisk
- [ ] Build the server: `bazel build //server:delerium_server`
- [ ] Run tests: `bazel test //server:all_tests`
- [ ] Run locally: `bazel run //server:delerium_server`

## Resources

- [Bazel Documentation](https://bazel.build/docs)
- [Bazel Kotlin Rules](https://github.com/bazelbuild/rules_kotlin)
- [Bazelisk](https://github.com/bazelbuild/bazelisk)

## Support

For questions or issues with Bazel setup, see:

- Project README
- `docs/development/BAZEL_MIGRATION.md` (coming in PR 4)
- Create an issue on GitHub
