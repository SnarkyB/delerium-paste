# Test Coverage & Quality Rules

## ?? CRITICAL RULE: Never Decrease Coverage by >5%

**When adding new code, test coverage must not drop by more than 5% without comprehensive justification.**

---

## Coverage Standards

### Minimum Targets
- **Global**: 85% code coverage (CI requirement)
- **Critical functions**: 100% coverage required
  - Encryption/decryption (all algorithms)
  - Password handling (PBKDF2, key derivation)
  - Authentication and authorization  
  - Input validation
  - Security utilities
- **New code**: Must be tested before merging

### Coverage Enforcement Process

```bash
# 1. Before adding new code - baseline
npm run test:coverage
# Note: security.ts: 82.69%, overall: 47.43%

# 2. Add your new feature/code

# 3. After adding new code - verify
npm run test:coverage

# 4. Check coverage delta
# ? ACCEPTABLE: Coverage stays same or increases
# ? ACCEPTABLE: Coverage drops ?5% (with documented justification)
# ? REJECTED: Coverage drops >5% without tests
```

### When Coverage Can Drop (?5%)

Valid reasons:
1. **Refactoring** - Consolidating duplicate code
2. **Boilerplate** - Adding framework/config code
3. **Edge cases** - Adding rare error handling paths
4. **Defensive programming** - Adding fallbacks hard to test

**Always document why** in the PR description.

---

## Test Quality Standards

### 1. Comprehensive Coverage

Every new function/feature MUST test:
- ? **Happy path**: Normal usage
- ? **Edge cases**: Empty, boundaries, unicode
- ? **Error paths**: Invalid inputs, exceptions
- ? **Integration**: Works with other components
- ? **Security**: Injection, overflow attempts

### 2. Readable & Well-Documented Tests

#### Clear Test Names
```typescript
// ? EXCELLENT
it('should allow 5 password attempts before failing')
it('should preserve view count during password retry')
it('should disable max views input when single-view is checked')

// ? BAD
it('works')
it('test1')
it('validates')
```

#### Arrange-Act-Assert Pattern
```typescript
it('should handle unicode in password-protected pastes', async () => {
  // Arrange: Create unicode content
  const content = '???? ?? Caf?';
  const password = 'Test123';
  
  // Act: Encrypt and decrypt
  const encrypted = await encryptWithPassword(content, password);
  const decrypted = await decryptWithPassword(
    encrypted.encryptedData,
    password,
    encrypted.salt,
    encrypted.iv
  );
  
  // Assert: Content preserved
  expect(decrypted).toBe(content);
});
```

#### Why Comments
```typescript
it('should not consume extra views on password retry', async () => {
  // WHY: Users need multiple password attempts without invalidating
  // single-view or limited-view pastes. Encrypted data stays in
  // browser RAM during retries (no server fetch = no view decrement).
  
  // PROTECTS AGAINST: One wrong password invalidating paste forever
  
  const fetchSpy = jest.spyOn(global, 'fetch');
  await viewWithRetry(['wrong1', 'wrong2', 'correct']);
  
  expect(fetchSpy).toHaveBeenCalledTimes(1); // Only once!
});
```

### 3. Test Independence

```typescript
// ? GOOD: Self-contained
describe('Encryption', () => {
  it('should encrypt empty strings', async () => {
    const result = await encryptWithPassword('', 'pass');
    expect(result.encryptedData.byteLength).toBeGreaterThan(0);
  });
  
  it('should encrypt long strings', async () => {
    const result = await encryptWithPassword('x'.repeat(10000), 'pass');
    expect(result.encryptedData.byteLength).toBeGreaterThan(10000);
  });
});

// ? BAD: Dependent on shared state
let encrypted;
it('encrypts', async () => { encrypted = await encrypt('test'); });
it('decrypts', async () => { await decrypt(encrypted); }); // Depends on previous!
```

### 4. Test Behavior, Not Implementation

```typescript
// ? GOOD: Tests behavior
it('should encrypt data with password', async () => {
  const result = await encryptWithPassword('test', 'password');
  
  expect(result.encryptedData).toBeDefined();
  expect(result.salt.byteLength).toBe(16);
  
  // Verify we can decrypt it
  const decrypted = await decryptWithPassword(
    result.encryptedData,
    'password',
    result.salt,
    result.iv
  );
  expect(decrypted).toBe('test');
});

// ? BAD: Tests implementation details
it('should call crypto.subtle.deriveKey', async () => {
  const spy = jest.spyOn(crypto.subtle, 'deriveKey');
  await encryptWithPassword('test', 'password');
  expect(spy).toHaveBeenCalled(); // Breaks if we change crypto library!
});
```

---

## PR Checklist for New Features

Before submitting PR:

- [ ] All new functions have unit tests
- [ ] Happy path covered
- [ ] Edge cases covered (empty, max, min, unicode)
- [ ] Error paths covered (invalid input, exceptions)
- [ ] Integration tests if multi-module
- [ ] **`npm run test:coverage` shows ?85% or within 5% drop**
- [ ] Tests are readable and documented
- [ ] Test names describe behavior
- [ ] Complex logic has "why" comments
- [ ] Tests are independent
- [ ] Security-critical code has 100% coverage

---

## Example: Testing Password Retry Feature

