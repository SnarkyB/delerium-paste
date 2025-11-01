# Using Cursor for PR Reviews

## Quick Start

```bash
# Checkout PR
./scripts/review-pr.sh <PR-NUMBER>

# In Cursor chat
@Codebase review this PR
```

## Cursor Commands

**General Review:**
```
@Codebase review the changes in this PR
```

**Security:**
```
@Codebase check for security vulnerabilities
```

**Architecture:**
```
@Codebase does this follow SOLID principles?
```

**Tests:**
```
@Codebase are there adequate tests?
```

## Workflow

1. **Get PR**: `./scripts/review-pr.sh <PR-NUMBER>`
2. **Review**: Ask Cursor to analyze files
3. **Comment**: Post feedback on GitHub

## What Cursor Can Do

- ? Analyze code quality
- ? Identify security issues  
- ? Suggest improvements
- ? Review architecture
- ? Check test coverage

## What It Cannot Do (Yet)

- ? Comment directly on GitHub
- ? Auto-approve/reject PRs
- ? See PR conversations

## Best Practices

1. Always checkout PR locally
2. Ask specific questions
3. Review in layers (architecture ? code ? tests)
4. Use Composer for suggested fixes

