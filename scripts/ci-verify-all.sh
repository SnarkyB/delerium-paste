#!/bin/bash
set -e  # Exit on any error

echo "=========================================="
echo "🚀 Running Full CI Verification (Serial)"
echo "=========================================="

# Frontend checks
echo ""
echo "=========================================="
echo "FRONTEND CHECKS"
echo "=========================================="
./scripts/ci-verify-frontend.sh

# Backend checks
echo ""
echo "=========================================="
echo "BACKEND CHECKS"
echo "=========================================="
./scripts/ci-verify-backend.sh

# Docker validation
echo ""
echo "=========================================="
echo "DOCKER VALIDATION"
echo "=========================================="
echo "🐳 Validating docker-compose..."
docker-compose -f docker-compose.yml config

echo ""
echo "=========================================="
echo "✅ ALL CI CHECKS PASSED!"
echo "=========================================="
echo "Your code is ready to push! 🎉"
