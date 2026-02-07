# PR Description Bot Example

This document shows how a bot can auto-generate PR descriptions by injecting content into the PR template.

## Bot Implementation Options

### Option 1: GitHub Actions Bot

Create a workflow (`.github/workflows/pr-description-bot.yml`):

```yaml
name: Auto-generate PR Description

on:
  pull_request:
    types: [opened, synchronize]

jobs:
  generate-description:
    runs-on: ubuntu-latest
    permissions:
      pull-requests: write
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Generate PR description
        run: |
          # Get changed files
          CHANGED_FILES=$(git diff --name-only ${{ github.event.pull_request.base.sha }}...${{ github.event.pull_request.head.sha }})
          
          # Analyze changes and generate summary
          DESCRIPTION=$(./scripts/generate-pr-description.sh "$CHANGED_FILES")
          
          # Update PR description using GitHub CLI
          gh pr edit ${{ github.event.pull_request.number }} --body "$DESCRIPTION"
        env:
          GH_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

### Option 2: Cursor AI / Claude Integration

When creating a PR, Cursor can:
1. Analyze changed files: `git diff --name-only main...HEAD`
2. Read commit messages: `git log --oneline main...HEAD`
3. Generate summary based on code changes
4. Inject between `<!-- BOT_START -->` and `<!-- BOT_END -->` markers

### Option 3: Simple Script Example

```bash
#!/bin/bash
# scripts/generate-pr-description.sh

CHANGED_FILES="$1"
BASE_BRANCH="main"

# Get file changes
FILES=$(echo "$CHANGED_FILES" | tr '\n' ' ')

# Analyze changes
if echo "$FILES" | grep -q "client/src"; then
  TYPE="Frontend"
elif echo "$FILES" | grep -q "server/"; then
  TYPE="Backend"
else
  TYPE="Other"
fi

# Generate description
DESCRIPTION="## Description
This PR updates $TYPE code.

**Changed files:**
$CHANGED_FILES

**Summary:**
- $(git log --oneline $BASE_BRANCH...HEAD | wc -l) commits
- $(echo "$CHANGED_FILES" | wc -l) files changed"

# Inject into template
sed -i '/<!-- BOT_START -->/,/<!-- BOT_END -->/c\
<!-- BOT_START -->\
'"$DESCRIPTION"'\
<!-- BOT_END -->' .github/pull_request_template.md

echo "$DESCRIPTION"
```

## Usage

The PR template includes markers (`<!-- BOT_START -->` and `<!-- BOT_END -->`) where bots can inject auto-generated content. Manual edits outside these markers are preserved.
