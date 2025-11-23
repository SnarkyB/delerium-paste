#!/bin/bash
################################################################################
# Quick CI Verification Script (Fast Pre-Commit Check)
#
# This script runs a fast subset of CI checks for rapid iteration during development.
# It mirrors essential checks from: .github/workflows/pr-checks.yml
#
# Purpose:
#   - Ultra-fast feedback loop during active development (< 2 minutes)
#   - Run before committing to catch obvious issues early
#   - Good for frequent iteration on code changes
#
# Checks performed (fast only):
#   ✓ ESLint: Code style (no type checking)
#   ✓ TypeScript: Type checking
#   ✓ Unit Tests: Jest test suite (no E2E)
#   ✓ Backend Build: Gradle build and tests
#
# Skipped (for full checks, use ci-verify-all.sh):
#   ⊘ E2E Tests: Playwright (slow)
#   ⊘ Coverage Report: Full coverage (slow)
#   ⊘ Security Audit: npm audit (slow)
#   ⊘ Docker Validation: Container checks (slow)
#
# Note: Full checks are enforced in GitHub Actions (pr-checks.yml)
#
# For full details, see:
#   .github/workflows/pr-checks.yml (complete checks)
#
################################################################################

set -e  # Exit on any error

echo "=========================================="
echo "⚡ Running Quick CI Verification"
echo "=========================================="

cd client

echo ""
echo "🔍 Running ESLint..."
npx eslint src/**/*.ts

echo ""
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit

echo ""
echo "🧪 Running unit tests..."
npx jest --testPathIgnorePatterns=/integration/ --testPathIgnorePatterns=/e2e/

cd ../server

echo ""
echo "🏗️  Building backend..."
./gradlew build test

echo ""
echo "✅ Quick checks passed!"
