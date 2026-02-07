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

## Commit & Push Control

**CRITICAL: NEVER auto-commit or auto-push**

- ❌ **NEVER auto-commit**: AI must NOT automatically commit changes
- ❌ **NEVER auto-push**: AI must NOT automatically push to remote
- ✅ **Manual review required**: Developer reviews all changes before commit
- ✅ **Explicit confirmation**: Only commit/push when developer explicitly asks

## Workflow

1. AI makes changes (editing files)
2. **Run ESLint before committing**: `cd client && npm run lint`
3. Developer reviews changes
4. Developer explicitly asks: "commit these changes"
5. AI suggests commit message
6. Developer approves or modifies
7. **Pre-commit hook runs automatically** (ESLint, typecheck, tests)
8. Developer explicitly asks: "push to remote"
9. AI pushes only when told

**Note**: Pre-commit hook at `.husky/pre-commit` runs ESLint automatically. If hook is not installed, run `cd client && npm install` to set it up.

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
- Use descriptive branch names: `feature/`, `fix/`, `docs/`, `refactor/`
- Ask before bypassing branch protection rules
