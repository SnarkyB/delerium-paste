# Phase 1: Add Bazel Build System Core Configuration

## Summary

This is the **first phase** of migrating from Gradle to Bazel build system. This PR introduces the core Bazel configuration files without removing Gradle, allowing for a safe, incremental migration.

## Why Bazel?

- ✅ **No wrapper files needed** - Bazelisk manages versions globally
- ✅ **Hermetic builds** - Fully reproducible builds across all environments  
- ✅ **Extreme performance** - Incremental builds with aggressive caching
- ✅ **Multi-language support** - Ready for monorepo expansion
- ✅ **Remote caching** - Share build artifacts between CI and local

## Changes

### New Files

**Bazel Configuration:**
- `WORKSPACE` - Defines Kotlin rules and Maven dependencies (matching build.gradle.kts)
- `.bazelrc` - Build configurations for CI, local, debug, and release modes
- `.bazelversion` - Pins Bazel version to 7.4.0 (managed by Bazelisk)
- `.bazelignore` - Excludes non-Bazel directories (node_modules, docs, etc.)

**Server Build:**
- `server/BUILD.bazel` - Build rules for:
  - Server library with all dependencies
  - Executable binary (`delerium_server`)
  - Deployable JAR (`delerium_server_deploy`)
  - Test suites (routes, integration, storage)
  - Test utilities library

**Setup & Documentation:**
- `scripts/setup-bazel.sh` - Automated Bazelisk installation with multi-arch support
- `docs/development/BAZEL_QUICKSTART.md` - Developer quick start guide
- `.gitignore` - Updated to exclude Bazel artifacts (`bazel-*`, `.bazel`, etc.)

### Dependencies

All Maven dependencies from `build.gradle.kts` mapped to Bazel:
- Ktor 3.0.2 (server-core, netty, content-negotiation, etc.)
- Logging (log4j-core, log4j-slf4j2-impl)
- Database (Exposed, HikariCP, sqlite-jdbc)
- Crypto (bouncycastle)
- Test dependencies (JUnit, kotlin-test, ktor-test-host)

## Architecture Support

The setup script automatically detects and supports:
- **x86_64** (amd64) - Intel/AMD processors
- **aarch64/arm64** - Apple Silicon M1/M2/M3, AWS Graviton, Raspberry Pi

## Testing

### Prerequisites
```bash
# Install Bazelisk (one-time setup)
make bazel-setup
# OR manually:
brew install bazelisk  # macOS
./scripts/setup-bazel.sh  # Linux
```

### Build and Test
```bash
# Build server
bazel build //server:delerium_server

# Build deployable JAR
bazel build //server:delerium_server_deploy

# Run all tests
bazel test //server:all_tests

# Run specific test suite
bazel test //server:routes_tests
bazel test //server:integration_tests
bazel test //server:storage_test

# Run server locally
bazel run //server:delerium_server
```

### Using Make Targets
```bash
make build-server-bazel
make test-server-bazel
make run-server-bazel
```

## Backward Compatibility

✅ **Gradle still works** - This PR adds Bazel without removing Gradle
- Existing `./gradlew` commands continue to work
- CI/CD still uses Gradle (will migrate in Phase 3)
- Docker builds still use Gradle (will migrate in Phase 2)

This allows teams to:
1. Test Bazel locally without disruption
2. Verify builds work correctly
3. Gradually adopt the new workflow

## Build Configurations

Multiple configurations available via `.bazelrc`:

```bash
# CI build (optimized for GitHub Actions)
bazel build //server:delerium_server --config=ci

# Local development (better error messages)
bazel build //server:delerium_server --config=local

# Debug build (with debug symbols)
bazel build //server:delerium_server --config=debug

# Release build (fully optimized)
bazel build //server:delerium_server --config=release
```

## Documentation

- **BAZEL_QUICKSTART.md** - Complete quick start guide with:
  - Installation instructions for all platforms
  - Basic commands (build, test, run, coverage, clean)
  - IDE integration (IntelliJ, VS Code)
  - Troubleshooting section
  - Command mapping from Gradle

## Migration Phases

This is **Phase 1 of 4**:
- ✅ **Phase 1** (this PR): Core Bazel setup
- 🔄 **Phase 2**: Update Dockerfile and scripts  
- 🔄 **Phase 3**: Migrate CI/CD workflows
- 🔄 **Phase 4**: Update documentation and remove Gradle

## Performance

Initial build downloads dependencies (like Gradle), but subsequent builds are significantly faster:
- **Incremental builds**: Only changed files rebuild
- **Aggressive caching**: Build artifacts cached by content hash
- **Parallel execution**: Automatic parallelization of independent tasks

Example: Changing one Kotlin file rebuilds only that file + tests, not entire project.

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| Team unfamiliar with Bazel | Comprehensive documentation + quick start guide |
| Build failures | Gradle still works, easy rollback |
| CI/CD disruption | CI unchanged in this phase |
| Dependency resolution issues | Exact same versions as Gradle |

## Checklist

- [x] Core Bazel files created (WORKSPACE, .bazelrc, .bazelversion)
- [x] Server BUILD.bazel with all targets
- [x] Setup script with multi-arch support
- [x] Developer documentation (BAZEL_QUICKSTART.md)
- [x] .gitignore updated for Bazel artifacts
- [x] Tested locally (builds and tests pass)
- [x] All dependencies mapped from Gradle
- [x] Gradle remains functional (backward compatibility)

## Next Steps

After this PR merges:
1. **Phase 2 PR**: Update Dockerfile and local scripts to use Bazel
2. Team can test Bazel locally while Gradle continues working
3. Gather feedback before migrating CI/CD

## Resources

- [Bazel Documentation](https://bazel.build/docs)
- [Bazel Kotlin Rules](https://github.com/bazelbuild/rules_kotlin)
- [Bazelisk](https://github.com/bazelbuild/bazelisk)
- [Quick Start Guide](docs/development/BAZEL_QUICKSTART.md) (in this PR)

## Questions?

See [BAZEL_QUICKSTART.md](docs/development/BAZEL_QUICKSTART.md) or ask in comments!

---

**Ready for Review** ✅ Safe to merge, Gradle unaffected
