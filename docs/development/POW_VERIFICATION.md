# PoW Verification Guide

This guide helps you verify that Proof-of-Work is functioning correctly after enabling it.

## Quick Verification

### 1. Start the Application

```bash
# Development mode
make dev

# Or production mode
make start
```

### 2. Check PoW Configuration

Verify in `server/src/main/resources/application.conf`:

```hocon
pow { enabled = true, difficulty = 10, ttlSeconds = 180 }
```

### 3. Test PoW Challenge Endpoint

```bash
# Should return a challenge
curl http://localhost:8080/api/pow

# Expected output:
# {"challenge":"aB3dE...","difficulty":10,"expiresAt":1735689600}
```

If you get `204 No Content`, PoW is disabled.

### 4. Test PoW Enforcement

Try creating a paste without PoW (should fail):

```bash
curl -X POST http://localhost:8080/api/pastes \
  -H "Content-Type: application/json" \
  -d '{
    "ct": "test-encrypted-content",
    "iv": "test-iv-value",
    "meta": {
      "expireTs": 9999999999,
      "singleView": false,
      "viewsAllowed": null,
      "mime": "text/plain"
    }
  }'

# Expected output:
# {"error":"pow_required"}
```

### 5. Test Browser Flow

1. Open http://localhost:8080 in your browser
2. Open DevTools Console (F12 → Console tab)
3. Create a paste
4. Watch for PoW-related logs:
   ```
   Fetching PoW challenge...
   Solving PoW (difficulty 10)...
   PoW solved in XXXms (nonce: XXXXX)
   ```
5. Paste should be created successfully

## Automated Test Suite

### Run All Tests

```bash
cd client

# Unit tests (PoW solver)
npm run test:unit -- pow-solver

# E2E tests (full flow with PoW)
npx playwright test

# All tests
npm run test:all
```

### Expected Results

#### Unit Tests
- ✅ 14 tests for PoW solver
- ✅ Difficulty 1, 4, 10, 15, 20 all tested
- ✅ Cancellation and edge cases covered

#### E2E Tests
- ✅ Paste creation with PoW (difficulty 1 for speed)
- ✅ Paste creation without PoW (when disabled)
- ✅ Error handling for invalid PoW

## Performance Benchmarks

### Manual Timing Test

Create pastes and measure solve times:

```javascript
// In browser console:
async function benchmarkPoW() {
  const response = await fetch('/api/pow');
  const challenge = await response.json();
  
  console.log(`Difficulty: ${challenge.difficulty}`);
  
  const startTime = performance.now();
  // ... solve the challenge (implementation in pow-solver.ts)
  const endTime = performance.now();
  
  console.log(`Solved in ${(endTime - startTime).toFixed(0)}ms`);
}

benchmarkPoW();
```

### Expected Timings

| Difficulty | Desktop (2024) | Mobile (2020) |
|------------|----------------|---------------|
| 8 bits     | ~50-100ms      | ~200-400ms    |
| 10 bits    | ~200-500ms     | ~800-1500ms   |
| 12 bits    | ~800-2000ms    | ~3-6s         |

## Troubleshooting

### PoW Not Enforced

**Symptoms**: Pastes created without solving PoW

**Check**:
```bash
# 1. Verify config
cat server/src/main/resources/application.conf | grep "pow {"

# 2. Check /api/pow endpoint
curl http://localhost:8080/api/pow

# 3. Restart services
make restart
```

### PoW Taking Too Long

**Symptoms**: >5 seconds to create paste

**Solutions**:
1. Lower difficulty in config (try 8 bits)
2. Check browser throttling (background tabs)
3. Test on newer device

### "pow_invalid" Errors

**Causes**:
- Challenge expired (>180 seconds)
- Wrong nonce calculation
- Server restarted (challenge cache cleared)

**Solutions**:
1. Fetch fresh challenge
2. Verify algorithm matches server (SHA-256, leading zero bits)
3. Check system clock sync

## Integration with CI/CD

### GitHub Actions

The CI pipeline already includes PoW verification:

