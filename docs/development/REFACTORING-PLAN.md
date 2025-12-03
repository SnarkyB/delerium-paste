# Delirium Architecture Refactoring Plan

## Overview

Transform Delirium into a highly modular, maintainable, and extensible codebase through **13 small, incremental PRs**.

## Why Incremental Refactoring?

Instead of one massive PR with 5000+ lines of changes:

- ? **Reviewable**: Each PR takes ~15-30 minutes to review
- ? **Testable**: Each PR can be tested independently
- ? **Reversible**: Easy to revert a small change if needed
- ? **Safe**: App keeps working between PRs
- ? **Learning**: Team learns new architecture gradually

## Goals

- **Modular**: Clear separation of concerns with well-defined boundaries
- **SOLID**: Follow Single Responsibility, Open/Closed, Liskov Substitution, Interface Segregation, Dependency Inversion
- **Testable**: Pure functions, dependency injection, easy mocking
- **Extensible**: Plugin architecture with clear extension points
- **Fork-friendly**: Easy for others to customize and extend

## PR Series

### Phase 1: Frontend Modularization (6 PRs)

#### ? **PR #1: Extract Crypto Module** - COMPLETED

**Branch**: `feature/pr-001-crypto-module`  
**Size**: 7 files, ~300 lines  
**Review Time**: ~15 minutes  
**Breaking Changes**: None  

**What it does**:

- Extracts encryption/decryption into pluggable `ICryptoProvider` interface
- Creates `Result<T, E>` type for type-safe error handling
- Implements AES-GCM 256-bit encryption (same security as before)
- Enables custom encryption algorithms via interface implementation

**Files**:

```text
client/src/core/
??? crypto/
?   ??? interfaces.ts      # ICryptoProvider interface
?   ??? aes-gcm.ts        # AES-GCM implementation
?   ??? encoding.ts       # Base64url utilities
?   ??? index.ts          # Public API
??? models/
    ??? result.ts         # Result<T, E> type
```

**Extension Point**:

```typescript
// Custom encryption? Just implement the interface:
class CustomCrypto implements ICryptoProvider {
  async encrypt(plaintext: string): Promise<EncryptionResult> {
    // Your implementation
  }
}
```

**Next Steps**:

1. Review PR documentation: `docs/prs/PR-001-CRYPTO-MODULE.md`
2. Test the module works independently
3. Merge when ready
4. Move to PR #2

---

#### ?? **PR #2: Extract Validators & Domain Models**

