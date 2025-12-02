#!/bin/bash
# Script to create all 4 PRs sequentially
# Run this after each PR is merged

echo "Creating Phase 1 PR..."
gh pr create \
  --base main \
  --head feat/bazel-phase1-core-setup \
  --title "Phase 1: Add Bazel Build System Core Configuration" \
  --body-file PR_PHASE1_DESCRIPTION.md \
  --label "enhancement" \
  --label "build-system"

echo ""
echo "✅ Phase 1 PR created!"
echo ""
echo "After Phase 1 merges, run:"
echo "  gh pr create --base main --head feat/bazel-phase2-docker-scripts --title \"Phase 2: Update Dockerfile and Scripts for Bazel Builds\" --body-file PR_PHASE2_DESCRIPTION.md"
