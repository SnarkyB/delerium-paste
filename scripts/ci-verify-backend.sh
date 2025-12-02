#!/bin/bash
set -e  # Exit on any error

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/.." && pwd)"

echo "=========================================="
echo "🔍 Running Backend CI Verification (Bazel)"
echo "=========================================="

# Check if Bazel is installed
if ! command -v bazel &> /dev/null; then
    echo ""
    echo "❌ Bazel/Bazelisk is not installed!"
    echo ""
    echo "To install Bazelisk (Bazel version manager):"
    echo ""
    echo "  Quick install:"
    echo "    make bazel-setup"
    echo ""
    echo "  Or manually:"
    echo "    macOS:   brew install bazelisk"
    echo "    Linux:   ./scripts/setup-bazel.sh"
    echo "    Windows: choco install bazelisk"
    echo ""
    exit 1
fi

cd "$PROJECT_ROOT"

echo ""
echo "✅ Bazel is installed: $(bazel --version)"
echo ""

echo "🏗️  Building backend with Bazel..."
bazel build //server:delerium_server_deploy

echo ""
echo "🧪 Running tests..."
bazel test //server:all_tests --test_output=errors

echo ""
echo "📊 Generating coverage report..."
bazel coverage //server:all_tests --combined_report=lcov || echo "⚠️  Coverage generation optional"

echo ""
echo "🔒 Querying dependencies for security analysis..."
bazel query 'deps(//server:delerium_server_lib)' --output=build > bazel-deps.txt || true
echo "✅ Dependencies saved to bazel-deps.txt"

echo ""
echo "=========================================="
echo "✅ All backend checks passed!"
echo "=========================================="
