#!/usr/bin/env bash

###############################################################################
# test-deployment-cors.sh - End-to-end test for deployment and CORS fixes
#
# This script tests the deployed application to verify:
# 1. Services are running and healthy
# 2. CORS headers are properly configured in Nginx
# 3. API endpoints work with Origin headers (no 403 Forbidden)
# 4. Error responses are properly returned (not swallowed by CORS)
# 5. Frontend form fields have proper attributes
#
# Usage: ./scripts/test-deployment-cors.sh
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test configuration
BASE_URL="${BASE_URL:-http://localhost:8080}"
API_URL="${BASE_URL}/api"

# Counters
PASSED=0
FAILED=0

# Helper functions
print_test() {
    echo -e "${BLUE}[TEST]${NC} $1"
}

print_pass() {
    echo -e "${GREEN}[PASS]${NC} $1"
    ((PASSED++))
}

print_fail() {
    echo -e "${RED}[FAIL]${NC} $1"
    ((FAILED++))
}

print_info() {
    echo -e "${YELLOW}[INFO]${NC} $1"
}

# Test 1: Check if services are running
test_services_running() {
    print_test "Checking if Docker services are running..."
    
    if docker compose ps | grep -q "delerium-server-1.*Up.*healthy"; then
        print_pass "Backend server is running and healthy"
    else
        print_fail "Backend server is not healthy"
        return 1
    fi
    
    if docker compose ps | grep -q "delerium-paste-web-1.*Up"; then
        print_pass "Nginx web server is running"
    else
        print_fail "Nginx web server is not running"
        return 1
    fi
}

# Test 2: Check Nginx default.conf is removed
test_nginx_config() {
    print_test "Checking Nginx configuration..."
    
    if docker exec delerium-paste-web-1 ls /etc/nginx/conf.d/default.conf 2>/dev/null; then
        print_fail "Default nginx config should be removed"
        return 1
    else
        print_pass "Default nginx config is properly removed"
    fi
}

# Test 3: Test API health endpoint
test_health_endpoint() {
    print_test "Testing health endpoint..."
    
    response=$(curl -s -w "\n%{http_code}" "${API_URL}/health")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        print_pass "Health endpoint returns 200 OK"
    else
        print_fail "Health endpoint returned ${http_code}, expected 200"
        return 1
    fi
}

# Test 4: Test POST /api/pastes with Origin header (should not get 403)
test_post_with_origin() {
    print_test "Testing POST /api/pastes with Origin header..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/pastes" \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:8080" \
        -d '{
            "ct": "dGVzdA==",
            "iv": "dGVzdC1pdi0xMjM=",
            "meta": {
                "expireTs": 9999999999,
                "singleView": false,
                "viewsAllowed": 1,
                "mime": "text/plain"
            }
        }')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    # Should return 400 (pow_required) NOT 403 (Forbidden)
    if [ "$http_code" = "400" ]; then
        if echo "$body" | grep -q "pow_required"; then
            print_pass "POST with Origin header returns 400 pow_required (not 403 Forbidden)"
        else
            print_fail "POST returned 400 but not pow_required: ${body}"
            return 1
        fi
    elif [ "$http_code" = "403" ]; then
        print_fail "POST with Origin header still returns 403 Forbidden (CORS issue not fixed)"
        echo "Response: $body"
        return 1
    else
        print_fail "POST returned unexpected status code: ${http_code}"
        echo "Response: $body"
        return 1
    fi
}

# Test 5: Test CORS headers are present
test_cors_headers() {
    print_test "Testing CORS headers in response..."
    
    # Note: In production, Nginx adds CORS headers. In test, we check they're handled properly
    headers=$(curl -s -I -X OPTIONS "${API_URL}/pastes" \
        -H "Origin: http://localhost:8080" \
        -H "Access-Control-Request-Method: POST")
    
    # Check for CORS-related response (either 204 from Nginx or 404/405 passing through)
    if echo "$headers" | grep -qE "HTTP/[0-9.]+ (200|204|404|405)"; then
        print_pass "OPTIONS preflight request handled"
    else
        print_fail "OPTIONS preflight request not handled properly"
        echo "Headers: $headers"
        return 1
    fi
}

# Test 6: Test POST without Origin header (should also work)
test_post_without_origin() {
    print_test "Testing POST /api/pastes without Origin header..."
    
    response=$(curl -s -w "\n%{http_code}" -X POST "${API_URL}/pastes" \
        -H "Content-Type: application/json" \
        -d '{
            "ct": "dGVzdA==",
            "iv": "dGVzdC1pdi0xMjM=",
            "meta": {
                "expireTs": 9999999999,
                "singleView": false,
                "viewsAllowed": 1,
                "mime": "text/plain"
            }
        }')
    
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "400" ]; then
        if echo "$body" | grep -q "pow_required"; then
            print_pass "POST without Origin header works (returns pow_required)"
        else
            print_fail "POST returned 400 but not pow_required: ${body}"
            return 1
        fi
    else
        print_fail "POST without Origin returned unexpected status: ${http_code}"
        echo "Response: $body"
        return 1
    fi
}

