# Fix Branch Protection Rules - Remove Deploy Check from PRs

## Problem

The "deploy" check is required for pull requests, but the deploy workflow only runs on pushes to `main`. This causes PRs to show "Expected ? Waiting for status to be reported" and blocks merging.

## Solution

Remove "deploy" from required checks for pull requests. The deploy check should only be required on the `main` branch (after merge), not on PRs.

## Fix via GitHub UI (Recommended)

1. **Go to Repository Settings**
   - Navigate to: `Settings` ? `Branches` ? `Branch protection rules`

2. **Edit the Branch Protection Rule**
   - Find the rule that applies to `main` branch (or the branch you're protecting)
   - Click "Edit" on that rule

3. **Configure Required Status Checks**
   - Scroll to "Require status checks to pass before merging"
   - Find the "deploy" check in the list
   - **Uncheck "deploy"** from required checks
   - Keep other checks like:
     - `checks` (from PR Serial Quality Gates)
     - `lint-and-test` (from Client CI, if applicable)

4. **Save Changes**
   - Scroll down and click "Save changes"

## Fix via Automated Script (Recommended)

We provide an automated script that handles this for you:

```bash
# Run the fix script (requires GitHub CLI)
./scripts/fix-branch-protection.sh

# Or specify a different branch
./scripts/fix-branch-protection.sh main
```

The script will:
- ? Check if GitHub CLI is installed
- ? Verify authentication
- ? Detect your repository automatically
- ? Show current required checks
- ? Remove "deploy" from required checks
- ? Preserve all other required checks

**Prerequisites:**
- GitHub CLI (`gh`) installed: https://cli.github.com/
- Authenticated: `gh auth login`

## Fix via GitHub CLI (Manual)

If you prefer to do it manually with GitHub CLI:

```bash
# View current branch protection rules
gh api repos/:owner/:repo/branches/main/protection

# Remove "deploy" from required checks
# Note: You'll need to set the exact list of required checks (excluding "deploy")
gh api repos/:owner/:repo/branches/main/protection/required_status_checks \
  -X PUT \
  -f strict=true \
  -f contexts='["checks"]'
```

Replace `:owner` and `:repo` with your repository owner and name.

## Recommended Required Checks for PRs

For pull requests, these checks should be required:

- ? **`checks`** - PR Serial Quality Gates (runs on all PRs)
  - Includes: linting, type checking, tests, coverage, security audits
- ? **`lint-and-test`** - Client CI (if path-based, runs when client files change)

Do NOT require:
- ? **`deploy`** - Only runs on `main` branch, not on PRs

## How to Verify

After making the change:

1. Open or refresh your PR
2. The "deploy" check should no longer appear as "Expected"
3. Only the checks that actually run on PRs should be shown
4. Your PR should be mergeable once the required checks pass

## Understanding the Workflows

- **`pr-checks.yml`** ? Runs on all PRs ? Job: `checks` ? Required for PRs
- **`client-ci.yml`** ? Runs on PRs when client files change ? Job: `lint-and-test` ? Optional
- **`deploy.yml`** ? Only runs on `main` branch ? Job: `deploy` ? Should NOT be required for PRs

## Notes

- The deploy workflow is correctly configured to only run on `main` branch pushes
- This is the right behavior - we don't want to deploy on every PR
- The issue was that branch protection was incorrectly requiring a check that never runs on PRs
