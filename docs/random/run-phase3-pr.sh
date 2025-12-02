#!/bin/bash
set -e

echo "🚀 Creating Phase 3 PR"

git checkout feat/bazel-phase3-ci-workflows
git fetch origin main
git rebase main  
git push origin feat/bazel-phase3-ci-workflows --force-with-lease

gh pr create \
  --base main \
  --head feat/bazel-phase3-ci-workflows \
  --title "Phase 3: Migrate CI/CD Workflows to Bazel" \
  --body-file PR_PHASE3_DESCRIPTION.md \
  --label "enhancement"

echo "✅ Phase 3 PR Created!"
