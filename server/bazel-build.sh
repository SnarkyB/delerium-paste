#!/bin/bash
set -e

echo "=========================================="
echo "📦 Building Delirium Paste Server (Bazel)"
echo "=========================================="

# Check if Bazel is installed
if ! command -v bazel &> /dev/null; then
    echo "❌ Bazel not found. Please install Bazelisk first:"
    echo "   Run: ../scripts/setup-bazel.sh"
    exit 1
fi

# Navigate to project root
cd "$(dirname "$0")/.."

echo ""
echo "🏗️  Building server binary..."
bazel build //server:delerium_server --show_timestamps

echo ""
echo "📦 Building deployable JAR..."
bazel build //server:delerium_server_deploy --show_timestamps

echo ""
echo "=========================================="
echo "✅ Build complete!"
echo "=========================================="
echo ""
echo "Artifacts:"
echo "  Binary:  bazel-bin/server/delerium_server"
echo "  JAR:     bazel-bin/server/delerium_server_deploy.jar"
echo ""
echo "Run with: bazel run //server:delerium_server"
echo ""
