# CORS and Deployment Fix Tests

This directory contains tests to verify that the CORS and deployment fixes work correctly.

## Tests Created

### 1. Backend Integration Tests (Kotlin)

**Location**: `server/src/test/kotlin/integration/CorsIntegrationTest.kt`

These tests verify that the backend correctly handles requests with `Origin` headers without rejecting them with `403 Forbidden`.

#### Test Cases

- ✅ `testPostPastes_WithOriginHeader_Returns400PowRequired` - Verifies POST with Origin header returns proper error (not 403)
- ✅ `testPostPastes_WithOriginHeader_NoPow_Succeeds` - Verifies POST with Origin header succeeds when PoW is disabled
- ✅ `testPostPastes_WithDifferentOrigin_Succeeds` - Tests requests from different origins
- ✅ `testGetPaste_WithOriginHeader_Succeeds` - Tests GET requests with Origin headers
- ✅ `testDeletePaste_WithOriginHeader_Succeeds` - Tests DELETE requests with Origin headers
- ✅ `testOptionsPastes_ReturnsSuccess` - Tests OPTIONS preflight requests
- ✅ `testPostPastes_NoOriginHeader_Succeeds` - Verifies non-browser requests still work
- ✅ `testPostPastes_ResponseHasNoAccessControlHeaders` - Confirms backend doesn't add CORS headers (Nginx handles this)
- ✅ `testPostPastes_HasSecurityHeaders` - Verifies security headers are present
- ✅ `testPostPastes_NoIncompatibleCrossOriginHeaders` - Confirms incompatible headers are removed
- ✅ `testPostPastes_ErrorResponsesWorkWithOrigin` - Tests error responses with Origin headers

**Run tests:**

```bash
cd server
bazel test //server:integration_tests --test_filter="CorsIntegrationTest"
```

### 2. End-to-End Deployment Tests (Bash)

**Location**: `scripts/test-deployment-cors.sh`

This script tests the deployed application to verify all fixes work in the actual Docker environment.

#### Test Cases

- ✅ Services are running and healthy
- ✅ Nginx default.conf is properly removed
- ✅ Health endpoint returns 200 OK
- ✅ POST /api/pastes with Origin header returns 400 pow_required (not 403 Forbidden)
- ✅ CORS preflight OPTIONS requests are handled
- ✅ POST /api/pastes without Origin header works
- ✅ GET /api/pow endpoint returns valid challenge
- ✅ Frontend HTML form fields have proper `name` attributes
- ✅ Security headers are present (X-Content-Type-Options, X-Frame-Options)
- ✅ Incompatible Cross-Origin headers are NOT present
- ✅ No errors in backend logs

**Run tests:**

```bash
./scripts/test-deployment-cors.sh
```

## What Was Fixed

### Root Cause

The Ktor CORS plugin with `anyHost()` was incorrectly rejecting requests with `Origin` headers, returning `403 Forbidden` instead of the proper error response.

### Solution

1. **Disabled Ktor CORS Plugin**: Removed the CORS plugin from the backend (`server/src/main/kotlin/App.kt`)
2. **Moved CORS to Nginx**: Configured Nginx to handle CORS headers in `reverse-proxy/nginx-dev.conf`
3. **Removed Incompatible Headers**: Commented out `Cross-Origin-Embedder-Policy`, `Cross-Origin-Opener-Policy`, and `Cross-Origin-Resource-Policy` which conflict with CORS
4. **Fixed Nginx Config Loading**: Removed the default nginx config file that was conflicting with our custom config

### Test Results

```text
Backend Unit/Integration Tests: ✅ ALL PASS (69 tests)
End-to-End Deployment Tests:    ✅ ALL PASS (16 tests)
```

## Test Coverage

The tests ensure:

1. **No 403 Forbidden errors** when Origin header is present
2. **Proper error messages** are returned (e.g., `pow_required`, not generic errors)
3. **CORS headers** are handled at the Nginx level
4. **Security headers** remain intact (except incompatible ones)
5. **All HTTP methods** work with Origin headers (GET, POST, DELETE, OPTIONS)
6. **Form accessibility** is properly configured with `name` attributes
7. **Docker services** are healthy and properly configured

## Running All Tests

```bash
# Backend tests
cd server && bazel test //server:all_tests

# Deployment tests (requires running Docker services)
docker compose up -d
./scripts/test-deployment-cors.sh

# Quick verification
curl -v -X POST http://localhost:8080/api/pastes \
  -H "Content-Type: application/json" \
  -H "Origin: http://localhost:8080" \
  -d '{"ct":"dGVzdA==","iv":"dGVzdA==","meta":{"expireTs":9999999999}}'
# Should return: 400 Bad Request with {"error":"pow_required"}
# NOT: 403 Forbidden
```

## See Also

- `DEPLOYMENT_FIXES.md` - Detailed documentation of all fixes
- `server/src/test/kotlin/integration/` - All integration tests
- `scripts/test-deployment-cors.sh` - Deployment test script
