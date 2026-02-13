# Repository Guidelines for AI Agents

## Project Overview

**Delirium** is a zero-knowledge encrypted paste system. All encryption happens client-side using Web Crypto API (AES-256-GCM). The server NEVER sees plaintext content or encryption keys. Keys are stored in URL fragments (`#salt:iv`) which browsers never send to servers.

## Project Structure

- `client/` - TypeScript SPA (`src/` for modules, `tests/{unit,integration,e2e}` for Jest/Playwright, build output in `js/`)
- `server/` - Kotlin Ktor API (`src/main/kotlin` for routes/storage, `BUILD.bazel` + Dockerfile). Uses Bazel for builds.
- `reverse-proxy/` - Nginx config serving static assets and proxying `/api`
- `docs/`, `scripts/`, `docker-compose*.yml` - Deployment notes and automation

## Build, Test, and Development Commands

```bash
# Setup & Development
make quick-start              # Full local bootstrap
make dev                      # Backend in Docker + client watch mode at localhost:8080
make start | stop | logs      # Docker Compose operations
make clean                    # Remove containers, volumes, artifacts

# Testing
make test                     # All client tests
make ci-check                 # Full CI verification (parallel) - RUN BEFORE PRs
make ci-quick                 # Quick checks (lint, type, tests)
./scripts/ci-verify-all.sh    # Reproduces GitHub Actions pipeline

# Server (Bazel)
make build-server-bazel       # Build server
make test-server-bazel        # Run server tests
bazel test //server:all_tests # Direct Bazel command
```

## Critical Code Flows

### Paste Creation
1. Client encrypts content with AES-GCM (key derived via PBKDF2 from password)
2. Client requests PoW challenge: `GET /api/pow`
3. Client solves PoW, submits: `POST /api/pastes` with {ciphertext, IV, metadata, PoW}
4. Server returns paste ID + deletion token
5. Client builds share URL: `domain.com/view?p=ID#salt:iv` (key in fragment!)

### Paste Viewing
1. Client fetches: `GET /api/pastes/{ID}`
2. Client derives key from password + salt (from URL fragment)
3. Client decrypts with AES-GCM

## API Endpoints

```
POST   /api/pastes              # Create paste (requires PoW)
GET    /api/pastes/:id          # Retrieve paste
DELETE /api/pastes/:id          # Delete paste (requires token)
POST   /api/pastes/:id/messages # Post encrypted chat message
GET    /api/pastes/:id/messages # Get all encrypted chat messages
GET    /api/pow                 # Get PoW challenge
GET    /health                  # Health check
```

## Coding Style

### TypeScript
- ESLint profile in `eslint.config.mjs` (2-space indent, camelCase symbols, kebab-case filenames)
- Strict mode, explicit types, avoid `any`
- Read source `.ts` files in `client/src/`, NOT compiled `.js` files in `client/js/`

### Kotlin
- JetBrains defaults (4-space indent, UpperCamelCase classes)
- Routes in `Routes.kt`, persistence in `Storage.kt`, DTOs in own packages

## Testing Requirements (CRITICAL)

- **Minimum 85% coverage** for CI to pass
- **100% coverage** for security-critical code (encryption, passwords, validation)
- **Every PR must include tests** for all new code - no exceptions
- Run `npm run lint` and typecheck scripts before requesting review

## Security Requirements (Non-Negotiable)

- Keys must ONLY exist in URL fragment - never sent to server
- No hardcoded secrets or keys in code
- No sensitive data in logs (keys, plaintext, passwords, tokens)
- Error messages must not leak internal details
- All security paths require 100% test coverage

## API Contract Rules

**NEVER break existing API contracts.** When tests fail:
1. DO NOT change the API signature to match test expectations
2. DO investigate how the API is actually used in production code
3. DO fix the test/consumer to match the actual API contract

## Commit & Pull Request Guidelines

### Commit Format
`<type>: <description>` where type is: feat, fix, docs, test, refactor, chore, perf, style

### PR Philosophy
- **Small PRs**: 100-300 lines, focused changes
- **One concern per PR**: Single feature, bug fix, or refactor
- **Logical commits**: Break large work into separate commits for each major chunk
- **Atomic commits**: Each commit should be independently understandable and reviewable
- **Run `make ci-check` before pushing**

### AI Commit & Push Control
- **Always ask before commit/push**: AI must confirm with user before committing or pushing
- **Feature branches allowed**: Commits and pushes to feature branches are permitted with user confirmation
- **Protect main/master**: If on main or master, MUST create a new feature branch before committing
- **Never push directly to main/master**: Always use feature branches and pull requests

## Documentation Rules

- **Change documentation** (fix summaries, migration notes) must go in `docs/prs/PR-XXX-<description>/`
- **NOT in repository root** - keep root clean
- Fill out `PR_DESCRIPTION.md` when opening a PR

## Common Pitfalls to Avoid

1. Sending keys to server (keys must ONLY exist in URL fragment)
2. Changing API contracts without investigation
3. Submitting untested code
4. Decreasing coverage >5%
5. Pushing without running `make ci-check`
6. Auto-committing changes without explicit approval
7. Large PRs (break into 100-300 line focused PRs)
8. Logging sensitive data
9. Using `any` in TypeScript
10. Reading compiled `.js` files instead of source `.ts`

## Key Files to Read

- `CLAUDE.md` - Comprehensive project guidance
- `.cursorrules` - Change documentation organization rules
- `docs/architecture/C4-DIAGRAMS.md` - Architecture diagrams
- `docs/prs/README.md` - PR workflow guide
- `Makefile` - All available commands
