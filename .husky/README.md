# Git Hooks

This directory contains Git hooks managed by Husky.

## Pre-commit Hook

The pre-commit hook runs automatically before each commit and performs:

1. **ESLint autofix** - Automatically fixes formatting and simple issues
2. **ESLint check** - Ensures no lint errors remain
3. **TypeScript type check** - Validates all types
4. **Unit tests** - Runs all unit tests

### Skipping the hook (emergency only)

If you need to skip the pre-commit hook:

```bash
git commit --no-verify -m "your message"
```

?? **Use sparingly!** Skipping checks can introduce bugs.

### Troubleshooting

If the hook fails:
1. Read the error message carefully
2. Fix the issues manually
3. Try committing again

Common issues:
- **Unused imports**: Remove them or use them
- **Type errors**: Add proper type annotations
- **Test failures**: Fix the failing tests
