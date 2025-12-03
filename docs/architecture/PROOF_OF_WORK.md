# Proof-of-Work (PoW) System

## Overview

The ZKPaste proof-of-work system provides spam protection by requiring clients to solve a computational puzzle before creating pastes. This makes automated abuse expensive without significantly impacting legitimate users.

## How It Works

### Challenge-Response Flow

1. **Client requests challenge**: `GET /api/pow`

   ```json
   {
     "challenge": "aB3dE...fG9hI",
     "difficulty": 10,
     "expiresAt": 1735689600
   }
   ```

2. **Client solves puzzle**: Find a nonce where `SHA-256(challenge:nonce)` has at least `difficulty` leading zero bits

3. **Client submits solution**: Include in paste creation request

   ```json
   {
     "ct": "encrypted_content",
     "iv": "initialization_vector",
     "meta": { ... },
     "pow": {
       "challenge": "aB3dE...fG9hI",
       "nonce": 12345
     }
   }
   ```

4. **Server validates**: Verifies the solution before accepting the paste

### Algorithm

The PoW uses SHA-256 with leading zero bit counting:

```typescript
// Client-side (TypeScript)
async function solve(challenge: string, difficulty: number): Promise<number> {
  let nonce = 0;
  while (true) {
    const hash = await sha256(`${challenge}:${nonce}`);
    if (countLeadingZeroBits(hash) >= difficulty) {
      return nonce;
    }
    nonce++;
  }
}
```

```kotlin
// Server-side (Kotlin)
fun verify(challenge: String, nonce: Long): Boolean {
  val digest = MessageDigest.getInstance("SHA-256")
    .digest("$challenge:$nonce".toByteArray())
  return leadingZeroBits(digest) >= difficulty
}
```

## Configuration

### Difficulty Levels

Located in `server/src/main/resources/application.conf`:

```hocon
storage {
  pow { 
    enabled = true
    difficulty = 10
    ttlSeconds = 180
  }
}
```

| Difficulty | Avg Attempts | Solve Time | Use Case |
|------------|--------------|------------|----------|
| 0 | 1 | <1ms | Disabled/testing |
| 4-6 | 16-64 | <100ms | Development |
| 8-10 | 256-1024 | <1s | **Production (recommended)** |
| 12-14 | 4K-16K | 1-5s | High traffic sites |
| 16-18 | 64K-256K | 10-60s | Anti-spam focus |
| 20+ | 1M+ | minutes | Testing/extreme cases |

**Current setting**: 10 bits (~1024 attempts, <1 second on modern devices)

### Rationale for Difficulty 10

- ✅ **Fast UX**: Solves in under 1 second for users
- ✅ **Effective**: Still prevents automated spam (requires ~1024 attempts)
- ✅ **Mobile-friendly**: Works well on phones and tablets
- ✅ **Scalable**: Exponential cost for attackers (2^10 = 1024x harder than no PoW)

### Time-to-Live (TTL)

Challenges expire after 180 seconds (3 minutes) by default. This:

- Prevents challenge reuse attacks
- Allows time for legitimate users to solve
- Keeps the challenge cache small

## Disabling PoW

To disable PoW (not recommended for production):

```hocon
storage {
  pow { 
    enabled = false
    difficulty = 10  # Ignored when disabled
    ttlSeconds = 180
  }
}
```

When disabled:

- `GET /api/pow` returns `204 No Content`
- Paste creation doesn't require PoW solution
- Rate limiting is still enforced (if enabled)

## Testing

### Unit Tests

PoW solver is thoroughly tested in `client/tests/unit/infrastructure/pow-solver.test.ts`:

```bash
cd client
npm run test:unit -- pow-solver
```

Tests cover:

- Low difficulty (1-4 bits)
- Medium difficulty (8-10 bits)
- High difficulty (15-20 bits) with cancellation
- Edge cases (difficulty 0, invalid challenges)
- Performance benchmarks

### E2E Tests

