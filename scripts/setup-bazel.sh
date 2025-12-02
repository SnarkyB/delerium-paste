#!/bin/bash
set -e

echo "=========================================="
echo "🔧 Setting up Bazel for Delirium Paste"
echo "=========================================="

# Check if Bazelisk is already installed
if command -v bazel &> /dev/null; then
    echo "✅ Bazelisk already installed: $(bazel --version)"
    exit 0
fi

echo "❌ Bazelisk not found. Installing..."

# Detect OS and install Bazelisk
if [[ "$OSTYPE" == "darwin"* ]]; then
    echo "📦 macOS detected - installing via Homebrew..."
    if ! command -v brew &> /dev/null; then
        echo "❌ Homebrew not found. Please install Homebrew first:"
        echo "   /bin/bash -c \"\$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)\""
        exit 1
    fi
    brew install bazelisk
    
elif [[ "$OSTYPE" == "linux-gnu"* ]]; then
    echo "🐧 Linux detected - installing Bazelisk binary..."
    
    # Download Bazelisk
    BAZELISK_VERSION="v1.19.0"
    BAZELISK_URL="https://github.com/bazelbuild/bazelisk/releases/download/${BAZELISK_VERSION}/bazelisk-linux-amd64"
    
    echo "📥 Downloading Bazelisk ${BAZELISK_VERSION}..."
    curl -LO "$BAZELISK_URL"
    chmod +x bazelisk-linux-amd64
    
    # Install to user's local bin if no sudo, otherwise system-wide
    if [ -w /usr/local/bin ]; then
        sudo mv bazelisk-linux-amd64 /usr/local/bin/bazel
        echo "✅ Installed to /usr/local/bin/bazel"
    else
        mkdir -p "$HOME/.local/bin"
        mv bazelisk-linux-amd64 "$HOME/.local/bin/bazel"
        echo "✅ Installed to $HOME/.local/bin/bazel"
        echo "⚠️  Make sure $HOME/.local/bin is in your PATH"
        echo "   Add to ~/.bashrc or ~/.zshrc:"
        echo "   export PATH=\"\$HOME/.local/bin:\$PATH\""
    fi
    
elif [[ "$OSTYPE" == "msys" ]] || [[ "$OSTYPE" == "win32" ]]; then
    echo "🪟 Windows detected"
    if command -v choco &> /dev/null; then
        echo "📦 Installing via Chocolatey..."
        choco install bazelisk -y
    else
        echo "❌ Chocolatey not found."
        echo "Please install Bazelisk manually:"
        echo "  1. Install Chocolatey: https://chocolatey.org/install"
        echo "  2. Run: choco install bazelisk"
        echo "OR download from: https://github.com/bazelbuild/bazelisk/releases"
        exit 1
    fi
    
else
    echo "❌ Unsupported operating system: $OSTYPE"
    echo "Please install Bazelisk manually from:"
    echo "https://github.com/bazelbuild/bazelisk/releases"
    exit 1
fi

# Verify installation
echo ""
echo "🔍 Verifying Bazel installation..."
if command -v bazel &> /dev/null; then
    echo "✅ Bazelisk installed successfully!"
    bazel --version
else
    echo "❌ Installation verification failed"
    exit 1
fi

echo ""
echo "=========================================="
echo "✅ Bazel setup complete!"
echo "=========================================="
echo ""
echo "Next steps:"
echo "  1. Build server: bazel build //server:delerium_server"
echo "  2. Run tests:    bazel test //server:all_tests"
echo "  3. Run server:   bazel run //server:delerium_server"
echo ""
