#!/bin/bash
set -e

echo "🚀 Creating Phase 4 PR (FINAL)"

git checkout feat/bazel-phase4-docs-cleanup
git fetch origin main
git rebase main
git push origin feat/bazel-phase4-docs-cleanup --force-with-lease

gh pr create \
  --base main \
  --head feat/bazel-phase4-docs-cleanup \
  --title "Phase 4: Complete Bazel Migration - Update Docs and Remove Gradle" \
  --body-file PR_PHASE4_DESCRIPTION.md \
  --label "enhancement"

echo "✅ Phase 4 PR Created!"
echo "🎉 All 4 Bazel migration PRs are now created!"
