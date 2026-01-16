# Version Bumping Guide

This document explains how version bumping works in the Delirium Paste project and how to use the automated version bumping tools.

## Overview

Version numbers are maintained across multiple files in the codebase:
- `client/package.json` - NPM package version
- `MODULE.bazel` - Bazel module version
- `client/index.html`, `client/view.html`, `client/delete.html` - HTML version displays
- `client/tests/e2e/delete-paste.spec.ts` - E2E test version assertions
- `server/docs/API.md` - API documentation version

## Automated Version Bumping

### Using the Script

The `scripts/bump-version.sh` script automatically updates all version references:

```bash
# Bump to a specific version
./scripts/bump-version.sh 1.0.7

# Preview changes without modifying files
./scripts/bump-version.sh 1.0.7 --dry-run
```

### Using Make

```bash
# Bump version
make version-bump VERSION=1.0.7

# Preview changes
make version-bump-dry-run VERSION=1.0.7
```

## Release Workflow

### Manual Release Process

1. **Create a release branch:**
   ```bash
   git checkout -b release/v1.0.7
   ```

2. **Bump the version:**
   ```bash
   make version-bump VERSION=1.0.7
   ```

3. **Review changes:**
   ```bash
   git diff
   ```

4. **Commit and push:**
   ```bash
   git add -A
   git commit -m "chore: bump version to v1.0.7"
   git push origin release/v1.0.7
   ```

5. **Create a Pull Request** to merge into `main`

6. **After merging**, the release workflow will:
   - Create a git tag (v1.0.7)
   - Create a GitHub release
   - Automatically bump to the next version (1.0.8) via PR

### Automated Release via GitHub Actions

#### Option 1: Manual Workflow Dispatch

1. Go to **Actions** → **Release Workflow**
2. Click **Run workflow**
3. Enter the version number (e.g., `1.0.7`)
4. The workflow will:
   - Verify the version matches the codebase
   - Create a git tag
   - Create a GitHub release
   - Automatically bump to the next version

#### Option 2: Release Branch Push

When you push to a branch matching `release/**`:
- The workflow automatically detects the version from the branch name
- Creates a tag and release
- Bumps to the next version

## Post-Release Automation

After a release is published on GitHub, the `version-bump.yml` workflow automatically:
1. Extracts the released version from the tag
2. Calculates the next patch version (1.0.7 → 1.0.8)
3. Creates a new branch with the version bump
4. Opens a Pull Request to merge the version bump into `main`

This ensures the codebase is always ready for the next release.

## Version Format

Versions follow [Semantic Versioning](https://semver.org/):
- Format: `MAJOR.MINOR.PATCH` (e.g., `1.0.7`)
- Major: Breaking changes
- Minor: New features (backward compatible)
- Patch: Bug fixes (backward compatible)

## Files Updated by Version Bump

The version bump script updates:

1. **client/package.json**
   ```json
   {
     "version": "1.0.7"
   }
   ```

2. **MODULE.bazel**
   ```python
   module(
       name = "delerium_paste",
       version = "1.0.7",
   )
   ```

3. **HTML files** (index.html, view.html, delete.html)
   ```html
   <a href="..." class="version-display">v1.0.7</a>
   ```

4. **Test files**
   ```typescript
   await expect(versionDisplay).toContainText('v1.0.7');
   ```

5. **API Documentation**
   ```markdown
   Current API version: **1.0.7**
   ```

## Troubleshooting

### Version Mismatch Error

If you see an error like:
```
Error: Version mismatch!
  Expected: 1.0.7
  Found in package.json: 1.0.6
```

**Solution:** Run the version bump script:
```bash
make version-bump VERSION=1.0.7
```

### Script Permission Denied

If you get a permission error:
```bash
chmod +x scripts/bump-version.sh
```

### Invalid Version Format

The script validates version format. Use semantic versioning:
- ✅ Valid: `1.0.7`, `2.1.0`, `1.0.10`
- ❌ Invalid: `1.0`, `v1.0.7`, `1.0.7-beta`

## Best Practices

1. **Always use dry-run first** to preview changes:
   ```bash
   make version-bump-dry-run VERSION=1.0.7
   ```

2. **Bump version in a release branch**, not directly in `main`

3. **Review all changes** before committing:
   ```bash
   git diff
   ```

4. **Test after version bump** to ensure everything works:
   ```bash
   make ci-check
   ```

5. **Let automation handle post-release bumps** - the GitHub Actions workflow will automatically create a PR for the next version

## Related Documentation

- [Release Workflow](../.github/workflows/release.yml)
- [Version Bump Workflow](../.github/workflows/version-bump.yml)
- [Version Bump Script](../scripts/bump-version.sh)
