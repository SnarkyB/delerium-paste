#!/bin/bash
# Helper script to check if Bazel/Bazelisk is installed
# Can be sourced by other scripts

check_bazel_installed() {
    if ! command -v bazel &> /dev/null; then
        echo "❌ Bazel/Bazelisk is not installed!"
        echo ""
        echo "To install Bazelisk (Bazel version manager):"
        echo ""
        echo "  macOS:"
        echo "    brew install bazelisk"
        echo ""
        echo "  Linux:"
        echo "    ./scripts/setup-bazel.sh"
        echo ""
        echo "  Windows:"
        echo "    choco install bazelisk"
        echo ""
        echo "  Or use our automated setup:"
        echo "    make bazel-setup"
        echo ""
        return 1
    fi
    return 0
}

# If script is executed directly (not sourced), run the check
if [[ "${BASH_SOURCE[0]}" == "${0}" ]]; then
    check_bazel_installed
    exit $?
fi
