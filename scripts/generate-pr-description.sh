#!/bin/bash
# Auto-generate PR description from git changes
# Usage: ./scripts/generate-pr-description.sh <base-sha> <head-sha>

set -e

BASE_SHA="${1:-main}"
HEAD_SHA="${2:-HEAD}"

# Get changed files
CHANGED_FILES=$(git diff --name-only "$BASE_SHA"..."$HEAD_SHA" 2>/dev/null || git diff --name-only "$BASE_SHA".."$HEAD_SHA")

# Count changes
FILE_COUNT=$(echo "$CHANGED_FILES" | grep -v '^$' | wc -l | tr -d ' ')
COMMIT_COUNT=$(git rev-list --count "$BASE_SHA".."$HEAD_SHA" 2>/dev/null || echo "0")

# Get commit messages
COMMITS=$(git log --oneline "$BASE_SHA".."$HEAD_SHA" 2>/dev/null | head -10)

# Analyze change types
HAS_CLIENT=$(echo "$CHANGED_FILES" | grep -q "^client/" && echo "yes" || echo "no")
HAS_SERVER=$(echo "$CHANGED_FILES" | grep -q "^server/" && echo "yes" || echo "no")
HAS_DOCS=$(echo "$CHANGED_FILES" | grep -q "^docs/" && echo "yes" || echo "no")
HAS_TESTS=$(echo "$CHANGED_FILES" | grep -qE "(test|spec)" && echo "yes" || echo "no")
HAS_WORKFLOWS=$(echo "$CHANGED_FILES" | grep -q "^\.github/" && echo "yes" || echo "no")

# Determine PR type
PR_TYPE="Other"
if echo "$CHANGED_FILES" | grep -qE "(\.ts|\.tsx|\.js|\.jsx)" && [ "$HAS_CLIENT" = "yes" ]; then
  PR_TYPE="Frontend"
elif echo "$CHANGED_FILES" | grep -qE "(\.kt|\.kts)" && [ "$HAS_SERVER" = "yes" ]; then
  PR_TYPE="Backend"
elif [ "$HAS_CLIENT" = "yes" ] && [ "$HAS_SERVER" = "yes" ]; then
  PR_TYPE="Full-stack"
elif [ "$HAS_DOCS" = "yes" ] && [ "$FILE_COUNT" -lt 5 ]; then
  PR_TYPE="Documentation"
fi

# Generate summary
DESCRIPTION="## Description

This PR includes changes to **$PR_TYPE** code.

**Summary:**
- $COMMIT_COUNT commit(s)
- $FILE_COUNT file(s) changed"

# Add change type details
if [ "$HAS_CLIENT" = "yes" ]; then
  DESCRIPTION="$DESCRIPTION
- Frontend changes included"
fi

if [ "$HAS_SERVER" = "yes" ]; then
  DESCRIPTION="$DESCRIPTION
- Backend changes included"
fi

if [ "$HAS_TESTS" = "yes" ]; then
  DESCRIPTION="$DESCRIPTION
- Tests included ✅"
else
  DESCRIPTION="$DESCRIPTION
- ⚠️ No test files detected - please ensure tests are added"
fi

if [ "$HAS_DOCS" = "yes" ]; then
  DESCRIPTION="$DESCRIPTION
- Documentation updated"
fi

if [ "$HAS_WORKFLOWS" = "yes" ]; then
  DESCRIPTION="$DESCRIPTION
- CI/CD workflows updated"
fi

# Add commit summary
if [ "$COMMIT_COUNT" -gt 0 ] && [ "$COMMIT_COUNT" -le 10 ]; then
  DESCRIPTION="$DESCRIPTION

**Recent commits:**
\`\`\`
$COMMITS
\`\`\`"
fi

# Add changed files (if not too many)
if [ "$FILE_COUNT" -le 20 ]; then
  DESCRIPTION="$DESCRIPTION

**Changed files:**
\`\`\`
$CHANGED_FILES
\`\`\`"
else
  DESCRIPTION="$DESCRIPTION

**Changed files:** $FILE_COUNT files (too many to list)"
fi

# Add security note for sensitive changes
if echo "$CHANGED_FILES" | grep -qE "(crypto|security|auth|password|encrypt|decrypt)"; then
  DESCRIPTION="$DESCRIPTION

**⚠️ Security Note:** This PR touches security-critical code. Please ensure:
- [ ] 100% test coverage for security paths
- [ ] Security review completed
- [ ] No sensitive data in logs
- [ ] Keys never sent to server (zero-knowledge principle)"
fi

# Add checklist
DESCRIPTION="$DESCRIPTION

## Checklist
- [ ] Tests pass locally
- [ ] Added/updated tests (if applicable)
- [ ] Code follows project style
- [ ] Self-reviewed"

echo "$DESCRIPTION"
