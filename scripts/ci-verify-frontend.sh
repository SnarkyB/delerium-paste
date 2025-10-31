#!/bin/bash
set -e  # Exit on any error

echo "=========================================="
echo "🔍 Running Frontend CI Verification"
echo "=========================================="

cd client

echo ""
echo "📦 Installing dependencies..."
npm ci

echo ""
echo "🎭 Installing Playwright browsers..."
npx playwright install --with-deps

echo ""
echo "🔍 Running ESLint..."
npx eslint src/**/*.ts

echo ""
echo "🔍 Running TypeScript type check..."
npx tsc --noEmit

echo ""
echo "🧪 Running unit tests..."
npx jest --testPathIgnorePatterns=/integration/ --testPathIgnorePatterns=/e2e/

echo ""
echo "🎭 Running E2E tests..."
npx playwright test

echo ""
echo "📊 Generating coverage report..."
npx jest --coverage

echo ""
echo "🔒 Running security audit..."
npm audit --audit-level=moderate

echo ""
echo "✅ All frontend checks passed!"
