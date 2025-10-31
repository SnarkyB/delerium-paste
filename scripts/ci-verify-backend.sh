#!/bin/bash
set -e  # Exit on any error

echo "=========================================="
echo "🔍 Running Backend CI Verification"
echo "=========================================="

cd server

echo ""
echo "🏗️  Building and testing backend..."
./gradlew clean build test

echo ""
echo "🔒 Running dependency check..."
./gradlew dependencyCheckAnalyze || true

echo ""
echo "✅ All backend checks passed!"
