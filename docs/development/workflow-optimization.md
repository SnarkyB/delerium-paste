# Workflow Optimization Guide

## Overview

This document describes the parallelization and caching optimizations implemented across CI/CD workflows and local development scripts to significantly reduce execution time.

## Performance Improvements

### Expected Time Savings

- **PR Checks Workflow**: Reduced from ~10-15 minutes to ~5-8 minutes (40-50% improvement)
- **Client CI Workflow**: Reduced from ~5-8 minutes to ~3-5 minutes (40% improvement)
- **Local CI Scripts**: Reduced from sequential to parallel execution (50% time savings)
- **Makefile deploy-full**: Reduced from sequential to parallel builds/tests (30-40% time savings)

## GitHub Actions Workflows

### PR Checks Workflow (`.github/workflows/pr-checks.yml`)

**Before**: All checks ran serially in a single job (frontend → backend → docker)

**After**: Split into three parallel jobs:

- `frontend-checks`: Lint, type-check, unit tests, coverage, security audit
- `backend-checks`: Build and test
- `docker-checks`: Docker build and health check
- `summary`: Aggregates results from all jobs

**Caching Improvements**:

- Added `node_modules` cache (in addition to npm cache)
- Added Jest test results cache
- Added TypeScript incremental build cache
- Added ESLint cache
- Improved Docker layer caching with buildx cache
- Optimized Gradle build cache

**Key Features**:

- Jobs run in parallel using `needs` dependencies
- Summary job uses `if: always()` to report results even on failures
- Each job has its own cleanup on failure

### Client CI Workflow (`.github/workflows/client-ci.yml`)

**Before**: All steps ran serially in one job

**After**: Split into parallel jobs:

- `lint`: ESLint checks
- `typecheck`: TypeScript type checking
- `test`: Unit tests
- `coverage`: Coverage report (depends on test)
- `summary`: Aggregates results

**Caching Improvements**:

- ESLint cache for faster linting
- TypeScript incremental build cache
- Jest cache for faster test execution
- `node_modules` cache

### Security Scan Workflow (`.github/workflows/security-scan.yml`)

**Before**: Already had parallelization but limited caching

**After**: Enhanced caching:

- Added `node_modules` cache
- Added npm audit results cache (for reference, scans still run fresh)
- Added OWASP Dependency Check results cache
- Improved Gradle cache to include build outputs

**Note**: Security scans always run fresh to ensure up-to-date vulnerability detection, but cached dependencies speed up the process.

## Local Development Scripts

### `scripts/ci-verify-all.sh`

**Before**: Ran frontend and backend checks sequentially

**After**:

- Runs `ci-verify-frontend.sh` and `ci-verify-backend.sh` in parallel using background processes
- Proper error handling with exit code tracking
- Displays output from both processes
- Docker validation runs after frontend/backend complete

**Usage**:

```bash
./scripts/ci-verify-all.sh
```

### `scripts/ci-verify-frontend.sh`

**Optimizations**:

- Checks if `node_modules` exists and `package-lock.json` hasn't changed before installing
- Caches Playwright browsers installation
- Uses ESLint cache (`--cache --cache-location .eslintcache`)
- Uses TypeScript incremental builds (`--incremental`)
- Uses Jest cache (`--cache`)

### `scripts/ci-verify-backend.sh`

**Optimizations**:

- Leverages Gradle's built-in build cache
- Uses `--build-cache` flag for better caching (if configured)
- Gradle handles incremental builds automatically

## Makefile Optimizations

### `deploy-full` Target

**Before**: Sequential execution:

1. Clean
2. Build client
3. Build server
4. Test client
5. Test server
6. Deploy Docker

**After**: Parallel execution:

1. Clean
2. Build client and server in parallel
3. Test client and server in parallel
4. Deploy Docker (sequential, depends on builds)

**Usage**:

```bash
make deploy-full
```

## Caching Strategy

### Cache Invalidation

Caches are invalidated when:

