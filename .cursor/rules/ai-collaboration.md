# AI Collaboration Rules for Cursor

## Cursor Integration

Cursor automatically reads all `.md` files in `.cursor/rules/`. Reference rules in prompts using:
- `@workspace.md` - Main workspace rules
- `@testing.md` - Testing guidelines
- `@typescript.md` - TypeScript rules
- `@pr-review.md` - PR review checklist

## Pull Request Philosophy

- **Small PRs**: 100-300 lines, focused changes
- **One concern per PR**: Single feature, bug fix, or refactor
- **Atomic changes**: Each PR independently deployable
- **Clear scope**: Easy to review, test, understand
- **Logical commits**: Break large work into separate commits for each major chunk
- **Atomic commits**: Each commit should be independently understandable and reviewable

## Commit & Push Control

- ✅ **Feature branches allowed**: Commits and pushes to feature branches are permitted
- ✅ **Protect main/master**: If on main or master branch, MUST create a new feature branch before committing
- ❌ **Never push directly to main/master**: Always use feature branches and pull requests
- ✅ **Push after each commit**: AI pushes to remote immediately after each commit

## Workflow

1. AI makes changes (editing files)
2. If on main/master, AI creates a new feature branch first
3. **Run ESLint before committing**: `cd client && npm run lint`
4. AI commits changes with descriptive commit message
5. **Pre-commit hook runs automatically** (ESLint, typecheck, tests)
6. AI pushes to remote immediately after each commit

**Note**: Pre-commit hook at `.husky/pre-commit` runs ESLint automatically. If hook is not installed, run `cd client && npm install` to set it up.

## GitHub Operations

- ✅ **Use `gh` CLI**: For all GitHub operations (PRs, issues, etc.), use the `gh` command-line tool
- ❌ **Do NOT use GitKraken tools**: Always prefer `gh` over GitKraken MCP tools
- **Common commands**:
  - `gh pr create` - Create pull request
  - `gh pr view` - View PR details
  - `gh pr list` - List pull requests
  - `gh issue list` - List issues
  - `gh issue view` - View issue details

## Commit Message Format

Format: `<type>: <description>`

**Types:**
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Adding/updating tests
- `refactor:` - Code change (no bug fix, no new feature)
- `chore:` - Build process, dependencies, tooling
- `perf:` - Performance improvement
- `style:` - Code style/formatting (no logic change)

**Examples:**
```
feat: add DDD layer structure with domain services
fix: resolve TypeScript errors in use cases
refactor: extract encryption logic to domain service
test: add unit tests for EncryptionService
docs: update PR template with bot injection support
```

## Contextual Commits

Commit messages must align with branch purpose:

```
Branch: draft/security-ux-bundle
✅ GOOD: "feat: add rate limiting middleware"
✅ GOOD: "feat: improve error message clarity"
❌ BAD: "docs: update deployment guide" (unrelated)
```

## Git Workflow

- **NEVER push directly to main** - Always create feature branch and PR
- All changes must go through pull requests
- Use descriptive branch names: `feature/`, `fix/`, `docs/`, `refactor/`, `draft/`
- Ask before bypassing branch protection rules
