# PR Description Bot Example

When a PR is opened or updated, the bot generates a full description from git changes:

**Workflow:** `.github/workflows/pr-description-bot.yml`  
**Script:** `scripts/generate-pr-description.sh`

The script analyzes git diff, commits, and file types to produce:
- Summary (change type, commit count, file count)
- Test file detection
- Security notes for crypto/auth changes
- Checklist
- Changed files list

No manual template is used—the description is fully generated.
