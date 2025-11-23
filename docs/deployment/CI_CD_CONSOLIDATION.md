# CI/CD Consolidation Implementation Guide

## Overview

This document tracks the consolidation of the Delerium CI/CD pipeline from **7 overlapping workflows** down to **3-4 optimized workflows** while maintaining full test coverage and security scanning.

**Goal**: Reduce CI/CD complexity, improve feedback loop time, and reduce runner minutes.

---

## Current State (Before Consolidation)

### Workflows

| Workflow | Trigger | Purpose | Overlap |
|----------|---------|---------|---------|
| `pr-checks.yml` | PR, branches | NEW consolidated gate | — |
| `client-ci.yml` | PR, push main (client/**) | Frontend checks | **DUPLICATE of pr-checks frontend** |
| `server-ci.yml` | PR, push main/parity (server/**) | Backend + Docker | **DUPLICATE of pr-checks backend** |
| `security-scan.yml` | Schedule (2 AM), tags, manual | Npm audit + OWASP | **Can exclude from PR** |
| `docker-publish.yml` | push main, tags (server/**) | Multi-arch Docker Hub + GHCR | Orthogonal |
| `docker-hub-server.yml` | workflow_dispatch, tags | Multi-arch Docker Hub | **DUPLICATE of docker-publish** |
| `auto-release.yml` | push main | Auto-tag from version | Orthogonal |

### Local CI Scripts

| Script | Purpose |
|--------|---------|
| `ci-verify-all.sh` | Run full PR checks locally (mirrors pr-checks.yml) |
| `ci-verify-frontend.sh` | Frontend checks only |
| `ci-verify-backend.sh` | Backend checks only |
| `ci-verify-quick.sh` | Fast pre-commit subset |

---

## Target State (After Consolidation)

### Workflows (3-4 instead of 7)

| Workflow | Trigger | Purpose | Status |
|----------|---------|---------|--------|
| `pr-checks.yml` (ENHANCED) | PR, branches | Single PR quality gate | ✅ Master |
| `security-scan.yml` (REFACTORED) | Schedule (2 AM), tags, manual | Standalone security scans | Scheduled only |
| `docker-publish.yml` (SIMPLIFIED) | push main, tags (server/**) | Multi-arch Docker build | Orthogonal |
| `auto-release.yml` | push main | Auto-tag from version | No change |

### Deprecated Workflows (to be deleted)

- `client-ci.yml` → Merged into `pr-checks.yml`
- `server-ci.yml` → Merged into `pr-checks.yml`
- `docker-hub-server.yml` → Merged into `docker-publish.yml`

### Local CI Scripts

- Remain unchanged but updated with deprecation notices
- Still valid for local pre-PR checks
- Link to GitHub Actions workflows for reference

---

## Implementation Phases

### Phase 1: Enhance `pr-checks.yml` (CURRENT)

**Goal**: Consolidate `client-ci.yml` and `server-ci.yml` into a single master PR gate.

**Changes**:
1. Merge frontend checks from `client-ci.yml` with better caching
2. Keep existing backend checks from `server-ci.yml`
3. Remove OWASP dependency check from PR flow (move to scheduled `security-scan.yml`)
4. Keep Docker validation checks
5. Add job dependencies for parallelization

**Files to modify**:
- `.github/workflows/pr-checks.yml` → Enhanced

**Expected results**:
- Single PR gate with all frontend/backend/docker checks
- Faster feedback (parallel execution)
- Better caching strategy
- ~30-40% reduction in runner minutes per PR

**Timeline**: 1-2 days

---

### Phase 2: Refactor `security-scan.yml`

**Goal**: Remove PR triggers; make it scheduled-only + manual + tag-based.

**Changes**:
1. Remove any `pull_request:` triggers
2. Keep `schedule: 0 2 * * *` (daily at 2 AM UTC)
3. Keep `workflow_dispatch` (manual trigger)
4. Keep tag triggers for releases
5. Document that it runs independently after PR merge

**Files to modify**:
- `.github/workflows/security-scan.yml` → Simplified

**Expected results**:
- Scheduled daily security scans independent of PR flow
- Faster PR feedback (no OWASP blocking)
- Manual trigger available for on-demand scans

**Timeline**: 1 day

---

### Phase 3: Consolidate Docker Workflows

**Goal**: Merge `docker-hub-server.yml` into `docker-publish.yml`; eliminate duplication.

**Changes**:
1. Audit if `docker-hub-server.yml` is a duplicate (appear to be)
2. Merge manual dispatch + tag triggers into `docker-publish.yml`
3. Keep multi-registry support (Docker Hub + GHCR)
4. Delete `docker-hub-server.yml`

**Files to modify**:
- `.github/workflows/docker-publish.yml` → Enhanced with manual dispatch
- `.github/workflows/docker-hub-server.yml` → Deleted

**Expected results**:
- Single source of truth for Docker image builds
- Still supports manual publish via workflow dispatch
- Fewer workflows to maintain

**Timeline**: 1 day

---

### Phase 4: Update Local CI Scripts

**Goal**: Add deprecation notices and documentation; keep scripts functional.

**Changes**:
1. Add comment headers linking to GitHub Actions workflows
2. Document that scripts are for local pre-PR checks only
3. Update AGENTS.md with CI/CD workflow reference
4. Document why local scripts exist (for fast local iteration without GitHub Actions)

**Files to modify**:
- `scripts/ci-verify-all.sh` → Add header comment
- `scripts/ci-verify-frontend.sh` → Add header comment
- `scripts/ci-verify-backend.sh` → Add header comment
- `scripts/ci-verify-quick.sh` → Add header comment
- `AGENTS.md` → Add CI/CD section

**Expected results**:
- Clear documentation of local vs. GitHub Actions flows
- Scripts remain useful for pre-commit checks
- Team understands the CI/CD structure

**Timeline**: 1 day

---

### Phase 5: Cleanup & Deprecation

**Goal**: Archive old workflows and clean up references.

**Changes**:
1. Disable old workflows in GitHub UI (don't delete yet; wait 2 weeks)
2. Archive old workflow YAML to `docs/archive/workflows/`
3. Update branch protection rules (if any reference old workflows)
4. Update PR template (if needed)
5. After 2 weeks confidence: Delete old workflows

**Files to modify**:
- Move `client-ci.yml`, `server-ci.yml`, `docker-hub-server.yml` to `docs/archive/workflows/`

**Expected results**:
- Clean GitHub Actions tab with only active workflows
- Historical record of old workflows in archive
- Reduced maintenance burden

**Timeline**: 2 days (after 2-week validation period)

---

## Implementation Status

### Phase 1: Enhance `pr-checks.yml`
- [ ] Merge frontend checks (lint, typecheck, test, coverage, security audit)
- [ ] Verify backend checks still pass
- [ ] Test on feature branch
- [ ] Validate parallel execution and caching
- [ ] Document performance improvements

### Phase 2: Refactor `security-scan.yml`
- [ ] Remove PR triggers
- [ ] Verify scheduled run still works
- [ ] Test manual workflow dispatch
- [ ] Document in workflow file

### Phase 3: Consolidate Docker Workflows
- [ ] Audit docker-publish.yml vs. docker-hub-server.yml
- [ ] Merge if duplicates confirmed
- [ ] Test tag push (v1.0.0 → Docker Hub + GHCR)
- [ ] Test manual dispatch

### Phase 4: Update Local CI Scripts
- [ ] Add headers to all scripts
- [ ] Update AGENTS.md
- [ ] Document flow in README or CI/CD guide

### Phase 5: Cleanup
- [ ] Archive old workflows
- [ ] Wait 2 weeks for validation
- [ ] Delete old workflows

---

## Success Metrics

- ✅ All 7 workflows consolidated to 3-4
- ✅ PR feedback loop time ≤5 minutes (from ~8-10 min)
- ✅ Zero regression in security/coverage checks
- ✅ Local CI scripts still work
- ✅ Scheduled security scans run daily
- ✅ Docker images build/push successfully
- ✅ Team can run full CI locally: `./scripts/ci-verify-all.sh`

---

## Quick Reference

### Run a PR check locally (before pushing)
```bash
./scripts/ci-verify-all.sh      # Full check
./scripts/ci-verify-quick.sh    # Fast check
```

### Monitor GitHub Actions
```bash
# View workflow runs
https://github.com/marcusb333/delerium-paste/actions

# View specific workflow
https://github.com/marcusb333/delerium-paste/actions/workflows/pr-checks.yml
```

### Troubleshooting

**Q: Why is my PR check failing?**
- Check `.github/workflows/pr-checks.yml` → Click on the failed job in GitHub Actions → View logs

**Q: How do I trigger security scan manually?**
- Go to GitHub Actions → `security-scan.yml` → Click "Run workflow" → "Run workflow"

**Q: Can I skip CI checks?**
- Not recommended! All checks should pass. Use `ci-verify-all.sh` locally first.

---

## Migration Checklist

- [ ] Phase 1: Enhance pr-checks.yml (test on feature branch)
- [ ] Phase 2: Refactor security-scan.yml (test scheduled run)
- [ ] Phase 3: Consolidate Docker workflows (test tag push)
- [ ] Phase 4: Update local scripts and docs
- [ ] Phase 5: Archive and cleanup
- [ ] Team training: Document changes in wiki/README
- [ ] Monitor runner minutes for first week
- [ ] Gather feedback from team

---

## Notes for Implementers

1. **Test Thoroughly**: Each phase should be tested on a feature branch before merging to main.
2. **Backward Compatibility**: Keep old workflows disabled (not deleted) for 2 weeks to catch regressions.
3. **Documentation**: Update README, AGENTS.md, and CI/CD guide as you go.
4. **Monitor**: Track runner minutes and PR feedback time after each phase.
5. **Team Communication**: Let team know about workflow changes so they don't get confused.

---

Last updated: 2025-11-23
Status: Planning Phase ✅ → Implementation Phase 1 (In Progress)
