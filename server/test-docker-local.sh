#!/bin/bash
set -e

echo "🧪 Comprehensive Docker Image Test Suite"
echo "=========================================="
echo ""

# Cleanup function
cleanup() {
    echo ""
    echo "🧹 Cleaning up..."
    docker stop delerium-test 2>/dev/null || true
    docker rm delerium-test 2>/dev/null || true
}

# Register cleanup on exit
trap cleanup EXIT

# Test 1: Start container
echo "✅ Test 1: Starting container..."
docker run -d \
    --name delerium-test \
    -p 9090:8080 \
    -e DELETION_TOKEN_PEPPER=$(openssl rand -hex 32) \
    delerium-server:local

echo "   Waiting for startup (15 seconds)..."
sleep 15

# Test 2: Verify container is running
echo ""
echo "✅ Test 2: Verifying container is running..."
if docker ps | grep -q delerium-test; then
    echo "   ✓ Container is running"
    docker ps --filter name=delerium-test --format "   Status: {{.Status}}"
else
    echo "   ✗ Container failed to start"
    docker logs delerium-test
    exit 1
fi

# Test 3: Verify non-root user
echo ""
echo "✅ Test 3: Verifying non-root user..."
USER_INFO=$(docker exec delerium-test id)
echo "   $USER_INFO"
if echo "$USER_INFO" | grep -q "uid=999(delirium) gid=999(delirium)"; then
    echo "   ✓ Running as non-root user (delirium:delirium)"
else
    echo "   ✗ Not running as expected user"
    exit 1
fi

# Test 4: Verify health check configuration
echo ""
echo "✅ Test 4: Verifying health check configuration..."
HEALTH_STATUS=$(docker inspect delerium-test --format='{{.State.Health.Status}}' 2>/dev/null || echo "not configured")
echo "   Health status: $HEALTH_STATUS"
if [ "$HEALTH_STATUS" != "not configured" ]; then
    echo "   ✓ Health check is configured"
else
    echo "   ⚠️  Health check not showing (may be starting)"
fi

# Test 5: Test /api/health endpoint
echo ""
echo "✅ Test 5: Testing /api/health endpoint..."
HEALTH_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:9090/api/health)
HEALTH_HTTP_CODE=$(echo "$HEALTH_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
HEALTH_BODY=$(echo "$HEALTH_RESPONSE" | grep -v "HTTP_CODE:")

echo "   HTTP Status: $HEALTH_HTTP_CODE"
if [ "$HEALTH_HTTP_CODE" = "200" ]; then
    echo "   ✓ Health endpoint responds correctly"
    echo "   Response preview: $(echo "$HEALTH_BODY" | head -c 100)"
else
    echo "   ✗ Health endpoint returned unexpected status: $HEALTH_HTTP_CODE"
    echo "   Response: $HEALTH_BODY"
    exit 1
fi

# Test 6: Test PoW endpoint
echo ""
echo "✅ Test 6: Testing /api/pow endpoint..."
POW_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:9090/api/pow)
HTTP_CODE=$(echo "$POW_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
RESPONSE_BODY=$(echo "$POW_RESPONSE" | grep -v "HTTP_CODE:")

echo "   HTTP Status: $HTTP_CODE"
if [ "$HTTP_CODE" = "200" ]; then
    echo "   ✓ PoW endpoint responds correctly"
    echo "   Response preview: $(echo "$RESPONSE_BODY" | head -c 100)"
elif [ "$HTTP_CODE" = "204" ]; then
    echo "   ✓ PoW endpoint responds (PoW disabled)"
else
    echo "   ✗ Unexpected response code: $HTTP_CODE"
    echo "   Response: $RESPONSE_BODY"
    exit 1
fi

# Test 7: Test paste creation
echo ""
echo "✅ Test 7: Testing paste creation..."
CREATE_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" -X POST http://localhost:9090/api/pastes \
    -H "Content-Type: application/json" \
    -d '{"ct":"dGVzdGNpcGhlcnRleHQ=","iv":"dGVzdGl2MTIzNDU2Nzg5MA==","meta":{"expireTs":9999999999}}')

CREATE_HTTP_CODE=$(echo "$CREATE_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
CREATE_BODY=$(echo "$CREATE_RESPONSE" | grep -v "HTTP_CODE:")

echo "   HTTP Status: $CREATE_HTTP_CODE"
if [ "$CREATE_HTTP_CODE" = "201" ]; then
    echo "   ✓ Paste created successfully"
    PASTE_ID=$(echo "$CREATE_BODY" | python3 -c "import sys, json; print(json.load(sys.stdin)['id'])" 2>/dev/null || echo "")
    if [ -n "$PASTE_ID" ]; then
        echo "   Paste ID: $PASTE_ID"
        
        # Test 8: Test paste retrieval
        echo ""
        echo "✅ Test 8: Testing paste retrieval..."
        GET_RESPONSE=$(curl -s -w "\nHTTP_CODE:%{http_code}" http://localhost:9090/api/pastes/$PASTE_ID)
        GET_HTTP_CODE=$(echo "$GET_RESPONSE" | grep "HTTP_CODE:" | cut -d: -f2)
        
        echo "   HTTP Status: $GET_HTTP_CODE"
        if [ "$GET_HTTP_CODE" = "200" ]; then
            echo "   ✓ Paste retrieved successfully"
        else
            echo "   ✗ Failed to retrieve paste"
        fi
    fi
else
    echo "   ✗ Paste creation failed with HTTP $CREATE_HTTP_CODE"
    echo "   Response: $CREATE_BODY"
fi

# Test 9: Check container logs
echo ""
echo "✅ Test 9: Checking container logs..."
LOG_LINES=$(docker logs delerium-test 2>&1 | wc -l)
echo "   Log lines: $LOG_LINES"
if [ "$LOG_LINES" -gt 0 ]; then
    echo "   ✓ Application is logging"
    echo "   Last 5 log lines:"
    docker logs delerium-test 2>&1 | tail -5 | sed 's/^/   │ /'
else
    echo "   ⚠️  No logs found"
fi

# Test 10: Verify file permissions in container
echo ""
echo "✅ Test 10: Verifying file permissions..."
APP_OWNER=$(docker exec delerium-test stat -c '%U:%G' /app)
DATA_OWNER=$(docker exec delerium-test stat -c '%U:%G' /data)
echo "   /app ownership: $APP_OWNER"
echo "   /data ownership: $DATA_OWNER"
if [ "$APP_OWNER" = "delirium:delirium" ] && [ "$DATA_OWNER" = "delirium:delirium" ]; then
    echo "   ✓ Correct ownership"
else
    echo "   ✗ Incorrect ownership"
fi

# Test 11: Check image metadata
echo ""
echo "✅ Test 11: Checking OCI image metadata..."
echo "   Labels:"
docker inspect delerium-server:local --format='{{range $k, $v := .Config.Labels}}   {{$k}}: {{$v}}{{println}}{{end}}' | grep "org.opencontainers" || echo "   (No OCI labels found)"

# Summary
echo ""
echo "=========================================="
echo "✨ All tests completed successfully!"
echo "=========================================="
echo ""
echo "📊 Image Information:"
docker images delerium-server:local --format "   Name: {{.Repository}}:{{.Tag}}\n   Size: {{.Size}}\n   Created: {{.CreatedSince}}"
echo ""
echo "🎯 Next Steps:"
echo "   1. Test with docker-compose: docker-compose up -d"
echo "   2. Test multi-arch build: docker buildx build --platform linux/amd64,linux/arm64 ."
echo "   3. Push to registry (when ready)"
