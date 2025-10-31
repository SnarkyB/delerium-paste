#!/bin/bash
# Review PR with Cursor assistance
# Usage: ./scripts/review-pr.sh <PR-NUMBER>

set -e

PR_NUMBER=$1

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: ./scripts/review-pr.sh <PR-NUMBER>"
  exit 1
fi

echo "?? Fetching PR #$PR_NUMBER..."
gh pr checkout "$PR_NUMBER"

echo ""
echo "?? PR Information:"
gh pr view "$PR_NUMBER"

echo ""
echo "?? Files Changed:"
gh pr diff "$PR_NUMBER" --name-only

echo ""
echo "?? Generating review summary..."
gh pr diff "$PR_NUMBER" > /tmp/pr-${PR_NUMBER}-diff.txt

echo ""
echo "? Ready for review!"
echo "? Ready for review in Cursor!"
echo ""
echo "Next steps:"
echo "  1. Open Cursor"
echo "  2. Ask: '@Codebase review the changes in this PR'"
echo "  3. Or: 'Summarize the diff in /tmp/pr-${PR_NUMBER}-diff.txt'"
echo "  4. Or: 'What are the security implications of these changes?'"
echo ""
echo "Review checklist:"
echo "  - Code quality and SOLID principles"
echo "  - Security implications"
echo "  - Test coverage"
echo "  - Breaking changes"
echo "  - Documentation"
echo "  - Performance"
echo "Suggested Cursor commands:"
echo "  @Codebase review the changes in this PR"
echo "  @Codebase check for security issues"
echo "  @Codebase are there adequate tests?"
