# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**Delirium** is a zero-knowledge encrypted paste system where all encryption happens client-side. The server NEVER sees plaintext content or encryption keys. This is a security-first application with TypeScript frontend and Kotlin backend.

## Core Architecture Principle: Zero-Knowledge

- ALL encryption/decryption occurs in the browser using Web Crypto API (AES-256-GCM)
- Encryption keys are stored in URL fragments (after `#`) which browsers never send to servers
- Server only stores encrypted ciphertext + IV + metadata
- Keys are derived from passwords using PBKDF2 (100,000 iterations)
- Privacy-first: no accounts, no tracking, no analytics

**Security Flow:**
```
User Input → PBKDF2 → AES-256 Key → Encrypt → Upload (without key!)
Share URL: domain.com/view?p=ID#salt:iv  (key stays client-side)
```

## Technology Stack

**Frontend (client/):**
- TypeScript with strict mode, ES Modules
- Web Crypto API for encryption
- Jest (unit/integration), Playwright (e2e)
- ESLint, 85% minimum code coverage

**Backend (server/):**
- Kotlin + Ktor framework
- SQLite database with Exposed SQL library
- Bazel build system (migrating from Gradle)
- JDK 21+

**Infrastructure:**
- Docker + Docker Compose
- Nginx reverse proxy
- Multi-architecture support (AMD64, ARM64, ARM/v7)

## Common Development Commands

### Building & Running
```bash
# First time setup
make quick-start              # Interactive setup with secrets config

# Development mode (hot-reload)
make dev                      # Backend in Docker, frontend watches for changes

# Standard workflow
make build-client             # Compile TypeScript
make start                    # Build client + start Docker services
make stop                     # Stop all containers
make logs                     # Follow container logs

# Testing
make test                     # Run all client tests
cd client && npm run test:unit           # Unit tests only
cd client && npm run test:integration    # Integration tests only
cd client && npm run test:e2e            # Playwright e2e tests
cd client && npm run test:coverage       # With coverage report

# Server (Bazel)
make build-server-bazel       # Build server with Bazel
make test-server-bazel        # Run server tests
bazel test //server:all_tests # Direct Bazel command
```

### Pre-PR Verification (CRITICAL)
```bash
# Run ALL checks before creating/pushing to PR
make ci-check                 # Full CI verification (parallel)
make ci-quick                 # Quick checks (lint, type, tests)

# Or use script directly
./scripts/ci-verify-all.sh    # Comprehensive CI verification
```

### Development Tips
```bash
# Type checking (no compilation)
cd client && npm run typecheck

# Linting
cd client && npm run lint            # Check for issues
cd client && npm run lint:fix        # Auto-fix issues

# Clean everything
make clean                    # Remove containers, volumes, build artifacts
```

## Directory Structure & Key Files

### Client Architecture
```
client/
├── src/
│   ├── core/                    # Domain layer (framework-agnostic)
│   │   ├── crypto/              # Encryption implementations
│   │   │   ├── interfaces.ts    # ICryptoProvider interface
│   │   │   ├── aes-gcm.ts       # AES-GCM implementation
│   │   │   └── encoding.ts      # Base64URL utilities
│   │   ├── models/              # Data models (Result<T>, Paste types)
│   │   └── validators/          # Business rule validators
│   ├── features/                # Application features
│   │   ├── paste-creator.ts    # Paste creation workflow
│   │   └── paste-viewer.ts     # Paste viewing workflow
│   ├── infrastructure/          # External integrations
│   │   ├── api/                 # HTTP API client
│   │   └── pow/                 # Proof-of-work solver
│   ├── security.ts              # Password crypto, security utilities
│   └── app.ts                   # Main entry point
├── tests/
│   ├── unit/                    # Fast, isolated tests (*.test.ts)
│   ├── integration/             # API endpoint tests (*.test.ts)
│   └── e2e/                     # Full user flows (*.spec.ts)
└── package.json
```

### Server Architecture
```
server/
├── src/main/kotlin/
│   ├── App.kt                   # Application setup, DI, config
│   ├── Routes.kt                # API endpoints (POST/GET/DELETE /api/pastes, GET /api/pow)
│   ├── Storage.kt               # Database schema, repository
│   ├── Pow.kt                   # Proof-of-work service
│   ├── RateLimiter.kt           # Token bucket rate limiter
│   ├── Models.kt                # Request/response DTOs
│   └── Utils.kt                 # ID generation, Base64 utils
├── BUILD.bazel                  # Bazel build configuration
├── Dockerfile                   # Multi-stage Docker build
└── src/test/kotlin/             # Kotlin tests
```

