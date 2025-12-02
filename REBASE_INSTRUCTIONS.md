# Rebasing Branches for Parallel PRs

## Current Problem
Branches are stacked: Phase 2 includes Phase 1, Phase 3 includes Phase 1+2, etc.

## Solution: Rebase Each Branch on Main

This will make each branch independent, containing only its own changes.

### Commands:

```bash
# Phase 2: Rebase to remove Phase 1 changes
git checkout feat/bazel-phase2-docker-scripts
git rebase --onto main feat/bazel-phase1-core-setup
git push origin feat/bazel-phase2-docker-scripts --force-with-lease

# Phase 3: Rebase to remove Phase 1+2 changes  
git checkout feat/bazel-phase3-ci-workflows
git rebase --onto main feat/bazel-phase2-docker-scripts
git push origin feat/bazel-phase3-ci-workflows --force-with-lease

# Phase 4: Rebase to remove Phase 1+2+3 changes
git checkout feat/bazel-phase4-docs-cleanup
git rebase --onto main feat/bazel-phase3-ci-workflows
git push origin feat/bazel-phase4-docs-cleanup --force-with-lease
```

### Result:
Each branch will only contain its own commits, making them independent PRs.

### Conflicts:
You'll need to resolve conflicts during rebase since phases modify the same files.
