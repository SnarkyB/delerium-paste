# Delirium Workspace Rules for Cursor

## Project Identity

**Delirium** is a zero-knowledge encrypted paste system where all encryption happens client-side. The server NEVER sees plaintext content or encryption keys.

## Architecture Overview

### DDD Layer Structure

```
Presentation → Application → Domain → Infrastructure
```

**Layers:**
- **Presentation** (`presentation/`): UI components, DOM manipulation, event handlers
- **Application** (`application/`): Use cases orchestrating workflows
- **Domain** (`core/services/`): Business logic, domain services
- **Infrastructure** (`infrastructure/`): External integrations (API, PoW, storage)

**Dependency Direction:** Outer layers depend on inner layers. Domain is independent.

### Key Directories

- `client/src/core/` - Domain models, validators, services
- `client/src/application/` - Use cases, DTOs
- `client/src/presentation/` - UI components
- `client/src/infrastructure/` - API clients, PoW solver
- `client/src/features/` - Thin wrappers (backward compatibility)

## Core Security Principles

### Zero-Knowledge Architecture

- ✅ ALL encryption happens client-side before data leaves browser
- ✅ Keys stored ONLY in URL fragments (`#salt:iv`) - never sent to server
- ✅ Server stores only encrypted blobs (ciphertext + IV)
- ❌ NEVER send keys, passwords, or plaintext to server
- ❌ NEVER log sensitive data (keys, plaintext, tokens)

### High-Risk Changes

Changes to these areas require extra care and 100% test coverage:
- Encryption/decryption algorithms
- Key generation, storage, or derivation
- Password handling or authentication
- Data transmission (what gets sent to server)
- URL fragment handling
- Delete authorization mechanisms

**Before making high-risk changes:**
1. Document threat model and edge cases
2. Achieve 100% test coverage for changed code
3. Run security review checklist
4. Test backward compatibility

## Code Style

### TypeScript

- Strict mode enabled (`strict: true`)
- Explicit types preferred over inference
- Export main functions for testing
- JSDoc comments for public APIs
- 2-space indentation, camelCase variables, kebab-case files

**See `.cursor/rules/typescript.md` for detailed rules.**

### Kotlin

- JetBrains defaults (4-space indent)
- UpperCamelCase classes
- Data classes for DTOs
- Suspend functions for async

## Testing Requirements

### Coverage Standards

- **Minimum 85% overall coverage** for CI (see `.github/workflows/pr-checks.yml`)
- **100% coverage** for security-critical code:
  - Encryption/decryption
  - Password handling
  - Authentication
  - Input validation

### Test Organization

- Unit/Integration: `**/*.test.ts`
- E2E: `**/*.spec.ts`
- Test behavior, not implementation
- Independent tests (no shared state)

**See `.cursor/rules/testing.md` for detailed guidance.**

## API Contract Rules

**NEVER break existing API contracts.** When tests fail:

1. ❌ DO NOT change API signature to match test expectations
2. ✅ DO investigate how API is used in production code
3. ✅ DO fix test/consumer to match actual API contract
4. ✅ DO understand WHY the API was designed that way

## Pre-Commit Checklist

**Before every commit**, run ESLint and type check:

```bash
cd client && npm run lint        # Check for lint errors
cd client && npm run typecheck   # Check TypeScript types
```

**Or use the pre-commit hook** (automatically runs on commit):
- Pre-commit hook at `.husky/pre-commit` runs:
  1. ESLint autofix
  2. ESLint check
  3. TypeScript type check
  4. Unit tests

**To install the hook:**
```bash
cd client && npm install  # Runs "prepare" script which sets up Husky
```


## Pre-PR Checklist

Before creating/updating a PR, run:

```bash
# Full CI verification (matches GitHub Actions)
make ci-check

# Quick checks (lint, type, tests)
make ci-quick
```

**Required checks (see `.github/workflows/pr-checks.yml`):**
- [ ] ESLint: 0 errors, 0 warnings
- [ ] TypeScript: Compiles with no errors
- [ ] Tests: All passing (≥85% coverage)
- [ ] Build: Client and server build successfully
- [ ] Self-review: Code follows project style

**CI runs these checks automatically on PR:**
- Frontend: Lint, type check, unit tests, E2E tests, coverage
- Backend: Bazel build and tests
- Docker: Image build and service health checks

## Common Commands

```bash
# Development
make dev              # Backend in Docker + client watch mode
make start            # Build client + start Docker services
make test             # Run all client tests
make ci-check         # Full CI verification (run before PR)

# Server (Bazel)
make build-server-bazel
make test-server-bazel

# See all commands
make help
```

## File Organization

- **Source code**: Read `.ts` files in `client/src/`, NOT compiled `.js` files
- **Change docs**: Place in `docs/prs/PR-XXX-<description>/`, NOT repository root
- **Tests**: Must accompany all new code in same PR

## GitHub Actions Integration

**CI Workflows** (`.github/workflows/`):
- `pr-checks.yml` - Runs on every PR (lint, test, build, coverage)
- `server-ci.yml` - Backend-specific checks
- `security-scan.yml` - Security vulnerability scanning
- `docker-publish.yml` - Docker image builds

**PR Template** (`.github/pull_request_template.md`):
- Use bot injection markers for auto-generated descriptions
- See `.github/PR_BOT_EXAMPLE.md` for bot implementation examples

## Quick Reference

- **Project README**: `README.md`
- **TypeScript rules**: `.cursor/rules/typescript.md`
- **Testing rules**: `.cursor/rules/testing.md`
- **AI collaboration**: `.cursor/rules/ai-collaboration.md`
- **PR review**: `.cursor/rules/pr-review.md`
- **CI configuration**: `.github/workflows/pr-checks.yml`
- **Makefile commands**: `Makefile` (run `make help`)