### Important Files to Read
- `README.md` - Project documentation index
- `.cursorrules` - Change documentation organization rules
- `.cursor/rules/workspace.md` - Comprehensive workspace rules (security, testing, API contracts)
- `docs/architecture/C4-DIAGRAMS.md` - Architecture diagrams (System, Container, Component levels)
- `docs/prs/README.md` - PR workflow and contribution guide
- `Makefile` - All available commands

## Critical Code Flows

### Paste Creation Flow
1. User enters content + settings (expiration, view limit, password)
2. Client validates size, expiration, password strength
3. Client derives encryption key from password via PBKDF2
4. Client encrypts content with AES-GCM
5. Client requests PoW challenge: `GET /api/pow`
6. Client solves PoW (find SHA-256 hash with N leading zero bits)
7. Client submits: `POST /api/pastes` with {ciphertext, IV, metadata, PoW}
8. Server verifies PoW, checks rate limit, validates size
9. Server stores encrypted paste in SQLite
10. Server returns paste ID + deletion token
11. Client builds share URL: `domain.com/view?p=ID#salt:iv` (key in fragment!)

### Paste Viewing Flow
1. User opens URL with ID in query string, salt:iv in fragment
2. Client prompts for password
3. Client fetches: `GET /api/pastes/{ID}`
4. Server returns encrypted ciphertext + IV + metadata
5. Server increments view count (or deletes if single-view)
6. Client derives key from password + salt
7. Client decrypts with AES-GCM
8. Client displays plaintext

### Anti-Spam Mechanisms
- **Proof-of-Work**: Client solves SHA-256 puzzle (10-bit difficulty = ~1024 attempts, <1 second)
- **Rate Limiting**: Token bucket (30 requests/minute per IP)
- **Size Limits**: 1MB max paste size
- **Expiration**: Automatic cleanup of expired pastes

## Code Style & Conventions

### TypeScript
- Strict mode enabled
- 2-space indentation
- camelCase for variables/functions, UpperCamelCase for classes
- kebab-case for filenames
- Explicit types preferred over inference
- Export main functions for testing
- JSDoc comments for public APIs

### Kotlin
- JetBrains defaults (4-space indent)
- UpperCamelCase for classes
- Data classes for DTOs
- Suspend functions for async operations
- Immutable properties preferred

### File Organization Rules
- **Source code**: Prefer reading `.ts` files in `client/src/`, NOT compiled `.js` files in `client/js/`
- **Change documentation**: Must go in `docs/prs/PR-XXX-<description>/` folders, NOT repository root
- **Tests**: Must accompany all new code in the same PR (see testing requirements)

## Testing Requirements (CRITICAL)

### Coverage Standards
- **Minimum 85% overall coverage** for CI to pass
- **100% coverage required** for security-critical code:
  - Encryption/decryption
  - Password handling
  - Authentication
  - Input validation
  - Security utilities
- **Coverage drops >5%**: NOT acceptable without justification

### Zero Untested Code Policy
**EVERY PR must include tests for ALL new code.** No exceptions.

- Adding a new function? Add tests for it
- Adding a new feature? Add tests for it
- Fixing a bug? Add a test that would have caught it
- Modifying logic? Update/add tests

### Test Quality
Tests must have:
- Clear descriptive names: `it('should allow 5 password attempts before failing')`
- Arrange-Act-Assert structure with comments explaining WHY
- Test all paths: happy path, edge cases, errors, security scenarios
- Independent tests (no shared state between tests)
- Test behavior, not implementation details

### Pre-PR Testing Checklist
Before every PR:
```bash
# 1. Clean build
cd client
rm -rf node_modules coverage dist
npm install

# 2. Build
npm run build

# 3. Lint
npm run lint  # Must pass with 0 errors, 0 warnings

# 4. Type check
npm run typecheck  # Must compile with no errors

# 5. Run tests
npm test  # All tests must pass

# 6. Check coverage
npm run test:coverage  # Verify ≥85% or drop ≤5%
```

Or use: `make ci-check` to run all checks automatically.

