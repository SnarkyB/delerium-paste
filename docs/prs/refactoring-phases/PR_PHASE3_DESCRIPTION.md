# Phase 3: Migrate CI/CD Workflows to Bazel

## Summary

This is the **third phase** of migrating from Gradle to Bazel. This PR updates all CI/CD workflows and verification scripts to use Bazel for building and testing.

**Depends on:** Phase 1 (Core setup) + Phase 2 (Docker/scripts)

## Changes

### CI/CD Workflow Updates

**`.github/workflows/server-ci.yml`:**

**Build & Test Job:**

- ✅ Replace Gradle cache with Bazel cache (`~/.cache/bazel`)
- ✅ Install Bazelisk with multi-arch support (amd64/arm64)
- ✅ Build: `bazel build //server:delerium_server_deploy --config=ci`
- ✅ Test: `bazel test //server:all_tests --config=ci`
- ✅ Coverage: `bazel coverage //server:all_tests --combined_report=lcov`
- ✅ Update artifact paths: `bazel-testlogs/`, `bazel-out/_coverage/`

**Security Scan Job:**

- ✅ Query dependencies with Bazel: `bazel query 'deps(//server:delerium_server_lib)'`
- ✅ Export dependency list for security analysis
- ⚠️ TODO: Full OWASP integration (currently using Dependabot)

**Docker Test Job:**

- ✅ Update Docker context from `./server` to `.` (project root)
- ✅ Maintains all existing tests (startup, health check, non-root user)

**Publish Job:**

- ✅ Update Docker context for multi-arch builds
- ✅ Same manifest merge process (unchanged)

**Trigger Paths:**
Updated to watch Bazel files:

```yaml
paths:
  - 'server/**'
  - 'WORKSPACE'
  - '.bazelrc'
  - '.bazelversion'
  - '.github/workflows/server-ci.yml'
```

### Script Updates

**scripts/setup-bazel.sh:**

- ✅ Multi-architecture detection (x86_64, aarch64, arm64)
- ✅ Automatic Bazelisk download for detected arch
- ✅ Better error messages with platform-specific instructions

**scripts/check-bazel.sh** (NEW):

- ✅ Helper function to check if Bazel is installed
- ✅ Provides installation instructions for all platforms
- ✅ Can be sourced by other scripts

**scripts/ci-verify-backend.sh:**

- ✅ Complete rewrite for Bazel
- ✅ Check for Bazelisk with helpful prompts
- ✅ Build, test, coverage with Bazel
- ✅ Query dependencies for security

**scripts/ci-verify-all.sh:**

- ✅ Check for Bazel installation before running
- ✅ Helpful error messages if Bazel missing

**scripts/pre-pr-check.sh:**

- ✅ Verify Bazel installed
- ✅ Provide installation instructions if missing

**scripts/quick-start.sh:**

- ✅ Optional Bazel check (not required for Docker workflow)
- ✅ Inform users about Bazel for local development

## Architecture Support

All scripts and CI workflows now support:

- **x86_64** (amd64) - GitHub Actions runners
- **aarch64/arm64** - Self-hosted ARM runners, Apple Silicon

Architecture automatically detected at runtime.

## Testing

### Local Verification

```bash
# Run full CI verification locally
./scripts/ci-verify-all.sh

# Run backend verification only
./scripts/ci-verify-backend.sh

# Pre-PR checks
./scripts/pre-pr-check.sh
```

### CI Pipeline Testing

After merging, CI will:

1. ✅ Install Bazelisk (architecture detected)
2. ✅ Build server with Bazel
3. ✅ Run all tests
4. ✅ Generate coverage report
5. ✅ Build Docker images (multi-arch)
6. ✅ Publish to GHCR

### Expected Behavior

**First CI run after merge:**

- Longer build time (downloads Bazel + dependencies)
- Bazel cache populated

**Subsequent CI runs:**

- Much faster (Bazel cache hit)
- Only changed files rebuild
- Typical speedup: 2-5x faster

## User Experience

### When Bazel is Missing

Users see helpful instructions:

```text
❌ Bazel/Bazelisk is not installed!

To install Bazelisk (Bazel version manager):
  Quick install:
    make bazel-setup
  
  Or manually:
    macOS:   brew install bazelisk
    Linux:   ./scripts/setup-bazel.sh
    Windows: choco install bazelisk
```

### CI Logs

CI logs now show:

```text
✅ Bazel is installed: Bazel 7.4.0
🏗️  Building backend with Bazel...
🧪 Running tests...
📊 Generating coverage report...
```

## Backward Compatibility

⚠️ **This PR removes Gradle from CI/CD**

- Gradle still exists in codebase (removed in Phase 4)
- Local Gradle builds still work
- Only CI/CD uses Bazel from this point

## Performance Impact

### Build Times (Expected)

**GitHub Actions (Ubuntu runner):**

- First build: ~3-4 minutes (similar to Gradle)
- Cached build: ~1-2 minutes (2-3x faster)
- Changed 1 file: ~30-60 seconds (5x faster)

**Local CI verification:**

- First run: ~2-3 minutes
- Incremental: ~30 seconds

### Cache Efficiency

Bazel cache is content-addressable:

- ✅ Better cache hit rate than Gradle
- ✅ Shared across different branches
- ✅ No cache invalidation on version bumps (if deps unchanged)

## Migration Phases

- ✅ **Phase 1**: Core Bazel setup (merged)
- ✅ **Phase 2**: Docker and scripts (merged)
- ✅ **Phase 3** (this PR): CI/CD workflows
- 🔄 **Phase 4**: Documentation and Gradle removal

## Risks & Mitigations

| Risk | Mitigation |
|------|------------|
| CI build failures | Tested locally with ci-verify scripts |
| Cache issues | Can clear with `bazel clean --expunge` |
| Architecture detection fails | Explicit error messages + fallback |
| Dependency download issues | Same Maven repos as Gradle |
| Coverage report format change | Using lcov (standard format) |

## Checklist

- [x] server-ci.yml updated for Bazel
- [x] Docker context updated (./server → .)
- [x] Bazelisk installation with multi-arch support
- [x] Cache configuration updated
- [x] Test output paths updated
- [x] Coverage report generation working
- [x] scripts/ci-verify-backend.sh rewritten for Bazel
- [x] scripts/check-bazel.sh created
- [x] scripts/setup-bazel.sh updated with arch detection
- [x] All verification scripts updated
- [x] Tested locally with ci-verify-all.sh
- [x] Architecture detection for amd64 and arm64

## Breaking Changes

⚠️ **CI/CD now uses Bazel exclusively**

- If you have custom CI workflows referencing Gradle, they need updating
- Local development can still use Gradle (Phase 4 removes it)

## Security Scanning

Current approach:

- ✅ GitHub Dependabot monitors Maven dependencies (automatic)
- ✅ Bazel query exports dependency list
- ⚠️ TODO: Full OWASP dependency-check integration

Dependabot provides good coverage for known vulnerabilities.

## Next Steps

After this PR merges:

1. **Phase 4 PR**: Update documentation, remove Gradle files
2. CI/CD uses Bazel for all builds and tests
3. Monitor first few CI runs for any issues

## Notes for Reviewers

- Verify CI workflow changes look correct
- Check Docker context change in build-push steps
- Review architecture detection logic
- Confirm cache key includes all relevant files
- Test scripts locally if possible

## Rollback Plan

If issues arise:

1. Revert this PR (CI goes back to Gradle)
2. Fix issues
3. Re-apply changes

Gradle is still in repository, so rollback is safe.

---

**Ready for Review** ✅ Requires Phase 1 & 2 merged first
