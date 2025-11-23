#!/bin/bash
################################################################################
# CI Verification Script - All Checks (Local Pre-PR Validation)
#
# This script runs all CI checks locally for pre-PR validation.
# It mirrors the checks in: .github/workflows/pr-checks.yml
#
# Purpose:
#   - Quick feedback loop during development (before pushing to GitHub)
#   - Catch issues early without waiting for GitHub Actions
#   - Validate that your code will pass PR checks
#
# Note:
#   - GitHub Actions (pr-checks.yml) is the source of truth for quality gates
#   - This script is for local convenience only
#   - Always verify that pr-checks.yml passes on your PR
#
# Usage:
#   ./scripts/ci-verify-all.sh       # Full check (frontend + backend + docker)
#   ./scripts/ci-verify-quick.sh     # Fast check (lint + tsc + jest only)
#   ./scripts/ci-verify-frontend.sh  # Frontend checks only
#   ./scripts/ci-verify-backend.sh   # Backend checks only
#
# For details on checks, see:
#   - Frontend: .github/workflows/pr-checks.yml (frontend-checks job)
#   - Backend:  .github/workflows/pr-checks.yml (backend-checks job)
#   - Docker:   .github/workflows/pr-checks.yml (docker-checks job)
#
################################################################################

set -e  # Exit on any error

echo "=========================================="
echo "🚀 Running Full CI Verification (Parallel)"
echo "=========================================="

# Create temporary files for output
FRONTEND_LOG=$(mktemp)
BACKEND_LOG=$(mktemp)
DOCKER_LOG=$(mktemp)

# Cleanup function
cleanup() {
  rm -f "$FRONTEND_LOG" "$BACKEND_LOG" "$DOCKER_LOG"
}
trap cleanup EXIT

# Function to display output from a log file
display_output() {
  local log_file=$1
  local job_name=$2
  echo ""
  echo "=========================================="
  echo "$job_name OUTPUT"
  echo "=========================================="
  cat "$log_file"
}

# Run frontend checks in background
echo ""
echo "🚀 Starting frontend checks in background..."
./scripts/ci-verify-frontend.sh > "$FRONTEND_LOG" 2>&1 &
FRONTEND_PID=$!

# Run backend checks in background
echo "🚀 Starting backend checks in background..."
./scripts/ci-verify-backend.sh > "$BACKEND_LOG" 2>&1 &
BACKEND_PID=$!

# Wait for both processes to complete
echo ""
echo "⏳ Waiting for frontend and backend checks to complete..."
wait $FRONTEND_PID
FRONTEND_EXIT=$?

wait $BACKEND_PID
BACKEND_EXIT=$?

# Display results
display_output "$FRONTEND_LOG" "FRONTEND CHECKS"
display_output "$BACKEND_LOG" "BACKEND CHECKS"

# Check for failures
if [ $FRONTEND_EXIT -ne 0 ]; then
  echo "❌ Frontend checks failed!"
  exit 1
fi

if [ $BACKEND_EXIT -ne 0 ]; then
  echo "❌ Backend checks failed!"
  exit 1
fi

# Docker validation (runs after frontend/backend complete)
echo ""
echo "=========================================="
echo "DOCKER VALIDATION"
echo "=========================================="
echo "🐳 Validating docker-compose..."
docker-compose -f docker-compose.yml config > "$DOCKER_LOG" 2>&1
DOCKER_EXIT=$?

display_output "$DOCKER_LOG" "DOCKER VALIDATION"

if [ $DOCKER_EXIT -ne 0 ]; then
  echo "❌ Docker validation failed!"
  exit 1
fi

echo ""
echo "=========================================="
echo "✅ ALL CI CHECKS PASSED!"
echo "=========================================="
echo "Your code is ready to push! 🎉"