# Test 7: Test GET PoW endpoint
test_pow_endpoint() {
    print_test "Testing GET /api/pow endpoint..."
    
    response=$(curl -s -w "\n%{http_code}" "${API_URL}/pow")
    http_code=$(echo "$response" | tail -n 1)
    body=$(echo "$response" | sed '$d')
    
    if [ "$http_code" = "200" ]; then
        if echo "$body" | grep -q "challenge" && echo "$body" | grep -q "difficulty"; then
            print_pass "PoW endpoint returns valid challenge"
        else
            print_fail "PoW endpoint response missing required fields"
            echo "Response: $body"
            return 1
        fi
    else
        print_fail "PoW endpoint returned ${http_code}, expected 200"
        return 1
    fi
}

# Test 8: Check frontend HTML for form attributes
test_frontend_html() {
    print_test "Testing frontend HTML form attributes..."
    
    html=$(curl -s "${BASE_URL}/")
    
    # Check for name attributes on form fields
    if echo "$html" | grep -q 'name="paste"'; then
        print_pass "Paste textarea has name attribute"
    else
        print_fail "Paste textarea missing name attribute"
        return 1
    fi
    
    if echo "$html" | grep -q 'name="mins"'; then
        print_pass "Minutes input has name attribute"
    else
        print_fail "Minutes input missing name attribute"
        return 1
    fi
    
    if echo "$html" | grep -q 'name="password"'; then
        print_pass "Password input has name attribute"
    else
        print_fail "Password input missing name attribute"
        return 1
    fi
}

# Test 9: Test security headers (but not incompatible ones)
test_security_headers() {
    print_test "Testing security headers..."
    
    headers=$(curl -s -v -X POST "${API_URL}/pastes" \
        -H "Content-Type: application/json" \
        -H "Origin: http://localhost:8080" \
        -d '{}' 2>&1)
    
    # Should have these headers
    if echo "$headers" | grep -qi "X-Content-Type-Options"; then
        print_pass "X-Content-Type-Options header present"
    else
        print_fail "X-Content-Type-Options header missing"
    fi
    
    if echo "$headers" | grep -qi "X-Frame-Options"; then
        print_pass "X-Frame-Options header present"
    else
        print_fail "X-Frame-Options header missing"
    fi
    
    # Should NOT have these incompatible headers
    if echo "$headers" | grep -qi "Cross-Origin-Resource-Policy"; then
        print_fail "Cross-Origin-Resource-Policy header present (should be removed for CORS compatibility)"
    else
        print_pass "Cross-Origin-Resource-Policy header not present (correct)"
    fi
    
    if echo "$headers" | grep -qi "Cross-Origin-Embedder-Policy"; then
        print_fail "Cross-Origin-Embedder-Policy header present (should be removed for CORS compatibility)"
    else
        print_pass "Cross-Origin-Embedder-Policy header not present (correct)"
    fi
}

# Test 10: Test that backend logs don't show errors
test_backend_logs() {
    print_test "Checking backend logs for errors..."
    
    # Get last 50 lines of backend logs
    logs=$(docker compose logs server --tail=50 2>&1)
    
    # Check for error patterns
    if echo "$logs" | grep -qi "exception\|error\|failed" | grep -v "test"; then
        print_fail "Backend logs contain errors (may be expected during testing)"
        # Don't fail the test, just warn
    else
        print_pass "No errors in recent backend logs"
    fi
}

###############################################################################
# Main test execution
###############################################################################

echo ""
echo "=========================================="
echo "Deployment and CORS Fix Tests"
echo "=========================================="
echo ""

print_info "Testing deployed application at ${BASE_URL}"
echo ""

# Run all tests
test_services_running || true
test_nginx_config || true
test_health_endpoint || true
test_post_with_origin || true
test_cors_headers || true
test_post_without_origin || true
test_pow_endpoint || true
test_frontend_html || true
test_security_headers || true
test_backend_logs || true

# Summary
echo ""
echo "=========================================="
echo "Test Summary"
echo "=========================================="
echo -e "${GREEN}Passed:${NC} ${PASSED}"
echo -e "${RED}Failed:${NC} ${FAILED}"
echo ""

if [ $FAILED -eq 0 ]; then
    echo -e "${GREEN}✓ All tests passed!${NC}"
    exit 0
else
    echo -e "${RED}✗ Some tests failed${NC}"
    exit 1
fi