End-to-end tests mock PoW challenges in `client/tests/e2e/paste-flow.spec.ts`:

```bash
cd client
npx playwright test
```

Tests verify:

- Paste creation with PoW
- Paste creation without PoW (when disabled)
- Error handling for invalid PoW solutions

### Manual Testing

1. **Start dev environment**:

   ```bash
   make dev
   ```

2. **Enable PoW in config**:

   ```hocon
   pow { enabled = true, difficulty = 10, ttlSeconds = 180 }
   ```

3. **Test paste creation**:
   - Open <http://localhost:8080>
   - Create a paste
   - Watch browser console for PoW solving
   - Should complete in <1 second

4. **Verify enforcement**:

   ```bash
   # Try to create paste without PoW (should fail)
   curl -X POST http://localhost:8080/api/pastes \
     -H "Content-Type: application/json" \
     -d '{"ct":"test","iv":"test","meta":{"expireTs":9999999999,"singleView":false,"viewsAllowed":null,"mime":"text/plain"}}'
   
   # Expected: {"error":"pow_required"}
   ```

## Security Considerations

### Attack Vectors

1. **Precomputed solutions**: Mitigated by random challenges and TTL
2. **Challenge reuse**: Prevented by single-use challenge cache
3. **Distributed solving**: Expected; difficulty makes it expensive at scale
4. **GPU acceleration**: Expected; difficulty still provides protection

### Defense in Depth

PoW is one layer in a multi-layered defense:

- **Rate limiting**: Limits requests per IP (30/minute default)
- **PoW**: Makes each request computationally expensive
- **Size limits**: Prevents large paste abuse (1MB max)
- **Expiration**: Pastes auto-delete after TTL

## Performance Impact

### Client-Side

| Difficulty | Mobile (2020) | Desktop (2020) | Desktop (2024) |
|------------|---------------|----------------|----------------|
| 8 bits | ~200ms | ~100ms | ~50ms |
| 10 bits | ~800ms | ~400ms | ~200ms |
| 12 bits | ~3s | ~1.5s | ~800ms |

*Benchmarks are estimates; actual times vary by device*

### Server-Side

Verification is extremely fast (~1ms) as it only:

1. Checks if challenge exists in cache
2. Verifies it hasn't expired
3. Computes single SHA-256 hash
4. Counts leading zero bits

Cache memory usage is minimal: ~50 bytes per challenge × active challenges.

## Troubleshooting

### "pow_required" Error

**Cause**: PoW is enabled but client didn't include solution

**Fix**:

- Frontend: Fetch challenge from `/api/pow` before creating paste
- Testing: Include valid PoW solution in request
- Development: Temporarily disable PoW in config

### "pow_invalid" Error

**Causes**:

- Challenge expired (>180 seconds old)
- Nonce doesn't satisfy difficulty requirement
- Challenge doesn't exist (server restarted)
- Wrong challenge submitted

**Fix**:

- Fetch a fresh challenge and retry
- Check system clock synchronization
- Verify difficulty calculation algorithm

### Slow Solving (>5 seconds)

**Causes**:

- Difficulty too high (>12 bits)
- Old/slow device
- Browser throttling background tabs

**Fix**:

- Lower difficulty in config
- Show loading indicator to user
- Consider adaptive difficulty based on paste size

## Future Enhancements

Potential improvements (not currently implemented):

1. **Adaptive difficulty**: Scale based on server load
2. **Paste size scaling**: Higher difficulty for larger pastes
3. **User reputation**: Lower difficulty for trusted IPs
4. **WebAssembly solver**: Faster solving via compiled code
5. **Web Worker solving**: Non-blocking UI during solve

## References

- [Hashcash](https://en.wikipedia.org/wiki/Hashcash) - Original PoW concept
- [Bitcoin PoW](https://en.bitcoin.it/wiki/Proof_of_work) - Similar mining algorithm
- [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) - Client-side crypto
- [SHA-256](https://en.wikipedia.org/wiki/SHA-2) - Hash function used