```typescript
describe('Password Retry Logic', () => {
  it('should allow exactly 5 password attempts', async () => {
    const content = 'Secret';
    const correctPassword = 'correct123';
    const encrypted = await encryptWithPassword(content, correctPassword);
    
    // Try wrong 4 times
    for (let i = 1; i <= 4; i++) {
      await expect(
        decryptWithPassword(
          encrypted.encryptedData,
          `wrong${i}`,
          encrypted.salt,
          encrypted.iv
        )
      ).rejects.toThrow();
    }
    
    // 5th with correct succeeds
    const result = await decryptWithPassword(
      encrypted.encryptedData,
      correctPassword,
      encrypted.salt,
      encrypted.iv
    );
    
    expect(result).toBe(content);
  });
  
  it('should show remaining attempts to user', () => {
    expect(getAttemptMessage(1)).toBe('Enter password:');
    expect(getAttemptMessage(2)).toBe('Incorrect. 4 attempts remaining:');
    expect(getAttemptMessage(5)).toBe('Incorrect. 1 attempt remaining:');
  });
  
  it('should securely clear password after each attempt', async () => {
    const encrypted = await encryptWithPassword('test', 'correct');
    const clearSpy = jest.spyOn(module, 'secureClear');
    
    await expect(
      decryptWithPassword(
        encrypted.encryptedData,
        'wrong',
        encrypted.salt,
        encrypted.iv
      )
    ).rejects.toThrow();
    
    expect(clearSpy).toHaveBeenCalledWith('wrong');
  });
});
```

---

## Coverage Reporting

### Check Coverage
```bash
npm run test:coverage
```

### HTML Report
```bash
npm run test:coverage --coverageReporters=html
open coverage/index.html
```

### Example Report
```
File         | % Stmts | % Branch | % Funcs | % Lines | Uncovered
-------------|---------|----------|---------|---------|----------
security.ts  |   82.69 |       80 |   81.25 |   82.17 | 122,146
app.ts       |   45.15 |    18.75 |   72.50 |   44.20 | 211-318
```

**Action items:**
- ? security.ts: Good (>80%), maintain
- ? app.ts: Needs tests, especially branches

---

## Remember

1. **Coverage is a tool, not a goal** - 100% ? bug-free
2. **Quality over quantity** - Good tests > many tests
3. **Test behavior, not implementation** - Survive refactoring
4. **Make tests readable** - Help future maintainers
5. **Never drop >5% without justification** - Quality friction

---

See also: `.cursor/rules/workspace.md` for full development guidelines

---

## 🚨 Zero Untested Code Policy

### CRITICAL RULE: No Untested Code in PRs

**Every PR must include tests for ALL new code that can usefully be tested.**

### The Rule

```
❌ PROHIBITED: Submitting new code without tests
✅ REQUIRED: Tests included in the same PR as the code
```

### What This Means

If you add code, you add tests. No exceptions.

- New function? **Tests required**
- New feature? **Tests required**
- Bug fix? **Test that catches the bug required**
- Logic change? **Tests required**

### "Will Add Tests Later" = ❌ Rejected PR

These are NOT acceptable:
- ❌ "I'll add tests in the next PR"
- ❌ "Tests are hard for this code"
- ❌ "It's just a small change"
- ❌ "I tested manually"
- ❌ "Coverage is good enough"

**The only acceptable answer: Add tests NOW.**

### Why This Rule Exists

**Without it:**
- Coverage decays over time
- Bugs slip through
- Code becomes "too scary to touch"
- Technical debt grows
- Future developers suffer

**With it:**
- Coverage stays high
- Bugs caught early
- Confidence in changes
- Maintainable codebase
- Quality culture

### PR Review Process

**Reviewer checklist:**
1. Does this PR add new code?
2. Are there corresponding test files?
3. Do tests cover all new code paths?
4. Has coverage stayed ≥85% or dropped ≤5%?

**If any answer is NO → Request changes**

### Example: How It Should Work

**✅ CORRECT:**
```
feat: add password retry with 5 attempts

Files changed:
+ src/password-retry.ts (45 lines)
+ tests/password-retry.test.ts (120 lines)

Tests:
- Happy path: correct password on attempt 3
- Error path: 5 wrong passwords
- Edge case: empty password
- Security: password cleared after each attempt

Coverage: 82.69% → 85.30% (+2.61%) ✅
Status: ✅ APPROVED
```

**❌ WRONG:**
```
feat: add password retry

Files changed:
+ src/password-retry.ts (45 lines)
(no test file)

Coverage: 82.69% → 78.20% (-4.49%) ❌
Comment: "Will add tests later"
Status: ❌ REJECTED - Add tests first
```

### Implementation Guide

```bash
# Your workflow for every PR:

# 1. Write code
vim src/new-feature.ts

# 2. Write tests (NOT optional!)
vim tests/new-feature.test.ts

# 3. Verify
npm test && npm run test:coverage

# 4. Commit BOTH together
git add src/new-feature.ts tests/new-feature.test.ts
git commit -m "feat: add feature with comprehensive tests"

# 5. Check coverage before pushing
npm run test:coverage
# Ensure ≥85% or <5% drop
```

### Rare Exceptions

Only skip tests for:
1. **Pure types** - Empty interfaces, type aliases
2. **Config files** - JSON/YAML with no logic
3. **Truly untestable** - Hardware dependencies

**If unsure, write a test.**

---

**Remember: Tests are not optional. They are part of the feature.**

Code without tests is unfinished code.