- **npm/node_modules**: `package-lock.json` changes
- **Jest**: Source files or `jest.config.js` changes
- **TypeScript**: Source files or `tsconfig.json` changes
- **ESLint**: Source files or `eslint.config.mjs` changes
- **Gradle**: Build files or `gradle-wrapper.properties` changes
- **Docker**: Dockerfile or docker-compose.yml changes

### Cache Keys

Cache keys use a combination of:

- Operating system (`${{ runner.os }}`)
- File hashes (relevant dependency files)
- Fallback restore keys for partial cache hits

### Cache Locations

- **npm**: Managed by `actions/setup-node@v4` (default location)
- **node_modules**: `client/node_modules`
- **Jest**: `client/.jest-cache` and `client/coverage`
- **TypeScript**: `client/js`
- **ESLint**: `client/.eslintcache`
- **Playwright**: `~/.cache/ms-playwright`
- **Gradle**: `~/.gradle/caches`, `server/.gradle`, `server/build`
- **Docker**: `/tmp/.buildx-cache`

## Troubleshooting

### Cache Not Working

1. **Check cache keys**: Ensure cache keys match the files that should trigger invalidation
2. **Verify file paths**: Ensure cached paths are correct and exist
3. **Check cache size**: GitHub Actions has cache size limits (10GB per repository)
4. **Review cache logs**: Check workflow logs for cache hit/miss information

### Parallel Jobs Failing

1. **Check job dependencies**: Ensure `needs` is correctly configured
2. **Review error messages**: Each job should have clear error output
3. **Check summary job**: The summary job will show which specific jobs failed

### Local Script Issues

1. **Background processes**: Ensure scripts handle background process cleanup
2. **Exit codes**: Verify error handling captures exit codes correctly
3. **Output buffering**: Output may appear out of order when running in parallel

### Makefile Parallel Execution

1. **Shell compatibility**: Ensure using bash-compatible shell
2. **Process tracking**: Verify PID tracking works correctly
3. **Error propagation**: Ensure errors from parallel processes are caught

## Best Practices

1. **Always use caching**: Cache dependencies, build outputs, and test results
2. **Parallelize independent tasks**: Run jobs that don't depend on each other in parallel
3. **Use incremental builds**: Enable incremental builds for TypeScript, Jest, etc.
4. **Monitor cache hit rates**: Track cache effectiveness and adjust keys as needed
5. **Keep cache keys specific**: Use file hashes to ensure caches invalidate when needed
6. **Test failure scenarios**: Ensure parallel jobs handle failures gracefully

## Performance Monitoring

To monitor the effectiveness of these optimizations:

1. **GitHub Actions**: Check workflow run times in the Actions tab
2. **Local scripts**: Time execution with `time ./scripts/ci-verify-all.sh`
3. **Cache hit rates**: Review cache hit/miss statistics in workflow logs
4. **Job dependencies**: Verify jobs are actually running in parallel (check timestamps)

## Future Improvements

Potential further optimizations:

1. **Matrix strategies**: Use matrix builds for running tests across multiple Node.js versions
2. **Test sharding**: Split large test suites across multiple parallel jobs
3. **Docker layer caching**: Improve Docker build caching with more granular layers
4. **Artifact sharing**: Share build artifacts between jobs to avoid rebuilding
5. **Conditional execution**: Skip jobs when only certain files change (path-based triggers)

## References

- [GitHub Actions Caching](https://docs.github.com/en/actions/using-workflows/caching-dependencies-to-speed-up-workflows)
- [GitHub Actions Job Dependencies](https://docs.github.com/en/actions/using-workflows/workflow-syntax-for-github-actions#jobsjob_idneeds)
- [Gradle Build Cache](https://docs.gradle.org/current/userguide/build_cache.html)
- [Jest Caching](https://jestjs.io/docs/cli#--cache)
- [TypeScript Incremental Builds](https://www.typescriptlang.org/tsconfig#incremental)
