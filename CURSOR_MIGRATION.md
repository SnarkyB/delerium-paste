# Cursor IDE Rules Migration Guide

## Overview

As of recent Cursor updates, the `.cursorrules` file has been **deprecated** in favor of the new **Rules** feature in Cursor Settings. This document explains the migration process and new best practices.

## What Changed?

### Old System (Deprecated)
- **File**: `.cursorrules` in project root
- **Scope**: Project-specific rules only
- **Management**: Manual file editing
- **Limitations**: Single file, no hierarchy

### New System (Current)
- **Location**: Cursor Settings ? Features ? Rules
- **Scope**: Global, workspace, and file-specific rules
- **Management**: UI-based with better organization
- **Benefits**: 
  - Multiple rule contexts (global, workspace, file)
  - Better priority and inheritance
  - Easier to manage across projects
  - Integration with Cursor's AI context system

## Migration Steps

### 1. Access the New Rules Feature

1. Open Cursor Settings (`Cmd+,` on Mac, `Ctrl+,` on Windows/Linux)
2. Navigate to **Features** ? **Rules**
3. You'll see three tabs:
   - **Global Rules**: Apply to all projects
   - **Workspace Rules**: Apply to current workspace
   - **File Rules**: Apply to specific file patterns

### 2. Use the Provided Rule Files

This repository includes organized rule files in `.cursor/rules/`:
- `workspace.md` - Project-wide conventions and patterns
- `typescript.md` - TypeScript-specific guidelines
- `testing.md` - Testing standards and patterns

To use these in Cursor:
1. Open Cursor Settings ? Features ? Rules
2. Navigate to **Workspace Rules**
3. Copy content from the appropriate `.cursor/rules/*.md` files
4. Paste into the Workspace Rules editor

### 3. Organize Rules by Context

Consider breaking down your rules into appropriate contexts:

#### Global Rules (Apply everywhere)
```
- Always use TypeScript strict mode
- Prefer functional programming patterns
- Write comprehensive tests
- Follow security best practices
```

#### Workspace Rules (Delirium-specific)
```
- Zero-knowledge encryption principles
- Client-side encryption before server transmission
- Never log sensitive data
- Follow Delirium project structure
```

#### File Rules (Pattern-specific)
```
Pattern: **/*.ts
- Use explicit types over inference
- Export main functions for testing
- Add JSDoc comments for public APIs

Pattern: **/*.test.ts
- Group tests with describe blocks
- Use descriptive test names
- Mock external dependencies
```

### 4. New `.cursorignore` File

The new system also supports `.cursorignore` for excluding files from AI indexing:

```
# Already created in this migration
.cursorignore
```

This file tells Cursor which files to **exclude from AI context**, improving:
- Faster indexing
- More relevant AI suggestions
- Reduced token usage
- Better context window utilization

## Benefits of New System

### 1. Better Context Management
- Cursor can now better understand which rules apply where
- Reduces confusion in multi-project workspaces
- Improves AI suggestion quality

### 2. Performance Improvements
- `.cursorignore` reduces indexing overhead
- Excludes `node_modules`, build artifacts, logs automatically
- Faster file search and AI context retrieval

### 3. Flexibility
- Different rules for different file types
- Share global rules across all projects
- Override rules at workspace level

### 4. Maintenance
- UI-based editing is easier than file editing
- Visual organization of rules
- Better validation and error checking

## File Exclusion Strategy

The `.cursorignore` file excludes:

### Always Exclude
- `node_modules/`, `.gradle/` (dependencies)
- `build/`, `dist/`, `coverage/` (generated files)
- `*.log`, `logs/` (log files)
- `.env`, `*.pem`, `*.key` (secrets)
- `.DS_Store`, `Thumbs.db` (OS files)

### Consider Excluding
- Lock files (`package-lock.json`, `yarn.lock`)
- Minified files (`*.min.js`, `*.min.css`)
- Source maps (`*.js.map`)
- Large data files (`*.db`, `*.sqlite`)

### Never Exclude
- Source code (`*.ts`, `*.kt`, `*.js` sources)
- Configuration files (`tsconfig.json`, `build.gradle.kts`)
- Documentation (`*.md`, `docs/`)
- Tests (`*.test.ts`, `*.spec.ts`)

## Testing the Migration

### Verify Rules Work
1. Open a TypeScript file
2. Start typing code that violates a rule
3. Check if Cursor's AI suggestions follow the rules

### Verify Indexing Exclusions
1. Open Cursor's file search (`Cmd+P`)
2. Search for a file in `node_modules/`
3. It should be de-prioritized or excluded

### Check Context Quality
1. Ask Cursor AI a question about your codebase
2. It should focus on source files, not node_modules
3. Responses should be faster and more relevant

## Troubleshooting

### Rules Not Applied
- Check that rules are saved in Cursor Settings
- Verify you're in the correct workspace
- Restart Cursor IDE

### Files Not Excluded
- Verify `.cursorignore` syntax (similar to `.gitignore`)
- Check file patterns match your structure
- Reload workspace

### Performance Issues
- Add more patterns to `.cursorignore`
- Exclude large generated files
- Consider excluding test snapshots

## Additional Resources

- [Cursor Documentation](https://cursor.sh/docs)
- [Cursor Rules Feature](https://cursor.sh/docs/features/rules)
- [Context Management Best Practices](https://cursor.sh/docs/context)

## AI Collaboration Workflow

The workspace rules now include comprehensive guidelines for working with AI assistants:

### Key Principles
- **Small PRs**: Keep pull requests focused (100-300 lines ideal)
- **Manual Control**: AI should never auto-commit or auto-push
- **Contextual Commits**: Commit messages must align with branch purpose
- **Explicit Confirmation**: Developer must explicitly request git operations

See [`.cursor/rules/workspace.md`](.cursor/rules/workspace.md) for complete guidelines on:
- Pull request philosophy and sizing
- Commit message conventions
- Breaking down large tasks
- AI assistant DO/DON'T guidelines

## Summary Checklist

- [x] Created `.cursorignore` file
- [x] Created organized rule files in `.cursor/rules/`
- [x] Created migration guide (this document)
- [x] Added AI collaboration workflow rules
- [ ] Migrated rules to Cursor Settings (manual step)
- [ ] Tested AI suggestions with new rules
- [ ] Verified indexing exclusions work
- [ ] Communicated changes to team (if applicable)

## Delirium-Specific Notes

### Critical Rules to Migrate
1. **Zero-knowledge principle**: Never send encryption keys to server
2. **Client-side encryption**: All encryption happens in browser
3. **Security-first**: No sensitive data in logs or errors
4. **Type safety**: Strict TypeScript everywhere
5. **Testing**: 85% coverage minimum

### Files to Keep in Context
- `client/src/*.ts` (TypeScript sources)
- `server/src/main/kotlin/*.kt` (Kotlin sources)
- `*.md` (documentation)
- Configuration files

### Files to Exclude from Context
- `client/js/*.js` (compiled, prefer TypeScript)
- `client/node_modules/` (vendor code)
- `server/build/` (build artifacts)
- `logs/` (log files)
- Coverage reports

---

**Migration Date**: 2025-10-31  
**Cursor Version**: Latest (with Rules feature)  
**Status**: ? Ready for Migration
