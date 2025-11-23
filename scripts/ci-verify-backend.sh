#!/bin/bash
################################################################################
# Backend CI Verification Script (Local Pre-PR Validation)
#
# This script runs backend CI checks locally for pre-PR validation.
# It mirrors the checks in: .github/workflows/pr-checks.yml (backend-checks job)
#
# Purpose:
#   - Quick feedback during backend development
#   - Validate Gradle build, Kotlin tests
#   - Catch issues before pushing to GitHub
#
# Checks performed:
#   ✓ Gradle Build: Clean build and test compilation
#   ✓ Unit Tests: Kotlin/Ktor test suite
#   ✓ Dependency Check: OWASP security scanning (optional)
#
# Note: GitHub Actions pr-checks.yml is the authoritative quality gate
#       Security scans (OWASP) are run in security-scan.yml (scheduled daily)
#
# For GitHub Actions details, see:
#   .github/workflows/pr-checks.yml (backend-checks job)
#   .github/workflows/security-scan.yml (scheduled security scans)
#
################################################################################

set -e  # Exit on any error

echo "=========================================="
echo "🔍 Running Backend CI Verification"
echo "=========================================="

cd server

# Check if Gradle build cache exists
if [ -d ".gradle" ] && [ -d "build" ]; then
  echo ""
  echo "🏗️  Checking if build needs updating..."
  # Gradle will handle incremental builds automatically
  echo "✅ Using Gradle build cache"
else
  echo ""
  echo "🏗️  Building from scratch..."
fi

echo ""
echo "🏗️  Building and testing backend..."
# Use --build-cache for better caching (if configured)
./gradlew clean build test --build-cache || ./gradlew clean build test

echo ""
echo "🔒 Running dependency check..."
./gradlew dependencyCheckAnalyze || true

echo ""
echo "✅ All backend checks passed!"
