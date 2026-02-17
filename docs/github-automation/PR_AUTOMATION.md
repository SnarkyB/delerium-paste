# PR Automation Setup

This repository includes automated PR description generation and code review workflows.

## Features

### 1. Auto-Generated PR Descriptions

When a PR is opened or updated, GitHub Actions automatically generates a PR description based on:
- Changed files and their types (frontend, backend, docs, etc.)
- Commit messages and count
- Test file detection
- Security-critical file detection

The description is generated from git changes and applied to the PR body when opened or updated.

**Workflow:** `.github/workflows/pr-description-bot.yml`

**Script:** `scripts/generate-pr-description.sh`

### 2. Automated Code Reviews

**Cursor Agent Code Review** automatically reviews PRs when they are opened or updated, providing feedback on:
- Code quality and best practices
- Security concerns (critical for zero-knowledge systems)
- Test coverage
- Potential bugs
- Performance considerations
- Documentation

**Workflow:** `.github/workflows/cursor-agent-review.yml`

This uses the same AI model and approach as Cursor Agent, providing reviews that match Cursor's built-in AI assistant style.

## Setup

### Prerequisites

1. **GitHub Actions** - Already enabled by default in GitHub repositories

2. **Cursor Agent Review Setup:**
   - Get your API key from [Anthropic Console](https://console.anthropic.com/)
   - Add it as a GitHub secret:
     - Repository Settings → Secrets and variables → Actions
     - New repository secret
     - Name: `ANTHROPIC_API_KEY`
     - Value: Your API key (starts with `sk-ant-`)
   
   **Note:** This uses the same AI model that Cursor Agent uses, so you can use the same API key if you have one.

### Verification

1. **Test PR Description Bot:**
   - Create a test PR
   - The workflow should run automatically
   - Check the PR description - it should be auto-populated

2. **Test Code Review:**
   - Create a test PR
   - The Cursor Agent review workflow should run automatically
   - Check for review comments from Cursor Agent

## How It Works

### PR Description Generation

1. PR is opened or updated
2. Workflow checks out the repository
3. Script analyzes git changes:
   - Counts commits and files
   - Detects change types (frontend/backend/docs)
   - Checks for test files
   - Identifies security-critical changes
4. Generates full PR description (summary, checklist, security notes)
5. Updates PR description via GitHub API

### Code Review

**Cursor Agent Review:**
1. PR is opened or updated
2. Cursor Agent workflow is triggered
3. Workflow fetches PR details and diff
4. Reads repository guidelines (CLAUDE.md, .cursorrules)
5. Calls Anthropic API (same model Cursor Agent uses)
6. Generates review using Cursor Agent-style prompts
7. Posts review as PR comment

## Customization

### Adjust PR Description Generation

Edit `scripts/generate-pr-description.sh` to:
- Change summary format
- Add more analysis (e.g., complexity metrics)
- Customize security warnings

### Adjust Code Review

Edit `.github/workflows/cursor-agent-review.yml` to:
- Modify the review prompt (in the `Generate AI review` step)
- Change the AI model (currently `claude-3-5-sonnet-20241022` - same as Cursor Agent)
- Adjust max tokens (currently 4000)
- Add custom logic or analysis steps
- Filter which PRs get reviewed (add `if` condition to the job)

### Filter PRs

To only review PRs from external contributors:

```yaml
if: |
  github.event.pull_request.author_association == 'FIRST_TIME_CONTRIBUTOR' ||
  github.event.pull_request.author_association == 'CONTRIBUTOR'
```

To only review PRs touching specific files:

```yaml
on:
  pull_request:
    types: [opened, synchronize]
    paths:
      - "client/src/**/*.ts"
      - "server/src/**/*.kt"
```

## Troubleshooting

### PR Description Not Updating

- Check workflow logs: Actions → PR Description Bot
- Ensure `GITHUB_TOKEN` has `pull-requests: write` permission (should be automatic)
- Verify script is executable: `chmod +x scripts/generate-pr-description.sh`

### Code Review Not Running

- Check if `ANTHROPIC_API_KEY` secret is set
- Verify workflow is enabled: Actions → Workflows → Cursor Agent Code Review
- Check workflow logs for errors
- Verify API key has sufficient credits/quota
- Ensure API key is valid (starts with `sk-ant-`)

### Review Too Verbose/Not Verbose Enough

- Edit the prompt in `.github/workflows/cursor-agent-review.yml` (in the `Generate AI review` step)
- Adjust `max_tokens` parameter (lower = shorter reviews, currently 4000)
- Add explicit instructions for desired review length/style
- Modify the prompt to request more concise or detailed feedback

## Related Files

- `.github/workflows/pr-description-bot.yml` - PR description workflow
- `.github/workflows/cursor-agent-review.yml` - Cursor Agent review workflow
- `.github/workflows/claude-code-review.yml` - Claude Code review (disabled, commented out)
- `scripts/generate-pr-description.sh` - Description generation script
- `scripts/review-pr-with-ai.sh` - Local script to review PRs with Claude AI (requires `ANTHROPIC_API_KEY`)
- `CLAUDE.md` - Repository guidelines for AI reviewers

## Why Cursor Agent?

Cursor Agent provides reviews that match Cursor's built-in AI assistant:
- Same AI model (`claude-3-5-sonnet-20241022`)
- Same review style and approach
- More control over prompts and behavior
- Direct API access for customization