```yaml
# .github/workflows/pr-checks.yml
- name: Unit Tests (frontend)
  run: npx jest --testPathIgnorePatterns=/integration/
  # Includes pow-solver.test.ts

- name: E2E Tests (frontend)
  run: npx playwright test
  # Includes paste-flow.spec.ts with PoW
```

### Local CI Verification

Run the same checks locally:

```bash
# All checks (including PoW tests)
./scripts/ci-verify-all.sh

# Just frontend (faster)
./scripts/ci-verify-frontend.sh

# Quick verification (no E2E)
./scripts/ci-verify-quick.sh
```

## Production Verification

### Health Check Script

```bash
#!/bin/bash
# scripts/verify-pow.sh

echo "=== PoW Verification ==="

# 1. Check challenge endpoint
echo -n "Challenge endpoint: "
STATUS=$(curl -s -o /dev/null -w "%{http_code}" https://your-domain.com/api/pow)
if [ "$STATUS" = "200" ]; then
  echo "✓ OK (PoW enabled)"
elif [ "$STATUS" = "204" ]; then
  echo "⚠ WARNING (PoW disabled)"
else
  echo "✗ FAIL (unexpected status $STATUS)"
  exit 1
fi

# 2. Check enforcement
echo -n "PoW enforcement: "
RESPONSE=$(curl -s -X POST https://your-domain.com/api/pastes \
  -H "Content-Type: application/json" \
  -d '{"ct":"test","iv":"test","meta":{"expireTs":9999999999,"singleView":false,"viewsAllowed":null,"mime":"text/plain"}}')

if echo "$RESPONSE" | grep -q "pow_required"; then
  echo "✓ OK (enforced)"
else
  echo "✗ FAIL (not enforced)"
  exit 1
fi

echo "=== All checks passed ==="
```

Make it executable and run:
```bash
chmod +x scripts/verify-pow.sh
./scripts/verify-pow.sh
```

## Monitoring

### Metrics to Track

1. **PoW solve times** (client-side)
   - p50, p95, p99 percentiles
   - By device type (mobile vs desktop)

2. **PoW rejection rate** (server-side)
   - Invalid solutions
   - Expired challenges
   - Missing PoW when required

3. **Challenge cache size** (server-side)
   - Number of active challenges
   - Memory usage

### Log Analysis

```bash
# Server logs
docker-compose logs server | grep -i pow

# Look for:
# - "pow_required" errors (clients not submitting PoW)
# - "pow_invalid" errors (bad solutions)
# - Challenge creation/validation
```

## Rollback Plan

If PoW causes issues in production:

### 1. Quick Disable (No Deployment)

```bash
# SSH into server
ssh your-server

# Edit config
vim /path/to/application.conf
# Change: pow { enabled = false, ... }

# Restart
docker-compose restart server
```

### 2. Proper Rollback (via Git)

```bash
# Create rollback PR
git checkout main
git checkout -b rollback-pow
git revert <pow-enable-commit-hash>
git push origin rollback-pow
gh pr create --title "Rollback: Disable PoW" --body "..."
```

## Success Criteria

PoW is working correctly when:

- ✅ `/api/pow` returns challenge (200) not 204
- ✅ Paste creation without PoW is rejected ("pow_required")
- ✅ Paste creation with valid PoW succeeds
- ✅ Solve time is <2 seconds on modern devices
- ✅ All unit tests pass (14/14 for pow-solver)
- ✅ All E2E tests pass
- ✅ No spam/abuse observed
- ✅ User complaints about speed are minimal

## Next Steps

After verification:

1. ✅ Monitor solve times for 24-48 hours
2. ✅ Check error rates in server logs
3. ✅ Adjust difficulty if needed (8-12 bits)
4. ✅ Document any issues encountered
5. ✅ Update runbooks with operational knowledge

## References

- [Main PoW Documentation](../architecture/PROOF_OF_WORK.md)
- [Testing Guide](../TESTING.md)
- [Deployment Guide](../deployment/DEPLOYMENT.md)
