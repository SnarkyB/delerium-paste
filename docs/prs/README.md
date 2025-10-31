# Delirium Architecture Refactoring - PR Series

This directory contains documentation for the incremental architecture refactoring of Delirium into a modular, SOLID, fork-friendly codebase.

## PR Series Overview

### Phase 1: Frontend Modularization (6 PRs)

#### ? PR #1: Extract Crypto Module
**Status**: Ready for review  
**Files**: 5 new files (~300 lines)  
**Testing**: Unit tests for crypto operations  
**Breaking Changes**: None  

Extract encryption/decryption into pluggable crypto module with clear interfaces.

**Key Files**:
- `core/crypto/interfaces.ts` - `ICryptoProvider` interface
- `core/crypto/aes-gcm.ts` - AES-GCM implementation
- `core/crypto/encoding.ts` - Base64url utilities
- `core/models/result.ts` - Type-safe error handling

**Extension Point**: Implement `ICryptoProvider` for custom encryption algorithms.

---

#### ?? PR #2: Extract Validators & Domain Models
**Status**: Not started  
**Dependencies**: None (can be parallel with PR #1)  

Extract validation logic and domain models from `security.ts` and `app.ts`.

**Key Files**:
- `core/validators/` - Content, password, expiration validation
- `core/models/paste.ts` - Paste domain models

---

#### ?? PR #3: Extract API Client Module
**Status**: Not started  
**Dependencies**: PR #2 (needs domain models)  

Extract API communication into pluggable API client.

**Key Files**:
- `infrastructure/api/interfaces.ts` - `IApiClient` interface
- `infrastructure/api/http-client.ts` - Fetch-based implementation
- `infrastructure/api/mock-client.ts` - Mock for testing

**Extension Point**: Implement `IApiClient` for custom API backends.

---

#### ?? PR #4: Extract PoW Solver Module
**Status**: Not started  
**Dependencies**: None  

Extract proof-of-work solving into pluggable module.

**Key Files**:
- `infrastructure/pow/interfaces.ts` - `IPowSolver` interface
- `infrastructure/pow/web-worker.ts` - WebWorker-based solver
- `infrastructure/pow/inline-solver.ts` - Fallback solver

**Extension Point**: Implement `IPowSolver` for alternative PoW algorithms.

---

#### ?? PR #5: Create Use Cases Layer
**Status**: Not started  
**Dependencies**: PR #1, #2, #3, #4  

Create application layer with use cases orchestrating domain logic.

**Key Files**:
- `application/use-cases/create-paste.ts` - CreatePasteUseCase
- `application/use-cases/view-paste.ts` - ViewPasteUseCase
- `application/use-cases/delete-paste.ts` - DeletePasteUseCase

---

#### ?? PR #6: Wire DI Container & Migrate app.ts
**Status**: Not started  
**Dependencies**: PR #5  

Set up dependency injection and migrate `app.ts` to use new modules.

**Key Files**:
- `main.ts` - DI container setup
- `app.ts` - Refactored to use use cases

**Breaking Changes**: None (internal refactor only)

---

### Phase 2: Backend Modularization (5 PRs)

#### ?? PR #7: Create Core Domain Package
**Status**: Not started  

Create backend core domain with models, validators, exceptions.

**Key Files**:
- `core/domain/models/` - Domain models
- `core/domain/validators/` - Business rule validation
- `core/domain/exceptions/` - Domain exceptions

---

#### ?? PR #8: Define Port Interfaces
**Status**: Not started  
**Dependencies**: PR #7  

Define hexagonal architecture port interfaces.

**Key Files**:
- `core/ports/PasteRepository.kt` - Storage port
- `core/ports/RateLimiter.kt` - Rate limiting port
- `core/ports/PowVerifier.kt` - PoW verification port

**Extension Point**: Implement ports for custom storage/rate limiting.

---

#### ?? PR #9: Create Infrastructure Adapters
**Status**: Not started  
**Dependencies**: PR #8  

Implement infrastructure adapters for ports.

**Key Files**:
- `infrastructure/persistence/exposed/` - SQL implementation
- `infrastructure/ratelimit/` - Rate limiter implementations
- `infrastructure/pow/` - PoW verifier implementations

---

#### ?? PR #10: Create Use Cases Layer
**Status**: Not started  
**Dependencies**: PR #8, #9  

Create backend application layer with use cases.

**Key Files**:
- `application/usecases/CreatePasteUseCase.kt`
- `application/usecases/RetrievePasteUseCase.kt`
- `application/usecases/DeletePasteUseCase.kt`

---

#### ?? PR #11: Set Up DI with Koin
**Status**: Not started  
**Dependencies**: PR #10  

Set up Koin dependency injection and refactor routes.

**Key Files**:
- `di/AppModule.kt` - DI module definitions
- `Routes.kt` - Refactored to use DI

---

### Phase 3: Documentation (2 PRs)

#### ?? PR #12: Add ARCHITECTURE.md
**Status**: Not started  

Comprehensive architecture documentation.

---

#### ?? PR #13: Update README
**Status**: Not started  

Update README with customization guides and extension points.

---

## PR Guidelines

### Size Targets
- **Small**: < 300 lines (ideal)
- **Medium**: 300-500 lines (acceptable)
- **Large**: > 500 lines (avoid, split if possible)

### Review Time Targets
- **Small PR**: ~15 minutes
- **Medium PR**: ~30 minutes
- **Large PR**: > 1 hour (too long!)

### Testing Requirements
- Every PR must include tests
- Unit tests for core logic
- Integration tests for infrastructure
- No decrease in code coverage

### Documentation Requirements
- JSDoc/KDoc for all public APIs
- README in each new package
- Migration notes for breaking changes

### CI Requirements
- All tests pass
- Linting passes
- Build succeeds
- No security vulnerabilities

## Current Status

**Phase 1 Progress**: 1/6 PRs (17%)  
**Phase 2 Progress**: 0/5 PRs (0%)  
**Phase 3 Progress**: 0/2 PRs (0%)  

**Overall Progress**: 1/13 PRs (8%)

## Benefits of Incremental Approach

1. **Reviewability**: Small PRs are easier to review thoroughly
2. **Testability**: Each PR can be tested independently
3. **Reversibility**: Easy to revert a small change
4. **Continuous Integration**: Features keep working between PRs
5. **Learning**: Team learns architecture gradually
6. **Lower Risk**: Small changes = lower risk of breaking things

## Extension Points Summary

After all PRs are merged, Delirium will have clear extension points:

### Frontend
- **ICryptoProvider**: Custom encryption algorithms
- **IApiClient**: Custom API backends
- **IPowSolver**: Alternative PoW algorithms
- **Plugin System**: Add features without modifying core

### Backend
- **PasteRepository**: Custom storage backends (MongoDB, S3, etc.)
- **RateLimiter**: Custom rate limiting (Redis, distributed)
- **PowVerifier**: Custom PoW verification
- **TokenGenerator**: Custom token generation

## Questions?

See individual PR documents for detailed information about each PR.
