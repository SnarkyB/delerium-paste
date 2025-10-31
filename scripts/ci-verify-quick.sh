#!/bin/bash
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
