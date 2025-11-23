# Deprecated Workflows - Migration Guide

**Archive Date**: November 23, 2025  
**Consolidation Status**: ✅ Complete

## Overview

These workflows have been consolidated into newer, more efficient workflows. They are kept here for **reference only** and should **NOT be used**.

## Deprecated Workflows

### 1. ~~client-ci.yml~~ (DEPRECATED)

**Status**: ⚠️ No longer used - Consolidated into `pr-checks.yml`

**What it did:**
- Separate frontend CI workflow
- Runs: ESLint, TypeScript, Jest tests, coverage

**Where it went:**
- All checks now in `.github/workflows/pr-checks.yml` → `frontend-checks` job
- Local equivalent: `./scripts/ci-verify-frontend.sh`

**Why consolidated:**
- Eliminated duplicate job startup overhead (~1 min per PR)
- Combined with backend checks in parallel execution
- Shared caching for node_modules

---

### 2. ~~server-ci.yml~~ (DEPRECATED)

**Status**: ⚠️ No longer used - Consolidated into `pr-checks.yml`

**What it did:**
- Separate backend CI workflow
- Runs: Gradle build, Kotlin tests, OWASP dependency check, Docker build test

**Where it went:**
- Backend checks: `.github/workflows/pr-checks.yml` → `backend-checks` job
- Docker tests: `.github/workflows/pr-checks.yml` → `docker-checks` job
- OWASP scan: Moved to `.github/workflows/security-scan.yml` (scheduled-only)
- Local equivalent: `./scripts/ci-verify-backend.sh`

**Why consolidated:**
- Eliminated duplicate job startup overhead (~1 min per PR)
- Parallel execution with frontend checks
- Moved OWASP to scheduled security scans (not blocking PRs)

---

### 3. ~~docker-hub-server.yml~~ (DEPRECATED)

**Status**: ⚠️ No longer used - Consolidated into `docker-publish.yml`

**What it did:**
- Manual workflow dispatch for publishing to Docker Hub
- Triggered on tags for release publishing
- Multi-architecture build (amd64, arm64)

**Where it went:**
- All functionality merged into `.github/workflows/docker-publish.yml`
- Manual dispatch still available via workflow_dispatch input
- Now publishes to both Docker Hub AND GitHub Container Registry

**Why consolidated:**
- Single source of truth for Docker builds
- Eliminates duplicate build logic
- Still supports manual publishing via workflow_dispatch

---

## Migration Path

If you were using these deprecated workflows, here's what changed:

### For CI/CD Results

**Before:**
```
PR triggers:
  ├── client-ci.yml (3 min)
  ├── server-ci.yml (4 min)
  ├── pr-checks.yml (5 min)
  └── (wait for all to complete)
  Total: ~8-10 min
```

**After:**
```
PR triggers:
  └── pr-checks.yml
      ├── frontend-checks (parallel, 2 min)
      ├── backend-checks (parallel, 3 min)
      └── docker-checks (parallel, 2 min)
  Total: ~5 min
```

### For Local Testing

**Before:**
```bash
./scripts/ci-verify-frontend.sh  # Frontend checks
./scripts/ci-verify-backend.sh   # Backend checks
./scripts/ci-verify-all.sh       # All (mirrors all 3 workflows)
```

**After:**
```bash
./scripts/ci-verify-frontend.sh  # Still works (same checks)
./scripts/ci-verify-backend.sh   # Still works (same checks)
./scripts/ci-verify-quick.sh     # NEW: Fast checks only
./scripts/ci-verify-all.sh       # Still works (consolidated)
```

### For Docker Publishing

**Before:**
```yaml
# Manual publish to Docker Hub
workflow: docker-hub-server.yml
dispatch: workflow_dispatch
```

**After:**
```yaml
# Manual publish to Docker Hub + GHCR
workflow: docker-publish.yml
dispatch: workflow_dispatch (input: optional tag)
```

### For Security Scanning

**Before:**
```yaml
# Runs on every PR (blocking)
workflow: server-ci.yml::security-scan
# Also scheduled daily
workflow: security-scan.yml
```

**After:**
```yaml
# No longer runs on PRs (faster feedback)
# Still runs daily at 2 AM UTC + manual dispatch + tags
workflow: security-scan.yml
```

---

## Archive Contents

| File | Purpose |
|------|---------|
| `client-ci.yml.deprecated` | Old frontend CI workflow (reference only) |
| `server-ci.yml.deprecated` | Old backend CI workflow (reference only) |
| `docker-hub-server.yml.deprecated` | Old manual Docker publish workflow (reference only) |
| `MIGRATION_GUIDE.md` | This file - Explains the consolidation |

---

## Why Keep Archives?

These files are kept for:
- **Historical reference**: See what the old workflow looked like
- **Knowledge preservation**: Document why consolidation happened
- **Rollback safety**: Can easily revert if needed
- **Git history**: Full commit history is preserved

---

## Should I Use These?

### ❌ NO - Don't use deprecated workflows for:

- Triggering new CI checks
- Reference for new workflows (use the new ones instead)
- Copying code patterns (consolidation improved them)
- Understanding current CI/CD (read docs/deployment/CI_CD_ARCHITECTURE.md)

### ✅ YES - Use these files for:

- Comparing old vs. new workflow logic (learning what changed)
- Git blame/history investigation (if needed)
- Reference when troubleshooting old issues

---

## Current Active Workflows

Use **these** workflows instead:

| Workflow | Purpose | Location |
|----------|---------|----------|
| **pr-checks.yml** | Master PR quality gate | `.github/workflows/pr-checks.yml` |
| **security-scan.yml** | Independent security scans | `.github/workflows/security-scan.yml` |
| **docker-publish.yml** | Docker builds & publishing | `.github/workflows/docker-publish.yml` |
| **auto-release.yml** | Auto-tagging from version | `.github/workflows/auto-release.yml` |

---

## Questions?

- **How do I run CI checks locally?** → See `./scripts/ci-verify-*.sh`
- **What checks run on my PR?** → See `.github/workflows/pr-checks.yml`
- **How do I publish Docker images?** → See `.github/workflows/docker-publish.yml`
- **Where's the CI/CD documentation?** → See `docs/deployment/CI_CD_ARCHITECTURE.md`

---

**Archive Status**: ✅ Preserved for historical reference  
**Last Updated**: November 23, 2025
