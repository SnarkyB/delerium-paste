# Bazel Build Guide

## Overview

Delirium Paste uses Bazel for building the Kotlin/Ktor server.

## Why Bazel?

1. **No wrapper files needed**: Bazelisk manages Bazel versions automatically
2. **Hermetic builds**: Fully reproducible builds across all environments
3. **Extreme performance**: Incremental builds with aggressive caching
4. **Monorepo-ready**: Native support for multi-language projects
5. **Remote caching**: Share build artifacts between CI and local development

## Build System

The project uses Bazel for all server builds. The build configuration is defined in:

### New Files

- `WORKSPACE` - Defines external dependencies and Kotlin rules
- `.bazelrc` - Build configuration for different scenarios
- `.bazelversion` - Pins Bazel version (managed by Bazelisk)
- `.bazelignore` - Directories to exclude from Bazel
- `server/BUILD.bazel` - Build rules for server code and tests

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
# Or use Make target
make bazel-setup
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
# Output: Bazel 7.4.0 (or version from .bazelversion)
```

## Command Mapping

### Building

| Task | Bazel Command |
|------|--------------|
| Build server | `bazel build //server:delerium_server` |
| Build JAR | `bazel build //server:delerium_server_deploy` |
| Clean | `bazel clean` |
| Full clean | `bazel clean --expunge` |

### Testing

| Task | Bazel Command |
|------|--------------|
| Run all tests | `bazel test //server:all_tests` |
| Run specific test | `bazel test //server:storage_test` |
| Test with output | `bazel test //server:all_tests --test_output=all` |
| Coverage report | `bazel coverage //server:all_tests` |

### Running

| Task | Bazel Command |
|------|--------------|
| Run server | `bazel run //server:delerium_server` |
| Run with config | Set env vars and run |

### Other Tasks

| Task | Bazel Command |
|------|--------------|
| Dependency check | GitHub Dependabot (automatic) |
| List dependencies | `bazel query 'deps(//server:delerium_server_lib)'` |

## Common Workflows

### Local Development

```bash
# Build server
bazel build //server:delerium_server

# Run tests
bazel test //server:all_tests --test_output=errors

# Run server
bazel run //server:delerium_server

# Or use Make targets
make build-server-bazel
make test-server-bazel
make run-server-bazel
```

### Docker Development

```bash
# Build Docker image (uses Bazel inside container)
cd server
docker build -t delerium-server .

# Run container
docker run -p 8080:8080 -e DELETION_TOKEN_PEPPER=test delerium-server
```

### CI/CD

The GitHub Actions workflows now use Bazel:

```bash
# What CI runs:
bazel build //server:delerium_server_deploy --config=ci
bazel test //server:all_tests --config=ci
bazel coverage //server:all_tests --config=ci
```

## Build Configurations

Bazel supports multiple configurations in `.bazelrc`:

```bash
# CI build (optimized for GitHub Actions)
bazel build //server:delerium_server --config=ci

# Local development (with better error messages)
bazel build //server:delerium_server --config=local

# Debug build (with debug symbols)
bazel build //server:delerium_server --config=debug

# Release build (fully optimized)
bazel build //server:delerium_server --config=release
```

## IDE Integration

### IntelliJ IDEA

1. Install "Bazel" plugin from JetBrains Marketplace
2. File → Open → Select project root
3. Choose "Import Bazel Project"
4. The plugin auto-generates `.idea/` files

### VS Code

1. Install "Bazel" extension
2. The extension provides:
   - Syntax highlighting for BUILD files
   - Build/test commands in command palette
   - Integrated terminal support

## Troubleshooting

### "bazel: command not found"

Install Bazelisk:

```bash
make bazel-setup
# Or manually: brew install bazelisk (macOS)
```

### Build fails with "cannot find symbol"

Clean and rebuild:

```bash
bazel clean --expunge
bazel build //server:delerium_server
```

### Tests fail unexpectedly

Run with verbose output:

```bash
bazel test //server:all_tests --test_output=all --verbose_failures
```

### Dependency issues

Query what's resolved:

```bash
bazel query 'deps(//server:delerium_server_lib)' --output=build
```

### Slow initial build

First build downloads dependencies and compiles everything.
Subsequent builds are much faster (only changed files rebuild).

### Cache issues

Clear Bazel cache:

```bash
rm -rf ~/.cache/bazel
bazel clean --expunge
```

## Performance Tips

1. **Incremental builds are fast**: Bazel only rebuilds what changed
2. **Use local config for dev**: `--config=local` has better error messages
3. **Parallel execution**: Bazel automatically parallelizes builds
4. **Cache is shared**: Build once, test multiple times is nearly instant

## Key Features

### Hermetic Builds

Bazel builds are fully hermetic - same inputs always produce same outputs.
No more "works on my machine" issues.

### Explicit Dependencies

All dependencies must be declared in WORKSPACE and BUILD files.
This makes the build graph explicit and cacheable.

### Explicit Build Rules

Bazel uses explicit build rules.
You specify exactly what to build.

### External Dependencies

Maven dependencies are resolved via `rules_jvm_external`
in the WORKSPACE file.

## Migration Status

✅ **Migration Complete!** All workflows and scripts now use Bazel.

### Completed

- ✅ Install Bazelisk
- ✅ Use `bazel` commands for all builds
- ✅ Update CI/CD scripts (pr-checks.yml, server-ci.yml)
- ✅ Update Docker build commands
- ✅ Update local verification scripts (ci-verify-quick.sh, ci-verify-backend.sh)
- ✅ Update security scanning scripts
- ✅ Update documentation
- ✅ Test local builds
- ✅ Test CI/CD pipelines

### Migration Checklist

If you're setting up the project:

- [x] Install Bazelisk
- [x] Use `bazel` commands for all builds
- [x] Update CI/CD scripts
- [x] Update Docker build commands
- [x] Update documentation
- [x] Test local builds
- [x] Test CI/CD pipelines

## Resources

- [Bazel Documentation](https://bazel.build/docs)
- [Bazel Kotlin Rules](https://github.com/bazelbuild/rules_kotlin)
- [Bazelisk](https://github.com/bazelbuild/bazelisk)
- [rules_jvm_external](https://github.com/bazelbuild/rules_jvm_external)

## Support

For questions or issues:

1. Check this migration guide
2. See [BAZEL_QUICKSTART.md](./BAZEL_QUICKSTART.md)
3. Create an issue on GitHub
4. Check Bazel documentation

## Build System History

The project uses Bazel for all builds. Previous build system configurations are preserved in git history if needed for reference.