## API Contract & Backward Compatibility (CRITICAL)

### Rule: NEVER Break Existing API Contracts

When tests fail or integrations break:
1. **DO NOT** change the API signature to match test expectations
2. **DO** investigate how the API is actually used in production code
3. **DO** fix the test/consumer to match the actual API contract
4. **DO** understand WHY the API was designed that way

### Before Changing Any Public API
- [ ] Search codebase for all usages: `grep -r "functionName"`
- [ ] Check how it's called in production code
- [ ] Verify return types/parameters in real usage
- [ ] Read comments/docs explaining design decisions
- [ ] Consider if tests are wrong, not the API

### API Contracts in This Codebase

**Example: Password-based encryption returns ArrayBuffers**
```typescript
// This returns ArrayBuffer for binary crypto operations
export async function encryptWithPassword(
  content: string,
  password: string
): Promise<{ encryptedData: ArrayBuffer; salt: ArrayBuffer; iv: ArrayBuffer }>
```

**Used in production like this:**
```typescript
const { encryptedData, salt, iv } = await encryptWithPassword(text, password);
const ctB64 = b64u(encryptedData); // Convert to base64 for transport
```

**If tests expect base64 strings:**
- ❌ BAD: Change API to return base64
- ✅ GOOD: Fix test to work with ArrayBuffers

## Security Requirements (Non-Negotiable)

### Before Every Commit
- [ ] No hardcoded secrets or keys in code
- [ ] No sensitive data in logs (keys, plaintext, tokens)
- [ ] Client-side encryption verified (keys never sent to server)
- [ ] Input validation on server
- [ ] Error messages don't leak internal details
- [ ] Tests cover security-critical paths (100%)
- [ ] No XSS, SQL injection, or OWASP top 10 vulnerabilities

### Logging Rules
- ✅ Log: request IDs, timestamps, paste IDs, status codes
- ❌ NEVER log: plaintext content, encryption keys, passwords, delete tokens

### Error Handling
**Client:**
```typescript
// ✅ GOOD: User-friendly, doesn't expose internals
try {
  await uploadPaste(data);
} catch (error) {
  showError('Failed to create paste. Please try again.');
  console.error('Upload error:', error); // Debug only
}
```

**Server:**
```kotlin
// ✅ GOOD: Log details, return generic message
try {
    val paste = storage.getPaste(id)
    call.respond(paste)
} catch (e: Exception) {
    logger.error("Failed to retrieve paste $id", e)
    call.respond(HttpStatusCode.InternalServerError,
        ErrorResponse("Failed to retrieve paste"))
}
```

## API Endpoints

```
POST   /api/pastes          # Create paste (requires PoW)
GET    /api/pastes/:id      # Retrieve paste
DELETE /api/pastes/:id      # Delete paste (requires token)
GET    /api/pow             # Get PoW challenge
GET    /health              # Health check
```

### Request/Response Format

**POST /api/pastes:**
```json
{
  "ct": "base64-ciphertext",
  "iv": "base64-initialization-vector",
  "meta": {
    "singleView": false,
    "expiresAt": 1234567890
  },
  "pow": {
    "challenge": "abc123",
    "nonce": 42,
    "hash": "000abc..."
  }
}
```

**Response:**
```json
{
  "id": "paste-id",
  "deleteToken": "token-for-deletion"
}
```

## Git Workflow & Commits

### Branches
- `main` - Production ready
- `draft/*` - Feature branches for PRs
- Use descriptive names: `draft/security-ux-bundle`

### Commit Messages
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

### Contextual Commits
Commit messages must align with branch purpose:

```
Branch: draft/security-ux-bundle
✅ GOOD: "feat: add rate limiting middleware"
✅ GOOD: "feat: improve error message clarity"
❌ BAD:  "docs: update deployment guide" (unrelated)
```

### Quality Gates
All CI checks must pass:
- ✅ Linting (ESLint)
- ✅ Type checking (tsc)
- ✅ Tests (Jest, Playwright)
- ✅ Coverage (85% minimum)
- ✅ Security audit

## AI Collaboration Rules

### Pull Request Philosophy
- **Small PRs are better**: 100-300 lines, focused changes
- **One concern per PR**: Single feature, bug fix, or refactor
- **Atomic changes**: Each PR independently deployable
- **Clear scope**: Easy to review, test, understand

### Commit & Push Control
- **NEVER auto-commit**: AI must NOT automatically commit changes
- **NEVER auto-push**: AI must NOT automatically push to remote
- **Manual review required**: Developer reviews all changes before commit
- **Explicit confirmation**: Only commit/push when developer explicitly asks

### Workflow
1. AI makes changes (editing files)
2. Developer reviews changes
3. Developer explicitly asks: "commit these changes"
4. AI suggests commit message
5. Developer approves or modifies
6. Developer explicitly asks: "push to remote"
7. AI pushes only when told

## Deployment

### Docker Compose
```bash
# Development (port 8080, HTTP)
docker-compose up -d

# Production (ports 80/443, HTTPS)
docker-compose -f docker-compose.prod.yml up -d

# Secure (HTTPS with Let's Encrypt)
docker-compose -f docker-compose.prod.yml -f docker-compose.secure.yml up -d
```

### Production Deployment
```bash
make deploy-prod              # VPS deployment with SSL
./scripts/deploy-prod.sh      # Direct script execution
```

### Multi-Architecture Support
```bash
make build-multiarch          # Build for AMD64 + ARM64
make push-multiarch REGISTRY=ghcr.io/username TAG=v1.0.0
```

## Important Patterns & Decisions

### Fragment-Based Key Storage
Encryption keys stored in URL fragment (`#salt:iv`) are never sent to server in HTTP requests - browser-native zero-knowledge architecture.

### Password Key Derivation
PBKDF2 with 100,000 iterations, SHA-256, 16-byte salt. Provides both security and simple UX (single password unlocks paste).

### Proof-of-Work Design
Client-side SHA-256 puzzle with configurable difficulty. Makes automated spam expensive without requiring user accounts.

### Token Bucket Rate Limiting
Per-IP rate limiting: 30 tokens capacity, refills at 30/minute. Fair resource allocation, prevents abuse.

### Deletion Token Security
Deletion tokens hashed with SHA-256 + secret pepper (env variable) before storage - prevents rainbow table attacks.

### View Management
Flexible viewing: unlimited, limited (N views), or one-time (self-destructs after first view).

## Documentation

### Where to Find Information
- **Setup**: `docs/getting-started/SETUP.md`
- **Deployment**: `docs/deployment/DEPLOYMENT.md`
- **Architecture**: `docs/architecture/C4-DIAGRAMS.md`
- **Testing**: `client/tests/README.md`
- **PRs**: `docs/prs/README.md`
- **Security**: `docs/security/CHECKLIST.md`

### Documentation Organization
- **Change docs** (fix summaries, migration notes, etc.): Place in `docs/prs/PR-XXX-<description>/`
- **NOT in repository root**: Keep root clean
- **PR-specific documentation**: Use descriptive folder names

## Common Pitfalls to Avoid

1. **Sending keys to server**: Keys must ONLY exist in URL fragment
2. **Changing API contracts**: Investigate and fix tests, not APIs
3. **Submitting untested code**: All new code requires tests
4. **Decreasing coverage >5%**: Add tests to maintain coverage
5. **Pushing without CI verification**: Run `make ci-check` first
6. **Auto-committing changes**: Always require explicit developer approval
7. **Large PRs**: Break into smaller, focused PRs (100-300 lines)
8. **Logging sensitive data**: Never log keys, passwords, or plaintext
9. **Using `any` in TypeScript**: Use explicit types
10. **Reading compiled `.js` files**: Read source `.ts` files instead

## Performance Considerations

### Client
- Use native Web Crypto API (fast, no dependencies)
- Minimize bundle size
- Lazy load when possible
- PoW solver yields every 1000 iterations to prevent UI blocking

### Server
- Connection pooling enabled (HikariCP)
- Rate limiting prevents abuse
- Efficient database queries
- Response compression enabled
- Hourly cleanup of expired pastes

## Remember

1. **Zero-Knowledge**: If you're sending a key to the server, you're doing it wrong
2. **Test Everything**: No code without tests (same PR)
3. **Type Safety**: Explicit types prevent bugs
4. **Security First**: When in doubt, be more secure
5. **API Contracts**: Never break existing contracts without investigation
6. **Coverage Matters**: Maintain 85% minimum, critical code at 100%
7. **CI Before PR**: Run full CI checks locally before pushing
8. **Small PRs**: Focused, reviewable, atomic changes