**Size**: ~200 lines  
**Review Time**: ~10 minutes  
**Dependencies**: None (can run parallel with PR #1)  

**What it does**:

- Extract validation logic from `security.ts`
- Extract domain models from `app.ts`
- Privacy-preserving validation (no content analysis)

**Files to create**:

```text
client/src/core/
??? validators/
?   ??? index.ts          # Content, password, expiration validators
??? models/
    ??? paste.ts          # Paste domain models
```

---

#### ?? **PR #3: Extract API Client Module**

**Size**: ~250 lines  
**Review Time**: ~15 minutes  
**Dependencies**: PR #2  

**What it does**:

- Extract API calls into pluggable `IApiClient` interface
- Create fetch-based implementation
- Create mock client for testing

**Extension Point**: Custom API backend (e.g., GraphQL, gRPC)

---

#### ?? **PR #4: Extract PoW Solver Module**

**Size**: ~200 lines  
**Review Time**: ~10 minutes  
**Dependencies**: None  

**What it does**:

- Extract proof-of-work into `IPowSolver` interface
- Create WebWorker-based solver
- Create inline solver fallback

**Extension Point**: Alternative PoW algorithms

---

#### ?? **PR #5: Create Use Cases Layer**

**Size**: ~400 lines  
**Review Time**: ~25 minutes  
**Dependencies**: PR #1, #2, #3, #4  

**What it does**:

- Create `CreatePasteUseCase`
- Create `ViewPasteUseCase`
- Create `DeletePasteUseCase`
- Orchestrate domain logic without UI concerns

---

#### ?? **PR #6: Wire DI Container & Migrate app.ts**

**Size**: ~350 lines  
**Review Time**: ~20 minutes  
**Dependencies**: PR #5  

**What it does**:

- Set up dependency injection container
- Refactor `app.ts` to use new modules
- Remove old crypto/validation code
- Complete frontend modularization

---

### Phase 2: Backend Modularization (5 PRs)

#### ?? **PR #7: Create Core Domain Package**

**Size**: ~300 lines  
**Review Time**: ~15 minutes  

**What it does**:

- Create Kotlin package structure
- Extract domain models
- Create domain validators
- Define domain exceptions

---

#### ?? **PR #8: Define Port Interfaces**

**Size**: ~200 lines  
**Review Time**: ~10 minutes  
**Dependencies**: PR #7  

**What it does**:

- Define `PasteRepository` interface
- Define `RateLimiter` interface
- Define `PowVerifier` interface
- Hexagonal architecture (ports & adapters)

**Extension Point**: Custom storage backends (MongoDB, S3, Redis)

---

#### ?? **PR #9: Create Infrastructure Adapters**

**Size**: ~400 lines  
**Review Time**: ~25 minutes  
**Dependencies**: PR #8  

**What it does**:

- Implement `ExposedPasteRepository` (current SQL)
- Implement `TokenBucketRateLimiter`
- Implement `Sha256PowVerifier`
- All adapters implement port interfaces

---

#### ?? **PR #10: Create Use Cases Layer**

**Size**: ~350 lines  
**Review Time**: ~20 minutes  
**Dependencies**: PR #8, #9  

**What it does**:

- Create `CreatePasteUseCase`
- Create `RetrievePasteUseCase`
- Create `DeletePasteUseCase`
- Pure business logic, no HTTP concerns

---

#### ?? **PR #11: Set Up DI with Koin**

**Size**: ~300 lines  
**Review Time**: ~15 minutes  
**Dependencies**: PR #10  

**What it does**:

- Add Koin dependency injection
- Create DI modules
- Refactor `Routes.kt` to use DI
- Complete backend modularization

---

### Phase 3: Documentation (2 PRs)

#### ?? **PR #12: Add ARCHITECTURE.md**

**Size**: ~500 lines of docs  
**Review Time**: ~20 minutes  

**What it does**:

- Comprehensive architecture documentation
- Explain layers and dependencies
- Document extension points
- Include diagrams

---

#### ?? **PR #13: Update README**

**Size**: ~300 lines of docs  
**Review Time**: ~15 minutes  

**What it does**:

- Add customization guides
- Document all extension points
- Add examples of extending Delirium
- Make it fork-friendly

---

## Progress Tracking

**Phase 1**: 1/6 PRs completed (17%)  
**Phase 2**: 0/5 PRs completed (0%)  
**Phase 3**: 0/2 PRs completed (0%)  

**Overall**: 1/13 PRs completed (8%)

## Current Status

### ? Completed

- [x] PR #1: Crypto module extracted and committed

### ?? In Progress

- [ ] Review and test PR #1
- [ ] Merge PR #1 to main

### ?? Next Up

- [ ] Start PR #2: Extract validators & domain models

## Extension Points (After All PRs)

### Frontend

1. **ICryptoProvider** - Custom encryption algorithms
2. **IApiClient** - Custom API backends
3. **IPowSolver** - Alternative PoW algorithms
4. **IStorage** - Custom storage (IndexedDB, etc.)

### Backend

1. **PasteRepository** - Custom storage (MongoDB, S3, Redis)
2. **RateLimiter** - Custom rate limiting (Redis, distributed)
3. **PowVerifier** - Custom PoW verification
4. **TokenGenerator** - Custom token generation

## Benefits After Completion

### Code Quality

- ? 100% of business logic is tested
- ? Zero circular dependencies
- ? Clear module boundaries
- ? All public APIs documented
- ? No framework code in core domain

### Developer Experience

- ? New contributors understand architecture in < 30 minutes
- ? Adding new storage backend takes < 2 hours
- ? Creating plugins is well-documented
- ? Fork-friendly with clear extension points

### Maintenance

- ? Easy to add features without breaking existing code
- ? Easy to swap implementations
- ? Easy to test in isolation
- ? Easy to deploy in different environments

## Testing Strategy

Each PR includes:

- **Unit Tests**: Test components in isolation
- **Integration Tests**: Test components working together
- **Backward Compatibility**: Ensure existing functionality works

## Review Guidelines

### For Reviewers

1. **Small PRs**: Each PR should take 10-30 minutes to review
2. **Focus Areas**: Architecture, SOLID principles, testability, extension points
3. **No Bike-shedding**: Focus on architecture, not formatting
4. **Ask Questions**: If unclear, ask about design decisions

### For Author

1. **One Thing**: Each PR does one thing well
2. **Documentation**: Every PR has clear documentation
3. **Tests**: Every PR includes tests
4. **Examples**: Show how to extend via interfaces

## Getting Started

### Review PR #1

```bash
git checkout feature/pr-001-crypto-module
cd client/src/core/crypto
ls -la  # See the new files
```

### Read Documentation

```bash
cat docs/prs/PR-001-CRYPTO-MODULE.md
cat docs/prs/README.md
```

### Test Manually

```typescript
// Try the new crypto module
import { createCryptoProvider } from './core/crypto';

const crypto = createCryptoProvider();
const result = await crypto.encrypt('Hello World');
const decrypted = await crypto.decrypt(result);
console.log(decrypted); // "Hello World"
```

## Questions?

- **Why 13 PRs?** Each PR is small, focused, and reviewable
- **Why not one big PR?** Too hard to review, test, and revert
- **What if I want to customize?** Implement the interfaces!
- **Is this over-engineering?** No - it's proper engineering for maintainability

## Next Actions

1. ? **Review PR #1** - Read `docs/prs/PR-001-CRYPTO-MODULE.md`
2. ? **Test PR #1** - Verify crypto module works
3. ? **Merge PR #1** - When satisfied, merge to main
4. ?? **Start PR #2** - Extract validators & models

---

**Let's make Delirium the most fork-friendly, extensible paste system out there! ??**
