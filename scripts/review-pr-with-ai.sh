#!/bin/bash
# Review PR using Anthropic API (similar to Cursor's AI)
# Usage: ./scripts/review-pr-with-ai.sh <PR_NUMBER> [ANTHROPIC_API_KEY]

set -e

PR_NUMBER="${1}"
API_KEY="${2:-${ANTHROPIC_API_KEY}}"

if [ -z "$PR_NUMBER" ]; then
  echo "Usage: ./scripts/review-pr-with-ai.sh <PR_NUMBER> [ANTHROPIC_API_KEY]"
  exit 1
fi

if [ -z "$API_KEY" ]; then
  echo "Error: ANTHROPIC_API_KEY not provided"
  echo "Set it as environment variable or pass as second argument"
  exit 1
fi

echo "🔍 Fetching PR #$PR_NUMBER..."

# Get PR details
PR_TITLE=$(gh pr view "$PR_NUMBER" --json title --jq -r '.title')
PR_BODY=$(gh pr view "$PR_NUMBER" --json body --jq -r '.body')
PR_AUTHOR=$(gh pr view "$PR_NUMBER" --json author --jq -r '.author.login')
BASE_BRANCH=$(gh pr view "$PR_NUMBER" --json baseRefName --jq -r '.baseRefName')
HEAD_BRANCH=$(gh pr view "$PR_NUMBER" --json headRefName --jq -r '.headRefName')

# Get diff
echo "📝 Getting PR diff..."
PR_DIFF=$(gh pr diff "$PR_NUMBER")

# Get changed files
CHANGED_FILES=$(gh pr diff "$PR_NUMBER" --name-only | head -20)

# Read repository guidelines
GUIDELINES=""
if [ -f "CLAUDE.md" ]; then
  GUIDELINES=$(cat CLAUDE.md | head -200)  # Limit size
fi

# Build review prompt
REVIEW_PROMPT=$(cat <<EOF
You are reviewing a pull request for a zero-knowledge encrypted paste system. 

**PR Details:**
- Title: $PR_TITLE
- Author: $PR_AUTHOR
- Base: $BASE_BRANCH → Head: $HEAD_BRANCH

**PR Description:**
$PR_BODY

**Changed Files:**
$CHANGED_FILES

**Repository Guidelines:**
$GUIDELINES

**Code Diff:**
\`\`\`
$PR_DIFF
\`\`\`

Please provide a comprehensive code review focusing on:

1. **Security (CRITICAL):**
   - Encryption/decryption correctness
   - Key handling (must never be sent to server)
   - Password handling
   - Input validation
   - Error messages that might leak data
   - Logging of sensitive information

2. **Code Quality:**
   - Adherence to project conventions
   - Code organization
   - Best practices

3. **Testing:**
   - Test coverage (minimum 85%, 100% for security code)
   - Edge cases
   - Security-critical paths tested

4. **Potential Issues:**
   - Bugs or logic errors
   - Race conditions
   - Performance concerns
   - Breaking changes

5. **Documentation:**
   - Code comments
   - PR description completeness

Provide specific, actionable feedback. Be constructive and helpful.
EOF
)

echo "🤖 Sending review request to Claude API..."

# Call Anthropic API
REVIEW_RESPONSE=$(curl -s https://api.anthropic.com/v1/messages \
  -H "x-api-key: $API_KEY" \
  -H "anthropic-version: 2023-06-01" \
  -H "content-type: application/json" \
  -d "{
    \"model\": \"claude-3-5-sonnet-20241022\",
    \"max_tokens\": 4000,
    \"messages\": [
      {
        \"role\": \"user\",
        \"content\": \"$REVIEW_PROMPT\"
      }
    ]
  }")

# Extract review text
REVIEW_TEXT=$(echo "$REVIEW_RESPONSE" | jq -r '.content[0].text' 2>/dev/null || echo "Error parsing API response")

if [ -z "$REVIEW_TEXT" ] || [ "$REVIEW_TEXT" = "null" ]; then
  echo "❌ Error: Failed to get review from API"
  echo "Response: $REVIEW_RESPONSE"
  exit 1
fi

echo "✅ Review generated!"
echo ""
echo "--- Review ---"
echo "$REVIEW_TEXT"
echo "--- End Review ---"
echo ""

# Post as PR comment
echo "💬 Posting review as PR comment..."
gh pr comment "$PR_NUMBER" --body "$REVIEW_TEXT"

echo "✅ Review posted to PR #$PR_NUMBER"
