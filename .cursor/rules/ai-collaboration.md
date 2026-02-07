# AI Collaboration Rules

## Cursor Integration

Cursor has built-in support for `.cursor/rules/` files. It automatically reads all `.md` files here.

**Use syntax:** `@workspace.md` or `@testing.md` to reference rules in prompts

## Pull Request Philosophy

- **Small PRs are better**: 100-300 lines, focused changes
- **One concern per PR**: Single feature, bug fix, or refactor
- **Atomic changes**: Each PR independently deployable
- **Clear scope**: Easy to review, test, understand

## Commit & Push Control

- **NEVER auto-commit**: AI must NOT automatically commit changes
- **NEVER auto-push**: AI must NOT automatically push to remote
- **Manual review required**: Developer reviews all changes before commit
- **Explicit confirmation**: Only commit/push when developer explicitly asks

## Workflow

1. AI makes changes (editing files)
2. Developer reviews changes
3. Developer explicitly asks: "commit these changes"
4. AI suggests commit message
5. Developer approves or modifies
6. Developer explicitly asks: "push to remote"
7. AI pushes only when told

## Commit Message Format

Format: `<type>: <description>`

Types:
- `feat:` - New feature
- `fix:` - Bug fix
- `docs:` - Documentation only
- `test:` - Adding/updating tests
- `refactor:` - Code change (no bug fix, no new feature)
- `chore:` - Build process, dependencies, tooling
- `perf:` - Performance improvement
- `style:` - Code style/formatting (no logic change)

## Contextual Commits

Commit messages must align with branch purpose:
