#!/bin/bash
# Quick script to create Phase 2 PR
set -e

echo "🚀 Creating Phase 2 PR"

git checkout feat/bazel-phase2-docker-scripts
git rebase main
git push origin feat/bazel-phase2-docker-scripts --force-with-lease

gh pr create \
  --base main \
  --head feat/bazel-phase2-docker-scripts \
  --title "Phase 2: Update Dockerfile and Scripts for Bazel Builds" \
  --body-file PR_PHASE2_DESCRIPTION.md \
  --label "enhancement" \
  --label "build-system"

echo "✅ Phase 2 PR Created!"
