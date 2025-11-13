# Codacy Fixes & Dependency Updates

## Summary
This PR addresses Codacy code quality issues and updates project dependencies to their latest versions.

## Changes

### 🔧 Code Quality Fixes

#### Client-Side Refactoring
- **Refactored `app.ts`** from monolithic 886-line file to modular architecture (92% reduction)
  - Extracted `storage.ts` - Browser storage utilities (119 lines)
  - Extracted `dom-helpers.ts` - DOM manipulation (140 lines)  
  - Extracted `ui-manager.ts` - UI state management (253 lines)
  - Extracted `paste-creator.ts` - Paste creation flow (162 lines)
  - Extracted `paste-viewer.ts` - Paste viewing flow (155 lines)
  - Reduced main `app.ts` to thin orchestrator (71 lines)

- **Fixed async recursion pattern** in `inline-solver.ts`
  - Changed `void step()` to `step()` for proper async recursion handling

- **Test organization improvements**
  - Reorganized tests into `unit/` subdirectories for better structure
  - Added coverage for new storage utilities

#### Server-Side Improvements
- **Updated Kotlin** from 2.1.21 to 2.2.21
- **Improved PoW validation** in server routes

### 📦 Dependency Updates

#### Client Dependencies
- Updated all npm packages to latest compatible versions
- Updated Jest from 29.x to 30.x
- Updated Playwright and related testing tools
- Updated build tools and TypeScript configurations

#### Build Configuration
- **Fixed GitHub Actions workflow**
  - Moved from `server/.github/workflows/` to root `.github/workflows/`
  - Fixed Docker Hub conditional checks to use `vars.DOCKERHUB_ENABLED` instead of checking secrets
  - Updated build context paths to properly reference `./server` directory

### 🧹 Cleanup
- Removed coverage artifacts from version control (added to `.gitignore`)
- Cleaned up test result snapshots and error contexts
- Removed temporary `.orig` file (merge conflict artifact)

### 📚 Documentation
- Added `REFACTORING_SUMMARY.md` with detailed module breakdown
- Added `TEST_RESULTS.md` documenting test improvements
- Added container publishing documentation

## Benefits

1. **Improved Code Quality**: Modular architecture with clear separation of concerns
2. **Better Maintainability**: Each module has single, well-defined responsibility  
3. **Enhanced Testability**: Isolated modules easier to test independently
4. **Up-to-date Dependencies**: Latest security patches and features
5. **Cleaner Repository**: Removed generated artifacts from version control

## Testing
- ✅ All existing tests pass
- ✅ New unit tests added for storage utilities
- ✅ Integration tests validated
- ✅ E2E tests passing

## Breaking Changes
None - all changes are internal refactoring and dependency updates.
